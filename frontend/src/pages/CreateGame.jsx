import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import GameForm from '../components/GameForm';
import { createGame } from '../api/games';

export default function CreateGame() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (data) => {
    setLoading(true);
    setError('');

    try {
      const game = await createGame(data);

      navigate(`/creator/games/${game.game_id}/edit`, {
        replace: true
      });
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Unable to create game.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-12">
      <Link
        to="/creator"
        className="mb-8 inline-flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>

      <h1 className="text-3xl font-bold">Create New Game</h1>
      <p className="mb-8 mt-3 text-gray-400">
        Start by giving your visual novel a title and description.
      </p>

      {error && (
        <p role="alert" className="mb-5 text-red-400">
          {error}
        </p>
      )}

      <GameForm
        onSubmit={handleCreate}
        loading={loading}
        submitLabel="Create Game"
      />
    </main>
  );
}