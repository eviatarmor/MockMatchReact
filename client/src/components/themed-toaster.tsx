import { Toaster } from "@mockmatch/ui/sonner"
import { useTheme } from "@/components/theme-provider"

/** Wires shared Toaster to app ThemeProvider. */
export function ThemedToaster() {
  const { theme } = useTheme()
  return <Toaster theme={theme} />
}
