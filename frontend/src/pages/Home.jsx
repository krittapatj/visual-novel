import { Link } from "react-router-dom";
import { BookOpen, Sparkles, PenLine } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div>
      <section className="relative overflow-hidden px-5 py-28 text-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,#37215d_0%,#09090f_65%)]" />

        <div className="relative mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-sm text-purple-300">
            <Sparkles size={16} />
            Stories Beyond Imagination
          </div>

          <h1 className="text-4xl font-extrabold leading-tight md:text-6xl">
            Every Story Begins
            <span className="block text-purple-400">With a Choice.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-gray-400">
            Discover interactive visual novels, explore different paths, and
            create stories of your own.
          </p>

          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <Link
              to="/games"
              className="flex items-center gap-2 rounded-xl bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-500"
            >
              <BookOpen size={19} />
              Explore Stories
            </Link>

            <Link
              to={user ? "/creator" : "/register"}
              className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 py-3 font-semibold hover:bg-white/10"
            >
              <PenLine size={19} />
              Start Creating
            </Link>
          </div>
        </div>
      </section>

      <section id="explore" className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-2xl font-bold">Discover Visual Novels</h2>

        <p className="mt-2 text-gray-400">
          Explore stories created by the community.
        </p>

        <div className="mt-8 rounded-2xl border border-dashed border-white/15 bg-[#171725] px-6 py-16 text-center">
          <BookOpen size={38} className="mx-auto mb-4 text-purple-400" />

          <h3 className="text-lg font-semibold">Stories are coming soon</h3>

          <p className="mt-2 text-sm text-gray-400">
            The Game Library will be connected in Phase 7.
          </p>
        </div>
      </section>
    </div>
  );
}
