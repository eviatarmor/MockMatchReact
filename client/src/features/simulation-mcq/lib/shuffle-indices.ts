/** Fisher–Yates shuffle copy; keeps identity if length < 2. */
export function shuffleIndices(n: number, seed?: string): number[] {
  const arr = Array.from({ length: n }, (_, i) => i)
  if (n < 2) return arr
  // Simple deterministic-ish shuffle from seed string when provided
  let s = 0
  if (seed) {
    for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0
  } else {
    s = Date.now() >>> 0
  }
  for (let i = n - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0
    const j = s % (i + 1)
    ;[arr[i], arr[j]] = [arr[j]!, arr[i]!]
  }
  // Avoid starting already correct when possible
  const identity = arr.every((v, i) => v === i)
  if (identity && n > 1) {
    ;[arr[0], arr[1]] = [arr[1]!, arr[0]!]
  }
  return arr
}
