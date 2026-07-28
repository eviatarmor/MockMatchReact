import { useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { FileText, Loader2, Plus, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@mockmatch/ui/button"
import { Separator } from "@mockmatch/ui/separator"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { TemplateBrowserSection } from "@/components/templates/template-browser-section"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { EntityListStates } from "@/components/data/entity-list-states"
import { EntityTablePagination } from "@/components/data/entity-table-pagination"
import {
  ViewModeTabs,
  type ListViewMode,
} from "@/components/data/view-mode-tabs"
import { useImportDocumentPdf } from "@/hooks/use-import-document-pdf"
import { useStartFromTemplate } from "@/hooks/use-start-from-template"
import { downloadDocumentPdf, pdfFilename } from "@/lib/export-document-pdf"
import { trpc } from "@/lib/trpc"
import { ResumeCardGrid } from "./components/resume-card-grid"
import { ResumeTable } from "./components/resume-table"
import { useResumesList } from "./hooks/use-resumes-list"
import { TEMPLATE_BROWSER_ITEMS } from "./constants"
import type { ResumeItem } from "./types"

export function ResumeLabPageContent() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const list = useResumesList()
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ListViewMode>("table")

  const createResume = trpc.resumes.create.useMutation({
    onSuccess: (resume) => {
      utils.resumes.list.invalidate().catch(() => {})
      navigate(`/resumes/${resume.id}`)
    },
    onError: () => toast.error(t("resumeLab.table.toast.createFailed")),
  })

  const deleteResume = trpc.resumes.delete.useMutation({
    onSuccess: () => {
      toast.success(t("resumeLab.table.toast.deleted"))
      utils.resumes.list.invalidate().catch(() => {})
    },
    onError: () => toast.error(t("resumeLab.table.toast.deleteFailed")),
  })

  const duplicateResume = trpc.resumes.duplicate.useMutation({
    onSuccess: () => {
      toast.success(t("resumeLab.table.toast.duplicated"))
      utils.resumes.list.invalidate().catch(() => {})
    },
    onError: () => toast.error(t("resumeLab.table.toast.duplicateFailed")),
  })

  const pdfImport = useImportDocumentPdf("resume")
  const templateStart = useStartFromTemplate("resume")

  const handleDelete = (resume: ResumeItem) => {
    deleteResume.mutate({ id: resume.id })
  }

  const handleExport = async (resume: ResumeItem) => {
    if (exportingId) return
    setExportingId(resume.id)
    try {
      await downloadDocumentPdf({
        kind: "resume",
        id: resume.id,
        filename: pdfFilename(resume.title, "resume"),
      })
      toast.success(t("resumeLab.table.toast.exportSuccess"))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("resumeLab.table.toast.exportFailed")
      )
    } finally {
      setExportingId(null)
    }
  }

  const handleDuplicate = (resume: ResumeItem) => {
    duplicateResume.mutate({ id: resume.id })
  }

  const emptyState = (
    <EntityEmptyState
      icon={FileText}
      title={
        list.hasActiveSearch
          ? t("resumeLab.table.emptySearchTitle")
          : t("resumeLab.table.emptyTitle")
      }
      description={
        list.hasActiveSearch
          ? t("resumeLab.table.emptySearchDescription")
          : t("resumeLab.table.emptyDescription")
      }
      action={
        list.hasActiveSearch
          ? undefined
          : {
              label: t("dashboard.actions.newResume"),
              icon: Plus,
              pending: createResume.isPending,
              onClick: () => createResume.mutate({}),
            }
      }
    />
  )

  return (
    <DashboardPageShell title={t("resumeLab.title")}>
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("resumeLab.title")}
          description={t("resumeLab.description")}
        />
        <TableToolbar
          searchPlaceholder={t("dashboard.search.resumes")}
          search={list.search}
          onSearchChange={list.setSearch}
          filters={
            <ViewModeTabs value={viewMode} onValueChange={setViewMode} />
          }
          actions={
            <>
              <input {...pdfImport.fileInput} />
              <Button
                variant="outline"
                className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
                disabled={pdfImport.isPending}
                onClick={pdfImport.openPicker}
                aria-busy={pdfImport.isPending}
              >
                {pdfImport.isPending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Upload className="size-4" />
                )}
                <span className="hidden sm:inline">
                  {pdfImport.isPending
                    ? t("dashboard.import.importing")
                    : t("dashboard.actions.importResume")}
                </span>
              </Button>
              <Button
                variant="default"
                className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
                disabled={createResume.isPending || pdfImport.isPending}
                onClick={() => createResume.mutate({})}
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">{t("dashboard.actions.newResume")}</span>
              </Button>
            </>
          }
        />

        <EntityListStates
          isError={list.isError}
          isLoading={list.isLoading}
          isEmpty={list.isEmpty}
          errorMessage={t("resumeLab.table.loadError")}
          loadingMessage={t("resumeLab.table.loading")}
          emptyState={emptyState}
        >
          {viewMode === "table" ? (
            <ResumeTable
              resumes={list.items}
              onDelete={handleDelete}
              onExport={(resume) => void handleExport(resume)}
              onDuplicate={handleDuplicate}
              deletingId={deleteResume.isPending ? deleteResume.variables?.id : null}
              exportingId={exportingId}
              duplicatingId={
                duplicateResume.isPending ? duplicateResume.variables?.id : null
              }
            />
          ) : (
            <ResumeCardGrid
              resumes={list.items}
              onDelete={handleDelete}
              onExport={(resume) => void handleExport(resume)}
              onDuplicate={handleDuplicate}
              deletingId={deleteResume.isPending ? deleteResume.variables?.id : null}
              exportingId={exportingId}
              duplicatingId={
                duplicateResume.isPending ? duplicateResume.variables?.id : null
              }
            />
          )}
          <EntityTablePagination
            page={list.page}
            totalPages={list.totalPages}
            total={list.total}
            onPageChange={list.setPage}
            disabled={list.isFetching}
          />
        </EntityListStates>

        <Separator className="my-2" />
        <TemplateBrowserSection
          items={TEMPLATE_BROWSER_ITEMS}
          translationPrefix="resumeLab.templates"
          browseAllTo="/resume-lab/templates"
          pendingId={templateStart.pendingId}
          onUse={(template) => templateStart.startFromTemplate(template.id)}
        />
      </div>
    </DashboardPageShell>
  )
}
