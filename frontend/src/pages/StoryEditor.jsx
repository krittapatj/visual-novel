import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Workflow } from 'lucide-react';

export default function StoryEditor() {
  const { gameId, chapterId } = useParams();

  return (
    <main className="mx-auto max-w-6xl px-5 py-12">
      <Link
        to={`/creator/games/${gameId}/chapters`}
        className="mb-8 inline-flex items-center gap-2 text-gray-400 hover:text-white"
      >
        <ArrowLeft size={18} />
        Back to Chapters
      </Link>

      <div className="rounded-2xl border border-white/10 bg-[#171725] px-6 py-20 text-center">
        <Workflow
          size={54}
          className="mx-auto mb-5 text-purple-400"
        />

        <h1 className="text-3xl font-bold">
          Story Editor
        </h1>

        <p className="mt-4 text-gray-400">
          Chapter ID: {chapterId}
        </p>

        <p className="mx-auto mt-4 max-w-lg text-gray-400">
          The Visual Node Editor and Form-Based Editor
          will be implemented in Phase 9.
        </p>
      </div>
    </main>
  );
}