/** Lexical theme classes for the freeform page canvas. */
export const pageEditorTheme = {
  ltr: "text-left",
  rtl: "text-right",
  paragraph: "m-0 mb-2 text-[15px] leading-relaxed text-foreground",
  quote:
    "m-0 mb-3 border-l-2 border-primary/40 pl-3 text-muted-foreground italic",
  heading: {
    h1: "m-0 mb-3 text-3xl font-semibold tracking-tight text-foreground",
    h2: "m-0 mb-2.5 text-2xl font-semibold tracking-tight text-foreground",
    h3: "m-0 mb-2 text-xl font-medium text-foreground",
  },
  list: {
    ul: "m-0 mb-2 list-disc pl-6",
    ol: "m-0 mb-2 list-decimal pl-6",
    listitem: "my-0.5",
    listitemChecked:
      "my-0.5 relative list-none pl-1 line-through text-muted-foreground",
    listitemUnchecked: "my-0.5 relative list-none pl-1",
    nested: {
      listitem: "list-none",
    },
    checklist: "m-0 mb-2 list-none pl-1",
  },
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code: "rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]",
  },
  code: "mb-3 block overflow-x-auto rounded-lg border border-border bg-muted/40 p-3 font-mono text-sm",
  codeHighlight: {},
  link: "text-primary underline underline-offset-2",
  hr: "my-4 border-0 border-t border-border",
}
