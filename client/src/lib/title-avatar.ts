const AVATAR_PALETTE = [
  "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400",
  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400",
  "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400",
  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
  "bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400",
] as const

/** Derive avatar initials from title (max 2 chars). */
export function titleToAvatarText(title: string): string {
  const parts = title.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function avatarClassFor(text: string): string {
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    hash = (hash + text.charCodeAt(i)) % AVATAR_PALETTE.length
  }
  return AVATAR_PALETTE[hash] ?? AVATAR_PALETTE[0]
}
