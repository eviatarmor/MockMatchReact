import { useCallback, useEffect, useState } from "react"
import { useLocalStorage } from "@uidotdev/usehooks"

/**
 * First-visit welcome dialog + optional product tour.
 * Welcome is shown once per `storageKey`; answering (tour or skip) persists.
 */
export function useFeatureOnboarding(storageKey: string) {
  const [welcomeSeen, setWelcomeSeen] = useLocalStorage<boolean>(storageKey, false)
  const [welcomeOpen, setWelcomeOpen] = useState(false)
  const [tourOpen, setTourOpen] = useState(false)

  useEffect(() => {
    if (welcomeSeen) return
    const id = window.setTimeout(() => setWelcomeOpen(true), 120)
    return () => window.clearTimeout(id)
  }, [welcomeSeen])

  const skipWelcome = useCallback(() => {
    setWelcomeSeen(true)
    setWelcomeOpen(false)
  }, [setWelcomeSeen])

  const startTour = useCallback(() => {
    setWelcomeSeen(true)
    setWelcomeOpen(false)
    window.setTimeout(() => setTourOpen(true), 220)
  }, [setWelcomeSeen])

  const setTourOpenSafe = useCallback((open: boolean) => {
    setTourOpen(open)
  }, [])

  return {
    welcomeOpen,
    tourOpen,
    startTour,
    skipWelcome,
    setTourOpen: setTourOpenSafe,
  }
}
