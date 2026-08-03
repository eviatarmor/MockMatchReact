import type { APIRequestContext, APIResponse } from "@playwright/test"
import {
  extractTrpcData,
  isTrpcErrorBody,
  trpcQueryPath,
} from "../../../../api/tests/helpers/trpc-http.ts"
import { E2E_API_URL } from "./env"

export { extractTrpcData }

/**
 * tRPC HTTP via Hono adapter — raw input JSON (no superjson transformer).
 * Wire helpers: api/tests/helpers/trpc-http.ts (shared with API HTTP benches).
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
  const path = trpcQueryPath(procedure, input)
  return request.get(`${E2E_API_URL}${path}`)
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
  if (isTrpcErrorBody(body)) {
    throw new Error(
      `${label}: ${JSON.stringify((body as { error: unknown }).error)}`
    )
  }
  return body
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
