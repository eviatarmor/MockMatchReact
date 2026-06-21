import { useEffect, useMemo, useState } from "react"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { $getRoot, $isTextNode, $createRangeSelection, $setSelection, type LexicalNode } from "lexical"
import { useGrammar } from "./use-grammar"
import { GrammarPopover, type GrammarPopoverLabels } from "./grammar-popover"
import type { GrammarIssue } from "@/lib/grammar/harper"

/** Red wavy squiggle, tiled under a grammar issue. */
const SQUIGGLE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='4'%3E%3Cpath d='M0 3 Q1.5 0 3 3 T6 3' stroke='%23ef4444' fill='none' stroke-width='1'/%3E%3C/svg%3E\")"

interface DomTextMap {
  readonly text: string
  /** Text nodes in document order with the global offset each one starts at. */
  readonly nodes: { node: Text; start: number }[]
}

/** Concatenate a root's text nodes (no block separators) with an offset index. */
function readDomText(root: HTMLElement): DomTextMap {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes: { node: Text; start: number }[] = []
  let text = ""
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    nodes.push({ node: node as Text, start: text.length })
    text += node.nodeValue ?? ""
  }
  return { text, nodes }
}

/** Resolve a global character offset to a DOM text node + local offset. */
function locate(map: DomTextMap, offset: number): { node: Text; offset: number } | null {
  for (let i = map.nodes.length - 1; i >= 0; i--) {
    const entry = map.nodes[i]
    if (offset >= entry.start) return { node: entry.node, offset: offset - entry.start }
  }
  return null
}

interface Mark {
  readonly issue: GrammarIssue
  readonly rects: { left: number; top: number; width: number; height: number }[]
}

/** Build positioned underline rects for each issue, in the root's layout space. */
function computeMarks(root: HTMLElement, map: DomTextMap, issues: readonly GrammarIssue[]): Mark[] {
  const rootRect = root.getBoundingClientRect()
  // The canvas scales the root via CSS transform; divide measured (scaled) px
  // back to layout px so the overlay (also inside the scaled canvas) aligns.
  const scale = root.clientWidth > 0 ? rootRect.width / root.clientWidth : 1
  const marks: Mark[] = []
  for (const issue of issues) {
    if (issue.start >= issue.end || issue.end > map.text.length) continue
    const start = locate(map, issue.start)
    const end = locate(map, issue.end)
    if (!start || !end) continue
    const range = document.createRange()
    range.setStart(start.node, Math.min(start.offset, start.node.length))
    range.setEnd(end.node, Math.min(end.offset, end.node.length))
    const rects = Array.from(range.getClientRects()).map((r) => ({
      left: (r.left - rootRect.left) / scale,
      top: (r.top - rootRect.top) / scale,
      width: r.width / scale,
      height: r.height / scale,
    }))
    if (rects.length) marks.push({ issue, rects })
  }
  return marks
}

/** Replace the text in [start, end) with `replacement` via a Lexical selection. */
function applyReplacement(start: number, end: number, replacement: string) {
  // Collect Lexical text nodes in the same order as the DOM walk.
  const collect = (node: LexicalNode, out: { key: string; len: number; start: number }[], cursor: { v: number }) => {
    if ($isTextNode(node)) {
      const len = node.getTextContentSize()
      out.push({ key: node.getKey(), len, start: cursor.v })
      cursor.v += len
      return
    }
    const children = "getChildren" in node ? (node as { getChildren(): LexicalNode[] }).getChildren() : []
    for (const child of children) collect(child, out, cursor)
  }
  const nodes: { key: string; len: number; start: number }[] = []
  collect($getRoot(), nodes, { v: 0 })
  const at = (offset: number) => {
    for (let i = nodes.length - 1; i >= 0; i--) {
      if (offset >= nodes[i].start) return { key: nodes[i].key, offset: offset - nodes[i].start }
    }
    return null
  }
  const a = at(start)
  const b = at(end)
  if (!a || !b) return
  const selection = $createRangeSelection()
  selection.anchor.set(a.key, a.offset, "text")
  selection.focus.set(b.key, b.offset, "text")
  $setSelection(selection)
  selection.insertText(replacement)
}

interface LexicalGrammarPluginProps {
  readonly enabled?: boolean
  readonly labels: GrammarPopoverLabels
}

interface ActiveMark {
  readonly issue: GrammarIssue
  readonly anchor: { top: number; left: number; bottom: number }
}

/**
 * Grammar-checks a Lexical editor's text with Harper and overlays wavy
 * underlines under each issue. Underlines are positioned from live DOM rects
 * (no editorState mutation), so formatting, wrapping and undo are untouched.
 * Clicking a mark opens its suggestions; applying one edits via a selection.
 */
export function LexicalGrammarPlugin({ enabled = true, labels }: LexicalGrammarPluginProps) {
  const [editor] = useLexicalComposerContext()
  const [text, setText] = useState("")
  const [version, setVersion] = useState(0)
  const [active, setActive] = useState<ActiveMark | null>(null)

  // Re-read the DOM text + trigger a rect recompute on every editor update.
  useEffect(
    () =>
      editor.registerUpdateListener(() => {
        const root = editor.getRootElement()
        if (root) setText(readDomText(root).text)
        setVersion((v) => v + 1)
      }),
    [editor]
  )

  // Recompute rects when the editor reflows (width change → different wrapping).
  useEffect(() => {
    const root = editor.getRootElement()
    if (!root) return
    const observer = new ResizeObserver(() => setVersion((v) => v + 1))
    observer.observe(root)
    return () => observer.disconnect()
  }, [editor])

  const issues = useGrammar(text, enabled)

  const marks = useMemo(() => {
    const root = editor.getRootElement()
    if (!root || !enabled || issues.length === 0) return []
    return computeMarks(root, readDomText(root), issues)
    // `version` forces recompute on edits/reflow; `text` keeps it in lockstep.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, issues, version, enabled])

  if (!enabled) return null

  return (
    <div aria-hidden className="pan-ignore pointer-events-none absolute inset-0 z-[1]">
      {marks.flatMap((mark) =>
        mark.rects.map((rect, index) => (
          <button
            key={`${mark.issue.start}-${mark.issue.end}-${index}`}
            type="button"
            tabIndex={-1}
            className="pointer-events-auto absolute cursor-pointer bg-bottom bg-repeat-x"
            style={{
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
              backgroundImage: SQUIGGLE,
              backgroundSize: "6px 4px",
            }}
            onClick={(event) => {
              const r = event.currentTarget.getBoundingClientRect()
              setActive({
                issue: mark.issue,
                anchor: { top: r.top, bottom: r.bottom, left: r.left + r.width / 2 },
              })
            }}
          />
        ))
      )}

      {active && (
        <GrammarPopover
          issue={active.issue}
          anchor={active.anchor}
          labels={labels}
          onApply={(replacement) => {
            editor.update(() => applyReplacement(active.issue.start, active.issue.end, replacement))
            setActive(null)
          }}
          onClose={() => setActive(null)}
        />
      )}
    </div>
  )
}
