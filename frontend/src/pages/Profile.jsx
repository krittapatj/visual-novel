
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import {
  UserRound,
  BookOpen,
  ShieldCheck,
  Gamepad2,
  LayoutDashboard,
  Pencil,
  Save,
  X,
  CheckCircle2,
  AlertCircle,
  Mail,
  AtSign
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { updateMyProfile } from '../api/profile';
import { useToast } from "../components/ui/ToastProvider";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { notify } = useToast();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setDisplayName(user?.display_name || user?.username || '');
  }, [user?.display_name, user?.username]);

  if (!user) return null;

  const currentDisplayName =
    user.display_name || user.username;

  const handleEdit = () => {
    setDisplayName(currentDisplayName);
    setSuccess('');
    setError('');
    setEditing(true);
  };

  const handleCancel = () => {
    setDisplayName(currentDisplayName);
    setEditing(false);
    setError('');
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving) return;

    const cleanName = displayName.trim();

    if (!cleanName || cleanName.length > 100) {
      setError('Display Name ต้องมีความยาว 1-100 ตัวอักษร');
      return;
    }

    if (cleanName === currentDisplayName) {
      setEditing(false);
      setError('');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const result = await updateMyProfile(cleanName);

      if (!result.success || !result.user) {
        throw new Error('ไม่สามารถอัปเดตข้อมูลได้');
      }

      updateUser(result.user);

      setDisplayName(result.user.display_name);
      setEditing(false);
      setSuccess('บันทึกข้อมูล Profile สำเร็จแล้ว');
      notify('บันทึกข้อมูล Profile สำเร็จแล้ว', 'success');
    } catch (err) {
      console.error('Update Profile Error:', err);

      setError(
        err.response?.data?.message ||
        err.message ||
        'เกิดข้อผิดพลาดในการบันทึกข้อมูล'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-5xl min-w-0 px-4 py-8 text-white sm:px-5 sm:py-10">
      <header className="mb-8">
        <h1 className="break-words text-2xl font-bold sm:text-3xl">
          My Profile
        </h1>

        <p className="mt-2 text-gray-400">
          จัดการข้อมูลบัญชีและเข้าถึงพื้นที่ของคุณ
        </p>
      </header>

      {success && (
        <div
          role="status"
          className="mb-5 flex min-w-0 items-start gap-3 break-words rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-sm text-green-300"
        >
          <CheckCircle2 size={20} className="shrink-0" />
          {success}
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="mb-5 flex min-w-0 items-start gap-3 break-words rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300"
        >
          <AlertCircle size={20} className="shrink-0" />
          {error}
        </div>
      )}

      <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#171725]">
        <div className="h-28 bg-gradient-to-r from-purple-900/70 via-indigo-900/50 to-[#171725]" />

        <div className="px-4 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-12 flex flex-wrap items-end justify-between gap-4">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full border-4 border-[#171725] bg-purple-600/30 text-purple-200">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Profile avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <UserRound size={44} />
              )}
            </div>

            {!editing && (
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium transition hover:bg-purple-500"
              >
                <Pencil size={16} />
                Edit Profile
              </button>
            )}
          </div>

          <div className="mt-5">
            <h2 className="break-words text-xl font-semibold sm:text-2xl">
              {currentDisplayName}
            </h2>

            <p className="mt-1 flex min-w-0 items-start gap-2 text-sm text-gray-400">
              <AtSign size={15} className="mt-0.5 shrink-0" />
              <span className="min-w-0 break-all">{user.username}</span>
            </p>

            <p className="mt-2 flex min-w-0 items-start gap-2 text-sm text-gray-400">
              <Mail size={15} className="mt-0.5 shrink-0" />
              <span className="min-w-0 break-all">{user.email}</span>
            </p>
          </div>

          {editing && (
            <form
              onSubmit={handleSave}
              className="mt-8 min-w-0 rounded-xl border border-purple-500/20 bg-[#10101b] p-4 sm:p-5"
            >
              <h3 className="mb-4 text-lg font-semibold">
                Edit Profile
              </h3>

              <label
                htmlFor="displayName"
                className="mb-2 block text-sm font-medium text-gray-300"
              >
                Display Name
              </label>

              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(event) => {
                  setDisplayName(event.target.value);
                  setError('');
                }}
                maxLength={100}
                disabled={saving}
                autoComplete="nickname"
                required
                className="min-w-0 w-full rounded-lg border border-white/15 bg-[#171725] px-4 py-3 text-white outline-none transition focus:border-purple-500 disabled:opacity-60"
                placeholder="Enter your display name"
              />

              <p className="mt-2 text-right text-xs text-gray-500">
                {displayName.length}/100
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-purple-600 px-5 py-2.5 sm:w-auto text-sm font-medium transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={17} />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>

                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-white/15 px-5 py-2.5 sm:w-auto text-sm transition hover:bg-white/10 disabled:opacity-50"
                >
                  <X size={17} />
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="mt-8 grid min-w-0 gap-4 border-t border-white/10 pt-8 sm:grid-cols-2">
            <div className="rounded-xl bg-[#10101b] p-5">
              <div className="mb-3 flex items-center gap-2 text-purple-400">
                <ShieldCheck size={20} />
                <h3 className="font-semibold">
                  Account Role
                </h3>
              </div>

              <p className="font-medium capitalize">
                {user.role || 'user'}
              </p>

              <p className="mt-2 text-sm text-gray-400">
                สิทธิ์การใช้งานบัญชีของคุณ
              </p>
            </div>

            <div className="rounded-xl bg-[#10101b] p-5">
              <div className="mb-3 flex items-center gap-2 text-purple-400">
                <BookOpen size={20} />
                <h3 className="font-semibold">
                  Visual Novel Platform
                </h3>
              </div>

              <p className="text-sm text-gray-400">
                สำรวจ เล่น และสร้าง Visual Novel
                ในพื้นที่เดียว
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-5 text-xl font-semibold">
          Quick Access
        </h2>

        <div className="grid min-w-0 gap-4 sm:grid-cols-2">
          <Link
            to="/my-games"
            className="group min-w-0 rounded-2xl border border-white/10 bg-[#171725] p-6 transition hover:border-purple-500/50 hover:bg-[#202035]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/15 text-purple-400">
              <Gamepad2 size={25} />
            </div>

            <h3 className="text-lg font-semibold group-hover:text-purple-300">
              My Games
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              ดูเกมที่เคยเล่นและกลับไปเล่นต่อจาก Save
              ล่าสุด
            </p>

            <span className="mt-4 inline-block text-sm text-purple-400">
              View My Games →
            </span>
          </Link>

          <Link
            to="/creator"
            className="group min-w-0 rounded-2xl border border-white/10 bg-[#171725] p-6 transition hover:border-purple-500/50 hover:bg-[#202035]"
          >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400">
              <LayoutDashboard size={25} />
            </div>

            <h3 className="text-lg font-semibold group-hover:text-purple-300">
              Creator Studio
            </h3>

            <p className="mt-2 text-sm text-gray-400">
              สร้าง แก้ไข และจัดการ Visual Novel
              ของคุณ
            </p>

            <span className="mt-4 inline-block text-sm text-purple-400">
              Open Creator Studio →
            </span>
          </Link>
        </div>
      </section>

      <div className="mt-8">
        <Link
          to="/games"
          className="inline-block rounded-lg border border-white/15 px-5 py-3 text-sm transition hover:bg-white/5"
        >
          Explore Visual Novels →
        </Link>
      </div>
    </main>
  );
}
