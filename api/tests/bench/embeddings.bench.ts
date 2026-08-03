import { bench, describe } from "vitest"
import { cosineSimilarity } from "@/lib/embeddings.js"

function randVec(n: number): number[] {
  const a = new Array<number>(n)
  for (let i = 0; i < n; i++) a[i] = Math.sin(i * 0.17) * 0.5
  return a
}

const a = randVec(1536)
const b = randVec(1536)
const c = [...a]

describe("api embeddings math (question dedupe)", () => {
  bench("cosineSimilarity 1536-d", () => {
    cosineSimilarity(a, b)
  })

  bench("cosineSimilarity identical 1536-d", () => {
    cosineSimilarity(a, c)
  })
})
