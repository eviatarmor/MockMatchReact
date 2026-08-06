import { useState } from "react"
import {
  DEFAULT_RICH_TEXT_LABELS,
  RichTextInput,
  type RichTextCaretSnapshot,
  type RichTextRemoteCaret,
} from "@mockmatch/rich-text"
import { cn } from "@mockmatch/ui/utils"

/**
 * Minimal host integration proof for `@mockmatch/rich-text`.
 * Not routed in product nav — import from a playground or Story when needed.
 */
export function RichTextDemoPanel({
  className,
}: {
  readonly className?: string
}) {
  const [html, setHtml] = useState(
    "<p>Select text to try <strong>bold</strong>, color, highlight, and link.</p>"
  )
  const [compactHtml, setCompactHtml] = useState("<p>Cell value</p>")
  const [localCaret, setLocalCaret] = useState<RichTextCaretSnapshot | null>(
    null
  )
  // Stub remote peer — replace with collab presence feed
  const stubPeers: readonly RichTextRemoteCaret[] =
    localCaret != null
      ? [
          {
            userId: "stub-peer",
            name: "Peer",
            color: "#7c3aed",
            x: Math.max(0, localCaret.x + 12),
            y: localCaret.y,
            height: localCaret.height,
          },
        ]
      : []

  return (
    <div className={cn("flex flex-col gap-6 p-4", className)}>
      <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-foreground">
          Default field
        </h2>
        <RichTextInput
          value={html}
          onChange={setHtml}
          labels={DEFAULT_RICH_TEXT_LABELS}
          placeholder="Type…"
          className="min-h-[6rem] rounded-md border border-border/80 px-3 py-2"
          collab={{
            fieldId: "demo-default",
            peers: stubPeers,
            onLocalCaretChange: setLocalCaret,
          }}
        />
        <p className="mt-2 font-mono text-[11px] text-muted-foreground">
          caret:{" "}
          {localCaret
            ? `${Math.round(localCaret.x)},${Math.round(localCaret.y)}`
            : "—"}
        </p>
      </section>

      <section className="rounded-xl border border-border bg-background p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-medium text-foreground">
          Compact (spreadsheet cell)
        </h2>
        <RichTextInput
          variant="compact"
          value={compactHtml}
          onChange={setCompactHtml}
          labels={DEFAULT_RICH_TEXT_LABELS}
          className="rounded border border-border/60 px-2 py-1"
        />
      </section>
    </div>
  )
}
