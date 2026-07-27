/** Append a final speech transcript piece onto the current draft. */
export function appendTranscript(current: string, next: string): string {
  const piece = next.trim()
  if (!piece) return current
  const base = current.trimEnd()
  if (!base) return piece
  return `${base} ${piece}`
}
