import { useState } from "react";

interface CopyMarkdownButtonProps {
  text: string;
}

export function CopyMarkdownButton({ text }: CopyMarkdownButtonProps) {
  const [status, setStatus] = useState<"idle" | "copied" | "error">("idle");

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setStatus("copied");
      window.setTimeout(() => setStatus("idle"), 2000);
    } catch {
      setStatus("error");
      window.setTimeout(() => setStatus("idle"), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:border-gray-600 hover:text-gray-100"
    >
      {status === "copied"
        ? "Copied markdown"
        : status === "error"
          ? "Copy failed"
          : "Copy markdown"}
    </button>
  );
}
