import { Fragment, type ReactNode } from "react";

interface MarkdownTextProps {
  text: string;
  className?: string;
}

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={index}
          className="rounded bg-rule px-1.5 py-0.5 font-mono text-[0.95em] text-plum"
        >
          {part.slice(1, -1)}
        </code>
      );
    }

    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-ink">
          {part.slice(2, -2)}
        </strong>
      );
    }

    return <Fragment key={index}>{part}</Fragment>;
  });
}

export function MarkdownText({ text, className }: MarkdownTextProps) {
  const lines = text.split("\n");
  const nodes: ReactNode[] = [];
  let paragraph: string[] = [];
  let listItems: string[] = [];

  function flushParagraph() {
    if (paragraph.length === 0) return;
    nodes.push(
      <p key={`p-${nodes.length}`} className="leading-relaxed">
        {renderInline(paragraph.join(" "))}
      </p>
    );
    paragraph = [];
  }

  function flushList() {
    if (listItems.length === 0) return;
    nodes.push(
      <ol key={`ol-${nodes.length}`} className="ml-5 list-decimal space-y-1">
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ol>
    );
    listItems = [];
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();

    if (!line) {
      flushParagraph();
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushParagraph();
      flushList();
      nodes.push(
        <div key={`h-${nodes.length}`} className="font-semibold text-ink">
          {renderInline(headingMatch[2])}
        </div>
      );
      continue;
    }

    const listMatch = line.match(/^\d+\.\s+(.*)$/);
    if (listMatch) {
      flushParagraph();
      listItems.push(listMatch[1]);
      continue;
    }

    flushList();
    paragraph.push(line);
  }

  flushParagraph();
  flushList();

  return <div className={className ?? "space-y-3"}>{nodes}</div>;
}
