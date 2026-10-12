import { Link } from 'react-router-dom';
import {
  BookOpen,
  Pencil,
  Trash2,
  ArrowRight
} from 'lucide-react';

export default function ChapterCard({
  chapter,
  gameId,
  onEdit,
  onDelete,
  disabled = false
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#171725] p-5 transition hover:border-purple-500/30">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-500/15 text-purple-300">
          <BookOpen size={22} />
        </div>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider text-purple-400">
            Chapter {chapter.chapter_order}
          </p>
          <h3 className="mt-1 break-words text-lg font-semibold">
            {chapter.title}
          </h3>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          to={`/creator/games/${gameId}/chapters/${chapter.chapter_id}/editor`}
          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium hover:bg-purple-500"
        >
          Open Editor
          <ArrowRight size={16} />
        </Link>

        <button
          type="button"
          onClick={() => onEdit(chapter)}
          disabled={disabled}
          className="rounded-lg border border-white/10 p-2.5 text-gray-300 hover:bg-white/5 disabled:opacity-50"
          aria-label={`Edit ${chapter.title}`}
        >
          <Pencil size={17} />
        </button>

        <button
          type="button"
          onClick={() => onDelete(chapter)}
          disabled={disabled}
          className="rounded-lg border border-red-500/20 p-2.5 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
          aria-label={`Delete ${chapter.title}`}
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}