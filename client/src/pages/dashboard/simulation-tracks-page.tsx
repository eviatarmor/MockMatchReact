import { useDocumentTitle } from "@uidotdev/usehooks"
import { useTranslation } from "react-i18next"
import { SimulationTracksPageContent } from "@/features/simulations/simulation-tracks-page"

export function SimulationTracksPage() {
  const { t } = useTranslation("common")
  useDocumentTitle(t("simulations.tracksBrowser.browseTitle"))

  return <SimulationTracksPageContent />
}
