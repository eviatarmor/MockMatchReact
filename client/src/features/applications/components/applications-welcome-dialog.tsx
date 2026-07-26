import { useTranslation } from "react-i18next"
import { LayoutDashboard } from "lucide-react"
import { FeatureWelcomeDialog } from "@/components/onboarding/feature-welcome-dialog"

interface ApplicationsWelcomeDialogProps {
  readonly open: boolean
  readonly onStartTour: () => void
  readonly onSkip: () => void
}

export function ApplicationsWelcomeDialog({
  open,
  onStartTour,
  onSkip,
}: ApplicationsWelcomeDialogProps) {
  const { t } = useTranslation("common")

  return (
    <FeatureWelcomeDialog
      open={open}
      onStartTour={onStartTour}
      onSkip={onSkip}
      icon={LayoutDashboard}
      title={t("applications.welcome.title")}
      description={t("applications.welcome.description")}
      tourPrompt={t("applications.welcome.tourPrompt")}
      startTourLabel={t("applications.welcome.startTour")}
      skipLabel={t("applications.welcome.skip")}
    />
  )
}
