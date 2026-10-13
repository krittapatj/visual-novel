import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  LogOut,
  UserRound,
  LayoutDashboard,
  Gamepad2,
} from "lucide-react";

import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  const navClass = ({ isActive }) =>
    isActive ? "text-purple-400" : "text-gray-300 hover:text-white";

  return (
    <header className="border-b border-white/10 bg-[#10101b]">
      <nav className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <BookOpen className="text-purple-400" />
          Visual Novel
        </Link>

        <div className="flex flex-wrap items-center gap-5 text-sm">
          <NavLink to="/games" className={navClass}>
            Explore
          </NavLink>

          {user ? (
            <>
              <NavLink
                to="/my-games"
                className={({ isActive }) =>
                  `flex items-center gap-2 ${
                    isActive
                      ? "text-purple-400"
                      : "text-gray-300 hover:text-white"
                  }`
                }
              >
                <Gamepad2 size={17} />
                My Games
              </NavLink>
              <NavLink
                to="/creator"
                className={({ isActive }) =>
                  `flex items-center gap-2 ${
                    isActive
                      ? "text-purple-400"
                      : "text-gray-300 hover:text-white"
                  }`
                }
              >
                <LayoutDashboard size={17} />
                Creator Studio
              </NavLink>

              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  `flex items-center gap-2 ${
                    isActive
                      ? "text-purple-400"
                      : "text-gray-300 hover:text-white"
                  }`
                }
              >
                <UserRound size={17} />
                {user.display_name || user.username}
              </NavLink>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-300 hover:text-red-200"
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-gray-300">
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-purple-600 px-4 py-2 font-medium hover:bg-purple-500"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
