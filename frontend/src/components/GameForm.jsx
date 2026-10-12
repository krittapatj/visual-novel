import { useEffect, useState } from 'react';

export default function GameForm({
  initialData,
  onSubmit,
  loading = false,
  submitLabel = 'Save Game'
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    setTitle(initialData?.title || '');
    setDescription(initialData?.description || '');
  }, [initialData]);

  const handleSubmit = (event) => {
    event.preventDefault();

    onSubmit({
      title: title.trim(),
      description: description.trim()
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-2xl border border-white/10 bg-[#171725] p-7"
    >
      <div>
        <label
          htmlFor="game-title"
          className="mb-2 block font-medium"
        >
          Game Title
        </label>
        <input
          id="game-title"
          type="text"
          required
          maxLength={255}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter your game title"
          className="w-full rounded-xl border border-white/10 bg-[#10101b] px-4 py-3 outline-none focus:border-purple-500"
        />
      </div>

      <div>
        <label
          htmlFor="game-description"
          className="mb-2 block font-medium"
        >
          Description
        </label>
        <textarea
          id="game-description"
          rows={6}
          maxLength={5000}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe your visual novel..."
          className="w-full resize-y rounded-xl border border-white/10 bg-[#10101b] px-4 py-3 outline-none focus:border-purple-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="rounded-xl bg-purple-600 px-7 py-3 font-semibold hover:bg-purple-500 disabled:opacity-50"
      >
        {loading ? 'Saving...' : submitLabel}
      </button>
    </form>
  );
}