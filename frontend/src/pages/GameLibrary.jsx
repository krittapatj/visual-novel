import EmptyState from "../components/ui/EmptyState";
import LoadingState from "../components/ui/LoadingState";
import { useEffect, useMemo, useState } from "react";
import {
  Search,
  BookOpen,
  ArrowDownUp,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
} from "lucide-react";

import GameCard from "../components/GameCard";
import { getPublishedGames } from "../api/games";
import { getCategories } from "../api/categories";

const GAMES_PER_PAGE = 9;

export default function GameLibrary() {
  const [games, setGames] = useState([]);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  // Load published games
  useEffect(() => {
    let active = true;

    const loadGames = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getPublishedGames();

        if (active) {
          setGames(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        if (active) {
          setError("Unable to load games.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    loadGames();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadCategories = async () => {
      try {
        const data = await getCategories();

        if (active) {
          setCategories(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Load categories error:", error);
      }
    };

    loadCategories();

    return () => {
      active = false;
    };
  }, []);

  // Search and sort
  const filteredGames = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    const result = games.filter((game) => {
      const title = String(game.title || "").toLowerCase();
      const description = String(game.description || "").toLowerCase();

      // Search
      const matchesSearch =
        title.includes(keyword) || description.includes(keyword);

      // Category
      const matchesCategory =
        selectedCategory === "all" ||
        (Array.isArray(game.categories) &&
          game.categories.some(
            (category) =>
              String(category.category_id) === String(selectedCategory),
          ));

      return matchesSearch && matchesCategory;
    });

    const getDate = (game) => {
      const value =
        game.published_at ||
        game.publishedAt ||
        game.created_at ||
        game.createdAt;

      const timestamp = new Date(value).getTime();

      return Number.isFinite(timestamp) ? timestamp : 0;
    };

    result.sort((a, b) => {
      switch (sortBy) {
        case "oldest":
          return getDate(a) - getDate(b);

        case "title_asc":
          return String(a.title || "").localeCompare(String(b.title || ""));

        case "title_desc":
          return String(b.title || "").localeCompare(String(a.title || ""));

        case "newest":
        default:
          return getDate(b) - getDate(a);
      }
    });

    return result;
  }, [games, search, sortBy, selectedCategory]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredGames.length / GAMES_PER_PAGE),
  );

  const safePage = Math.min(currentPage, totalPages);

  const paginatedGames = useMemo(() => {
    const startIndex = (safePage - 1) * GAMES_PER_PAGE;

    return filteredGames.slice(startIndex, startIndex + GAMES_PER_PAGE);
  }, [filteredGames, safePage]);

  const startItem =
    filteredGames.length === 0 ? 0 : (safePage - 1) * GAMES_PER_PAGE + 1;

  const endItem = Math.min(safePage * GAMES_PER_PAGE, filteredGames.length);

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const handleSortChange = (event) => {
    setSortBy(event.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSortBy("newest");
    setCurrentPage(1);
    setSelectedCategory("all");
  };

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;

    setCurrentPage(page);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-5 sm:py-12">
      {/* Header */}
      <div className="mb-9">
        <h1 className="text-3xl font-bold md:text-4xl">
          Explore Visual Novels
        </h1>

        <p className="mt-3 text-gray-400">
          Discover interactive stories created by our community.
        </p>
      </div>

      {/* Search and Sort */}
      <div className="mb-7 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        {/* Search */}
        <div className="relative min-w-0 w-full max-w-lg">
          <Search
            size={20}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
          />

          <input
            type="search"
            value={search}
            onChange={handleSearchChange}
            placeholder="Search visual novels..."
            aria-label="Search visual novels"
            className="w-full rounded-xl border border-white/10 bg-[#171725] py-3 pl-12 pr-11 text-white outline-none transition focus:border-purple-500"
          />

          {search && (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                setCurrentPage(1);
              }}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Sort */}
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <ArrowDownUp size={18} className="text-purple-400" />

          <label
            htmlFor="game-sort"
            className="whitespace-nowrap text-sm text-gray-400"
          >
            Sort by
          </label>

          <select
            id="game-sort"
            value={sortBy}
            onChange={handleSortChange}
            className="max-w-full rounded-xl border border-white/10 bg-[#171725] px-4 py-3 text-sm text-white outline-none focus:border-purple-500"
          >
            <option value="newest">Newest First</option>

            <option value="oldest">Oldest First</option>

            <option value="title_asc">Title A–Z</option>

            <option value="title_desc">Title Z–A</option>
          </select>
        </div>
      </div>
      <div className="mb-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            setSelectedCategory("all");
            setCurrentPage(1);
          }}
          className={`rounded-full px-4 py-2 text-sm transition ${
            selectedCategory === "all"
              ? "bg-purple-600 text-white"
              : "border border-white/10 bg-[#171725] text-gray-300 hover:border-purple-500"
          }`}
        >
          All Games
        </button>

        {categories.map((category) => (
          <button
            type="button"
            key={category.category_id}
            onClick={() => {
              setSelectedCategory(String(category.category_id));
              setCurrentPage(1);
            }}
            className={`rounded-full px-4 py-2 text-sm transition ${
              selectedCategory === String(category.category_id)
                ? "bg-purple-600 text-white"
                : "border border-white/10 bg-[#171725] text-gray-300 hover:border-purple-500"
            }`}
          >
            {category.category_name}
          </button>
        ))}
      </div>
      {/* Loading */}
      {loading ? (
<LoadingState message="Loading games..." />
      ) : error ? (
        /* Error */
        <div
          role="alert"
          className="rounded-xl border border-red-500/20 bg-red-500/10 p-6 text-center text-red-400"
        >
          {error}
        </div>
      ) : (
        <>
          {/* Result Count */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-gray-400">
              {filteredGames.length > 0 ? (
                <>
                  Showing{" "}
                  <span className="font-medium text-white">
                    {startItem}–{endItem}
                  </span>{" "}
                  of{" "}
                  <span className="font-medium text-white">
                    {filteredGames.length}
                  </span>{" "}
                  games
                </>
              ) : (
                "0 games found"
              )}
            </p>

            {(search || sortBy !== "newest" || selectedCategory !== "all") && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300"
              >
                <X size={15} />
                Clear Filters
              </button>
            )}
          </div>

          {/* Empty State */}
          {filteredGames.length === 0 ? (
<EmptyState
              icon={BookOpen}
              title={search || selectedCategory !== "all" ? "No matching games" : "No published games yet"}
              description={search || selectedCategory !== "all" ? "Try another search or category." : "Published stories will appear here."}
              action={(search || selectedCategory !== "all") ? <button type="button" onClick={clearFilters} className="w-full rounded-lg bg-purple-600 px-5 py-2 text-sm font-medium text-white hover:bg-purple-500 sm:w-auto">Clear Search</button> : null}
            />
          ) : (
            <>
              {/* Game Grid */}
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {paginatedGames.map((game) => (
                  <GameCard key={game.game_id} game={game} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav
                  aria-label="Game pagination"
                  className="mt-12 flex flex-wrap items-center justify-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => goToPage(safePage - 1)}
                    disabled={safePage === 1}
                    aria-label="Previous page"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#171725] text-gray-300 transition hover:border-purple-500 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft size={18} />
                  </button>

                  {Array.from(
                    { length: totalPages },
                    (_, index) => index + 1,
                  ).map((page) => (
                    <button
                      type="button"
                      key={page}
                      onClick={() => goToPage(page)}
                      aria-label={`Page ${page}`}
                      aria-current={safePage === page ? "page" : undefined}
                      className={`flex h-10 min-w-10 items-center justify-center rounded-lg px-3 text-sm font-medium transition ${
                        safePage === page
                          ? "bg-purple-600 text-white"
                          : "border border-white/10 bg-[#171725] text-gray-300 hover:border-purple-500"
                      }`}
                    >
                      {page}
                    </button>
                  ))}

                  <button
                    type="button"
                    onClick={() => goToPage(safePage + 1)}
                    disabled={safePage === totalPages}
                    aria-label="Next page"
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-[#171725] text-gray-300 transition hover:border-purple-500 disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronRight size={18} />
                  </button>
                </nav>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
