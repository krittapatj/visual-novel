
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  UserRound,
  Play,
  RotateCcw,
  Clock3,
  Layers3,
  Loader2,
} from "lucide-react";

import { getPublishedGame } from "../api/games";
import { getPublishedGameForPlay } from "../api/player";
import { getSaveSlots } from "../api/saveSlots";

const formatDate = (value) => {
  if (!value) return "-";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? "-"
    : date.toLocaleString("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
      });
};

export default function GameDetails() {
  const { gameId } = useParams();

  const [game, setGame] = useState(null);
  const [publishedData, setPublishedData] = useState(null);
  const [saves, setSaves] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveError, setSaveError] = useState("");

  useEffect(() => {
    let active = true;

    const loadDetails = async () => {
      try {
        setLoading(true);
        setError("");
        setSaveError("");
        setGame(null);
        setPublishedData(null);
        setSaves([]);

        const [gameResult, playerResult] =
          await Promise.all([
            getPublishedGame(gameId),
            getPublishedGameForPlay(gameId),
          ]);

        if (!active) return;

        setGame(gameResult);
        setPublishedData(playerResult);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Game not found."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDetails();

    return () => {
      active = false;
    };
  }, [gameId]);

  useEffect(() => {
    if (!game) return;

    let active = true;

    const loadSaves = async () => {
      try {
        const result = await getSaveSlots(gameId);

        if (active) {
          setSaves(
            Array.isArray(result) ? result : []
          );
        }
      } catch (err) {
        if (!active) return;

        // A public game page must remain accessible
        // when the visitor is not logged in.
        if (err.response?.status !== 401) {
          setSaveError(
            "Unable to check saved progress."
          );
        }
      }
    };

    loadSaves();

    return () => {
      active = false;
    };
  }, [game, gameId]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-3 text-gray-400">
        <Loader2 className="animate-spin" size={20} />
        Loading game...
      </div>
    );
  }

  if (error || !game) {
    return (
      <div className="p-12 text-center text-gray-400">
        <p>{error || "Game not found."}</p>

        <Link
          to="/games"
          className="mt-4 inline-block text-purple-400 hover:underline"
        >
          Back to Library
        </Link>
      </div>
    );
  }

  const chapters = publishedData?.chapters || [];
  const version = publishedData?.version;

  const latestSave = [...saves].sort(
    (a, b) =>
      new Date(b.savedAt).getTime() -
      new Date(a.savedAt).getTime()
  )[0];

  const playUrl = `/games/${gameId}/play`;

  const continueUrl = latestSave
    ? `${playUrl}?slot=${latestSave.slotNumber}`
    : null;

  return (
    <main className="mx-auto max-w-6xl px-5 py-12 text-white">
      <Link
        to="/games"
        className="mb-8 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white"
      >
        <ArrowLeft size={17} />
        Back to Library
      </Link>

      <div className="grid gap-10 md:grid-cols-[350px_1fr]">
        {/* Cover */}
        <div className="aspect-[3/4] overflow-hidden rounded-2xl border border-white/10 bg-[#191928]">
          {game.cover_url ? (
            <img
              src={game.cover_url}
              alt={game.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-purple-300">
              <BookOpen size={72} />
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="mb-3 inline-flex rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
            Published Visual Novel
          </div>

          <h1 className="text-3xl font-bold md:text-4xl">
            {game.title}
          </h1>

          <div className="mt-4 flex items-center gap-2 text-sm text-gray-400">
            <UserRound size={17} />
            Created by{" "}
            {game.creator_username || "Unknown Creator"}
          </div>

          {/* Published Info */}
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-[#151521] p-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Layers3 size={15} />
                Chapters
              </div>

              <p className="mt-2 text-2xl font-semibold">
                {chapters.length}
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-[#151521] p-4">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <BookOpen size={15} />
                Published Version
              </div>

              <p className="mt-2 text-2xl font-semibold">
                {version?.versionNumber ?? "-"}
              </p>
            </div>
          </div>

          {/* Description */}
          <section className="mt-8">
            <h2 className="text-xl font-semibold">
              About This Story
            </h2>

            <p className="mt-3 whitespace-pre-wrap leading-relaxed text-gray-300">
              {game.description ||
                "No description available."}
            </p>
          </section>

          {/* Actions */}
          <div className="mt-8 flex flex-wrap gap-3">
            {continueUrl && (
              <Link
                to={continueUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold transition hover:bg-purple-500"
              >
                <Play size={18} />
                Continue Game
              </Link>
            )}

            <Link
              to={playUrl}
              className={`inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-semibold transition ${
                continueUrl
                  ? "border border-white/20 bg-white/10 hover:bg-white/20"
                  : "bg-purple-600 hover:bg-purple-500"
              }`}
            >
              {continueUrl ? (
                <RotateCcw size={18} />
              ) : (
                <Play size={18} />
              )}

              {continueUrl
                ? "Play New Game"
                : "Play Game"}
            </Link>
          </div>

          {latestSave && (
            <div className="mt-5 rounded-xl border border-purple-500/20 bg-purple-500/5 p-4">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-300">
                <Clock3 size={16} />
                Your Latest Save
              </div>

              <p className="mt-2 text-sm text-gray-300">
                Slot {latestSave.slotNumber} · Version{" "}
                {latestSave.versionNumber}
              </p>

              <p className="mt-1 text-xs text-gray-500">
                {formatDate(latestSave.savedAt)}
              </p>
            </div>
          )}

          {saveError && (
            <p className="mt-3 text-sm text-amber-300">
              {saveError}
            </p>
          )}

          {/* Chapter List */}
          {chapters.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-semibold">
                Chapters
              </h2>

              <div className="mt-4 space-y-2">
                {chapters.map((chapter, index) => (
                  <div
                    key={chapter.chapterId ?? index}
                    className="flex items-center gap-4 rounded-xl border border-white/10 bg-[#151521] px-4 py-3"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-sm font-semibold text-purple-300">
                      {index + 1}
                    </span>

                    <p className="text-sm text-gray-200">
                      {chapter.title}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
