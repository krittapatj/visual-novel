
const API_ORIGIN = new URL(
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).origin;

export function getAssetUrl(filePath) {
  if (!filePath) return "";
  return new URL(filePath, API_ORIGIN).href;
}

export default function AssetPicker({
  assets = [],
  type,
  value,
  onChange,
  label = "Select Image"
}) {
  const available = assets.filter(
    (asset) => asset.asset_type === type
  );

  const selected = available.find(
    (asset) => String(asset.asset_id) === String(value)
  );

  return (
    <div className="space-y-3">
      <label className="block text-sm text-gray-300">
        {label}
      </label>

      <select
        value={value ?? ""}
        onChange={(event) =>
          onChange(
            event.target.value
              ? Number(event.target.value)
              : null
          )
        }
        className="w-full rounded-lg border border-white/10 bg-[#10101b] px-3 py-2.5 text-white"
      >
        <option value="">No image selected</option>

        {available.map((asset) => (
          <option key={asset.asset_id} value={asset.asset_id}>
            {asset.asset_name}
          </option>
        ))}
      </select>

      {selected && (
        <div className="flex h-44 items-center justify-center rounded-lg bg-[#10101b] p-3">
          <img
            src={getAssetUrl(selected.file_path)}
            alt={selected.asset_name}
            className="h-full max-w-full object-contain"
          />
        </div>
      )}

      {available.length === 0 && (
        <p className="text-xs text-gray-400">
          No {type} images available. Upload an image
          in Asset Manager first.
        </p>
      )}
    </div>
  );
}
