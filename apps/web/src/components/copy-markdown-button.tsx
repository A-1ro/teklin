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
      className="rounded-lg border border-rule bg-paper px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-ink-3 hover:text-ink"
    >
      {status === "copied"
        ? "Copied markdown"
        : status === "error"
          ? "Copy failed"
          : "Copy markdown"}
    </button>
  );
}
