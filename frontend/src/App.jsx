import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

import GameLibrary from "./pages/GameLibrary";
import GameDetails from "./pages/GameDetails";
import CreatorDashboard from "./pages/CreatorDashboard";
import CreateGame from "./pages/CreateGame";
import EditGame from "./pages/EditGame";
import ChapterManager from "./pages/ChapterManager";
import StoryEditor from "./pages/StoryEditor";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-[#09090f] text-white">
          <Navbar />

          <Routes>
            {/* Public */}
            <Route path="/" element={<Home />} />
            <Route path="/games" element={<GameLibrary />} />
            <Route path="/games/:gameId" element={<GameDetails />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Protected */}
            <Route element={<ProtectedRoute />}>
              <Route path="/profile" element={<Profile />} />
              <Route path="/creator" element={<CreatorDashboard />} />
              <Route path="/creator/games/new" element={<CreateGame />} />
              <Route
                path="/creator/games/:gameId/edit"
                element={<EditGame />}
              />
              <Route
                path="/creator/games/:gameId/chapters"
                element={<ChapterManager />}
              />

              <Route
                path="/creator/games/:gameId/chapters/:chapterId/editor"
                element={<StoryEditor />}
              />
            </Route>

            <Route
              path="*"
              element={
                <div className="py-24 text-center">
                  <h1 className="text-4xl font-bold">404</h1>
                  <p className="mt-3 text-gray-400">Page not found</p>
                </div>
              }
            />
          </Routes>
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}
