import { useCallback, useEffect, useRef, useState } from "react"

const SESSION_KEY = "mockmatch.discover.detectedCity"

interface ReverseGeocodeResponse {
  city?: string
  locality?: string
  principalSubdivision?: string
  countryCode?: string
}

export type LocationDetectStatus =
  | "idle"
  | "detecting"
  | "ready"
  | "denied"
  | "unavailable"
  | "error"

interface UseDetectLocationOptions {
  readonly enabled: boolean
  readonly onDetected?: (city: string) => void
}

function readSessionCity(): string | null {
  try {
    const value = sessionStorage.getItem(SESSION_KEY)
    return value?.trim() || null
  } catch {
    return null
  }
}

function writeSessionCity(city: string): void {
  try {
    sessionStorage.setItem(SESSION_KEY, city)
  } catch {
    // ignore quota / private mode
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const url = new URL("https://api.bigdatacloud.net/data/reverse-geocode-client")
  url.searchParams.set("latitude", String(lat))
  url.searchParams.set("longitude", String(lon))
  url.searchParams.set("localityLanguage", "en")

  const response = await fetch(url.toString())
  if (!response.ok) return null

  const data = (await response.json()) as ReverseGeocodeResponse
  const city =
    data.city?.trim() ||
    data.locality?.trim() ||
    data.principalSubdivision?.trim() ||
    null
  return city
}

/**
 * One-shot browser geolocation → city name.
 * Respects `enabled` (privacy.allowLocationMetadata).
 * Caches city in sessionStorage to avoid re-prompt on remount.
 */
export function useDetectLocation({ enabled, onDetected }: UseDetectLocationOptions) {
  const [status, setStatus] = useState<LocationDetectStatus>("idle")
  const [city, setCity] = useState<string | null>(() => readSessionCity())
  const attemptedRef = useRef(false)
  const onDetectedRef = useRef(onDetected)
  onDetectedRef.current = onDetected

  const applyCity = useCallback((next: string) => {
    writeSessionCity(next)
    setCity(next)
    setStatus("ready")
    onDetectedRef.current?.(next)
  }, [])

  const detect = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unavailable")
      return
    }

    setStatus("detecting")
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const name = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          )
          if (name) {
            applyCity(name)
          } else {
            setStatus("error")
          }
        } catch {
          setStatus("error")
        }
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setStatus("denied")
        } else {
          setStatus("error")
        }
      },
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 600_000 }
    )
  }, [applyCity])

  useEffect(() => {
    if (!enabled) {
      setStatus("idle")
      return
    }
    if (attemptedRef.current) return

    const cached = readSessionCity()
    if (cached) {
      attemptedRef.current = true
      setCity(cached)
      setStatus("ready")
      onDetectedRef.current?.(cached)
      return
    }

    attemptedRef.current = true
    detect()
  }, [enabled, detect])

  return {
    status,
    city,
    detect,
    clearCity: () => {
      try {
        sessionStorage.removeItem(SESSION_KEY)
      } catch {
        // ignore
      }
      setCity(null)
      setStatus("idle")
    },
  }
}
