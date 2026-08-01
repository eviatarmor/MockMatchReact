import { useTranslation } from "react-i18next"
import type { GetStartedStep } from "@/features/signup/types"

interface GetStartedStepListProps {
  readonly steps: readonly GetStartedStep[]
}

export function GetStartedStepList({ steps }: GetStartedStepListProps) {
  const { t } = useTranslation("signup")

  return (
    <ol className="flex flex-col gap-4">
      {steps.map((step) => (
        <li key={step.id} className="flex gap-3">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold tabular-nums text-primary-foreground"
            aria-hidden
          >
            {step.step}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="text-sm font-semibold text-primary-foreground">
              {t(step.titleKey)}
            </span>
            <span className="text-sm text-primary-foreground/70">
              {t(step.descriptionKey)}
            </span>
          </div>
        </li>
      ))}
    </ol>
  )
}
