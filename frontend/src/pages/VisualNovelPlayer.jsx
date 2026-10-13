import { useEffect, useMemo, useRef, useState } from "react";
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
  Settings,
  History,
  CheckCircle2,
} from "lucide-react";

import { getPublishedGameForPlay } from "../api/player";
import {
  saveGameToSlot,
  loadGameFromSlot,
  saveAutoGame,
  loadAutoGame,
} from "../api/saveSlots";

import SaveLoadModal from "../components/player/SaveLoadModal";
import PlayerSettingsModal from "../components/player/PlayerSettingsModal";
import DialogueHistoryModal from "../components/player/DialogueHistoryModal";

import {
  loadPlayerSettings,
  savePlayerSettings,
} from "../utils/playerSettings";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const getAssetUrl = (path) => {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;

  const origin = API_BASE.replace(/\/api\/?$/, "");
  return `${origin}/${String(path).replace(/^\/+/, "")}`;
};

const readValue = (...values) =>
  values.find((value) => value !== undefined && value !== null);

const getNodeType = (node) => node?.data?.nodeType || node?.type;

const findStartNode = (nodes = []) =>
  nodes.find((node) => getNodeType(node) === "start");

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

// Validate and restore a save returned by the API.
const restoreSave = (result) => {
  const savedGameData = result?.gameData;
  const save = result?.save;

  if (!Array.isArray(savedGameData?.chapters) || !save?.saveData) {
    throw new Error("Invalid save file.");
  }

  const chapterIndex = savedGameData.chapters.findIndex(
    (chapter) => Number(chapter.chapterId) === Number(save.saveData.chapterId),
  );

  if (chapterIndex === -1) {
    throw new Error("Saved chapter not found.");
  }

  const chapter = savedGameData.chapters[chapterIndex];

  const nodeExists = chapter.nodes?.some(
    (node) => String(node.id) === String(save.currentNodeId),
  );

  if (!nodeExists) {
    throw new Error("Saved node not found.");
  }

  return {
    gameData: savedGameData,
    progress: {
      chapterIndex,
      currentNodeId: String(save.currentNodeId),
      background: save.saveData.background ?? null,
      history: Array.isArray(save.saveData.history)
        ? save.saveData.history
        : [],
    },
    save,
  };
};

const buildSavePayload = (gameData, progress) => {
  const chapter = gameData?.chapters?.[progress?.chapterIndex];

  const versionId = gameData?.version?.versionId;

  if (!chapter || !versionId || !progress?.currentNodeId) {
    throw new Error("Game is not ready to save.");
  }

  return {
    versionId,
    currentNodeId: String(progress.currentNodeId),
    saveData: {
      schemaVersion: 1,
      chapterId: chapter.chapterId,
      background: progress.background,
      history: progress.history || [],
    },
  };
};

export default function VisualNovelPlayer() {
  const { gameId } = useParams();
  const [searchParams] = useSearchParams();
  const requestedSlot = searchParams.get("slot");
  const requestedContinue = searchParams.get("continue");

  const [gameData, setGameData] = useState(null);
  const [progress, setProgress] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Existing player modals
  const [modalMode, setModalMode] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Player Settings
  const [playerSettings, setPlayerSettings] = useState(loadPlayerSettings);

  const handleSettingsChange = (newSettings) => {
    const savedSettings = savePlayerSettings(newSettings);
    setPlayerSettings(savedSettings);
  };

  // Typewriter
  const [typewriter, setTypewriter] = useState({
    key: "",
    count: 0,
  });

  // Auto Save
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const [autoSaveRequest, setAutoSaveRequest] = useState(null);
  const [autoLoading, setAutoLoading] = useState(false);

  // Used to invalidate pending auto-save operations.
  const saveGeneration = useRef(0);
  const saveQueue = useRef(Promise.resolve());
  const latestProgress = useRef(null);

  // Track the latest committed progress.
  latestProgress.current = progress;

  const cancelPendingAutoSave = () => {
    saveGeneration.current += 1;
    setAutoSaveRequest(null);
    setAutoSaveStatus("");
  };

  // ==============================
  // INITIAL GAME LOAD
  // ==============================

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
        setHistoryOpen(false);
        setSettingsOpen(false);
        setAutoSaveRequest(null);
        setAutoSaveStatus("");

        saveGeneration.current += 1;

        const slotNumber = /^[1-3]$/.test(requestedSlot || "")
          ? Number(requestedSlot)
          : null;

        // Continue from Auto Save
        if (requestedContinue === "auto") {
          try {
            const result = await loadAutoGame(gameId);

            if (!active) return;

            const restored = restoreSave(result);

            setGameData(restored.gameData);
            setProgress(restored.progress);
            setNotice("Continued from Auto Save.");
            setAutoSaveStatus("Auto Save loaded");
          } catch (err) {
            if (!active) return;

            // No Auto Save: open the game normally.
            // Other errors are displayed instead of silently
            // ignoring a potentially corrupted save.
            if (err.response?.status !== 404) {
              throw err;
            }

            const result = await getPublishedGameForPlay(gameId);

            if (!active) return;

            setGameData(result);
            setProgress(getChapterStart(result, 0));
            setNotice("Auto Save not found. Started a new game.");
          }
        }

        // Continue from Manual Save
        else if (slotNumber) {
          const result = await loadGameFromSlot(gameId, slotNumber);

          if (!active) return;

          const restored = restoreSave(result);

          setGameData(restored.gameData);
          setProgress(restored.progress);

          setNotice(`Continued from Slot ${slotNumber}.`);
        }

        // Normal game start
        else {
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
        if (active) {
          setLoading(false);
        }
      }
    };

    loadInitialGame();

    return () => {
      active = false;
      saveGeneration.current += 1;
    };
  }, [gameId, requestedSlot, requestedContinue]);

  // ==============================
  // STORY DATA
  // ==============================

  const chapters = gameData?.chapters || [];

  const assets = useMemo(() => gameData?.assets || [], [gameData]);

  const characters = useMemo(() => gameData?.characters || [], [gameData]);

  const chapterIndex = progress?.chapterIndex ?? 0;
  const currentNodeId = progress?.currentNodeId;
  const background = progress?.background ?? null;
  const history = progress?.history || [];

  const chapter = chapters[chapterIndex];

  const nodes = useMemo(() => chapter?.nodes || [], [chapter]);

  const edges = useMemo(() => chapter?.edges || [], [chapter]);

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

  // ==============================
  // AUTO SAVE TRIGGER
  // ==============================

  const requestAutoSave = (nextProgress) => {
    setAutoSaveRequest({
      generation: saveGeneration.current,
      chapterIndex: nextProgress.chapterIndex,
      nodeId: String(nextProgress.currentNodeId),
      progress: nextProgress,
    });
  };

  // ==============================
  // STORY NAVIGATION
  // ==============================

  const enterNode = (node, shouldAutoSave = false) => {
    if (!node || !progress) return;

    const nextBackground = getNodeBackground(node, assets);

    const nextProgress = {
      ...progress,
      currentNodeId: String(node.id),
      background: nextBackground || progress.background,
      history: [
        ...progress.history,
        {
          nodeId: progress.currentNodeId,
          background: progress.background,
        },
      ],
    };

    setProgress(nextProgress);
    setNotice("");

    if (shouldAutoSave) {
      requestAutoSave(nextProgress);
    }
  };

  const startChapter = (index, shouldAutoSave = false) => {
    const nextProgress = getChapterStart(gameData, index);

    if (!nextProgress) {
      setNotice("Chapter Start node not found.");
      return;
    }

    cancelPendingAutoSave();
    setProgress(nextProgress);
    setNotice("");

    if (shouldAutoSave) {
      requestAutoSave(nextProgress);
    }
  };

  const handleNext = () => {
    if (!currentNode || nodeType === "choice" || nodeType === "ending") {
      return;
    }

    if (nodeType === "dialogue" && visibleCharacters < text.length) {
      setTypewriter({
        key: `${chapterIndex}:${currentNodeId}`,
        count: text.length,
      });
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
      // Auto Save after choosing a branch.
      enterNode(nextNode, true);
    }
  };

  const handleBack = () => {
    if (!progress || history.length === 0) {
      return;
    }

    cancelPendingAutoSave();

    const previousEntry = history[history.length - 1];

    setProgress({
      ...progress,
      currentNodeId: previousEntry.nodeId,
      background: previousEntry.background,
      history: history.slice(0, -1),
    });

    setNotice("");
  };

  const handleRestart = () => {
    startChapter(0);
  };

  // ==============================
  // MANUAL SAVE
  // ==============================

  const handleSave = async (slotNumber) => {
    const payload = buildSavePayload(gameData, progress);

    await saveGameToSlot(gameId, slotNumber, payload);

    setNotice(`Game saved successfully to Slot ${slotNumber}.`);
  };

  // ==============================
  // MANUAL LOAD
  // ==============================

  const handleLoad = async (slotNumber) => {
    cancelPendingAutoSave();

    const result = await loadGameFromSlot(gameId, slotNumber);

    const restored = restoreSave(result);

    setGameData(restored.gameData);
    setProgress(restored.progress);

    setNotice(
      `Loaded Slot ${slotNumber} — Version ${restored.save.versionNumber}.`,
    );
  };

  // ==============================
  // AUTO LOAD
  // ==============================

  const handleAutoLoad = async () => {
    if (autoLoading) return;

    cancelPendingAutoSave();
    setAutoLoading(true);
    setAutoSaveStatus("Loading...");

    try {
      // Wait for any previously queued save to finish.
      await saveQueue.current;

      const result = await loadAutoGame(gameId);
      const restored = restoreSave(result);

      setGameData(restored.gameData);
      setProgress(restored.progress);

      setModalMode(null);
      setSettingsOpen(false);
      setHistoryOpen(false);

      setNotice("Continued from Auto Save.");
      setAutoSaveStatus("Auto Save loaded");
    } catch (err) {
      setAutoSaveStatus("");

      setNotice(
        err.response?.status === 404
          ? "No Auto Save found yet."
          : err.response?.data?.message ||
              err.message ||
              "Unable to load Auto Save.",
      );
    } finally {
      setAutoLoading(false);
    }
  };

  // ==============================
  // AUTO SAVE EFFECT
  // ==============================

  useEffect(() => {
    if (!autoSaveRequest || !gameData || loading || autoLoading) {
      return;
    }

    const request = autoSaveRequest;

    if (request.generation !== saveGeneration.current) {
      return;
    }

    const current = latestProgress.current;

    if (
      !current ||
      current.chapterIndex !== request.chapterIndex ||
      String(current.currentNodeId) !== request.nodeId
    ) {
      return;
    }

    let active = true;

    // Short delay before sending the save.
    const timer = setTimeout(() => {
      if (!active || request.generation !== saveGeneration.current) {
        return;
      }

      let payload;

      try {
        payload = buildSavePayload(gameData, request.progress);
      } catch (err) {
        setAutoSaveStatus("Auto Save failed");
        console.error("Auto Save payload error:", err);
        return;
      }

      setAutoSaveStatus("Saving...");

      // Serialize requests to prevent older saves
      // from completing after newer saves.
      const operation = saveQueue.current
        .catch(() => {})
        .then(async () => {
          if (!active || request.generation !== saveGeneration.current) {
            return;
          }

          await saveAutoGame(gameId, payload);

          if (active && request.generation === saveGeneration.current) {
            setAutoSaveStatus("Auto Saved");
          }
        });

      saveQueue.current = operation.catch((err) => {
        console.error("Auto Save error:", err);

        if (active && request.generation === saveGeneration.current) {
          setAutoSaveStatus("Auto Save failed");
        }
      });
    }, 700);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [autoSaveRequest, gameData, gameId, loading, autoLoading]);

  // ==============================
  // DIALOGUE DATA
  // ==============================

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

  const characterImage = resolveCharacter(characters, speakerId, expressionId);

  // Dialogue History follows the current path.
  const dialogueEntries = useMemo(() => {
    if (!chapter) return [];

    const visitedIds = [
      ...history.map((entry) => entry.nodeId),
      ...(currentNodeId != null ? [currentNodeId] : []),
    ];

    return visitedIds.flatMap((nodeId) => {
      const node = nodeMap.get(String(nodeId));

      if (getNodeType(node) !== "dialogue") {
        return [];
      }

      const nodeData = node.data || {};

      const content = readValue(
        nodeData.text,
        nodeData.dialogue,
        nodeData.content,
        "",
      );

      if (!String(content).trim()) return [];

      const characterId = readValue(
        nodeData.characterId,
        nodeData.character_id,
      );

      const actor = characters.find(
        (item) =>
          String(item.character_id ?? item.characterId) === String(characterId),
      );

      const speaker = readValue(
        nodeData.speaker,
        nodeData.characterName,
        actor?.character_name,
        actor?.characterName,
        "Narrator",
      );

      return [
        {
          nodeId: String(nodeId),
          speaker: String(speaker),
          text: String(content),
        },
      ];
    });
  }, [chapter, history, currentNodeId, nodeMap, characters]);

  const dialogueText = readValue(data.text, data.dialogue, data.content, "");

  const text = String(dialogueText);

  const dialogueKey = `${chapterIndex}:${currentNodeId}`;

  const typewriterDelay =
    playerSettings.textSpeed === 0
      ? 0
      : Math.max(5, Math.round(100 - playerSettings.textSpeed * 0.9));

  const visibleCharacters =
    typewriter.key === dialogueKey ? typewriter.count : 0;

  // ==============================
  // TYPEWRITER EFFECT
  // ==============================

  useEffect(() => {
    if (nodeType !== "dialogue") return;

    if (typewriterDelay === 0 || text.length === 0) {
      setTypewriter({
        key: dialogueKey,
        count: text.length,
      });
      return;
    }

    setTypewriter({
      key: dialogueKey,
      count: 0,
    });

    let count = 0;

    const timer = setInterval(() => {
      count += 1;

      setTypewriter((previous) => {
        if (previous.key === dialogueKey && previous.count >= text.length) {
          clearInterval(timer);
          return previous;
        }

        return {
          key: dialogueKey,
          count,
        };
      });

      if (count >= text.length) {
        clearInterval(timer);
      }
    }, typewriterDelay);

    return () => clearInterval(timer);
  }, [dialogueKey, nodeType, text, typewriterDelay]);

  // ==============================
  // AUTO PLAY EFFECT
  // ==============================

  useEffect(() => {
    if (
      !playerSettings.autoPlay ||
      settingsOpen ||
      historyOpen ||
      modalMode !== null ||
      loading ||
      autoLoading ||
      nodeType !== "dialogue" ||
      visibleCharacters < text.length ||
      !currentNodeId
    ) {
      return;
    }

    const edge = edges.find(
      (item) =>
        String(item.source) === String(currentNodeId) &&
        String(item.sourceHandle || "default") === "default",
    );

    const nextNode = edge ? nodeMap.get(String(edge.target)) : null;

    if (!nextNode) return;

    const timer = setTimeout(() => {
      setProgress((previous) => {
        if (
          !previous ||
          String(previous.currentNodeId) !== String(currentNodeId)
        ) {
          return previous;
        }

        const nextBackground = getNodeBackground(nextNode, assets);

        return {
          ...previous,
          currentNodeId: String(nextNode.id),
          background: nextBackground || previous.background,
          history: [
            ...previous.history,
            {
              nodeId: previous.currentNodeId,
              background: previous.background,
            },
          ],
        };
      });

      setNotice("");
    }, playerSettings.autoPlayDelay);

    return () => clearTimeout(timer);
  }, [
    playerSettings.autoPlay,
    playerSettings.autoPlayDelay,
    settingsOpen,
    historyOpen,
    modalMode,
    loading,
    autoLoading,
    nodeType,
    currentNodeId,
    visibleCharacters,
    text,
    edges,
    nodeMap,
    assets,
  ]);

  // ==============================
  // LOADING / ERROR
  // ==============================

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

  // ==============================
  // PLAYER UI
  // ==============================

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

        <div className="flex flex-wrap items-center gap-4">
          {/* Manual Save */}
          <button
            type="button"
            onClick={() => setModalMode("save")}
            className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
          >
            <Save size={16} />
            Save
          </button>

          {/* Manual Load */}
          <button
            type="button"
            onClick={() => setModalMode("load")}
            className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
          >
            <FolderOpen size={16} />
            Load
          </button>

          {/* Auto Load */}
          <button
            type="button"
            onClick={handleAutoLoad}
            disabled={autoLoading}
            className="flex items-center gap-2 text-sm text-emerald-300 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {autoLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <FolderOpen size={16} />
            )}
            Auto Load
          </button>

          {/* Dialogue History */}
          <button
            type="button"
            onClick={() => setHistoryOpen(true)}
            className="flex items-center gap-2 text-sm text-purple-300 hover:text-purple-200"
          >
            <History size={16} />
            History
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => setSettingsOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-black/50 px-4 py-2 text-sm text-white hover:bg-black/70"
          >
            <Settings size={18} />
            Settings
          </button>

          {/* Restart */}
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

      {/* Notice */}
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
                {text.slice(0, visibleCharacters)}
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
                  onClick={() => startChapter(chapterIndex + 1, true)}
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

        <div className="flex items-center gap-4">
          {/* Auto Save Status */}
          {autoSaveStatus && (
            <div
              role="status"
              className={`flex items-center gap-2 text-xs ${
                autoSaveStatus.includes("failed")
                  ? "text-red-400"
                  : "text-emerald-300"
              }`}
            >
              {autoSaveStatus === "Saving..." ||
              autoSaveStatus === "Loading..." ? (
                <Loader2 size={14} className="animate-spin" />
              ) : autoSaveStatus === "Auto Saved" ? (
                <CheckCircle2 size={14} />
              ) : (
                <Save size={14} />
              )}

              {autoSaveStatus}
            </div>
          )}

          <p className="text-xs text-gray-500">
            Version {gameData.version?.versionNumber || "-"}
          </p>
        </div>
      </div>

      {/* Manual Save / Load Modal */}
      <SaveLoadModal
        open={modalMode !== null}
        mode={modalMode}
        gameId={gameId}
        onClose={() => setModalMode(null)}
        onSave={handleSave}
        onLoad={handleLoad}
      />

      {/* Dialogue History Modal */}
      <DialogueHistoryModal
        open={historyOpen}
        entries={dialogueEntries}
        onClose={() => setHistoryOpen(false)}
      />

      {/* Player Settings Modal */}
      <PlayerSettingsModal
        open={settingsOpen}
        settings={playerSettings}
        onChange={handleSettingsChange}
        onClose={() => setSettingsOpen(false)}
      />
    </main>
  );
}
