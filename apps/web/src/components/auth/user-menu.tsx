import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { useNavigate } from "react-router-dom";

export function UserMenu() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate("/login", { replace: true });
    } finally {
      setIsLoggingOut(false);
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="ユーザーメニュー"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-sm font-semibold text-white">
            {initials}
          </span>
        )}
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {user.name}
        </span>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                {user.name}
              </p>
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {user.email}
              </p>
            </div>
            <div className="px-4 py-2">
              <p className="text-xs text-gray-400">
                レベル: {user.level} / {user.domain}
              </p>
            </div>
            <div className="border-t border-gray-100 dark:border-gray-800">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
              >
                {isLoggingOut ? "ログアウト中..." : "ログアウト"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
