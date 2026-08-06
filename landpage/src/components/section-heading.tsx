import { cn } from "@mockmatch/ui/utils"

interface SectionHeadingProps {
  readonly eyebrow: string
  readonly title: string
  readonly description?: string
  readonly align?: "left" | "center"
  readonly titleId: string
  readonly className?: string
}

/** Shared marketing section intro — keeps type scale consistent. */
// fallow-ignore-next-line complexity
export function SectionHeading({
  eyebrow,
  title,
  description = "",
  align = "left",
  titleId,
  className,
}: SectionHeadingProps) {
  const centered = align === "center"

  return (
    <div
      className={cn(
        "mb-12 max-w-2xl sm:mb-14",
        centered && "mx-auto text-center",
        className
      )}
    >
      <p className="lp-eyebrow mb-3">{eyebrow}</p>
      <h2 id={titleId} className="lp-title">
        {title}
      </h2>
      {description ? (
        <p className={cn("lp-lede mt-4", centered && "mx-auto max-w-xl")}>
          {description}
        </p>
      ) : null}
    </div>
  )
}
