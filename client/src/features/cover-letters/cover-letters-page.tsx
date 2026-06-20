import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { SearchBar } from "@/components/dashboard/search-bar"
import { TemplateBrowserSection } from "@/components/templates/template-browser-section"
import { CoverLetterTable } from "./components/cover-letter-table"
import { MOCK_COVER_LETTERS, MOCK_TEMPLATES, TEMPLATE_CATEGORIES } from "./constants"

export function CoverLettersPageContent() {
  const { t } = useTranslation("common")
  const [search, setSearch] = useState("")

  const filteredLetters = useMemo(
    () => MOCK_COVER_LETTERS.filter(
      (cl) =>
        cl.title.toLowerCase().includes(search.toLowerCase()) ||
        (cl.company && cl.company.toLowerCase().includes(search.toLowerCase()))
    ),
    [search]
  )

  return (
    <DashboardPageShell
      title={t("coverLetters.title")}
    >
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("coverLetters.title")}
          description={t("coverLetters.description")}
          actions={
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
          }
        />
        <SearchBar
          placeholder={t("dashboard.search.coverLetters")}
          value={search}
          onChange={setSearch}
        />
        <CoverLetterTable coverLetters={filteredLetters} />
        <Separator className="my-2" />
        <TemplateBrowserSection items={MOCK_TEMPLATES} categories={TEMPLATE_CATEGORIES} translationPrefix="coverLetters.templates" />
      </div>
    </DashboardPageShell>
  )
}
