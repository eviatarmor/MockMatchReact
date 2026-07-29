import { createContext, useContext, type ReactNode } from "react"
import { Dialect } from "../lib/grammar/harper"

const GrammarDialectContext = createContext<Dialect>(Dialect.American)

/** Host supplies Harper dialect (from account language prefs). */
export function GrammarDialectProvider({
  dialect,
  children,
}: {
  readonly dialect: Dialect
  readonly children: ReactNode
}) {
  return (
    <GrammarDialectContext.Provider value={dialect}>
      {children}
    </GrammarDialectContext.Provider>
  )
}

export function useGrammarDialect(): Dialect {
  return useContext(GrammarDialectContext)
}
