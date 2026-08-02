import type { ReactNode } from "react"

/** Matches client `SectionShell` — heading + description, then content. */
export function SectionShell({
  heading,
  description,
  children,
}: {
  readonly heading: string
  readonly description: string
  readonly children: ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="font-heading text-base font-medium text-foreground">
          {heading}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </section>
  )
}
