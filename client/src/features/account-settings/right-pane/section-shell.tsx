import type { ReactNode } from "react"

interface SectionShellProps {
  readonly heading: string
  readonly description: string
  readonly children: ReactNode
}

// Panel content layout: heading + description on top, content below.
export function SectionShell({ heading, description, children }: SectionShellProps) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{heading}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}
