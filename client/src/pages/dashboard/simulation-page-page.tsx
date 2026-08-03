import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { SimulationPagePageContent } from "@/features/simulation-page/simulation-page-page"

export function SimulationPagePage() {
  const { t } = useTranslation("simulation-page")

  useEffect(() => {
    document.title = t("documentTitle")
  }, [t])

  return <SimulationPagePageContent />
}
