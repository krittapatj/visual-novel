import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import { useToast } from "../components/ui/ToastProvider";
import useConfirm from "../components/ui/useConfirm";

import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Plus,
  Save,
  Trash2,
  UserRound,
  Image as ImageIcon,
  LoaderCircle,
} from "lucide-react";

import { getMyGame } from "../api/games";
import { getAssets } from "../api/assets";
import {
  getCharacters,
  createCharacter,
  updateCharacter,
  deleteCharacter,
  saveCharacterExpression,
  deleteCharacterExpression,
} from "../api/characters";

const API_ORIGIN = new URL(
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).origin;

const EXPRESSION_NAMES = [
  "Normal",
  "Happy",
  "Sad",
  "Angry",
  "Surprised",
  "Shy",
  "Crying",
];

const inputClass =
  "block w-full min-w-0 rounded-xl border border-white/10 " +
  "bg-[#10101b] px-4 py-3 text-base text-white " +
  "outline-none transition focus:border-purple-500 " +
  "disabled:cursor-not-allowed disabled:opacity-50 " +
  "sm:text-sm";

function imageUrl(path) {
  if (!path) return "";
  return new URL(path, API_ORIGIN).href;
}

export default function CharacterManager() {
  const { gameId } = useParams();
  const { notify } = useToast();
  const { confirm, dialog } = useConfirm();

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
        getAssets(gameId),
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
      getAssets(gameId),
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
          description,
        });

        await loadData();
        setMessage("Character updated successfully.");
        notify("Character updated successfully.", "success");
      } else {
        const created = await createCharacter(gameId, {
          character_name: name.trim(),
          description,
        });

        await loadData();
        setSelectedId(created.character_id);
        setMessage("Character created successfully.");
        notify("Character created successfully.", "success");
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

    if (
      !(await confirm({ title: "Delete character?", description: "Delete this character and all expressions? This cannot be undone.", confirmLabel: "Delete character", danger: true }))
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      await deleteCharacter(gameId, selectedId);
      await loadData();
      resetForm();
      setMessage("Character deleted successfully.");
      notify("Character deleted successfully.", "success");
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
        is_default: isDefault,
      });

      await loadData();
      setMessage("Expression saved successfully.");
      notify("Expression saved successfully.", "success");
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
    if (!(await confirm({ title: "Delete expression?", description: "Delete this expression? This cannot be undone.", confirmLabel: "Delete expression", danger: true }))) return;

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
      notify("Expression deleted successfully.", "success");
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
    return <LoadingState message="Loading characters..." fullPage />;
  }

  return (
    <main
      className={
        "mx-auto w-full max-w-7xl min-w-0 " +
        "px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10"
      }
    >
      {/* Back Navigation */}
      <Link
        to={`/creator/games/${gameId}/edit`}
        className={
          "mb-6 inline-flex items-center gap-2 " +
          "text-sm text-gray-400 transition hover:text-white " +
          "sm:mb-7 sm:text-base"
        }
      >
        <ArrowLeft size={18} className="shrink-0" />
        Back to Edit Game
      </Link>

      {/* Page Header */}
      <div
        className={
          "mb-6 flex min-w-0 flex-col gap-4 " +
          "sm:mb-8 sm:flex-row sm:items-center " +
          "sm:justify-between"
        }
      >
        <div className="min-w-0 flex-1">
          <h1
            className={
              "break-words text-2xl font-bold " +
              "sm:text-3xl"
            }
          >
            Character Manager
          </h1>

          <p
            className={
              "mt-2 break-words text-sm text-gray-400 " +
              "sm:text-base"
            }
          >
            {game?.title || "Visual Novel"} — Characters & Expressions
          </p>
        </div>

        <button
          type="button"
          onClick={resetForm}
          disabled={saving}
          className={
            "inline-flex w-full shrink-0 items-center " +
            "justify-center gap-2 rounded-xl bg-purple-600 " +
            "px-5 py-3 font-medium transition " +
            "hover:bg-purple-500 disabled:opacity-50 " +
            "sm:w-auto"
          }
        >
          <Plus size={18} />
          New Character
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <p
          role="alert"
          className={
            "mb-5 break-words rounded-xl border " +
            "border-red-500/20 bg-red-500/10 " +
            "p-4 text-sm text-red-300 sm:text-base"
          }
        >
          {error}
        </p>
      )}

      {/* Success Message */}
      {message && (
        <p
          role="status"
          className={
            "mb-5 break-words rounded-xl border " +
            "border-emerald-500/20 bg-emerald-500/10 " +
            "p-4 text-sm text-emerald-300 sm:text-base"
          }
        >
          {message}
        </p>
      )}

      {/* Main Responsive Layout */}
      <div
        className={
          "grid min-w-0 grid-cols-1 gap-5 " +
          "lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-6"
        }
      >
        {/* Character List */}
        <aside
          className={
            "min-w-0 rounded-2xl border border-white/10 " +
            "bg-[#171725] p-4 sm:p-5 lg:p-4"
          }
        >
          <h2 className="mb-4 text-lg font-semibold">
            Characters ({characters.length})
          </h2>

          {characters.length === 0 && (
            <EmptyState title="No characters yet" className="px-3 py-8" />
          )}

          <div
            className={
              "grid min-w-0 grid-cols-1 gap-2 " +
              "sm:grid-cols-2 lg:grid-cols-1"
            }
          >
            {characters.map((character) => {
              const defaultExpression =
                character.expressions?.find(
                  (expression) => expression.is_default
                ) || character.expressions?.[0];

              return (
                <button
                  key={character.character_id}
                  type="button"
                  onClick={() => selectCharacter(character)}
                  aria-pressed={
                    selectedId === character.character_id
                  }
                  className={`flex min-w-0 w-full items-center gap-3
                    rounded-xl border p-3 text-left transition
                    ${
                      selectedId === character.character_id
                        ? "border-purple-500 bg-purple-500/10"
                        : "border-white/10 hover:bg-white/5"
                    }`}
                >
                  {defaultExpression ? (
                    <img
                      src={imageUrl(
                        defaultExpression.file_path
                      )}
                      alt={character.character_name}
                      className={
                        "h-14 w-12 shrink-0 rounded-lg " +
                        "bg-black/30 object-contain"
                      }
                    />
                  ) : (
                    <div
                      className={
                        "flex h-14 w-12 shrink-0 items-center " +
                        "justify-center rounded-lg bg-black/20"
                      }
                    >
                      <UserRound
                        size={24}
                        className="text-gray-500"
                      />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {character.character_name}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {character.expressions?.length || 0} expressions
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Character Details & Expressions */}
        <div className="min-w-0 space-y-5 sm:space-y-6">
          {/* Character Form */}
          <section
            className={
              "min-w-0 rounded-2xl border border-white/10 " +
              "bg-[#171725] p-4 sm:p-6"
            }
          >
            <h2
              className={
                "mb-5 text-lg font-semibold sm:text-xl"
              }
            >
              {selectedId
                ? "Edit Character"
                : "Create Character"}
            </h2>

            <form
              onSubmit={handleSaveCharacter}
              className="space-y-4"
            >
              <div className="min-w-0">
                <label
                  htmlFor="character-name"
                  className={
                    "mb-2 block text-sm text-gray-300"
                  }
                >
                  Character Name
                </label>

                <input
                  id="character-name"
                  type="text"
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  maxLength={100}
                  required
                  disabled={saving}
                  placeholder="e.g. Alice"
                  className={inputClass}
                />
              </div>

              <div className="min-w-0">
                <label
                  htmlFor="character-description"
                  className={
                    "mb-2 block text-sm text-gray-300"
                  }
                >
                  Description
                </label>

                <textarea
                  id="character-description"
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={3}
                  disabled={saving}
                  placeholder="Character background or personality"
                  className={inputClass}
                />
              </div>

              {/* Form Actions */}
              <div
                className={
                  "flex flex-col gap-3 pt-1 " +
                  "sm:flex-row sm:flex-wrap"
                }
              >
                <button
                  type="submit"
                  disabled={saving}
                  className={
                    "inline-flex w-full items-center " +
                    "justify-center gap-2 rounded-xl " +
                    "bg-purple-600 px-5 py-3 font-medium " +
                    "transition hover:bg-purple-500 " +
                    "disabled:cursor-not-allowed " +
                    "disabled:opacity-50 sm:w-auto"
                  }
                >
                  {saving ? (
                    <LoaderCircle
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Save size={17} />
                  )}

                  {selectedId
                    ? "Save Changes"
                    : "Create Character"}
                </button>

                {selectedId && (
                  <button
                    type="button"
                    onClick={handleDeleteCharacter}
                    disabled={saving}
                    className={
                      "inline-flex w-full items-center " +
                      "justify-center gap-2 rounded-xl " +
                      "border border-red-500/30 px-5 py-3 " +
                      "text-red-400 transition " +
                      "hover:bg-red-500/10 " +
                      "disabled:cursor-not-allowed " +
                      "disabled:opacity-50 sm:w-auto"
                    }
                  >
                    <Trash2 size={17} />
                    Delete
                  </button>
                )}
              </div>
            </form>
          </section>

          {/* Character Expressions */}
          {selectedId && (
            <section
              className={
                "min-w-0 rounded-2xl border border-white/10 " +
                "bg-[#171725] p-4 sm:p-6"
              }
            >
              <h2
                className={
                  "break-words text-lg font-semibold " +
                  "sm:text-xl"
                }
              >
                Character Expressions
              </h2>

              <p
                className={
                  "mt-2 text-sm text-gray-400"
                }
              >
                Assign images from your Asset Library.
              </p>

              {/* Expression Grid */}
              <div
                className={
                  "mt-5 grid min-w-0 grid-cols-1 gap-3 " +
                  "sm:grid-cols-2 xl:grid-cols-3"
                }
              >
                {(selected?.expressions || []).map(
                  (expression) => (
                    <div
                      key={expression.expression_id}
                      className={
                        "min-w-0 overflow-hidden rounded-xl " +
                        "border border-white/10 bg-[#10101b]"
                      }
                    >
                      <div
                        className={
                          "flex h-44 items-center " +
                          "justify-center bg-black/20 p-3 " +
                          "sm:h-40"
                        }
                      >
                        <img
                          src={imageUrl(
                            expression.file_path
                          )}
                          alt={expression.expression_name}
                          className={
                            "h-full max-w-full object-contain"
                          }
                        />
                      </div>

                      <div
                        className={
                          "flex min-w-0 items-center " +
                          "justify-between gap-3 p-3"
                        }
                      >
                        <div className="min-w-0 flex-1">
                          <p
                            className={
                              "break-words text-sm font-semibold"
                            }
                          >
                            {expression.expression_name}
                          </p>

                          {Boolean(
                            expression.is_default
                          ) && (
                            <p
                              className={
                                "mt-1 text-xs text-purple-300"
                              }
                            >
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
                          className={
                            "flex h-10 w-10 shrink-0 " +
                            "items-center justify-center " +
                            "rounded-lg text-red-400 " +
                            "transition hover:bg-red-500/10 " +
                            "disabled:opacity-50"
                          }
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Add / Replace Expression */}
              <form
                onSubmit={handleSaveExpression}
                className={
                  "mt-6 min-w-0 space-y-4 " +
                  "border-t border-white/10 pt-6"
                }
              >
                <h3 className="font-semibold">
                  Add / Replace Expression
                </h3>

                <div className="min-w-0">
                  <label
                    htmlFor="expression-name"
                    className="mb-2 block text-sm"
                  >
                    Expression
                  </label>

                  <select
                    id="expression-name"
                    value={expressionName}
                    onChange={(event) =>
                      setExpressionName(event.target.value)
                    }
                    disabled={saving}
                    className={inputClass}
                  >
                    {EXPRESSION_NAMES.map(
                      (expression) => (
                        <option
                          key={expression}
                          value={expression}
                        >
                          {expression}
                        </option>
                      )
                    )}
                  </select>
                </div>

                <div className="min-w-0">
                  <label
                    htmlFor="expression-asset"
                    className="mb-2 block text-sm"
                  >
                    Character Image
                  </label>

                  <select
                    id="expression-asset"
                    value={assetId}
                    onChange={(event) =>
                      setAssetId(event.target.value)
                    }
                    required
                    disabled={saving}
                    className={inputClass}
                  >
                    <option value="">
                      Select an image
                    </option>

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

                {/* Selected Image Preview */}
                {assetId && (
                  <div
                    className={
                      "flex h-44 w-full min-w-0 " +
                      "items-center justify-center " +
                      "overflow-hidden rounded-xl " +
                      "bg-[#10101b] p-3 sm:h-52"
                    }
                  >
                    <img
                      src={imageUrl(
                        characterAssets.find(
                          (asset) =>
                            String(asset.asset_id) ===
                            assetId
                        )?.file_path
                      )}
                      alt="Selected expression"
                      className={
                        "h-full max-w-full object-contain"
                      }
                    />
                  </div>
                )}

                {/* Default Expression */}
                <label
                  className={
                    "flex min-w-0 items-center gap-3 " +
                    "py-2 text-sm"
                  }
                >
                  <input
                    type="checkbox"
                    checked={isDefault}
                    onChange={(event) =>
                      setIsDefault(
                        event.target.checked
                      )
                    }
                    disabled={saving}
                    className={
                      "h-4 w-4 shrink-0 accent-purple-600"
                    }
                  />

                  <span className="break-words">
                    Set as default expression
                  </span>
                </label>

                {/* No Character Assets */}
                {characterAssets.length === 0 && (
                  <div
                    className={
                      "min-w-0 rounded-xl border " +
                      "border-dashed border-white/15 " +
                      "p-4 text-sm text-gray-400"
                    }
                  >
                    <ImageIcon
                      className="mb-2"
                      size={22}
                    />

                    <p className="break-words">
                      No character images found.
                      <Link
                        to={`/creator/games/${gameId}/assets`}
                        className={
                          "ml-1 text-purple-400 underline " +
                          "hover:text-purple-300"
                        }
                      >
                        Upload images
                      </Link>
                    </p>
                  </div>
                )}

                {/* Save Expression */}
                <button
                  type="submit"
                  disabled={saving || !assetId}
                  className={
                    "inline-flex w-full items-center " +
                    "justify-center gap-2 rounded-xl " +
                    "bg-purple-600 px-5 py-3 " +
                    "font-medium transition " +
                    "hover:bg-purple-500 " +
                    "disabled:cursor-not-allowed " +
                    "disabled:opacity-50 sm:w-auto"
                  }
                >
                  {saving ? (
                    <LoaderCircle
                      size={18}
                      className="animate-spin"
                    />
                  ) : (
                    <Plus size={18} />
                  )}

                  Save Expression
                </button>
              </form>
            </section>
          )}
        </div>
      </div>
      {dialog}
    </main>
  );
}
