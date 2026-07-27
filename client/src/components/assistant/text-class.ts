/** Chrome surface for assistant markdown tokens. */
export type AssistantChrome = "sidebar" | "surface"

/**
 * Streamdown / MessageResponse styles for assistant markdown.
 * Body size: 15px (shared). Token sets differ by panel chrome only.
 */
export function assistantTextClass(chrome: AssistantChrome): string {
  if (chrome === "sidebar") {
    return [
      "text-[15px] leading-relaxed text-sidebar-foreground/80",
      "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
      "[&_p]:my-2 [&_p]:leading-relaxed [&_p]:text-sidebar-foreground/70",
      "[&_strong]:font-semibold [&_strong]:text-sidebar-foreground",
      "[&_em]:italic",
      "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ol]:text-sidebar-foreground/70",
      "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-sidebar-foreground/70",
      "[&_li]:leading-relaxed",
      "[&_a]:text-sidebar-foreground [&_a]:underline-offset-2 hover:[&_a]:underline",
      "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-xs",
      "[&_th]:border [&_th]:border-sidebar-border [&_th]:bg-sidebar-accent [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium [&_th]:text-sidebar-foreground",
      "[&_td]:border [&_td]:border-sidebar-border [&_td]:bg-sidebar [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top [&_td]:text-sidebar-foreground/70",
      "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-sidebar-border [&_blockquote]:pl-3 [&_blockquote]:italic",
      "[&_code]:rounded [&_code]:bg-sidebar-accent [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:text-sidebar-foreground",
      "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-sidebar-border [&_pre]:bg-sidebar-accent [&_pre]:p-2",
      "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
      "[&_hr]:my-3 [&_hr]:border-sidebar-border",
    ].join(" ")
  }

  return [
    "text-[15px] leading-relaxed text-foreground",
    "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
    "[&_p]:my-2 [&_p]:leading-relaxed [&_p]:text-muted-foreground",
    "[&_strong]:font-semibold [&_strong]:text-foreground",
    "[&_em]:italic",
    "[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5 [&_ol]:text-muted-foreground",
    "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_ul]:text-muted-foreground",
    "[&_li]:leading-relaxed",
    "[&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline",
    "[&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_table]:text-left [&_table]:text-xs",
    "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:px-2 [&_th]:py-1.5 [&_th]:font-medium [&_th]:text-foreground",
    "[&_td]:border [&_td]:border-border [&_td]:bg-background [&_td]:px-2 [&_td]:py-1.5 [&_td]:align-top [&_td]:text-muted-foreground",
    "[&_blockquote]:my-2 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground [&_blockquote]:italic",
    "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:text-[0.9em] [&_code]:text-foreground",
    "[&_pre]:my-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:border [&_pre]:border-border [&_pre]:bg-muted [&_pre]:p-2",
    "[&_pre_code]:bg-transparent [&_pre_code]:p-0",
    "[&_hr]:my-3 [&_hr]:border-border",
  ].join(" ")
}

/** User bubble plain text — same body size as assistant markdown. */
export const ASSISTANT_USER_TEXT_CLASS =
  "text-[15px] leading-relaxed whitespace-pre-wrap"
