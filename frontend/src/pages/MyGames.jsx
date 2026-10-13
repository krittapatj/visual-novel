
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getMyGames } from "../api/myGames";
import { getSaveSlots } from "../api/saveSlots";

const formatDate = (value) => {
  if (!value) return "ไม่ทราบเวลา";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "ไม่ทราบเวลา";
  }

  return date.toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const getSlotNumber = (slot) =>
  Number(slot.slotNumber ?? slot.slot_number);

const getSlotTime = (slot) => {
  const value = slot.savedAt ?? slot.saved_at;

  if (!value) return 0;

  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : 0;
};

export default function MyGames() {
  const navigate = useNavigate();

  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [continuingGameId, setContinuingGameId] =
    useState(null);
  const [continueError, setContinueError] = useState("");

  // ==============================
  // LOAD MY GAMES
  // ==============================

  const loadGames = async () => {
    try {
      setLoading(true);
      setError("");

      const result = await getMyGames();

      if (!result.success) {
        throw new Error("ไม่สามารถโหลดข้อมูลเกมได้");
      }

      setGames(
        Array.isArray(result.games) ? result.games : []
      );
    } catch (err) {
      console.error("Load My Games Error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "เกิดข้อผิดพลาดในการโหลดเกม"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGames();
  }, []);

  // ==============================
  // RECENTLY PLAYED
  // ==============================

  const recentlyPlayed = [...games]
    .sort((a, b) => {
      const aTime = new Date(
        a.lastPlayedAt || 0
      ).getTime();

      const bTime = new Date(
        b.lastPlayedAt || 0
      ).getTime();

      return bTime - aTime;
    })
    .slice(0, 5);

  // ==============================
  // CONTINUE PLAYING
  // ==============================

  const handleContinue = async (game) => {
    if (continuingGameId !== null) return;

    try {
      setContinuingGameId(game.gameId);
      setContinueError("");

      // Priority 1: Auto Save
      if (game.hasAutoSave) {
        navigate(
          `/games/${game.gameId}/play?continue=auto`
        );
        return;
      }

      // Priority 2: Latest Manual Save
      const slots = await getSaveSlots(game.gameId);

      const validSlots = (
        Array.isArray(slots) ? slots : []
      )
        .filter((slot) => {
          const slotNumber = getSlotNumber(slot);

          return (
            Number.isInteger(slotNumber) &&
            slotNumber >= 1 &&
            slotNumber <= 3
          );
        })
        .sort(
          (a, b) =>
            getSlotTime(b) - getSlotTime(a)
        );

      if (validSlots.length > 0) {
        const slotNumber = getSlotNumber(
          validSlots[0]
        );

        navigate(
          `/games/${game.gameId}/play?slot=${slotNumber}`
        );
        return;
      }

      // No Save found: Start normally
      navigate(`/games/${game.gameId}/play`);
    } catch (err) {
      console.error("Continue Playing Error:", err);

      setContinueError(
        err.response?.data?.message ||
          err.message ||
          "ไม่สามารถโหลดข้อมูลเพื่อเล่นต่อได้"
      );
    } finally {
      setContinuingGameId(null);
    }
  };

  // ==============================
  // GAME CARD
  // ==============================

  const GameCard = ({ game }) => {
    const isContinuing =
      continuingGameId === game.gameId;

    return (
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#171722] transition hover:border-purple-500/50">
        {/* Cover */}
        <div className="h-44 bg-[#252536]">
          {game.coverUrl ? (
            <img
              src={game.coverUrl}
              alt={game.title}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">
              🎮
            </div>
          )}
        </div>

        <div className="space-y-3 p-5">
          {/* Title */}
          <h3 className="line-clamp-1 text-lg font-semibold">
            {game.title}
          </h3>

          {/* Description */}
          <p className="line-clamp-2 min-h-10 text-sm text-gray-400">
            {game.description ||
              "ไม่มีคำอธิบายเกม"}
          </p>

          {/* Creator */}
          <p className="text-xs text-gray-500">
            ผู้สร้าง:{" "}
            {game.creatorUsername || "ไม่ระบุ"}
          </p>

          {/* Save Status */}
          <div className="flex flex-wrap gap-2 text-xs">
            {game.hasAutoSave && (
              <span className="rounded-full bg-green-500/15 px-3 py-1 text-green-300">
                Auto Save
              </span>
            )}

            {game.manualSlotCount > 0 && (
              <span className="rounded-full bg-blue-500/15 px-3 py-1 text-blue-300">
                Manual Save{" "}
                {game.manualSlotCount} Slot
              </span>
            )}
          </div>

          {/* Last Played */}
          <p className="text-xs text-gray-400">
            บันทึกล่าสุด:{" "}
            {formatDate(game.lastPlayedAt)}
          </p>

          {/* Continue Playing */}
          <button
            type="button"
            onClick={() => handleContinue(game)}
            disabled={continuingGameId !== null}
            className="w-full rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isContinuing
              ? "กำลังโหลด..."
              : "▶ Continue Playing"}
          </button>

          {/* Other Actions */}
          <div className="grid grid-cols-2 gap-2">
            <Link
              to={`/games/${game.gameId}/play`}
              className="rounded-lg border border-white/15 px-3 py-2 text-center text-sm transition hover:bg-white/10"
            >
              New Game
            </Link>

            <Link
              to={`/games/${game.gameId}`}
              className="rounded-lg border border-white/15 px-3 py-2 text-center text-sm transition hover:bg-white/10"
            >
              รายละเอียด
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // ==============================
  // LOADING
  // ==============================

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16 text-center text-gray-400">
        กำลังโหลด My Games...
      </main>
    );
  }

  // ==============================
  // ERROR
  // ==============================

  if (error) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">
          ไม่สามารถโหลด My Games
        </h1>

        <p className="mt-3 text-red-400">
          {error}
        </p>

        <button
          type="button"
          onClick={loadGames}
          className="mt-6 rounded-lg bg-purple-600 px-5 py-2 hover:bg-purple-500"
        >
          ลองอีกครั้ง
        </button>
      </main>
    );
  }

  // ==============================
  // MAIN PAGE
  // ==============================

  return (
    <main className="mx-auto max-w-7xl space-y-12 px-6 py-10">
      {/* Header */}
      <header>
        <h1 className="text-3xl font-bold">
          My Games
        </h1>

        <p className="mt-2 text-gray-400">
          รวมเกมที่คุณเคยบันทึกความคืบหน้าไว้
        </p>
      </header>

      {/* Continue Error */}
      {continueError && (
        <div
          role="alert"
          className="rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          {continueError}
        </div>
      )}

      {/* Empty State */}
      {games.length === 0 ? (
        <section className="rounded-2xl border border-white/10 bg-[#171722] px-6 py-16 text-center">
          <div className="mb-4 text-5xl">
            🎮
          </div>

          <h2 className="text-xl font-semibold">
            ยังไม่มีเกมใน My Games
          </h2>

          <p className="mt-2 text-gray-400">
            เริ่มเล่นเกมและบันทึกความคืบหน้า
            แล้วเกมจะปรากฏที่นี่
          </p>

          <Link
            to="/games"
            className="mt-6 inline-block rounded-lg bg-purple-600 px-6 py-3 transition hover:bg-purple-500"
          >
            สำรวจเกม
          </Link>
        </section>
      ) : (
        <>
          {/* Recently Played */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                Recently Played
              </h2>

              <span className="text-sm text-gray-400">
                {recentlyPlayed.length} เกมล่าสุด
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {recentlyPlayed.map((game) => (
                <GameCard
                  key={`recent-${game.gameId}`}
                  game={game}
                />
              ))}
            </div>
          </section>

          {/* All My Games */}
          <section>
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-semibold">
                All My Games
              </h2>

              <span className="text-sm text-gray-400">
                {games.length} เกม
              </span>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {games.map((game) => (
                <GameCard
                  key={`all-${game.gameId}`}
                  game={game}
                />
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
