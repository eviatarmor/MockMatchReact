import { useTranslation } from "react-i18next"
import { Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { CoverLetterTable } from "./components/cover-letter-table"
import { CoverLetterTemplatesSection } from "./components/cover-letter-templates-section"
import { MOCK_COVER_LETTERS } from "./constants"

export function CoverLettersPageContent() {
  const { t } = useTranslation("common")

  const actions = (
    <>
      <Button
        variant="outline"
        className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
      >
        <Upload className="size-4" />
        <span className="hidden sm:inline">{t("dashboard.actions.importCoverLetter")}</span>
      </Button>
      <Button
        variant="default"
        className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
      >
        <Plus className="size-4" />
        <span className="hidden sm:inline">{t("dashboard.actions.newCoverLetter")}</span>
      </Button>
    </>
  )

  return (
    <DashboardPageShell
      title={t("coverLetters.title")}
      searchPlaceholder={t("dashboard.search.coverLetters")}
      actions={actions}
    >
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("coverLetters.title")}
          description={t("coverLetters.description")}
        />

        <CoverLetterTable coverLetters={MOCK_COVER_LETTERS} />

        <Separator className="my-2" />

        <CoverLetterTemplatesSection />
      </div>
    </DashboardPageShell>
  )
}
