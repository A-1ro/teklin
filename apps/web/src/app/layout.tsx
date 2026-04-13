import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";

export const metadata: Metadata = {
  title: "Teklin - 技術英語特化AI学習アプリ",
  description:
    "コードを書くように、英語を書けるエンジニアになる。1日5分、AIが伴走する技術英語特化アプリ。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-white text-gray-900 antialiased dark:bg-gray-950 dark:text-gray-100">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
