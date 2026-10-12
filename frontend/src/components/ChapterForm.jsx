import { useEffect, useState } from 'react';

export default function ChapterForm({
  initialTitle = '',
  onSubmit,
  onCancel,
  loading = false,
  submitLabel = 'Save Chapter'
}) {
  const [title, setTitle] = useState(initialTitle);

  useEffect(() => {
    setTitle(initialTitle);
  }, [initialTitle]);

  const handleSubmit = (event) => {
    event.preventDefault();

    const cleanTitle = title.trim();

    if (!cleanTitle) return;

    onSubmit(cleanTitle);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-purple-500/20 bg-[#171725] p-5"
    >
      <label
        htmlFor="chapter-title"
        className="mb-2 block text-sm font-medium text-gray-300"
      >
        Chapter Title
      </label>

      <input
        id="chapter-title"
        type="text"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        placeholder="e.g. Chapter 1: The Beginning"
        maxLength={255}
        required
        autoFocus
        className="w-full rounded-lg border border-white/10 bg-[#10101b] px-4 py-3 text-white outline-none focus:border-purple-500"
      />

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={loading || !title.trim()}
          className="rounded-lg bg-purple-600 px-5 py-2.5 font-medium text-white hover:bg-purple-500 disabled:opacity-50"
        >
          {loading ? 'Saving...' : submitLabel}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="rounded-lg border border-white/10 px-5 py-2.5 text-gray-300 hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}