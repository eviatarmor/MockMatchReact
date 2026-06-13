import { useTranslation } from "react-i18next"
import type { GetStartedStep } from "@/features/signup/types"

interface GetStartedStepListProps {
  readonly steps: readonly GetStartedStep[]
}

export function GetStartedStepList({ steps }: GetStartedStepListProps) {
  const { t } = useTranslation("signup")

  return (
    <ul className="flex flex-col gap-4">
      {steps.map((step) => (
        <li key={step.id} className="flex gap-3">
          <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
            {step.step}
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-white">{t(step.titleKey)}</span>
            <span className="text-sm text-white/70">{t(step.descriptionKey)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}
