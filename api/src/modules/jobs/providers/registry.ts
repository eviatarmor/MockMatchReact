import type { JobProviderId } from "@mockmatch/schemas"
import { TRPCError } from "@trpc/server"
import { adzunaProvider } from "./adzuna.js"
import type { JobProvider } from "./types.js"

const providers: Record<JobProviderId, JobProvider> = {
  adzuna: adzunaProvider,
}

const DEFAULT_PROVIDER_ID: JobProviderId = "adzuna"

export function getJobProvider(id?: JobProviderId): JobProvider {
  const key = id ?? DEFAULT_PROVIDER_ID
  const provider = providers[key]
  if (!provider) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unknown job provider "${key}".`,
    })
  }
  return provider
}

export function listJobProviders(): JobProvider[] {
  return Object.values(providers)
}
