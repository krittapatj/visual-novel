
import { useEffect, useState } from "react";
import {
  X,
  Save,
  FolderOpen,
  Trash2,
  Loader2,
  AlertCircle,
  Bookmark,
  Plus,
} from "lucide-react";

import {
  getSaveSlots,
  deleteSaveSlot,
} from "../../api/saveSlots";

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

export default function SaveLoadModal({
  open,
  mode,
  gameId,
  onClose,
  onSave,
  onLoad,
}) {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busySlot, setBusySlot] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !gameId) return;

    let active = true;

    const fetchSlots = async () => {
      setLoading(true);
      setError("");

      try {
        const result = await getSaveSlots(gameId);

        if (active) {
          setSlots(Array.isArray(result) ? result : []);
        }
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Unable to load save slots."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchSlots();

    return () => {
      active = false;
    };
  }, [open, gameId]);

  if (!open) return null;

  const refreshSlots = async () => {
    const result = await getSaveSlots(gameId);
    setSlots(Array.isArray(result) ? result : []);
  };

  const handleSlotClick = async (slotNumber, existingSave) => {
    if (busySlot !== null) return;

    if (mode === "load" && !existingSave) return;

    if (mode === "save" && existingSave) {
      const confirmed = window.confirm(
        `Overwrite Save Slot ${slotNumber}?`
      );

      if (!confirmed) return;
    }

    setBusySlot(slotNumber);
    setError("");

    try {
      if (mode === "save") {
        await onSave(slotNumber);
        await refreshSlots();
      } else {
        await onLoad(slotNumber);
      }

      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          "Unable to complete this action."
      );
    } finally {
      setBusySlot(null);
    }
  };

  const handleDelete = async (slotNumber) => {
    if (busySlot !== null) return;

    const confirmed = window.confirm(
      `Delete Save Slot ${slotNumber} permanently?`
    );

    if (!confirmed) return;

    setBusySlot(slotNumber);
    setError("");

    try {
      await deleteSaveSlot(gameId, slotNumber);
      await refreshSlots();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete save."
      );
    } finally {
      setBusySlot(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && busySlot === null) {
          onClose();
        }
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="save-load-title"
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171725] p-6 text-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="save-load-title"
              className="flex items-center gap-2 text-xl font-semibold"
            >
              {mode === "save" ? (
                <Save className="text-purple-400" size={21} />
              ) : (
                <FolderOpen className="text-purple-400" size={21} />
              )}

              {mode === "save" ? "Save Game" : "Load Game"}
            </h2>

            <p className="mt-2 text-sm text-gray-400">
              {mode === "save"
                ? "Select a slot to save your current progress."
                : "Select a saved slot to continue playing."}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={busySlot !== null}
            aria-label="Close"
            className="text-gray-400 hover:text-white disabled:opacity-40"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300"
          >
            <AlertCircle size={18} className="shrink-0" />
            <p>{error}</p>
          </div>
        )}

        <div className="mt-6 space-y-3">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-gray-400">
              <Loader2 size={20} className="animate-spin" />
              Loading slots...
            </div>
          ) : (
            [1, 2, 3].map((slotNumber) => {
              const existingSave = slots.find(
                (item) => Number(item.slotNumber) === slotNumber
              );

              const disabled =
                busySlot !== null ||
                (mode === "load" && !existingSave);

              return (
                <div
                  key={slotNumber}
                  className="flex items-center gap-3 rounded-xl border border-white/10 bg-[#10101b] p-3"
                >
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      handleSlotClick(slotNumber, existingSave)
                    }
                    className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-500/15 text-purple-300">
                      {busySlot === slotNumber ? (
                        <Loader2
                          size={19}
                          className="animate-spin"
                        />
                      ) : existingSave ? (
                        <Bookmark size={19} />
                      ) : (
                        <Plus size={19} />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium">
                        Slot {slotNumber}
                      </p>

                      {existingSave ? (
                        <>
                          <p className="mt-1 text-xs text-purple-300">
                            Version {existingSave.versionNumber}
                          </p>
                          <p className="mt-1 text-xs text-gray-400">
                            {formatDate(existingSave.savedAt)}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-xs text-gray-500">
                          Empty Slot
                        </p>
                      )}
                    </div>

                    <span className="text-xs text-gray-400">
                      {mode === "save"
                        ? existingSave
                          ? "Overwrite"
                          : "Save"
                        : existingSave
                          ? "Load"
                          : "Empty"}
                    </span>
                  </button>

                  {existingSave && (
                    <button
                      type="button"
                      onClick={() => handleDelete(slotNumber)}
                      disabled={busySlot !== null}
                      title={`Delete Slot ${slotNumber}`}
                      aria-label={`Delete Slot ${slotNumber}`}
                      className="rounded-lg p-2 text-gray-500 transition hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                    >
                      <Trash2 size={17} />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
