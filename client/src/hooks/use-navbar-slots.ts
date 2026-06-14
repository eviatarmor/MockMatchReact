import { createContext, useContext, useEffect, type ReactNode } from "react"

export interface NavbarSlots {
  readonly center: ReactNode
  readonly end: ReactNode
}

export interface NavbarSlotsContextValue extends NavbarSlots {
  setSlots: (slots: Partial<NavbarSlots>) => void
}

export const NavbarSlotsContext = createContext<NavbarSlotsContextValue | null>(null)

export function useNavbarSlotsValue() {
  const context = useContext(NavbarSlotsContext)
  if (!context) {
    throw new Error("useNavbarSlotsValue must be used within a NavbarSlotsProvider")
  }
  return context
}

export function useNavbarSlots(slots: { readonly center?: ReactNode; readonly end?: ReactNode }) {
  const { setSlots } = useNavbarSlotsValue()
  const { center, end } = slots

  useEffect(() => {
    setSlots({ center: center ?? null, end: end ?? null })
    return () => setSlots({ center: null, end: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [center, end])
}
