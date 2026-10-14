import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, BookOpen, Layers } from 'lucide-react';

import { getMyGames, getMyGame } from '../api/games';
import GameCard from '../components/GameCard';

export default function CreatorDashboard() {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadGames = async () => {
      try {
        const data = await getMyGames();
        const list = Array.isArray(data) ? data : [];

        // The list endpoint can expose published artwork for published games.
        // The Creator Dashboard must instead show the latest saved draft artwork.
        const withDraftArtwork = await Promise.all(
          list.map(async (game) => {
            try {
              const draft = await getMyGame(game.game_id);
              return {
                ...game,
                cover_url: draft.cover_url ?? null,
                thumbnail_url: draft.thumbnail_url ?? null,
              };
            } catch (error) {
              console.warn(`Could not load draft artwork for game ${game.game_id}`, error);
              // Do not accidentally show published artwork as a draft preview.
              return { ...game, cover_url: null, thumbnail_url: null };
            }
          })
        );
        if (active) setGames(withDraftArtwork);
      } catch {
        if (active) {
          setError('Unable to load your games.');
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadGames();

    return () => {
      active = false;
    };
  }, []);

  const draftCount = games.filter(
    (game) => game.status === 'draft'
  ).length;

  const publishedCount = games.filter(
    (game) => game.status === 'published'
  ).length;

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="mb-10 flex flex-wrap items-center justify-between gap-5">
        <div>
          <h1 className="text-3xl font-bold">
            Creator Dashboard
          </h1>
          <p className="mt-2 text-gray-400">
            Create and manage your visual novels.
          </p>
        </div>

        <Link
          to="/creator/games/new"
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold hover:bg-purple-500"
        >
          <Plus size={19} />
          Create New Game
        </Link>
      </div>

      <div className="mb-10 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Games', value: games.length, icon: BookOpen },
          { label: 'Drafts', value: draftCount, icon: Layers },
          { label: 'Published', value: publishedCount, icon: BookOpen }
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-white/10 bg-[#171725] p-6"
          >
            <stat.icon className="mb-4 text-purple-400" size={24} />
            <p className="text-sm text-gray-400">{stat.label}</p>
            <p className="mt-2 text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mb-6 text-2xl font-semibold">My Games</h2>

      {loading ? (
        <LoadingState message="Loading your games..." />
      ) : error ? (
        <p role="alert" className="text-red-400">{error}</p>
      ) : games.length === 0 ? (
<EmptyState
          icon={BookOpen}
          title="You haven't created any games yet."
          description="Start creating your first visual novel."
          action={<Link to="/creator/games/new" className="inline-flex w-full justify-center rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-500 sm:w-auto">Create Game</Link>}
        />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {games.map((game) => (
            <GameCard
              key={game.game_id}
              game={game}
              creatorMode
            />
          ))}
        </div>
      )}
    </main>
  );
}