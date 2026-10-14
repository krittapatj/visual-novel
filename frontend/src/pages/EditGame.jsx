import LoadingState from "../components/ui/LoadingState";
import { useToast } from "../components/ui/ToastProvider";
import useConfirm from "../components/ui/useConfirm";

import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Trash2,
  Layers,
  Images,
  Users,
  Tags,
  Save,
  Loader2,
} from "lucide-react";

import GameForm from "../components/GameForm";
import { getMyGame, updateGame, deleteGame } from "../api/games";
import PublishManagement from "../components/creator/PublishManagement";

import {
  getCategories,
  updateGameCategories,
  getMyGameCategories
} from "../api/categories";

export default function EditGame() {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const { notify } = useToast();
  const { confirm, dialog } = useConfirm();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Phase 12: Categories
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesSaving, setCategoriesSaving] = useState(false);
  const [categoriesError, setCategoriesError] = useState("");
  const [categoriesMessage, setCategoriesMessage] = useState("");

  // Load game information
  const loadGame = useCallback(async () => {
    try {
      const data = await getMyGame(gameId);
      setGame(data);
      setError("");
    } catch (err) {
      setError(
        err.response?.data?.message || "Game not found."
      );
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadGame();
  }, [loadGame]);

  // Load available and selected categories
  useEffect(() => {
    let active = true;

    const loadCategoryData = async () => {
      setCategoriesLoading(true);
      setCategoriesError("");

      try {
        const [allCategories, gameCategories] = await Promise.all([
          getCategories(),
          getMyGameCategories(gameId)
        ]);

        if (!active) return;

        setCategories(
          Array.isArray(allCategories) ? allCategories : []
        );

        setSelectedCategories(
          Array.isArray(gameCategories)
            ? gameCategories.map((category) => category.category_id)
            : []
        );
      } catch (err) {
        if (active) {
          setCategoriesError(
            err.response?.data?.message ||
              "Unable to load game categories."
          );
        }
      } finally {
        if (active) setCategoriesLoading(false);
      }
    };

    loadCategoryData();

    return () => {
      active = false;
    };
  }, [gameId]);

  // Update game information
  const handleUpdate = async (data) => {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const updated = await updateGame(gameId, data);
      setGame(updated);
      setMessage("Game updated successfully.");
      notify("Game updated successfully.", "success");
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to update game."
      );
    } finally {
      setSaving(false);
    }
  };

  // Select or deselect category
  const toggleCategory = (categoryId) => {
    setCategoriesError("");
    setCategoriesMessage("");

    setSelectedCategories((previous) => {
      if (previous.includes(categoryId)) {
        return previous.filter((id) => id !== categoryId);
      }

      if (previous.length >= 5) {
        setCategoriesError("You can select up to 5 categories.");
        return previous;
      }

      return [...previous, categoryId];
    });
  };

  // Save selected categories
  const handleSaveCategories = async () => {
    setCategoriesSaving(true);
    setCategoriesError("");
    setCategoriesMessage("");

    try {
      const result = await updateGameCategories(
        gameId,
        selectedCategories
      );

      setSelectedCategories(
        result.categories.map((category) => category.category_id)
      );

      setCategoriesMessage("Categories updated successfully.");
      notify("Categories updated successfully.", "success");
    } catch (err) {
      setCategoriesError(
        err.response?.data?.message ||
          "Unable to update categories."
      );
    } finally {
      setCategoriesSaving(false);
    }
  };

  // Delete unpublished draft game
  const handleDelete = async () => {
    const confirmed = await confirm({ title: "Delete draft game?", description: "Delete this draft game permanently? This action cannot be undone.", confirmLabel: "Delete game", danger: true });

    if (!confirmed) return;

    setDeleting(true);
    setError("");

    try {
      await deleteGame(gameId);
      navigate("/creator", { replace: true });
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to delete game."
      );
      setDeleting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading game..." fullPage />;
  }

  if (!game) {
    return (
      <p className="p-12 text-center text-red-400">
        {error || "Game not found."}
      </p>
    );
  }

  const canDelete =
    game.status === "draft" &&
    game.published_version_id == null;

  return (
    <main className="mx-auto w-full min-w-0 max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
      {/* Back to Dashboard */}
      <Link
        to="/creator"
        className="mb-7 inline-flex min-h-10 items-center gap-2 text-sm text-gray-400 sm:mb-8 hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>

      {/* Page Header */}
      <div className="mb-8 flex min-w-0 flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-bold sm:text-3xl">Edit Game</h1>
          <p className="mt-2 text-gray-400">
            Manage your game's information.
          </p>
        </div>

        <span
          className={`max-w-full break-words rounded-full px-4 py-2 text-sm capitalize ${
            game.status === "published"
              ? "bg-green-500/15 text-green-400"
              : "bg-purple-500/15 text-purple-300"
          }`}
        >
          {game.status}
        </span>
      </div>

      {/* Error Message */}
      {error && (
        <p role="alert" className="mb-5 break-words rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {/* Success Message */}
      {message && (
        <p role="status" className="mb-5 break-words rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          {message}
        </p>
      )}

      {/* Game Information Form */}
      <GameForm
        initialData={game}
        onSubmit={handleUpdate}
        loading={saving}
        submitLabel="Save Changes"
      />

      {/* Phase 12: Game Categories */}
      <section className="mt-8 min-w-0 rounded-2xl border border-white/10 bg-[#171725] p-4 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <Tags className="text-purple-400" size={24} />
          <h2 className="min-w-0 break-words text-lg font-semibold sm:text-xl">
            Game Categories
          </h2>
        </div>

        <p className="mt-3 text-sm text-gray-400">
          Choose up to 5 categories that best describe your story.
        </p>

        {categoriesLoading ? (
          <div className="mt-6 flex items-center gap-2 text-gray-400">
            <Loader2 size={18} className="animate-spin" />
            Loading categories...
          </div>
        ) : (
          <>
            <div className="mt-6 flex min-w-0 flex-wrap gap-2 sm:gap-3">
              {categories.map((category) => {
                const selected = selectedCategories.includes(
                  category.category_id
                );

                return (
                  <button
                    key={category.category_id}
                    type="button"
                    aria-pressed={selected}
                    disabled={categoriesSaving}
                    onClick={() =>
                      toggleCategory(category.category_id)
                    }
                    className={`max-w-full break-words rounded-full border px-4 py-2 text-sm font-medium transition disabled:opacity-50 ${
                      selected
                        ? "border-purple-500 bg-purple-600 text-white"
                        : "border-white/10 bg-[#222232] text-gray-300 hover:border-purple-500"
                    }`}
                  >
                    {category.category_name}
                  </button>
                );
              })}
            </div>

            <p className="mt-4 text-sm text-gray-400">
              Selected: {selectedCategories.length} / 5
            </p>

            {categoriesError && (
              <p role="alert" className="mt-3 break-words text-sm text-red-400">
                {categoriesError}
              </p>
            )}

            {categoriesMessage && (
              <p
                role="status"
                className="mt-3 break-words text-sm text-emerald-400"
              >
                {categoriesMessage}
              </p>
            )}

            <button
              type="button"
              onClick={handleSaveCategories}
              disabled={
                categoriesSaving ||
                categoriesLoading ||
                categories.length === 0
              }
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl sm:w-auto bg-purple-600 px-5 py-3 font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {categoriesSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}

              {categoriesSaving
                ? "Saving Categories..."
                : "Save Categories"}
            </button>
          </>
        )}
      </section>

      {/* Story Chapters */}
      <section className="mt-8 min-w-0 rounded-2xl border border-white/10 bg-[#171725] p-4 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <Layers className="text-purple-400" />
          <h2 className="min-w-0 break-words text-lg font-semibold sm:text-xl">
            Story Chapters
          </h2>
        </div>

        <p className="mt-3 text-gray-400">
          Create and manage chapters for your visual novel.
        </p>

        <Link
          to={`/creator/games/${gameId}/chapters`}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl text-center sm:w-auto bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
        >
          Manage Chapters
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Asset Manager */}
      <section className="mt-8 min-w-0 rounded-2xl border border-white/10 bg-[#171725] p-4 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <Images className="text-purple-400" />
          <h2 className="min-w-0 break-words text-lg font-semibold sm:text-xl">
            Asset Manager
          </h2>
        </div>

        <p className="mt-3 text-gray-400">
          Upload and manage backgrounds, characters, covers and
          thumbnails for your visual novel.
        </p>

        <Link
          to={`/creator/games/${gameId}/assets`}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl text-center sm:w-auto bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
        >
          Manage Assets
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Character Manager */}
      <section className="mt-8 min-w-0 rounded-2xl border border-white/10 bg-[#171725] p-4 sm:p-6">
        <div className="flex min-w-0 items-start gap-3">
          <Users className="text-purple-400" />
          <h2 className="min-w-0 break-words text-lg font-semibold sm:text-xl">
            Character Manager
          </h2>
        </div>

        <p className="mt-3 text-gray-400">
          Create characters and manage their expressions,
          including Normal, Happy, Sad and Angry.
        </p>

        <Link
          to={`/creator/games/${gameId}/characters`}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl text-center sm:w-auto bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
        >
          Manage Characters
          <ArrowRight size={18} />
        </Link>
      </section>

      {/* Publishing Management */}
      <div className="mt-8">
        <PublishManagement
          gameId={gameId}
          game={game}
          onPublished={loadGame}
        />
      </div>

      {/* Danger Zone */}
      {canDelete && (
        <section className="mt-8 min-w-0 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-red-300">
            Danger Zone
          </h2>

          <p className="mt-2 text-sm text-gray-400">
            Deleting this game permanently removes its data.
          </p>

          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl text-center sm:w-auto bg-red-600 px-5 py-3 font-semibold hover:bg-red-500 disabled:opacity-50"
          >
            <Trash2 size={18} />
            {deleting ? "Deleting..." : "Delete Draft Game"}
          </button>
        </section>
      )}
      {dialog}
    </main>
  );
}
