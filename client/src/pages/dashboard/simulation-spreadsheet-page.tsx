import { useEffect } from "react"
import { useTranslation } from "react-i18next"
import { SimulationSpreadsheetPageContent } from "@/features/simulation-spreadsheet/simulation-spreadsheet-page"

export function SimulationSpreadsheetPage() {
  const { t } = useTranslation("simulation-spreadsheet")

  useEffect(() => {
    document.title = t("documentTitle")
  }, [t])

  return <SimulationSpreadsheetPageContent />
}
