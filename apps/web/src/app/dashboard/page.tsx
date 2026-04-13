"use client";

import { useRequireAuth } from "@/lib/auth";
import { useAuth } from "@/components/auth/auth-provider";
import { useRouter } from "next/navigation";

const LEVEL_LABELS: Record<string, string> = {
  L1: "L1 - 初級",
  L2: "L2 - 中級",
  L3: "L3 - 上級",
  L4: "L4 - エキスパート",
};

const DOMAIN_LABELS: Record<string, string> = {
  web: "Web開発",
  infra: "インフラ",
  ml: "機械学習",
  mobile: "モバイル",
};

export default function DashboardPage() {
  const { user, isLoading } = useRequireAuth();
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-950">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-600 border-t-blue-500" />
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <main className="min-h-screen bg-gray-950 px-4 py-8">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <header className="mb-8 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-100">Teklin</h1>
          <button
            onClick={handleLogout}
            className="rounded-lg px-4 py-2 text-sm text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          >
            ログアウト
          </button>
        </header>

        {/* Welcome card */}
        <div className="mb-6 rounded-2xl border border-gray-800 bg-gray-900 p-6">
          <div className="flex items-center gap-4">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.name}
                width={56}
                height={56}
                className="h-14 w-14 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-600 text-xl font-bold text-white">
                {initials}
              </span>
            )}
            <div>
              <p className="text-lg font-semibold text-gray-100">
                ようこそ、{user.name}さん！
              </p>
              <p className="text-sm text-gray-400">{user.email}</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              レベル
            </p>
            <p className="text-lg font-semibold text-gray-100">
              {LEVEL_LABELS[user.level] ?? user.level}
            </p>
          </div>
          <div className="rounded-xl border border-gray-800 bg-gray-900 p-4">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-gray-500">
              ドメイン
            </p>
            <p className="text-lg font-semibold text-gray-100">
              {DOMAIN_LABELS[user.domain] ?? user.domain}
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-2xl border border-blue-800 bg-blue-950/40 p-6 text-center">
          <p className="mb-1 text-sm text-blue-400">今日のレッスン</p>
          <p className="mb-4 text-base text-gray-300">
            技術英語のスキルを磨きましょう
          </p>
          <a
            href="#"
            className="inline-block rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700"
          >
            レッスンを始める
          </a>
        </div>
      </div>
    </main>
  );
}
