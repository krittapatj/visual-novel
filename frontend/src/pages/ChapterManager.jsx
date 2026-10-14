import { useToast } from "../components/ui/ToastProvider";
import useConfirm from "../components/ui/useConfirm";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";

import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Layers,
  AlertCircle,
} from "lucide-react";

import { getMyGame } from "../api/games";
import {
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter,
} from "../api/chapters";

import ChapterCard from "../components/ChapterCard";
import ChapterForm from "../components/ChapterForm";

export default function ChapterManager() {
  const { gameId } = useParams();
  const { notify } = useToast();
  const { confirm, dialog } = useConfirm();

  const [game, setGame] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError("");

      const [gameData, chapterData] = await Promise.all([
        getMyGame(gameId),
        getChapters(gameId),
      ]);

      setGame(gameData);
      setChapters(chapterData);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load chapters."
      );
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const nextOrder =
    chapters.reduce(
      (max, chapter) =>
        Math.max(max, chapter.chapter_order),
      0
    ) + 1;

  const handleCreate = async (title) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      await createChapter(gameId, {
        title,
        chapter_order: nextOrder,
      });

      setShowCreate(false);
      setMessage("Chapter created successfully.");
      notify("Chapter created successfully.", "success");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to create chapter."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (title) => {
    if (!editingChapter) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await updateChapter(editingChapter.chapter_id, {
        title,
        chapter_order: editingChapter.chapter_order,
      });

      setEditingChapter(null);
      setMessage("Chapter updated successfully.");
      notify("Chapter updated successfully.", "success");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update chapter."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chapter) => {
    const confirmed = await confirm({
      title: "Delete chapter?",
      description: `Delete "${chapter.title}" permanently?\n\nAll story nodes and edges in this chapter may also be deleted.`,
      confirmLabel: "Delete Chapter", danger: true,
    });

    if (!confirmed) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await deleteChapter(chapter.chapter_id);
      setMessage("Chapter deleted successfully.");
      notify("Chapter deleted successfully.", "success");
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete chapter."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading chapters..." fullPage />;
  }

  if (!game) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <p role="alert" className="break-words text-red-400">
          {error || "Game not found."}
        </p>

        <Link
          to="/creator"
          className="mt-5 inline-block text-purple-400"
        >
          Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl min-w-0 px-4 py-6 sm:px-6 sm:py-10 lg:py-12">
      {/* Back Navigation */}
      <Link
        to={`/creator/games/${gameId}/edit`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white sm:mb-8 sm:text-base"
      >
        <ArrowLeft size={18} className="shrink-0" />
        Back to Game
      </Link>

      {/* Header */}
      <div className="mb-6 flex min-w-0 flex-col gap-5 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <p className="mb-2 text-sm font-medium text-purple-400">
            Creator Studio / Chapters
          </p>

          <h1 className="break-words text-2xl font-bold sm:text-3xl">
            {game.title}
          </h1>

          <p className="mt-3 break-words text-sm text-gray-400 sm:text-base">
            Manage chapters and organize your visual novel story.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingChapter(null);
            setShowCreate(true);
          }}
          disabled={saving}
          className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
        >
          <Plus size={19} />
          Add Chapter
        </button>
      </div>

      {/* Chapter Summary */}
      <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-[#171725] p-4 sm:mb-8 sm:p-5">
        <Layers
          size={24}
          className="shrink-0 text-purple-400"
        />

        <div className="min-w-0">
          <p className="text-2xl font-bold">
            {chapters.length}
          </p>

          <p className="text-sm text-gray-400">
            Total Chapters
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          role="alert"
          className="mb-6 flex min-w-0 items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300"
        >
          <AlertCircle
            size={20}
            className="shrink-0"
          />
          <p className="min-w-0 break-words">{error}</p>
        </div>
      )}

      {/* Success */}
      {message && (
        <div
          role="status"
          className="mb-6 break-words rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300"
        >
          {message}
        </div>
      )}

      {/* Create Chapter */}
      {showCreate && (
        <section className="mb-8 min-w-0">
          <h2 className="mb-4 text-lg font-semibold sm:text-xl">
            New Chapter
          </h2>

          <div className="min-w-0">
            <ChapterForm
              onSubmit={handleCreate}
              onCancel={() => setShowCreate(false)}
              loading={saving}
              submitLabel="Create Chapter"
            />
          </div>

          <p className="mt-3 text-sm text-gray-500">
            This chapter will be added as Chapter {nextOrder}.
          </p>
        </section>
      )}

      {/* Chapter List */}
      <div className="min-w-0 space-y-4">
        {chapters.length === 0 ? (
<EmptyState icon={Layers} title="No chapters yet" description="Create your first chapter to begin writing your story." />
        ) : (
          chapters.map((chapter) => (
            <div
              key={chapter.chapter_id}
              className="min-w-0"
            >
              {editingChapter?.chapter_id ===
              chapter.chapter_id ? (
                <ChapterForm
                  initialTitle={chapter.title}
                  onSubmit={handleUpdate}
                  onCancel={() => setEditingChapter(null)}
                  loading={saving}
                  submitLabel="Save Changes"
                />
              ) : (
                <ChapterCard
                  chapter={chapter}
                  gameId={gameId}
                  disabled={saving}
                  onEdit={(selected) => {
                    setShowCreate(false);
                    setEditingChapter(selected);
                  }}
                  onDelete={handleDelete}
                />
              )}
            </div>
          ))
        )}
      </div>
    {dialog}
    </main>
  );
}
