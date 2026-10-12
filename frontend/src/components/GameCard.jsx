import { Link } from 'react-router-dom';
import { BookOpen, UserRound } from 'lucide-react';

export default function GameCard({
  game,
  creatorMode = false
}) {
  const detailPath = creatorMode
    ? `/creator/games/${game.game_id}/edit`
    : `/games/${game.game_id}`;

  return (
    <Link
      to={detailPath}
      className="group overflow-hidden rounded-2xl border border-white/10 bg-[#171725] transition hover:-translate-y-1 hover:border-purple-500/40"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-purple-900/50 to-indigo-950">
        {game.cover_url ? (
          <img
            src={game.cover_url}
            alt={game.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen size={52} className="text-purple-300/60" />
          </div>
        )}

        {creatorMode && (
          <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
            game.status === 'published'
              ? 'bg-emerald-500/90 text-white'
              : 'bg-amber-500/90 text-black'
          }`}>
            {game.status}
          </span>
        )}
      </div>

      <div className="p-5">
        <h3 className="line-clamp-1 text-lg font-semibold text-white group-hover:text-purple-300">
          {game.title}
        </h3>

        <p className="mt-2 line-clamp-2 min-h-10 text-sm text-gray-400">
          {game.description || 'No description available.'}
        </p>

        {!creatorMode && game.creator_username && (
          <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
            <UserRound size={15} />
            {game.creator_username}
          </div>
        )}

        <div className="mt-5 flex items-center gap-2 text-sm font-medium text-purple-400">
          {creatorMode ? 'Manage Game' : 'View Details'}
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </Link>
  );
}