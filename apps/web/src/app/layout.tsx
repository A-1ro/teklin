import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/auth/auth-provider";

const siteTitle = "Teklin - 技術英語特化AI学習アプリ";
const siteDescription =
  "コードを書くように、英語を書けるエンジニアになる。1日5分、AIが伴走する技術英語特化アプリ。PR・コミット・Slack・GitHub Issue の英語をエンジニアに最適化して学べます。";

// OGP / Twitter Card の絶対 URL 解決や将来追加するカスタム OG 画像の
// ベース URL として使う。本番ドメイン確定後に差し替える。
const siteUrl = "https://teklin.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | Teklin",
  },
  description: siteDescription,
  applicationName: "Teklin",
  keywords: [
    "技術英語",
    "英語学習",
    "エンジニア",
    "AI",
    "PR",
    "コミットメッセージ",
    "GitHub",
    "Teklin",
  ],
  authors: [{ name: "Teklin" }],
  openGraph: {
    type: "website",
    locale: "ja_JP",
    url: siteUrl,
    siteName: "Teklin",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
  },
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
