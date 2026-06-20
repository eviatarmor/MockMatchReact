import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Upload, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { SearchBar } from "@/components/dashboard/search-bar"
import { TemplateBrowserSection } from "@/components/templates/template-browser-section"
import { ResumeTable } from "./components/resume-table"
import { MOCK_RESUMES, MOCK_TEMPLATES, TEMPLATE_CATEGORIES } from "./constants"

export function ResumeLabPageContent() {
  const { t } = useTranslation("common")
  const [search, setSearch] = useState("")

  const filteredResumes = useMemo(
    () => MOCK_RESUMES.filter(
      (r) =>
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        (r.targetRole && r.targetRole.toLowerCase().includes(search.toLowerCase()))
    ),
    [search]
  )

  return (
    <DashboardPageShell
      title={t("resumeLab.title")}
    >
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("resumeLab.title")}
          description={t("resumeLab.description")}
          actions={
            <>
              <Button
                variant="outline"
                className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
              >
                <Upload className="size-4" />
                <span className="hidden sm:inline">{t("dashboard.actions.importResume")}</span>
              </Button>
              <Button
                variant="default"
                className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">{t("dashboard.actions.newResume")}</span>
              </Button>
            </>
          }
        />
        <SearchBar
          placeholder={t("dashboard.search.resumes")}
          value={search}
          onChange={setSearch}
        />
        <ResumeTable resumes={filteredResumes} />
        <Separator className="my-2" />
        <TemplateBrowserSection items={MOCK_TEMPLATES} categories={TEMPLATE_CATEGORIES} translationPrefix="resumeLab.templates" />
      </div>
    </DashboardPageShell>
  )
}
