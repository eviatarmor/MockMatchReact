import { useMediaQuery } from "@uidotdev/usehooks"

const MOBILE_BREAKPOINT = 768

/** True below the app's mobile breakpoint (matches Tailwind `md`). */
export function useIsMobile() {
  return useMediaQuery(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
}
