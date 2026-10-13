import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  RotateCcw,
  Home,
  Loader2,
  AlertCircle,
  Save,
  FolderOpen,
} from "lucide-react";

import { getPublishedGameForPlay } from "../api/player";
import { saveGameToSlot, loadGameFromSlot } from "../api/saveSlots";
import SaveLoadModal from "../components/player/SaveLoadModal";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAssetUrl = (path) => {
  if (!path) return null;

  if (/^https?:\/\//i.test(path)) return path;

  const origin = API_BASE.replace(/\/api\/?$/, "");

  return `${origin}/${String(path).replace(/^\/+/, "")}`;
};

const readValue = (...values) =>
  values.find((value) => value !== undefined && value !== null);

const findStartNode = (nodes = []) =>
  nodes.find(
    (node) => node.data?.nodeType === "start" || node.type === "start",
  );

const getNodeType = (node) => node?.data?.nodeType || node?.type;

const getAsset = (assets, assetId) => {
  if (assetId == null || assetId === "") return null;

  return assets.find(
    (asset) => String(asset.asset_id ?? asset.assetId) === String(assetId),
  );
};

const resolveAsset = (assets, assetId) => {
  const asset = getAsset(assets, assetId);

  return getAssetUrl(asset?.file_path ?? asset?.filePath);
};

const getNodeBackground = (node, assets) => {
  const data = node?.data || {};

  const backgroundId = readValue(
    data.backgroundAssetId,
    data.background_asset_id,
    data.backgroundId,
  );

  return resolveAsset(assets, backgroundId);
};

const getChapterStart = (gameData, index) => {
  const chapter = gameData?.chapters?.[index];

  if (!chapter) return null;

  const startNode = findStartNode(chapter.nodes || []);

  if (!startNode) return null;

  return {
    chapterIndex: index,
    currentNodeId: String(startNode.id),
    background: getNodeBackground(startNode, gameData.assets || []),
    history: [],
  };
};

const resolveCharacter = (characters, characterId, expressionId) => {
  if (characterId == null || characterId === "") {
    return null;
  }

  const character = characters.find(
    (item) =>
      String(item.character_id ?? item.characterId) === String(characterId),
  );

  if (!character) return null;

  const expressions = character.expressions || [];

  const expression =
    expressions.find(
      (item) =>
        String(item.expression_id ?? item.expressionId) ===
        String(expressionId),
    ) ||
    expressions.find((item) => Boolean(item.is_default ?? item.isDefault)) ||
    expressions[0];

  if (!expression) return null;

  return getAssetUrl(expression.file_path ?? expression.filePath);
};

export default function VisualNovelPlayer() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();

  const requestedSlot = searchParams.get("slot");

  const autoLoadSlot = /^[1-3]$/.test(requestedSlot || "")
    ? Number(requestedSlot)
    : null;

  const [gameData, setGameData] = useState(null);
  const [progress, setProgress] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // null | "save" | "load"
  const [modalMode, setModalMode] = useState(null);

  // Load latest published version
  useEffect(() => {
    let active = true;

    const loadInitialGame = async () => {
      try {
        setLoading(true);
        setError("");
        setNotice("");
        setGameData(null);
        setProgress(null);
        setModalMode(null);

        const params = new URLSearchParams(window.location.search);

        const slotParam = params.get("slot");

        const slotNumber = /^[1-3]$/.test(slotParam || "")
          ? Number(slotParam)
          : null;

        if (slotNumber) {
          // Continue an existing save.
          const result = await loadGameFromSlot(gameId, slotNumber);

          if (!active) return;

          const savedGameData = result.gameData;
          const save = result.save;

          if (
            !savedGameData ||
            !Array.isArray(savedGameData.chapters) ||
            !save?.saveData
          ) {
            throw new Error("Invalid save file.");
          }

          const savedChapterIndex = savedGameData.chapters.findIndex(
            (chapter) =>
              Number(chapter.chapterId) === Number(save.saveData.chapterId),
          );

          if (savedChapterIndex === -1) {
            throw new Error("Saved chapter not found.");
          }

          const savedChapter = savedGameData.chapters[savedChapterIndex];

          const nodeExists = savedChapter.nodes?.some(
            (node) => String(node.id) === String(save.currentNodeId),
          );

          if (!nodeExists) {
            throw new Error("Saved node not found.");
          }

          setGameData(savedGameData);

          setProgress({
            chapterIndex: savedChapterIndex,
            currentNodeId: String(save.currentNodeId),
            background: save.saveData.background ?? null,
            history: Array.isArray(save.saveData.history)
              ? save.saveData.history
              : [],
          });

          setNotice(`Continued from Slot ${slotNumber}.`);
        } else {
          // Start a new game from latest version.
          const result = await getPublishedGameForPlay(gameId);

          if (!active) return;

          setGameData(result);
          setProgress(getChapterStart(result, 0));
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to load this game.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadInitialGame();

    return () => {
      active = false;
    };
  }, [gameId, requestedSlot]);

  const chapters = gameData?.chapters || [];
  const assets = gameData?.assets || [];
  const characters = gameData?.characters || [];

  const chapterIndex = progress?.chapterIndex ?? 0;
  const currentNodeId = progress?.currentNodeId;
  const background = progress?.background ?? null;
  const history = progress?.history || [];

  const chapter = chapters[chapterIndex];

  const nodes = useMemo(() => chapter?.nodes || [], [chapter]);

  const edges = chapter?.edges || [];

  const nodeMap = useMemo(
    () => new Map(nodes.map((node) => [String(node.id), node])),
    [nodes],
  );

  const currentNode = currentNodeId ? nodeMap.get(String(currentNodeId)) : null;

  const nodeType = getNodeType(currentNode);
  const data = currentNode?.data || {};

  const getNextNode = (sourceId, sourceHandle = "default") => {
    const edge = edges.find(
      (item) =>
        String(item.source) === String(sourceId) &&
        String(item.sourceHandle || "default") === String(sourceHandle),
    );

    return edge ? nodeMap.get(String(edge.target)) : null;
  };

  // Move to another node within the current chapter
  const enterNode = (node) => {
    if (!node || !progress) return;

    const nextBackground = getNodeBackground(node, assets);

    setProgress((previous) => ({
      ...previous,
      currentNodeId: String(node.id),
      background: nextBackground || previous.background,
      history: [
        ...previous.history,
        {
          nodeId: previous.currentNodeId,
          background: previous.background,
        },
      ],
    }));

    setNotice("");
  };

  const startChapter = (index) => {
    const nextProgress = getChapterStart(gameData, index);

    if (!nextProgress) {
      setNotice("Chapter Start node not found.");
      return;
    }

    setProgress(nextProgress);
    setNotice("");
  };

  const handleNext = () => {
    if (!currentNode || nodeType === "choice" || nodeType === "ending") {
      return;
    }

    const nextNode = getNextNode(currentNode.id);

    if (nextNode) {
      enterNode(nextNode);
    }
  };

  const handleChoice = (option) => {
    if (!currentNode) return;

    const handleId = readValue(option.id, option.optionId, option.option_id);

    if (handleId == null) return;

    const nextNode = getNextNode(currentNode.id, handleId);

    if (nextNode) {
      enterNode(nextNode);
    }
  };

  const handleBack = () => {
    if (!progress || history.length === 0) {
      return;
    }

    setProgress((previous) => {
      const previousEntry = previous.history[previous.history.length - 1];

      return {
        ...previous,
        currentNodeId: previousEntry.nodeId,
        background: previousEntry.background,
        history: previous.history.slice(0, -1),
      };
    });

    setNotice("");
  };

  const handleRestart = () => {
    startChapter(0);
  };

  // Save current progress to selected slot
  const handleSave = async (slotNumber) => {
    if (!gameData || !progress || !chapter) {
      throw new Error("Game is not ready to save.");
    }

    const versionId = gameData.version?.versionId;

    if (!versionId) {
      throw new Error("Game version not found.");
    }

    const payload = {
      versionId,
      currentNodeId: progress.currentNodeId,
      saveData: {
        schemaVersion: 1,
        chapterId: chapter.chapterId,
        background: progress.background,
        history: progress.history,
      },
    };

    await saveGameToSlot(gameId, slotNumber, payload);

    setNotice(`Game saved successfully to Slot ${slotNumber}.`);
  };

  // Load both the saved version and its progress
  const handleLoad = async (slotNumber) => {
    const result = await loadGameFromSlot(gameId, slotNumber);

    const savedGameData = result.gameData;
    const save = result.save;

    if (
      !savedGameData ||
      !Array.isArray(savedGameData.chapters) ||
      !save?.saveData
    ) {
      throw new Error("Invalid save file.");
    }

    const savedChapterIndex = savedGameData.chapters.findIndex(
      (item) => Number(item.chapterId) === Number(save.saveData.chapterId),
    );

    if (savedChapterIndex === -1) {
      throw new Error("Saved chapter was not found.");
    }

    const savedChapter = savedGameData.chapters[savedChapterIndex];

    const savedNode = savedChapter.nodes?.find(
      (node) => String(node.id) === String(save.currentNodeId),
    );

    if (!savedNode) {
      throw new Error("Saved story node was not found.");
    }

    const savedHistory = Array.isArray(save.saveData.history)
      ? save.saveData.history
      : [];

    // Restore game snapshot and progress together.
    setGameData(savedGameData);

    setProgress({
      chapterIndex: savedChapterIndex,
      currentNodeId: String(save.currentNodeId),
      background: save.saveData.background ?? null,
      history: savedHistory,
    });

    setNotice(`Loaded Slot ${slotNumber} — Version ${save.versionNumber}.`);
  };
  useEffect(() => {
    if (!gameData || !autoLoadSlot) return;

    let active = true;

    const restoreProgress = async () => {
      try {
        setLoading(true);
        setError("");

        const result = await loadGameFromSlot(gameId, autoLoadSlot);

        if (!active) return;

        const savedGameData = result.gameData;
        const save = result.save;

        if (
          !savedGameData ||
          !Array.isArray(savedGameData.chapters) ||
          !save?.saveData
        ) {
          throw new Error("Invalid save file.");
        }

        const savedChapterIndex = savedGameData.chapters.findIndex(
          (chapter) =>
            Number(chapter.chapterId) === Number(save.saveData.chapterId),
        );

        if (savedChapterIndex < 0) {
          throw new Error("Saved chapter not found.");
        }

        const savedNodeExists = savedGameData.chapters[
          savedChapterIndex
        ].nodes?.some((node) => String(node.id) === String(save.currentNodeId));

        if (!savedNodeExists) {
          throw new Error("Saved node not found.");
        }

        setGameData(savedGameData);

        setProgress({
          chapterIndex: savedChapterIndex,
          currentNodeId: String(save.currentNodeId),
          background: save.saveData.background ?? null,
          history: Array.isArray(save.saveData.history)
            ? save.saveData.history
            : [],
        });

        setNotice(`Continued from Slot ${autoLoadSlot}.`);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Unable to continue saved game.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreProgress();

    return () => {
      active = false;
    };

    // Intentionally run once per game and requested slot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId, autoLoadSlot]);
  const options = Array.isArray(data.options) ? data.options : [];

  const speakerId = readValue(data.characterId, data.character_id);

  const expressionId = readValue(data.expressionId, data.expression_id);

  const character = characters.find(
    (item) =>
      String(item.character_id ?? item.characterId) === String(speakerId),
  );

  const speakerName = readValue(
    data.speaker,
    data.characterName,
    character?.character_name,
    character?.characterName,
  );

  const dialogueText = readValue(data.text, data.dialogue, data.content, "");

  const characterImage = resolveCharacter(characters, speakerId, expressionId);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-3 bg-[#0d0d17] text-white">
        <Loader2 className="animate-spin text-purple-400" />
        Loading game...
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0d0d17] text-white">
        <AlertCircle className="text-red-400" size={36} />

        <p className="text-red-300">{error}</p>

        <Link to="/games" className="text-purple-400 hover:underline">
          Back to Games
        </Link>
      </div>
    );
  }

  if (!chapter || !currentNode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#0d0d17] text-white">
        <p>Unable to find the story's Start node.</p>

        <Link to="/games" className="text-purple-400 hover:underline">
          Back to Games
        </Link>
      </div>
    );
  }

  const isEnding = nodeType === "ending";

  return (
    <main className="min-h-screen bg-[#090910] text-white">
      {/* Top Navigation */}
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#151521] px-5 py-3">
        <Link
          to={`/games/${gameId}`}
          className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
        >
          <ArrowLeft size={17} />
          Exit Game
        </Link>

        <div className="text-center">
          <h1 className="text-sm font-semibold">
            {gameData.game?.title || "Visual Novel"}
          </h1>

          <p className="text-xs text-gray-400">{chapter.title}</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setModalMode("save")}
            className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
          >
            <Save size={16} />
            Save
          </button>

          <button
            type="button"
            onClick={() => setModalMode("load")}
            className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
          >
            <FolderOpen size={16} />
            Load
          </button>

          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
          >
            <RotateCcw size={16} />
            Restart
          </button>
        </div>
      </header>

      {/* Save/Load Notice */}
      {notice && (
        <div
          role="status"
          className="mx-auto mt-4 max-w-6xl rounded-lg border border-purple-500/20 bg-purple-500/10 px-4 py-3 text-sm text-purple-200"
        >
          {notice}
        </div>
      )}

      {/* Game Stage */}
      <div className="mx-auto flex max-w-6xl items-center justify-center px-3 py-6">
        <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-gradient-to-b from-[#292044] to-[#11111e] shadow-2xl">
          {/* Background */}
          {background && (
            <img
              src={background}
              alt="Story background"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          {/* Character */}
          {characterImage && nodeType === "dialogue" && (
            <img
              src={characterImage}
              alt={speakerName || "Character"}
              className="pointer-events-none absolute bottom-0 left-1/2 z-10 h-[85%] max-w-[70%] -translate-x-1/2 object-contain object-bottom"
            />
          )}

          {/* Dialogue */}
          {nodeType === "dialogue" && (
            <div className="absolute inset-x-3 bottom-3 z-20 rounded-xl border border-white/15 bg-[#10101b]/90 p-4 shadow-xl backdrop-blur-md md:inset-x-8 md:bottom-6 md:p-6">
              {speakerName && (
                <p className="mb-2 font-semibold text-purple-300">
                  {speakerName}
                </p>
              )}

              <p className="min-h-12 whitespace-pre-wrap text-sm leading-relaxed md:text-lg">
                {dialogueText}
              </p>

              <button
                type="button"
                onClick={handleNext}
                className="mt-3 flex items-center gap-1 text-sm text-purple-300 hover:text-purple-200"
              >
                Continue
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* Choice */}
          {nodeType === "choice" && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 bg-black/55 p-6">
              <h2 className="mb-3 text-center text-xl font-semibold">
                {data.question || data.text || "Choose your path"}
              </h2>

              {options.map((option, index) => (
                <button
                  type="button"
                  key={option.id || index}
                  onClick={() => handleChoice(option)}
                  className="w-full max-w-lg rounded-xl border border-white/20 bg-[#211a38]/90 px-5 py-3 text-center transition hover:border-purple-400 hover:bg-purple-700/70"
                >
                  {option.text || option.label || `Option ${index + 1}`}
                </button>
              ))}
            </div>
          )}

          {/* Ending */}
          {isEnding && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-5 bg-black/65 p-6 text-center">
              <h2 className="text-3xl font-bold text-purple-200">
                {data.title || "The End"}
              </h2>

              {data.text && (
                <p className="max-w-xl text-gray-200">{data.text}</p>
              )}

              {chapterIndex < chapters.length - 1 ? (
                <button
                  type="button"
                  onClick={() => startChapter(chapterIndex + 1)}
                  className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 hover:bg-purple-500"
                >
                  Next Chapter
                  <ArrowRight size={18} />
                </button>
              ) : (
                <div className="flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={handleRestart}
                    className="flex items-center gap-2 rounded-lg bg-purple-600 px-5 py-3 hover:bg-purple-500"
                  >
                    <RotateCcw size={18} />
                    Play Again
                  </button>

                  <Link
                    to="/games"
                    className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-5 py-3 hover:bg-white/20"
                  >
                    <Home size={18} />
                    Browse Games
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* Start / Scene */}
          {(nodeType === "start" || nodeType === "scene") && (
            <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/20 p-8">
              <button
                type="button"
                onClick={handleNext}
                className="flex items-center gap-2 rounded-lg bg-purple-600 px-6 py-3 font-medium hover:bg-purple-500"
              >
                {nodeType === "start" ? "Start Story" : "Continue"}

                <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Player Controls */}
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 pb-8">
        <button
          type="button"
          onClick={handleBack}
          disabled={history.length === 0}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <p className="text-xs text-gray-500">
          Version {gameData.version?.versionNumber || "-"}
        </p>
      </div>

      {/* Save & Load Modal */}
      <SaveLoadModal
        open={modalMode !== null}
        mode={modalMode}
        gameId={gameId}
        onClose={() => setModalMode(null)}
        onSave={handleSave}
        onLoad={handleLoad}
      />
    </main>
  );
}
