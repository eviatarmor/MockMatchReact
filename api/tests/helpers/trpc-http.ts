/**
 * tRPC HTTP wire helpers shared by Playwright E2E and in-process Hono benches.
 *
 * This app uses no superjson transformer: request body / GET `input` is the raw
 * procedure input JSON; success envelope is `{ result: { data: T } }`.
 */

/** Encode procedure input for a tRPC GET query string. */
export function encodeTrpcQueryInput(input: unknown): string {
  return encodeURIComponent(JSON.stringify(input))
}

/** Build `/trpc/<procedure>?input=...` path (no host). */
export function trpcQueryPath(procedure: string, input?: unknown): string {
  if (input === undefined) return `/trpc/${procedure}`
  return `/trpc/${procedure}?input=${encodeTrpcQueryInput(input)}`
}

/**
 * Unwrap tRPC success payload from HTTP JSON body.
 * Handles optional superjson-shaped `{ json: T }` and batch index `"0"`.
 */
export function extractTrpcData<T = unknown>(body: unknown): T {
  if (!body || typeof body !== "object") {
    throw new Error(`Unexpected tRPC body: ${JSON.stringify(body)}`)
  }
  const root = body as Record<string, unknown>
  if ("result" in root && root.result && typeof root.result === "object") {
    const result = root.result as { data?: { json?: unknown } | unknown }
    const data = result.data
    if (data && typeof data === "object" && data !== null && "json" in data) {
      return (data as { json: T }).json
    }
    return data as T
  }
  if ("0" in root) {
    return extractTrpcData<T>((root as { "0": unknown })["0"])
  }
  throw new Error(`No tRPC data in: ${JSON.stringify(body).slice(0, 300)}`)
}

/** True when the parsed body is a tRPC error envelope. */
export function isTrpcErrorBody(body: unknown): boolean {
  return Boolean(
    body &&
      typeof body === "object" &&
      "error" in body &&
      (body as { error?: unknown }).error
  )
}
