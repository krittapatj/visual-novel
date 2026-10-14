
import { useEffect, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  BookOpen,
  LogOut,
  UserRound,
  LayoutDashboard,
  Gamepad2,
  Menu,
  X,
  LogIn,
  UserPlus,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu after navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, location.search, location.hash]);

  const handleLogout = () => {
    setMobileMenuOpen(false);
    logout();
    navigate("/");
  };

  const navClass = ({ isActive }) =>
    `flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
      isActive
        ? "bg-purple-500/10 text-purple-400"
        : "text-gray-300 hover:bg-white/5 hover:text-white"
    }`;

  const mobileNavClass = ({ isActive }) =>
    `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
      isActive
        ? "bg-purple-600/20 text-purple-300"
        : "text-gray-300 hover:bg-white/5 hover:text-white"
    }`;

  const displayName = user?.display_name || user?.username;

  return (
    <header className="relative z-50 border-b border-white/10 bg-[#10101b]">
      <nav className="mx-auto max-w-7xl px-5">
        <div className="flex min-h-18 items-center justify-between gap-4">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="flex shrink-0 items-center gap-2 text-lg font-bold text-white sm:text-xl"
          >
            <BookOpen size={25} className="text-purple-400" />
            <span>Visual Novel</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-2 lg:flex">
            <NavLink to="/games" className={navClass}>
              Explore
            </NavLink>

            {user ? (
              <>
                <NavLink to="/my-games" className={navClass}>
                  <Gamepad2 size={17} />
                  My Games
                </NavLink>

                <NavLink to="/creator" className={navClass}>
                  <LayoutDashboard size={17} />
                  Creator Studio
                </NavLink>

                <NavLink
                  to="/profile"
                  className={navClass}
                  title={displayName}
                >
                  <UserRound size={17} />
                  <span className="max-w-32 truncate">
                    {displayName}
                  </span>
                </NavLink>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-300 transition hover:bg-red-500/10 hover:text-red-200"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink to="/login" className={navClass}>
                  Login
                </NavLink>

                <Link
                  to="/register"
                  className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-500"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label={
              mobileMenuOpen
                ? "Close navigation menu"
                : "Open navigation menu"
            }
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 text-gray-200 transition hover:bg-white/10 lg:hidden"
          >
            {mobileMenuOpen ? (
              <X size={23} />
            ) : (
              <Menu size={23} />
            )}
          </button>
        </div>

        {/* Mobile / Tablet Navigation */}
        <div
          id="mobile-navigation"
          className={`border-t border-white/10 py-4 lg:hidden ${
            mobileMenuOpen ? "block" : "hidden"
          }`}
        >
          <div className="flex flex-col gap-1">
            <NavLink
              to="/games"
              className={mobileNavClass}
            >
              <BookOpen size={19} />
              Explore Visual Novels
            </NavLink>

            {user ? (
              <>
                <NavLink
                  to="/my-games"
                  className={mobileNavClass}
                >
                  <Gamepad2 size={19} />
                  My Games
                </NavLink>

                <NavLink
                  to="/creator"
                  className={mobileNavClass}
                >
                  <LayoutDashboard size={19} />
                  Creator Studio
                </NavLink>

                <NavLink
                  to="/profile"
                  className={mobileNavClass}
                >
                  <UserRound size={19} />
                  <span className="min-w-0 truncate">
                    {displayName}
                  </span>
                </NavLink>

                <div className="my-2 border-t border-white/10" />

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium text-red-300 transition hover:bg-red-500/10"
                >
                  <LogOut size={19} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={mobileNavClass}
                >
                  <LogIn size={19} />
                  Login
                </NavLink>

                <Link
                  to="/register"
                  className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-purple-500"
                >
                  <UserPlus size={19} />
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>
    </header>
  );
}
