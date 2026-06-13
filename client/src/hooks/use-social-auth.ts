import { useCallback } from "react"
import { useMutation } from "@tanstack/react-query"
import type { SocialProvider } from "@/components/auth/types"

export interface UseSocialAuthResult {
  readonly pendingProvider: SocialProvider | null
  readonly signInWithProvider: (provider: SocialProvider) => void
}

// Dummy social sign-in: no backend wired up yet.
const socialAuthRequest: (provider: SocialProvider) => Promise<void> = () =>
  new Promise((resolve) => window.setTimeout(resolve, 600))

export function useSocialAuth(): UseSocialAuthResult {
  const { mutate, isPending, variables } = useMutation({
    mutationFn: socialAuthRequest,
  })

  const signInWithProvider = useCallback(
    (provider: SocialProvider) => {
      mutate(provider)
    },
    [mutate]
  )

  return { pendingProvider: isPending ? (variables ?? null) : null, signInWithProvider }
}
