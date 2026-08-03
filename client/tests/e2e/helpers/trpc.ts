import type { APIRequestContext, APIResponse } from "@playwright/test"
import { E2E_API_URL } from "./env"

/**
 * tRPC HTTP via Hono adapter — body is the raw input object (not `{ json: … }`).
 */
export async function trpcMutation<TInput>(
  request: APIRequestContext,
  procedure: string,
  input: TInput
): Promise<APIResponse> {
  const url = `${E2E_API_URL}/trpc/${procedure}`
  return request.post(url, {
    data: input as object,
    headers: { "content-type": "application/json" },
  })
}

export async function trpcQuery(
  request: APIRequestContext,
  procedure: string,
  input?: unknown
): Promise<APIResponse> {
  const params = new URLSearchParams()
  if (input !== undefined) {
    // GET input: raw JSON (Hono/tRPC accepts unwrapped input)
    params.set("input", JSON.stringify(input))
  }
  const q = params.toString()
  const url = `${E2E_API_URL}/trpc/${procedure}${q ? `?${q}` : ""}`
  return request.get(url)
}

export async function assertTrpcOk(
  res: APIResponse,
  label: string
): Promise<unknown> {
  const status = res.status()
  const text = await res.text()
  if (status < 200 || status >= 300) {
    throw new Error(`${label} failed HTTP ${status}: ${text.slice(0, 400)}`)
  }
  let body: unknown
  try {
    body = JSON.parse(text) as unknown
  } catch {
    throw new Error(`${label}: non-JSON body: ${text.slice(0, 200)}`)
  }
  // tRPC error envelope
  if (
    body &&
    typeof body === "object" &&
    "error" in body &&
    (body as { error?: unknown }).error
  ) {
    throw new Error(`${label}: ${JSON.stringify((body as { error: unknown }).error)}`)
  }
  return body
}

/**
 * Unwrap tRPC success payload.
 * Hono adapter returns `{ result: { data: T } }` (data not superjson-wrapped).
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

export async function trpcMutationData<TInput, TOut = unknown>(
  request: APIRequestContext,
  procedure: string,
  input: TInput
): Promise<TOut> {
  const res = await trpcMutation(request, procedure, input)
  const body = await assertTrpcOk(res, procedure)
  return extractTrpcData<TOut>(body)
}

export async function trpcQueryData<TOut = unknown>(
  request: APIRequestContext,
  procedure: string,
  input?: unknown
): Promise<TOut> {
  const res = await trpcQuery(request, procedure, input)
  const body = await assertTrpcOk(res, procedure)
  return extractTrpcData<TOut>(body)
}
