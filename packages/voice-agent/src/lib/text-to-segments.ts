import type { TranscriptSegment } from "../types"

const WORDS_PER_SEC = 3.2

/** Split plain text into timed word segments for realtime highlight. */
export function textToSegments(
  text: string,
  wordsPerSec = WORDS_PER_SEC
): { segments: TranscriptSegment[]; durationSec: number } {
  const words = text.split(/\s+/).filter(Boolean)
  if (words.length === 0) {
    return { segments: [], durationSec: 0.4 }
  }
  const segments = words.map((word, i) => ({
    text: i < words.length - 1 ? `${word} ` : word,
    startSecond: i / wordsPerSec,
    endSecond: (i + 1) / wordsPerSec,
  }))
  return {
    segments,
    durationSec: words.length / wordsPerSec,
  }
}
