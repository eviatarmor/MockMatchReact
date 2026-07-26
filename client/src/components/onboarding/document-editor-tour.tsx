import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  FeatureTour,
  type FeatureTourStep,
} from "@/components/onboarding/feature-tour"

interface DocumentEditorTourProps {
  readonly open: boolean
  readonly onOpenChange: (open: boolean) => void
}

export function DocumentEditorTour({
  open,
  onOpenChange,
}: DocumentEditorTourProps) {
  const { t } = useTranslation("common")

  const steps = useMemo<FeatureTourStep[]>(
    () => [
      {
        target: "#editor-tour-canvas",
        side: "left",
        title: t("documentEditor.tour.canvas.title"),
        description: t("documentEditor.tour.canvas.description"),
      },
      {
        target: "#editor-tour-collab",
        side: "bottom",
        align: "start",
        title: t("documentEditor.tour.collab.title"),
        description: t("documentEditor.tour.collab.description"),
      },
      {
        target: "#editor-tour-actions",
        side: "bottom",
        align: "end",
        title: t("documentEditor.tour.actions.title"),
        description: t("documentEditor.tour.actions.description"),
      },
      {
        target: "#editor-tour-rail",
        side: "left",
        title: t("documentEditor.tour.rail.title"),
        description: t("documentEditor.tour.rail.description"),
      },
    ],
    [t]
  )

  return <FeatureTour open={open} onOpenChange={onOpenChange} steps={steps} />
}
