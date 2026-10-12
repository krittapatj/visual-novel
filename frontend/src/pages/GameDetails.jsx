import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, UserRound } from 'lucide-react';

import { getPublishedGame } from '../api/games';

export default function GameDetails() {
  const { gameId } = useParams();

  const [game, setGame] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadGame = async () => {
      try {
        const data = await getPublishedGame(gameId);
        if (active) setGame(data);
      } catch (err) {
        if (active) setError('Game not found.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadGame();

    return () => {
      active = false;
    };
  }, [gameId]);

  if (loading) {
    return <p className="p-12 text-center">Loading game...</p>;
  }

  if (error || !game) {
    return (
      <div className="p-12 text-center text-gray-400">
        {error || 'Game not found.'}
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <Link
        to="/games"
        className="mb-8 inline-flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Library
      </Link>

      <div className="grid gap-10 md:grid-cols-[350px_1fr]">
        <div className="aspect-[3/4] overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 to-indigo-950">
          {game.cover_url ? (
            <img
              src={game.cover_url}
              alt={game.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <BookOpen size={70} className="text-purple-300" />
            </div>
          )}
        </div>

        <div>
          <h1 className="text-4xl font-bold">{game.title}</h1>

          <div className="mt-5 flex items-center gap-2 text-gray-400">
            <UserRound size={18} />
            Created by {game.creator_username}
          </div>

          <h2 className="mt-10 text-xl font-semibold">
            About This Story
          </h2>

          <p className="mt-4 whitespace-pre-wrap leading-8 text-gray-300">
            {game.description || 'No description available.'}
          </p>

          <button
            disabled
            className="mt-10 rounded-xl bg-purple-600 px-8 py-3 font-semibold opacity-50"
          >
            Play Game — Coming Soon
          </button>
        </div>
      </div>
    </main>
  );
}