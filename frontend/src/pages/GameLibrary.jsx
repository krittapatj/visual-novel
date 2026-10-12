import { useEffect, useMemo, useState } from 'react';
import { Search, BookOpen } from 'lucide-react';

import GameCard from '../components/GameCard';
import { getPublishedGames } from '../api/games';

export default function GameLibrary() {
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    const loadGames = async () => {
      try {
        const data = await getPublishedGames();
        if (active) setGames(data);
      } catch (err) {
        if (active) {
          setError('Unable to load games.');
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

  const filteredGames = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return games.filter((game) =>
      game.title.toLowerCase().includes(keyword)
    );
  }, [games, search]);

  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <div className="mb-9">
        <h1 className="text-3xl font-bold md:text-4xl">
          Explore Visual Novels
        </h1>
        <p className="mt-3 text-gray-400">
          Discover interactive stories created by our community.
        </p>
      </div>

      <div className="relative mb-9 max-w-lg">
        <Search
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
        />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search visual novels..."
          className="w-full rounded-xl border border-white/10 bg-[#171725] py-3 pl-12 pr-4 outline-none focus:border-purple-500"
        />
      </div>

      {loading ? (
        <p className="text-gray-400">Loading games...</p>
      ) : error ? (
        <p role="alert" className="text-red-400">{error}</p>
      ) : filteredGames.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-[#171725] py-20 text-center">
          <BookOpen
            size={42}
            className="mx-auto mb-4 text-purple-400"
          />
          <h2 className="text-xl font-semibold">
            {search ? 'No matching games' : 'No published games yet'}
          </h2>
          <p className="mt-2 text-gray-400">
            {search
              ? 'Try searching with another title.'
              : 'Published stories will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredGames.map((game) => (
            <GameCard key={game.game_id} game={game} />
          ))}
        </div>
      )}
    </main>
  );
}