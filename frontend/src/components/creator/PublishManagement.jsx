
import { useCallback, useEffect, useState } from 'react';
import { useToast } from '../ui/ToastProvider';
import useConfirm from '../ui/useConfirm';
import {
  Upload,
  History,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Loader2
} from 'lucide-react';

import {
  publishGame,
  getGameVersions
} from '../../api/publishing';

export default function PublishManagement({
  gameId,
  game,
  onPublished
}) {
  const { notify } = useToast();
  const { confirm, dialog } = useConfirm();
  const [versions, setVersions] = useState([]);
  const [versionName, setVersionName] = useState('');
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const isPublished =
    game?.status === 'published' &&
    game?.published_version_id != null;

  const currentVersion = versions.find(
    (version) =>
      Number(version.version_id) ===
      Number(game?.published_version_id)
  );

  const loadVersions = useCallback(async () => {
    if (!gameId) return;

    try {
      setLoading(true);
      setError('');

      const data = await getGameVersions(gameId);
      setVersions(Array.isArray(data) ? data : []);

    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Failed to load version history'
      );

    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  const handlePublish = async () => {
    if (publishing) return;

    const confirmed = await confirm({ title: isPublished ? 'Publish new version?' : 'Publish game?', description: isPublished ? 'Publish a new version of this game?' : 'Publish this game for the first time?', confirmLabel: 'Publish' });

    if (!confirmed) return;

    try {
      setPublishing(true);
      setError('');
      setMessage('');

      const result = await publishGame(
        gameId,
        versionName.trim()
      );

      setMessage(
        `${result.message} (Version ${result.version.versionNumber})`
      );

      notify('Game published successfully.', 'success');
      setVersionName('');

      await loadVersions();

      if (onPublished) {
        await onPublished();
      }

    } catch (err) {
      const response = err.response?.data;

      if (Array.isArray(response?.errors)) {
        const details = response.errors
          .map((chapter) => {
            const problems = chapter.errors?.join(', ') || '';
            return `${chapter.chapterTitle}: ${problems}`;
          })
          .join('\n');

        setError(details || 'Story validation failed');
      } else {
        setError(
          response?.message || 'Failed to publish game'
        );
      }

    } finally {
      setPublishing(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? '-'
      : date.toLocaleString('th-TH', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });
  };

  return (
    <section className="space-y-5 rounded-2xl border border-white/10 bg-[#171725] p-5 text-white">

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Upload size={19} className="text-purple-400" />
            Publishing
          </h2>

          <p className="mt-1 text-sm text-gray-400">
            Publish your game and manage release history.
          </p>
        </div>

        <span
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isPublished
              ? 'bg-green-500/15 text-green-400'
              : 'bg-yellow-500/15 text-yellow-400'
          }`}
        >
          {isPublished ? 'Published' : 'Draft'}
        </span>
      </div>

      {/* Current Version */}
      <div className="rounded-xl border border-white/10 bg-[#10101b] p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500">
          Current Published Version
        </p>

        {isPublished ? (
          <div className="mt-3">
            <p className="text-lg font-semibold text-white">
              {currentVersion
                ? `Version ${currentVersion.version_number}`
                : 'Published'}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              {currentVersion?.version_name || 'Current release'}
            </p>

            {currentVersion && (
              <p className="mt-2 text-xs text-gray-500">
                Published: {formatDate(currentVersion.published_at)}
              </p>
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-400">
            This game has not been published yet.
          </p>
        )}
      </div>

      {/* Publish Form */}
      <div className="space-y-3">
        <label
          htmlFor="publish-version-name"
          className="block text-sm font-medium text-gray-300"
        >
          Version Name
        </label>

        <input
          id="publish-version-name"
          type="text"
          maxLength={100}
          value={versionName}
          onChange={(e) => setVersionName(e.target.value)}
          placeholder="e.g. Initial Release, Chapter 2 Update"
          className="w-full rounded-lg border border-white/10 bg-[#10101b] px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
        />

        <p className="text-xs text-gray-500">
          Leave blank to generate a version name automatically.
        </p>

        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing || loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {publishing ? (
            <>
              <Loader2 size={17} className="animate-spin" />
              Publishing...
            </>
          ) : (
            <>
              <Upload size={17} />
              {isPublished
                ? 'Publish New Version'
                : 'Publish Game'}
            </>
          )}
        </button>
      </div>

      {/* Success */}
      {message && (
        <div className="flex items-start gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-300">
          <CheckCircle2 size={17} className="mt-0.5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
          <AlertCircle size={17} className="mt-0.5 shrink-0" />
          <p className="whitespace-pre-wrap">{error}</p>
        </div>
      )}

      {/* Version History */}
      <div className="border-t border-white/10 pt-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 font-semibold">
            <History size={18} className="text-purple-400" />
            Version History
          </h3>

          <button
            type="button"
            onClick={loadVersions}
            disabled={loading || publishing}
            title="Refresh versions"
            aria-label="Refresh versions"
            className="text-gray-400 hover:text-white disabled:opacity-40"
          >
            <RefreshCw
              size={17}
              className={loading ? 'animate-spin' : ''}
            />
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">
            Loading versions...
          </p>
        ) : versions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-white/10 p-5 text-center text-sm text-gray-500">
            No published versions yet.
          </p>
        ) : (
          <div className="space-y-3">
            {versions.map((version) => {
              const isCurrent =
                Number(version.version_id) ===
                Number(game?.published_version_id);

              return (
                <div
                  key={version.version_id}
                  className="rounded-xl border border-white/10 bg-[#10101b] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-white">
                        v{version.version_number}
                        {' — '}
                        {version.version_name ||
                          `Version ${version.version_number}`}
                      </p>

                      <p className="mt-2 text-xs text-gray-500">
                        {formatDate(version.published_at)}
                      </p>
                    </div>

                    {isCurrent && (
                      <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs text-green-400">
                        Current
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
      {dialog}
    </section>
  );
}
