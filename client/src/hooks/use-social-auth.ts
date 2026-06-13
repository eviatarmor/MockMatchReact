import { useCallback, useState } from "react"
import type { SocialProvider } from "@/lib/auth/types"

export interface UseSocialAuthResult {
  readonly pendingProvider: SocialProvider | null
  readonly signInWithProvider: (provider: SocialProvider) => void
}

export function useSocialAuth(): UseSocialAuthResult {
  const [pendingProvider, setPendingProvider] = useState<SocialProvider | null>(null)

  const signInWithProvider = useCallback((provider: SocialProvider) => {
    setPendingProvider(provider)

    // Dummy social sign-in: no backend wired up yet.
    window.setTimeout(() => {
      setPendingProvider(null)
    }, 600)
  }, [])

  return { pendingProvider, signInWithProvider }
}
