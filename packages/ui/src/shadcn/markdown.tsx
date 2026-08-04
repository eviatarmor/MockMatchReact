"use client"

import { memo, useMemo, type ComponentProps } from "react"
import { Streamdown } from "streamdown"
import { cjk } from "@streamdown/cjk"
import { createCodePlugin } from "@streamdown/code"
import { math } from "@streamdown/math"
import { mermaid } from "@streamdown/mermaid"

import { cn } from "../lib/utils"
import { StaggerItem } from "./stagger"

const streamdownPlugins = {
  cjk,
  code: createCodePlugin({ themes: ["github-light", "github-dark"] }),
  math,
  mermaid,
}

const MARKDOWN_BODY =
  "markdown-body size-full text-sm leading-relaxed text-foreground/90 " +
  "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 " +
  "[&_h1]:mb-2 [&_h1]:mt-4 [&_h1]:text-base [&_h1]:font-semibold " +
  "[&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-sm [&_h2]:font-semibold " +
  "[&_h3]:mb-1.5 [&_h3]:mt-3 [&_h3]:text-sm [&_h3]:font-medium " +
  "[&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 " +
  "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 " +
  "[&_li]:my-0.5 " +
  "[&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline " +
  "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-2xs " +
  "[&_pre]:my-3 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-muted [&_pre]:p-3 " +
  "[&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground " +
  "[&_hr]:my-4 [&_hr]:border-border " +
  "[&_table]:my-3 [&_table]:w-full [&_table]:text-left [&_th]:border-b [&_th]:px-2 [&_th]:py-1 [&_td]:border-b [&_td]:border-border/60 [&_td]:px-2 [&_td]:py-1"

export type MarkdownProps = {
  readonly children: string
  readonly className?: string
} & Omit<
  ComponentProps<typeof Streamdown>,
  "children" | "className" | "plugins"
>

/**
 * Product markdown (prompts, docs snippets). Uses Streamdown — same stack as
 * assistant chat — with calm prose defaults for side panels.
 */
export const Markdown = memo(function Markdown({
  children,
  className,
  ...props
}: MarkdownProps) {
  return (
    <Streamdown
      className={cn(MARKDOWN_BODY, className)}
      plugins={streamdownPlugins}
      shikiTheme={["github-light", "github-dark"]}
      {...props}
    >
      {children}
    </Streamdown>
  )
})

/**
 * Split markdown into blocks (blank-line separated) and cascade each with
 * {@link StaggerItem}. Prefer this for rail prompts over CSS child tricks —
 * Streamdown often wraps content so `> *` CSS never hits real paragraphs.
 */
export const StaggerMarkdown = memo(function StaggerMarkdown({
  children,
  className,
}: {
  readonly children: string
  readonly className?: string
}) {
  const blocks = useMemo(() => splitMarkdownBlocks(children), [children])

  if (blocks.length <= 1) {
    return (
      <StaggerItem index={0} className={className}>
        <Markdown className="size-full">{children}</Markdown>
      </StaggerItem>
    )
  }

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {blocks.map((block, i) => (
        <StaggerItem key={`md-${i}-${block.slice(0, 24)}`} index={i}>
          <Markdown className="size-full">{block}</Markdown>
        </StaggerItem>
      ))}
    </div>
  )
})

/** Split on blank lines; keep fenced code blocks intact. */
export function splitMarkdownBlocks(source: string): string[] {
  const text = source.replace(/\r\n/g, "\n").trim()
  if (!text) return []

  const blocks: string[] = []
  let buf: string[] = []
  let inFence = false

  for (const line of text.split("\n")) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence
      buf.push(line)
      continue
    }
    if (!inFence && line.trim() === "") {
      if (buf.length > 0) {
        blocks.push(buf.join("\n").trim())
        buf = []
      }
      continue
    }
    buf.push(line)
  }
  if (buf.length > 0) blocks.push(buf.join("\n").trim())
  return blocks.filter(Boolean)
}
