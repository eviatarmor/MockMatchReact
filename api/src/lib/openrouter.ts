import { OpenRouter } from "@openrouter/sdk"
import { env } from "../config/env.js"

let client: OpenRouter | null = null

export function getOpenRouter(): OpenRouter {
  if (!client) {
    client = new OpenRouter({
      apiKey: env.OPENROUTER_API_KEY || undefined,
    })
  }
  return client
}
