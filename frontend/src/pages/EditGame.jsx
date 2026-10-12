import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Trash2, Layers } from "lucide-react";
import GameForm from "../components/GameForm";

import { getMyGame, updateGame, deleteGame } from "../api/games";

export default function EditGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;

    const loadGame = async () => {
      try {
        const data = await getMyGame(gameId);
        if (active) setGame(data);
      } catch {
        if (active) setError("Game not found.");
      } finally {
        if (active) setLoading(false);
      }
    };

    loadGame();

    return () => {
      active = false;
    };
  }, [gameId]);

  const handleUpdate = async (data) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updated = await updateGame(gameId, data);
      setGame(updated);
      setMessage("Game updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to update game.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this draft game permanently? This action cannot be undone.",
    );

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      await deleteGame(gameId);
      navigate("/creator", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Unable to delete game.");
      setDeleting(false);
    }
  };

  if (loading) {
    return <p className="p-12 text-center">Loading game...</p>;
  }

  if (!game) {
    return (
      <p className="p-12 text-center text-red-400">
        {error || "Game not found."}
      </p>
    );
  }

  const canDelete =
    game.status === "draft" && game.published_version_id == null;

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link
        to="/creator"
        className="mb-8 inline-flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Edit Game</h1>
          <p className="mt-2 text-gray-400">Manage your game's information.</p>
        </div>

        <span className="rounded-full bg-purple-500/15 px-4 py-2 text-sm capitalize text-purple-300">
          {game.status}
        </span>
      </div>

      {error && (
        <p role="alert" className="mb-5 text-red-400">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mb-5 text-emerald-400">
          {message}
        </p>
      )}

      <GameForm
        initialData={game}
        onSubmit={handleUpdate}
        loading={saving}
        submitLabel="Save Changes"
      />

      <section className="mt-8 rounded-2xl border border-white/10 bg-[#171725] p-6">
        <div className="flex items-center gap-3">
          <Layers className="text-purple-400" />

          <h2 className="text-xl font-semibold">Story Chapters</h2>
        </div>

        <p className="mt-3 text-gray-400">
          Create and manage chapters for your visual novel.
        </p>

        <Link
          to={`/creator/games/${gameId}/chapters`}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
        >
          Manage Chapters
          <ArrowRight size={18} />
        </Link>
      </section>

      {canDelete && (
        <section className="mt-8 rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
          <h2 className="text-xl font-semibold text-red-300">Danger Zone</h2>

          <p className="mt-2 text-sm text-gray-400">
            Deleting this game permanently removes its data.
          </p>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold hover:bg-red-500 disabled:opacity-50"
          >
            <Trash2 size={18} />
            {deleting ? "Deleting..." : "Delete Draft Game"}
          </button>
        </section>
      )}
    </main>
  );
}
