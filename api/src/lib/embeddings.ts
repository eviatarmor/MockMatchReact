import { env } from "../config/env.js"
import { logger } from "./logger.js"
import { getOpenRouter } from "./openrouter.js"

const EXPECTED_DIM = 1536

export function isEmbeddingsConfigured(): boolean {
  return Boolean(env.OPENROUTER_API_KEY)
}

/**
 * Embed text via OpenRouter (OpenAI-compatible embeddings).
 * Returns null when key missing or call fails (caller can skip ANN).
 */
export async function embedText(text: string): Promise<{
  vector: number[]
  model: string
} | null> {
  if (!env.OPENROUTER_API_KEY) return null
  const input = text.replace(/\s+/g, " ").trim().slice(0, 8000)
  if (!input) return null

  const model = env.OPENROUTER_EMBEDDING_MODEL
  try {
    const openRouter = getOpenRouter()
    const client = openRouter as unknown as {
      embeddings?: {
        generate: (args: {
          model: string
          input: string
        }) => Promise<{
          data?: Array<{ embedding?: number[] }>
        }>
      }
    }

    if (client.embeddings?.generate) {
      const response = await client.embeddings.generate({ model, input })
      const vector = response.data?.[0]?.embedding
      if (!vector || vector.length !== EXPECTED_DIM) {
        logger.warn(
          { dim: vector?.length, expected: EXPECTED_DIM, model },
          "embedding_dimension_mismatch"
        )
        return null
      }
      return { vector, model }
    }

    // Fallback: raw fetch if SDK lacks embeddings helper
    const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input }),
    })
    if (!res.ok) {
      logger.warn(
        { status: res.status, body: await res.text() },
        "embedding_http_failed"
      )
      return null
    }
    const json = (await res.json()) as {
      data?: Array<{ embedding?: number[] }>
    }
    const vector = json.data?.[0]?.embedding
    if (!vector || vector.length !== EXPECTED_DIM) {
      logger.warn(
        { dim: vector?.length, expected: EXPECTED_DIM, model },
        "embedding_dimension_mismatch"
      )
      return null
    }
    return { vector, model }
  } catch (err) {
    logger.error({ err }, "embedding_failed")
    return null
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0
  let dot = 0
  let na = 0
  let nb = 0
  for (let i = 0; i < a.length; i++) {
    const x = a[i]!
    const y = b[i]!
    dot += x * y
    na += x * x
    nb += y * y
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb)
  return denom === 0 ? 0 : dot / denom
}
