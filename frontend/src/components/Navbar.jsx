import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, UserRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-white/10 bg-[#10101b]">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link
          to="/"
          className="flex items-center gap-2 text-xl font-bold text-white"
        >
          <BookOpen className="text-purple-400" />
          Visual Novel
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link
            to="/"
            className="text-gray-300 hover:text-white"
          >
            Explore
          </Link>

          {user ? (
            <>
              <Link
                to="/profile"
                className="flex items-center gap-2 text-gray-300 hover:text-white"
              >
                <UserRound size={17} />
                {user.display_name || user.username}
              </Link>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-red-300 hover:text-red-200"
              >
                <LogOut size={17} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-gray-300 hover:text-white"
              >
                Login
              </Link>

              <Link
                to="/register"
                className="rounded-lg bg-purple-600 px-4 py-2 font-medium text-white hover:bg-purple-500"
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