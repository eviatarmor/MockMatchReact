import { useState, useMemo, type ReactNode } from "react"
import {
  NavbarSlotsContext,
  NavbarSlotsActionsContext,
  type NavbarSlots,
} from "@/hooks/use-navbar-slots"

export function NavbarSlotsProvider({ children }: { readonly children: ReactNode }) {
  const [slots, setSlotsState] = useState<NavbarSlots>({ center: null, end: null })

  const actions = useMemo(
    () => ({
      setSlots: (next: Partial<NavbarSlots>) => {
        setSlotsState((prev) => ({ ...prev, ...next }))
      },
    }),
    []
  )

  return (
    <NavbarSlotsActionsContext.Provider value={actions}>
      <NavbarSlotsContext.Provider value={slots}>{children}</NavbarSlotsContext.Provider>
    </NavbarSlotsActionsContext.Provider>
  )
}
