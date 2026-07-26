import { useTranslation } from "react-i18next"
import { PenLine } from "lucide-react"
import { FeatureWelcomeDialog } from "@/components/onboarding/feature-welcome-dialog"

interface DocumentEditorWelcomeDialogProps {
  readonly open: boolean
  readonly onStartTour: () => void
  readonly onSkip: () => void
}

export function DocumentEditorWelcomeDialog({
  open,
  onStartTour,
  onSkip,
}: DocumentEditorWelcomeDialogProps) {
  const { t } = useTranslation("common")

  return (
    <FeatureWelcomeDialog
      open={open}
      onStartTour={onStartTour}
      onSkip={onSkip}
      icon={PenLine}
      title={t("documentEditor.welcome.title")}
      description={t("documentEditor.welcome.description")}
      tourPrompt={t("documentEditor.welcome.tourPrompt")}
      startTourLabel={t("documentEditor.welcome.startTour")}
      skipLabel={t("documentEditor.welcome.skip")}
    />
  )
}
