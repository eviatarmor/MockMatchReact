import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { SimulationsPageContent } from "@/features/simulations/simulations-page"

export function SimulationsPage() {
  const { t } = useTranslation("common")

  useEffect(() => {
    document.title = t("simulations.documentTitle")
  }, [t])

  return <SimulationsPageContent />
}
