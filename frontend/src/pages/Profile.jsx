import { Link } from 'react-router-dom';
import { UserRound, BookOpen, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-5xl px-5 py-12">
      <h1 className="mb-8 text-3xl font-bold">
        My Profile
      </h1>

      <div className="rounded-2xl border border-white/10 bg-[#171725] p-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-600/20 text-purple-300">
            <UserRound size={44} />
          </div>

          <div>
            <h2 className="text-2xl font-semibold">
              {user.display_name || user.username}
            </h2>

            <p className="mt-1 text-gray-400">
              @{user.username}
            </p>

            <p className="mt-1 text-sm text-gray-400">
              {user.email}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 border-t border-white/10 pt-8 md:grid-cols-2">
          <div className="rounded-xl bg-[#10101b] p-5">
            <div className="mb-3 flex items-center gap-2 text-purple-400">
              <ShieldCheck size={20} />
              Account Role
            </div>
            <p className="font-medium capitalize">
              {user.role}
            </p>
          </div>

          <div className="rounded-xl bg-[#10101b] p-5">
            <div className="mb-3 flex items-center gap-2 text-purple-400">
              <BookOpen size={20} />
              Creator Studio
            </div>
            <p className="mb-3 text-sm text-gray-400">
              Create and manage your visual novels.
            </p>
            <span className="text-sm text-purple-300">
              Coming in Phase 7
            </span>
          </div>
        </div>

        <Link
          to="/"
          className="mt-8 inline-block rounded-lg border border-white/15 px-5 py-3 text-sm hover:bg-white/5"
        >
          Explore Visual Novels
        </Link>
      </div>
    </div>
  );
}