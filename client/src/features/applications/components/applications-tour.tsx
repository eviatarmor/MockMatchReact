import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  FeatureTour,
  type FeatureTourStep,
} from "@/components/onboarding/feature-tour"

interface ApplicationsTourProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function ApplicationsTour({ open, onOpenChange }: ApplicationsTourProps) {
  const { t } = useTranslation("common")

  const steps = useMemo<FeatureTourStep[]>(
    () => [
      {
        target: "#applications-tour-email",
        side: "bottom",
        align: "end",
        title: t("applications.tour.email.title"),
        description: t("applications.tour.email.description"),
      },
      {
        target: "#applications-tour-import",
        side: "bottom",
        align: "end",
        title: t("applications.tour.import.title"),
        description: t("applications.tour.import.description"),
      },
      {
        target: "#applications-tour-board",
        side: "top",
        title: t("applications.tour.kanban.title"),
        description: t("applications.tour.kanban.description"),
      },
    ],
    [t]
  )

  return <FeatureTour open={open} onOpenChange={onOpenChange} steps={steps} />
}
