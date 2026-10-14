import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

import GameForm from '../components/GameForm';
import { createGame } from '../api/games';
import { useToast } from "../components/ui/ToastProvider";

export default function CreateGame() {
  const navigate = useNavigate();
  const { notify } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (data) => {
    setLoading(true);
    setError('');

    try {
      const game = await createGame(data);
      notify("Game created successfully.", "success");

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
    <main className="mx-auto w-full min-w-0 max-w-3xl px-4 py-8 sm:px-5 sm:py-12">
      <Link
        to="/creator"
        className="mb-7 inline-flex min-h-10 items-center gap-2 text-sm text-gray-400 sm:mb-8 hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>

      <h1 className="break-words text-2xl font-bold sm:text-3xl">Create New Game</h1>
      <p className="mb-7 mt-3 break-words text-sm text-gray-400 sm:mb-8 sm:text-base">
        Start by giving your visual novel a title and description.
      </p>

      {error && (
        <p role="alert" className="mb-5 break-words rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
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