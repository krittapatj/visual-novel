
import { useEffect, useState } from "react";
import {
  Settings,
  X,
  RotateCcw,
  Volume2,
  Type,
  Play,
  Clock,
} from "lucide-react";

import {
  DEFAULT_PLAYER_SETTINGS,
  normalizePlayerSettings,
} from "../../utils/playerSettings";



export default function PlayerSettingsModal({
  open,
  settings,
  onChange,
  onClose,
}) {
  const [draft, setDraft] = useState(settings);

  useEffect(() => {
    if (open) {
      setDraft(normalizePlayerSettings(settings));
    }
  }, [open, settings]);

  if (!open) return null;

  const updateDraft = (key, value) => {
    setDraft((previous) => ({
      ...previous,
      [key]: value,
    }));
  };

  const handleSave = () => {
    onChange(normalizePlayerSettings(draft));
    onClose();
  };

  const handleReset = () => {
    setDraft({ ...DEFAULT_PLAYER_SETTINGS });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
      role="presentation"
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="player-settings-title"
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-[#171725] p-6 text-white shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Settings className="text-purple-400" size={24} />
            <h2
              id="player-settings-title"
              className="text-xl font-bold"
            >
              Player Settings
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close settings"
            className="rounded-lg p-2 text-gray-400 hover:bg-white/10 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        <div className="mt-7 space-y-7">
          {/* Text Speed */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label
                htmlFor="text-speed"
                className="flex items-center gap-2 font-medium"
              >
                <Type size={18} className="text-purple-400" />
                Text Speed
              </label>
              <span className="text-sm text-gray-400">
                {draft.textSpeed === 0
                  ? "Instant"
                  : `${draft.textSpeed}%`}
              </span>
            </div>

            <input
              id="text-speed"
              type="range"
              min="0"
              max="100"
              step="5"
              value={draft.textSpeed}
              onChange={(event) =>
                updateDraft(
                  "textSpeed",
                  Number(event.target.value)
                )
              }
              className="w-full accent-purple-500"
            />

            <p className="mt-2 text-xs text-gray-500">
              Higher values display dialogue faster.
            </p>
          </div>

          {/* Master Volume */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <label
                htmlFor="master-volume"
                className="flex items-center gap-2 font-medium"
              >
                <Volume2 size={18} className="text-purple-400" />
                Master Volume
              </label>

              <span className="text-sm text-gray-400">
                {draft.masterVolume}%
              </span>
            </div>

            <input
              id="master-volume"
              type="range"
              min="0"
              max="100"
              step="5"
              value={draft.masterVolume}
              onChange={(event) =>
                updateDraft(
                  "masterVolume",
                  Number(event.target.value)
                )
              }
              className="w-full accent-purple-500"
            />

            <p className="mt-2 text-xs text-gray-500">
              Used by music and sound effects when available.
            </p>
          </div>

          {/* Auto Play */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <label
                htmlFor="auto-play"
                className="flex items-center gap-2 font-medium"
              >
                <Play size={18} className="text-purple-400" />
                Auto Play
              </label>

              <p className="mt-2 text-xs text-gray-500">
                Automatically continue after dialogue finishes.
              </p>
            </div>

            <input
              id="auto-play"
              type="checkbox"
              checked={draft.autoPlay}
              onChange={(event) =>
                updateDraft("autoPlay", event.target.checked)
              }
              className="mt-1 h-5 w-5 accent-purple-500"
            />
          </div>

          {/* Auto Play Delay */}
          {draft.autoPlay && (
            <div>
              <div className="mb-3 flex items-center justify-between">
                <label
                  htmlFor="auto-play-delay"
                  className="flex items-center gap-2 font-medium"
                >
                  <Clock size={18} className="text-purple-400" />
                  Auto Play Delay
                </label>

                <span className="text-sm text-gray-400">
                  {(draft.autoPlayDelay / 1000).toFixed(1)}s
                </span>
              </div>

              <input
                id="auto-play-delay"
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={draft.autoPlayDelay}
                onChange={(event) =>
                  updateDraft(
                    "autoPlayDelay",
                    Number(event.target.value)
                  )
                }
                className="w-full accent-purple-500"
              />
            </div>
          )}
        </div>

        <div className="mt-8 flex flex-wrap justify-between gap-3 border-t border-white/10 pt-5">
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-300 hover:bg-white/5"
          >
            <RotateCcw size={16} />
            Reset Defaults
          </button>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-white/10 px-4 py-3 text-sm text-gray-300 hover:bg-white/5"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              className="rounded-xl bg-purple-600 px-5 py-3 text-sm font-semibold hover:bg-purple-500"
            >
              Save Settings
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
