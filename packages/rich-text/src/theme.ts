/** Lexical theme classes for the lightweight rich-text input. */
export const richTextTheme = {
  paragraph: "m-0",
  heading: {
    h1: "m-0 text-2xl font-semibold tracking-tight",
    h2: "m-0 text-xl font-semibold tracking-tight",
    h3: "m-0 text-lg font-medium",
  },
  list: {
    ul: "m-0 list-disc pl-5",
    ol: "m-0 list-decimal pl-5",
    listitem: "my-0",
    nested: {
      listitem: "list-none",
    },
  },
  text: {
    bold: "font-semibold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
  },
  link: "text-blue-600 underline underline-offset-2 dark:text-blue-400",
}
