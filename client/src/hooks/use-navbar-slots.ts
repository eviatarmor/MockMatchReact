import { createContext, useContext, useEffect, type ReactNode } from "react"

export interface NavbarSlots {
  readonly crumb: ReactNode
  readonly center: ReactNode
  readonly end: ReactNode
}

export interface NavbarSlotsActions {
  readonly setSlots: (slots: Partial<NavbarSlots>) => void
}

export const NavbarSlotsContext = createContext<NavbarSlots | null>(null)
export const NavbarSlotsActionsContext = createContext<NavbarSlotsActions | null>(null)

export function useNavbarSlotsValue() {
  const context = useContext(NavbarSlotsContext)
  if (!context) {
    throw new Error("useNavbarSlotsValue must be used within a NavbarSlotsProvider")
  }
  return context
}

export function useNavbarSlotsActions() {
  const context = useContext(NavbarSlotsActionsContext)
  if (!context) {
    throw new Error("useNavbarSlotsActions must be used within a NavbarSlotsProvider")
  }
  return context
}

export function useNavbarSlots(slots: {
  readonly crumb?: ReactNode
  readonly center?: ReactNode
  readonly end?: ReactNode
}) {
  const { setSlots } = useNavbarSlotsActions()
  const { crumb, center, end } = slots

  useEffect(() => {
    setSlots({ crumb: crumb ?? null, center: center ?? null, end: end ?? null })
    return () => setSlots({ crumb: null, center: null, end: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [crumb, center, end])
}
