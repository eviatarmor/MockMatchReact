/**
 * Map a file name or path to a Monaco language id from its extension.
 * Unknown extensions → `"plaintext"`.
 *
 * @see https://microsoft.github.io/monaco-editor/docs.html#functions/languages.getLanguages.html
 */
const EXT_TO_LANGUAGE: Record<string, string> = {
  // JS / TS
  ts: "typescript",
  tsx: "typescript",
  mts: "typescript",
  cts: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",

  // Web
  json: "json",
  jsonc: "json",
  html: "html",
  htm: "html",
  xhtml: "html",
  css: "css",
  scss: "scss",
  less: "less",
  md: "markdown",
  mdx: "markdown",
  svg: "xml",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
  toml: "ini",
  ini: "ini",

  // Systems
  c: "c",
  h: "c",
  cpp: "cpp",
  cxx: "cpp",
  cc: "cpp",
  hpp: "cpp",
  hh: "cpp",
  hxx: "cpp",
  cs: "csharp",
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  go: "go",
  rs: "rust",
  swift: "swift",
  m: "objective-c",
  mm: "cpp",

  // Scripting
  py: "python",
  pyw: "python",
  pyi: "python",
  rb: "ruby",
  php: "php",
  pl: "perl",
  pm: "perl",
  lua: "lua",
  r: "r",
  jl: "julia",
  dart: "dart",
  groovy: "groovy",
  gradle: "groovy",

  // Shell / config
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  fish: "shell",
  ps1: "powershell",
  psm1: "powershell",
  bat: "bat",
  cmd: "bat",
  dockerfile: "dockerfile",
  makefile: "plaintext",
  mk: "plaintext",
  env: "ini",
  conf: "ini",
  cfg: "ini",
  properties: "ini",

  // Data / query
  sql: "sql",
  graphql: "graphql",
  gql: "graphql",
  proto: "protobuf",
  csv: "plaintext",
  tsv: "plaintext",

  // Other
  vue: "html",
  svelte: "html",
  astro: "html",
  tf: "hcl",
  hcl: "hcl",
  sol: "sol",
  zig: "zig",
  nim: "plaintext",
  ex: "elixir",
  exs: "elixir",
  erl: "plaintext",
  hs: "plaintext",
  clj: "clojure",
  cljs: "clojure",
  scala: "scala",
  sc: "scala",
  fs: "fsharp",
  fsi: "fsharp",
  fsx: "fsharp",
  vb: "vb",
  coffee: "coffeescript",
  litcoffee: "coffeescript",
  handlebars: "handlebars",
  hbs: "handlebars",
  pug: "pug",
  jade: "pug",
  twig: "twig",
  razor: "razor",
  cshtml: "razor",
  diff: "diff",
  patch: "diff",
  log: "plaintext",
  txt: "plaintext",
  text: "plaintext",
}

/** Bare filenames without a normal extension. */
const BASENAME_TO_LANGUAGE: Record<string, string> = {
  dockerfile: "dockerfile",
  makefile: "plaintext",
  gemfile: "ruby",
  rakefile: "ruby",
  procfile: "plaintext",
  cmakelists: "plaintext",
}

/**
 * Resolve Monaco language id from a file name or path (`src/foo.cpp` → `cpp`).
 */
export function languageFromFileName(nameOrPath: string): string {
  const base = nameOrPath.replace(/\\/g, "/").split("/").pop() ?? nameOrPath
  const lower = base.toLowerCase()

  const bare = BASENAME_TO_LANGUAGE[lower]
  if (bare) return bare

  // multi-dot: .d.ts, .test.ts → use last segment; special-case .d.ts
  if (lower.endsWith(".d.ts")) return "typescript"

  const dot = lower.lastIndexOf(".")
  if (dot <= 0 || dot === lower.length - 1) return "plaintext"

  const ext = lower.slice(dot + 1)
  return EXT_TO_LANGUAGE[ext] ?? "plaintext"
}

/**
 * Prefer path-derived language, then explicit tab language, then plaintext.
 */
export function resolveTabLanguage(tab: {
  id: string
  title: string
  language?: string
}): string {
  const fromId = languageFromFileName(tab.id)
  if (fromId !== "plaintext") return fromId

  const fromTitle = languageFromFileName(tab.title)
  if (fromTitle !== "plaintext") return fromTitle

  return tab.language ?? "plaintext"
}
