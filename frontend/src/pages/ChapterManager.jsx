import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Layers,
  AlertCircle
} from 'lucide-react';

import { getMyGame } from '../api/games';
import {
  getChapters,
  createChapter,
  updateChapter,
  deleteChapter
} from '../api/chapters';

import ChapterCard from '../components/ChapterCard';
import ChapterForm from '../components/ChapterForm';

export default function ChapterManager() {
  const { gameId } = useParams();

  const [game, setGame] = useState(null);
  const [chapters, setChapters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [editingChapter, setEditingChapter] = useState(null);

  const loadData = useCallback(async () => {
    try {
      setError('');

      const [gameData, chapterData] = await Promise.all([
        getMyGame(gameId),
        getChapters(gameId)
      ]);

      setGame(gameData);
      setChapters(chapterData);
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to load chapters.'
      );
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const nextOrder = chapters.reduce(
    (max, chapter) =>
      Math.max(max, chapter.chapter_order),
    0
  ) + 1;

  const handleCreate = async (title) => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      await createChapter(gameId, {
        title,
        chapter_order: nextOrder
      });

      setShowCreate(false);
      setMessage('Chapter created successfully.');
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to create chapter.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (title) => {
    if (!editingChapter) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await updateChapter(editingChapter.chapter_id, {
        title,
        chapter_order: editingChapter.chapter_order
      });

      setEditingChapter(null);
      setMessage('Chapter updated successfully.');
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to update chapter.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (chapter) => {
    const confirmed = window.confirm(
      `Delete "${chapter.title}" permanently?\n\nAll story nodes and edges in this chapter may also be deleted.`
    );

    if (!confirmed) return;

    setSaving(true);
    setError('');
    setMessage('');

    try {
      await deleteChapter(chapter.chapter_id);
      setMessage('Chapter deleted successfully.');
      await loadData();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete chapter.'
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="p-12 text-center text-gray-400">
        Loading chapters...
      </p>
    );
  }

  if (!game) {
    return (
      <main className="mx-auto max-w-5xl px-5 py-12">
        <p role="alert" className="text-red-400">
          {error || 'Game not found.'}
        </p>
        <Link to="/creator" className="mt-5 inline-block text-purple-400">
          Back to Dashboard
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-5 py-12">
      <Link
        to={`/creator/games/${gameId}/edit`}
        className="mb-8 inline-flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Game
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="mb-2 text-sm font-medium text-purple-400">
            Creator Studio / Chapters
          </p>

          <h1 className="text-3xl font-bold">
            {game.title}
          </h1>

          <p className="mt-3 text-gray-400">
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
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50"
        >
          <Plus size={19} />
          Add Chapter
        </button>
      </div>

      <div className="mb-8 flex items-center gap-3 rounded-xl border border-white/10 bg-[#171725] p-5">
        <Layers size={24} className="text-purple-400" />
        <div>
          <p className="text-2xl font-bold">
            {chapters.length}
          </p>
          <p className="text-sm text-gray-400">
            Total Chapters
          </p>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {message && (
        <div role="status" className="mb-6 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-emerald-300">
          {message}
        </div>
      )}

      {showCreate && (
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold">
            New Chapter
          </h2>

          <ChapterForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreate(false)}
            loading={saving}
            submitLabel="Create Chapter"
          />

          <p className="mt-3 text-sm text-gray-500">
            This chapter will be added as Chapter {nextOrder}.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {chapters.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-[#171725] px-6 py16 text-center">
            <Layers
              size={44}
              className="mx-auto mb-4 text-purple-400"
            />
            <h2 className="text-xl font-semibold">
              No chapters yet
            </h2>
            <p className="mt-2 text-gray-400">
              Create your first chapter to begin writing your story.
            </p>
          </div>
        ) : (
          chapters.map((chapter) => (
            <div key={chapter.chapter_id}>
              {editingChapter?.chapter_id === chapter.chapter_id ? (
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
    </main>
  );
}