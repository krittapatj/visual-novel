
import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft, Plus, Save, Trash2, UserRound,
  Image as ImageIcon, LoaderCircle
} from "lucide-react";

import { getMyGame } from "../api/games";
import { getAssets } from "../api/assets";
import {
  getCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  saveCharacterExpression,
  deleteCharacterExpression
} from "../api/characters";

const API_ORIGIN = new URL(
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).origin;

const EXPRESSION_NAMES = [
  "Normal", "Happy", "Sad", "Angry",
  "Surprised", "Shy", "Crying"
];

const inputClass =
  "w-full rounded-xl border border-white/10 bg-[#10101b] " +
  "px-4 py-3 text-white outline-none focus:border-purple-500";

function imageUrl(path) {
  if (!path) return "";
  return new URL(path, API_ORIGIN).href;
}

export default function CharacterManager() {
  const { gameId } = useParams();

  const [game, setGame] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [assets, setAssets] = useState([]);

  const [selectedId, setSelectedId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const [expressionName, setExpressionName] = useState("Normal");
  const [assetId, setAssetId] = useState("");
  const [isDefault, setIsDefault] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selected = characters.find(
    (item) => item.character_id === selectedId
  );

  const characterAssets = assets.filter(
    (asset) => asset.asset_type === "character"
  );

  const loadData = useCallback(async () => {
    const [gameData, characterData, assetData] =
      await Promise.all([
        getMyGame(gameId),
        getCharacters(gameId),
        getAssets(gameId)
      ]);

    setGame(gameData);
    setCharacters(characterData);
    setAssets(assetData);

    return characterData;
  }, [gameId]);

  useEffect(() => {
    let active = true;

    Promise.all([
      getMyGame(gameId),
      getCharacters(gameId),
      getAssets(gameId)
    ])
      .then(([gameData, characterData, assetData]) => {
        if (!active) return;
        setGame(gameData);
        setCharacters(characterData);
        setAssets(assetData);
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
            "Unable to load Character Manager."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [gameId]);

  const selectCharacter = (character) => {
    setSelectedId(character.character_id);
    setName(character.character_name);
    setDescription(character.description || "");
    setError("");
    setMessage("");
  };

  const resetForm = () => {
    setSelectedId(null);
    setName("");
    setDescription("");
    setError("");
    setMessage("");
  };

  const handleSaveCharacter = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      if (selectedId) {
        await updateCharacter(gameId, selectedId, {
          character_name: name.trim(),
          description
        });

        await loadData();
        setMessage("Character updated successfully.");
      } else {
        const created = await createCharacter(gameId, {
          character_name: name.trim(),
          description
        });

        await loadData();
        setSelectedId(created.character_id);
        setMessage("Character created successfully.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to save character."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCharacter = async () => {
    if (!selectedId) return;

    if (!window.confirm("Delete this character and all expressions?")) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await deleteCharacter(gameId, selectedId);
      await loadData();
      resetForm();
      setMessage("Character deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete character."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSaveExpression = async (event) => {
    event.preventDefault();

    if (!selectedId || !assetId) {
      setError("Please select a character image.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await saveCharacterExpression(gameId, selectedId, {
        asset_id: Number(assetId),
        expression_name: expressionName.trim(),
        is_default: isDefault
      });

      await loadData();
      setMessage("Expression saved successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to save expression."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteExpression = async (expressionId) => {
    if (!window.confirm("Delete this expression?")) return;

    setSaving(true);
    setError("");
    setMessage("");

    try {
      await deleteCharacterExpression(
        gameId,
        selectedId,
        expressionId
      );

      await loadData();
      setMessage("Expression deleted successfully.");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to delete expression."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-gray-400">
        <LoaderCircle className="animate-spin" />
        Loading characters...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 text-white">
      <Link
        to={`/creator/games/${gameId}/edit`}
        className="mb-7 inline-flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Edit Game
      </Link>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">
            Character Manager
          </h1>
          <p className="mt-2 text-gray-400">
            {game?.title || "Visual Novel"} — Characters & Expressions
          </p>
        </div>

        <button
          onClick={resetForm}
          className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 hover:bg-purple-500"
        >
          <Plus size={18} />
          New Character
        </button>
      </div>

      {error && (
        <p role="alert" className="mb-5 rounded-xl bg-red-500/10 p-4 text-red-300">
          {error}
        </p>
      )}

      {message && (
        <p role="status" className="mb-5 rounded-xl bg-emerald-500/10 p-4 text-emerald-300">
          {message}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Character List */}
        <aside className="rounded-2xl border border-white/10 bg-[#171725] p-4">
          <h2 className="mb-4 text-lg font-semibold">
            Characters ({characters.length})
          </h2>

          {characters.length === 0 && (
            <p className="text-sm text-gray-400">
              No characters yet.
            </p>
          )}

          <div className="space-y-2">
            {characters.map((character) => {
              const defaultExpression =
                character.expressions?.find(
                  (expression) => expression.is_default
                ) || character.expressions?.[0];

              return (
                <button
                  key={character.character_id}
                  onClick={() => selectCharacter(character)}
                  className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left ${
                    selectedId === character.character_id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 hover:bg-white/5"
                  }`}
                >
                  {defaultExpression ? (
                    <img
                      src={imageUrl(defaultExpression.file_path)}
                      alt={character.character_name}
                      className="h-14 w-12 rounded-lg bg-black/30 object-contain"
                    />
                  ) : (
                    <UserRound className="text-gray-500" />
                  )}

                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {character.character_name}
                    </p>
                    <p className="text-xs text-gray-400">
                      {character.expressions?.length || 0} expressions
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <div className="space-y-6">
          {/* Character Details */}
          <section className="rounded-2xl border border-white/10 bg-[#171725] p-6">
            <h2 className="mb-5 text-xl font-semibold">
              {selectedId ? "Edit Character" : "Create Character"}
            </h2>

            <form onSubmit={handleSaveCharacter} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Character Name
                </label>
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  maxLength={100}
                  required
                  placeholder="e.g. Alice"
                  className={inputClass}
                />
              </div>

              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={3}
                  placeholder="Character background or personality"
                  className={inputClass}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 disabled:opacity-50"
                >
                  <Save size={17} />
                  {selectedId ? "Save Changes" : "Create Character"}
                </button>

                {selectedId && (
                  <button
                    type="button"
                    onClick={handleDeleteCharacter}
                    disabled={saving}
                    className="flex items-center gap-2 rounded-xl border border-red-500/30 px-5 py-3 text-red-400 disabled:opacity-50"
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Expressions */}
          {selectedId && (
            <section className="rounded-2xl border border-white/10 bg-[#171725] p-6">
              <h2 className="text-xl font-semibold">
                Character Expressions
              </h2>
              <p className="mt-2 text-sm text-gray-400">
                Assign images from your Asset Library.
              </p>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {(selected?.expressions || []).map((expression) => (
                  <div
                    key={expression.expression_id}
                    className="overflow-hidden rounded-xl border border-white/10 bg-[#10101b]"
                  >
                    <div className="flex h-40 items-center justify-center">
                      <img
                        src={imageUrl(expression.file_path)}
                        alt={expression.expression_name}
                        className="h-full w-full object-contain"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 p-3">
                      <div>
                        <p className="text-sm font-semibold">
                          {expression.expression_name}
                        </p>
                        {Boolean(expression.is_default) && (
                          <p className="text-xs text-purple-300">
                            Default
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        disabled={saving}
                        onClick={() =>
                          handleDeleteExpression(
                            expression.expression_id
                          )
                        }
                        aria-label={`Delete ${expression.expression_name}`}
                        className="text-red-400 disabled:opacity-50"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <form
                onSubmit={handleSaveExpression}
                className="mt-6 space-y-4 border-t border-white/10 pt-6"
              >
                <h3 className="font-semibold">
                  Add / Replace Expression
                </h3>

                <div>
                  <label className="mb-2 block text-sm">
                    Expression
                  </label>
                  <select
                    value={expressionName}
                    onChange={(event) =>
                      setExpressionName(event.target.value)
                    }
                    className={inputClass}
                  >
                    {EXPRESSION_NAMES.map((expression) => (
                      <option key={expression} value={expression}>
                        {expression}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm">
                    Character Image
                  </label>
                  <select
                    value={assetId}
                    onChange={(event) =>
                      setAssetId(event.target.value)
                    }
                    required
                    className={inputClass}
                  >
                    <option value="">Select an image</option>
                    {characterAssets.map((asset) => (
                      <option
                        key={asset.asset_id}
                        value={asset.asset_id}
                      >
                        {asset.asset_name}
                      </option>
                    ))}
                  </select>
                </div>

                {assetId && (
                  <div className="flex h-44 items-center justify-center rounded-xl bg-[#10101b] p-3">
                    <img
                      src={imageUrl(
                        characterAssets.find(
                          (asset) =>
                            String(asset.asset_id) === assetId
                        )?.file_path
                      )}
                      alt="Selected expression"
                      className="h-full max-w-full object-contain"
                    />
                  </div>
                )}

                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(event) =>
                      setIsDefault(event.target.checked)
                    }
                    className="accent-purple-600"
                  />
                  Set as default expression
                </label>

                {characterAssets.length === 0 && (
                  <div className="rounded-xl border border-dashed border-white/15 p-4 text-sm text-gray-400">
                    <ImageIcon className="mb-2" size={22} />
                    No character images found.
                    <Link
                      to={`/creator/games/${gameId}/assets`}
                      className="ml-1 text-purple-400 underline"
                    >
                      Upload images
                    </Link>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving || !assetId}
                  className="flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 disabled:opacity-50"
                >
                  <Plus size={18} />
                  Save Expression
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
