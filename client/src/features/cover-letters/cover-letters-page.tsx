import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Loader2, Mail, Plus, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { TemplateBrowserSection } from "@/components/templates/template-browser-section"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { EntityListStates } from "@/components/data/entity-list-states"
import { EntityTablePagination } from "@/components/data/entity-table-pagination"
import { useImportDocumentPdf } from "@/hooks/use-import-document-pdf"
import { useStartFromTemplate } from "@/hooks/use-start-from-template"
import { trpc } from "@/lib/trpc"
import { CoverLetterTable } from "./components/cover-letter-table"
import { useCoverLettersList } from "./hooks/use-cover-letters-list"
import { TEMPLATE_BROWSER_ITEMS } from "./constants"
import type { CoverLetterItem } from "./types"

export function CoverLettersPageContent() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const list = useCoverLettersList()

  const createLetter = trpc.coverLetters.create.useMutation({
    onSuccess: (letter) => {
      utils.coverLetters.list.invalidate().catch(() => {})
      navigate(`/cover-letters/${letter.id}`)
    },
    onError: () => toast.error(t("coverLetters.table.toast.createFailed")),
  })

  const deleteLetter = trpc.coverLetters.delete.useMutation({
    onSuccess: () => {
      toast.success(t("coverLetters.table.toast.deleted"))
      utils.coverLetters.list.invalidate().catch(() => {})
    },
    onError: () => toast.error(t("coverLetters.table.toast.deleteFailed")),
  })

  const pdfImport = useImportDocumentPdf("cover-letter")
  const templateStart = useStartFromTemplate("cover-letter")

  const handleDelete = (letter: CoverLetterItem) => {
    deleteLetter.mutate({ id: letter.id })
  }

  const emptyState = (
    <EntityEmptyState
      icon={Mail}
      title={
        list.hasActiveSearch
          ? t("coverLetters.table.emptySearchTitle")
          : t("coverLetters.table.emptyTitle")
      }
      description={
        list.hasActiveSearch
          ? t("coverLetters.table.emptySearchDescription")
          : t("coverLetters.table.emptyDescription")
      }
      action={
        list.hasActiveSearch
          ? undefined
          : {
              label: t("dashboard.actions.newCoverLetter"),
              icon: Plus,
              pending: createLetter.isPending,
              onClick: () => createLetter.mutate({}),
            }
      }
    />
  )

  return (
    <DashboardPageShell title={t("coverLetters.title")}>
      <div className="flex flex-col gap-3">
        <DashboardPageHeader
          title={t("coverLetters.title")}
          description={t("coverLetters.description")}
        />
        <TableToolbar
          searchPlaceholder={t("dashboard.search.coverLetters")}
          search={list.search}
          onSearchChange={list.setSearch}
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
                    : t("dashboard.actions.importCoverLetter")}
                </span>
              </Button>
              <Button
                variant="default"
                className="h-8 w-8 sm:w-auto px-0 sm:px-3 gap-1.5 cursor-pointer"
                disabled={createLetter.isPending || pdfImport.isPending}
                onClick={() => createLetter.mutate({})}
              >
                <Plus className="size-4" />
                <span className="hidden sm:inline">{t("dashboard.actions.newCoverLetter")}</span>
              </Button>
            </>
          }
        />

        <EntityListStates
          isError={list.isError}
          isLoading={list.isLoading}
          isEmpty={list.isEmpty}
          errorMessage={t("coverLetters.table.loadError")}
          loadingMessage={t("coverLetters.table.loading")}
          emptyState={emptyState}
        >
          <CoverLetterTable
            coverLetters={list.items}
            onDelete={handleDelete}
            deletingId={deleteLetter.isPending ? deleteLetter.variables?.id : null}
          />
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
          translationPrefix="coverLetters.templates"
          browseAllTo="/cover-letters/templates"
          pendingId={templateStart.pendingId}
          onUse={(template) => templateStart.startFromTemplate(template.id)}
        />
      </div>
    </DashboardPageShell>
  )
}
