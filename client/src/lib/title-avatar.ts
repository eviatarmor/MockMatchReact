/** Soft identity chips — primary + neutral family only (no rainbow brand drift). */
const AVATAR_PALETTE = [
  "bg-primary/12 text-primary",
  "bg-muted text-muted-foreground",
  "bg-secondary text-secondary-foreground",
  "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300",
  "bg-primary/20 text-primary",
  "bg-foreground/10 text-foreground",
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
