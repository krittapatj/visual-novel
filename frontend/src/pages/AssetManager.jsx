import { useToast } from "../components/ui/ToastProvider";
import useConfirm from "../components/ui/useConfirm";
import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';

import {
  ArrowLeft,
  Upload,
  Image as ImageIcon,
  Trash2,
  X,
  Plus,
  LoaderCircle,
  AlertCircle
} from 'lucide-react';

import { getMyGame } from '../api/games';
import {
  getAssets,
  uploadAsset,
  deleteAsset
} from '../api/assets';

const API_ORIGIN = new URL(
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
).origin;

const TYPES = [
  { value: 'background', label: 'Background' },
  { value: 'character', label: 'Character' },
  { value: 'cover', label: 'Cover' },
  { value: 'thumbnail', label: 'Thumbnail' }
];

const inputClass =
  'block w-full min-w-0 rounded-lg border border-white/10 bg-[#10101b] px-3 py-3 text-base text-white outline-none focus:border-purple-500 sm:text-sm';

function getImageUrl(filePath) {
  if (!filePath) return '';

  // Asset API ของเราเก็บเป็น /uploads/filename
  return new URL(filePath, API_ORIGIN).href;
}

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function AssetManager() {
  const { gameId } = useParams();
  const { notify } = useToast();
  const { confirm, dialog } = useConfirm();

  const [game, setGame] = useState(null);
  const [assets, setAssets] = useState([]);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [filter, setFilter] = useState('all');
  const [showUpload, setShowUpload] = useState(false);

  const [image, setImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [assetName, setAssetName] = useState('');
  const [assetType, setAssetType] = useState('background');

  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setError('');

      try {
        const [gameData, assetData] = await Promise.all([
          getMyGame(gameId),
          getAssets(gameId)
        ]);

        if (!active) return;

        setGame(gameData);
        setAssets(assetData);
      } catch (err) {
        if (active) {
          setError(
            err.response?.data?.message ||
            'Unable to load assets.'
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [gameId]);

  useEffect(() => {
    if (!image) {
      setPreviewUrl('');
      return;
    }

    const url = URL.createObjectURL(image);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [image]);

  const filteredAssets = useMemo(() => {
    if (filter === 'all') return assets;

    return assets.filter(
      (asset) => asset.asset_type === filter
    );
  }, [assets, filter]);

  const resetForm = () => {
    setImage(null);
    setAssetName('');
    setAssetType('background');
    setShowUpload(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const allowed = [
      'image/jpeg',
      'image/png',
      'image/webp'
    ];

    if (!allowed.includes(file.type)) {
      setError('Only JPG, PNG and WebP files are allowed.');
      event.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must not exceed 5 MB.');
      event.target.value = '';
      return;
    }

    setImage(file);
    setAssetName(
      file.name.replace(/\.[^.]+$/, '').slice(0, 255)
    );
    setError('');
    event.target.value = '';
  };

  const handleUpload = async (event) => {
    event.preventDefault();

    if (!image || !assetName.trim()) {
      setError('Please select an image and enter its name.');
      return;
    }

    setUploading(true);
    setError('');
    setMessage('');

    try {
      const newAsset = await uploadAsset(gameId, {
        image,
        asset_name: assetName.trim(),
        asset_type: assetType
      });

      setAssets((current) => [newAsset, ...current]);
      setMessage('Image uploaded successfully.');
      notify('Image uploaded successfully.', "success");
      resetForm();
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to upload image.'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (asset) => {
    const confirmed = await confirm({
      title: "Delete asset?",
      description: `Delete "${asset.asset_name}" from the Asset Library?`,
      confirmLabel: "Delete Asset", danger: true,
    });

    if (!confirmed) return;

    setDeletingId(asset.asset_id);
    setError('');
    setMessage('');

    try {
      await deleteAsset(gameId, asset.asset_id);

      setAssets((current) =>
        current.filter(
          (item) => item.asset_id !== asset.asset_id
        )
      );

      setMessage('Asset deleted successfully.');
      notify('Asset deleted successfully.', "success");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to delete asset.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <LoadingState message="Loading Asset Manager..." fullPage />;
  }

  if (!game) {
    return (
      <div className="mx-auto max-w-5xl p-10 text-center text-red-400">
        {error || 'Game not found.'}
      </div>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-7xl w-full min-w-0 px-4 py-6 text-white sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      <Link
        to={`/creator/games/${gameId}/edit`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white"
      >
        <ArrowLeft size={17} />
        Back to Edit Game
      </Link>

      <div className="mb-7 flex min-w-0 flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold sm:text-3xl">Asset Library</h1>
          <p className="mt-2 break-words text-gray-400">
            Manage images for {game.title}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setError('');
            setShowUpload(true);
          }}
          className="flex w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 font-medium hover:bg-purple-500 sm:w-auto"
        >
          <Plus size={19} />
          Upload Image
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-5 flex min-w-0 items-start gap-2 break-words rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <AlertCircle size={18} />
          {error}
        </div>
      )}

      {message && (
        <div
          role="status"
          className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-300"
        >
          {message}
        </div>
      )}

      <div className="mb-6 flex min-w-0 gap-2 overflow-x-auto pb-2">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm ${
            filter === 'all'
              ? 'bg-purple-600 text-white'
              : 'bg-[#171725] text-gray-300'
          }`}
        >
          All ({assets.length})
        </button>

        {TYPES.map((type) => (
          <button
            key={type.value}
            type="button"
            onClick={() => setFilter(type.value)}
            className={`shrink-0 whitespace-nowrap rounded-lg px-4 py-2 text-sm ${
              filter === type.value
                ? 'bg-purple-600 text-white'
                : 'bg-[#171725] text-gray-300'
            }`}
          >
            {type.label} (
            {assets.filter(
              (asset) => asset.asset_type === type.value
            ).length}
            )
          </button>
        ))}
      </div>

      {filteredAssets.length === 0 ? (
<EmptyState icon={ImageIcon} title="No images found" description="Upload an image to start building your visual novel." />
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {filteredAssets.map((asset) => (
            <div
              key={asset.asset_id}
              className="min-w-0 overflow-hidden rounded-xl border border-white/10 bg-[#171725]"
            >
              <div className="flex aspect-[4/3] items-center justify-center bg-[#0c0c15]">
                <img
                  src={getImageUrl(asset.file_path)}
                  alt={asset.asset_name}
                  loading="lazy"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="space-y-3 p-4">
                <div>
                  <h3
                    className="truncate font-semibold"
                    title={asset.asset_name}
                  >
                    {asset.asset_name}
                  </h3>

                  <p className="mt-1 text-xs capitalize text-purple-300">
                    {asset.asset_type}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {formatSize(asset.file_size)}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDelete(asset)}
                  disabled={deletingId === asset.asset_id}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  {deletingId === asset.asset_id
                    ? 'Deleting...'
                    : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 p-3 sm:p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-title"
            className="my-auto max-h-[calc(100dvh-1.5rem)] w-full max-w-lg overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-[#171725] p-4 shadow-2xl sm:max-h-[calc(100dvh-2rem)] sm:p-6"
          >
            <div className="mb-5 flex min-w-0 items-center justify-between gap-3 sm:mb-6">
              <h2 id="upload-title" className="text-xl font-bold">
                Upload Image
              </h2>

              <button
                type="button"
                onClick={resetForm}
                disabled={uploading}
                aria-label="Close upload form"
                className="text-gray-400 hover:text-white"
              >
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm text-gray-300">
                  Image File
                </label>

                <label className="flex min-h-36 cursor-pointer flex-col sm:min-h-44 items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-purple-500/30 bg-[#10101b] p-4 hover:border-purple-500">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Upload preview"
                      className="max-h-48 object-contain"
                    />
                  ) : (
                    <>
                      <Upload
                        size={30}
                        className="mb-3 text-purple-400"
                      />
                      <span className="text-sm text-gray-300">
                        Click to select an image
                      </span>
                      <span className="mt-2 text-xs text-gray-500">
                        JPG, PNG, WebP — Max 5 MB
                      </span>
                    </>
                  )}

                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleFileChange}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label
                  htmlFor="asset-name"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Asset Name
                </label>

                <input
                  id="asset-name"
                  value={assetName}
                  onChange={(event) =>
                    setAssetName(event.target.value)
                  }
                  maxLength={255}
                  required
                  className={inputClass}
                  placeholder="e.g. School Background"
                />
              </div>

              <div>
                <label
                  htmlFor="asset-type"
                  className="mb-2 block text-sm text-gray-300"
                >
                  Asset Type
                </label>

                <select
                  id="asset-type"
                  value={assetType}
                  onChange={(event) =>
                    setAssetType(event.target.value)
                  }
                  className={inputClass}
                >
                  {TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {(assetType === 'cover' || assetType === 'thumbnail') && (
                  <p className="mt-2 text-xs text-gray-400">
                    {assetType === 'cover'
                      ? 'Recommended cover: 900 × 1200 px (3:4 portrait)'
                      : 'Recommended thumbnail: 1280 × 800 px (16:10 landscape)'}
                  </p>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={uploading}
                  className="w-full rounded-lg border border-white/15 px-5 py-3 text-sm sm:w-auto"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading || !image}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-3 text-sm font-medium disabled:opacity-50 sm:w-auto"
                >
                  <Upload size={16} />
                  {uploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    {dialog}
    </main>
  );
}