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
        className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-paper-2"
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
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-teal text-sm font-semibold text-paper">
            {initials}
          </span>
        )}
        <span className="text-sm font-medium text-ink">{user.name}</span>
        <svg
          className={`h-4 w-4 text-ink-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
          <div className="absolute right-0 z-20 mt-2 w-56 rounded-[14px] border border-rule bg-paper py-1">
            <div className="border-b border-rule px-4 py-3">
              <p className="text-sm font-medium text-ink">{user.name}</p>
              <p className="truncate text-xs text-ink-3">{user.email}</p>
            </div>
            <div className="px-4 py-2">
              <p className="text-xs text-ink-3">
                レベル: {user.level} / {user.domain}
              </p>
            </div>
            <div className="border-t border-rule">
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-coral transition-colors hover:bg-coral-50 disabled:opacity-50"
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
