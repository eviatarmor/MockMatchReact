import { useState, type ReactNode } from "react"
import { NavbarSlotsContext, type NavbarSlots } from "@/hooks/use-navbar-slots"

export function NavbarSlotsProvider({ children }: { readonly children: ReactNode }) {
  const [slots, setSlotsState] = useState<NavbarSlots>({ center: null, end: null })

  const setSlots = (next: Partial<NavbarSlots>) => {
    setSlotsState((prev) => ({ ...prev, ...next }))
  }

  return (
    <NavbarSlotsContext.Provider value={{ ...slots, setSlots }}>
      {children}
    </NavbarSlotsContext.Provider>
  )
}
