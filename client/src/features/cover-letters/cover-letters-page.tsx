import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Mail, Plus, Upload } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@mockmatch/ui/button"
import { Spinner } from "@mockmatch/ui/spinner"
import { Separator } from "@mockmatch/ui/separator"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { TableToolbar } from "@/components/dashboard/table-toolbar"
import { TemplateBrowserSection } from "@/components/templates/template-browser-section"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { EntityListStates } from "@/components/data/entity-list-states"
import { EntityTablePagination } from "@/components/data/entity-table-pagination"
import { TableChromeControls } from "@/components/data/table-chrome-controls"
import {
  ViewModeTabs,
  type ListViewMode,
} from "@/components/data/view-mode-tabs"
import { useImportDocumentPdf } from "@/hooks/use-import-document-pdf"
import { useStartFromTemplate } from "@/hooks/use-start-from-template"
import { useTableColumnVisibility } from "@/hooks/use-table-column-visibility"
import { useTableFilters } from "@/hooks/use-table-filters"
import { downloadDocumentPdf, pdfFilename } from "@/lib/export-document-pdf"
import { listEmptyCopy } from "@/lib/list-empty-copy"
import { buildLabeledStatusFilterField } from "@/lib/status-table-filter"
import { useStatusTableQuery } from "@/hooks/use-status-table-query"
import { trpc } from "@/lib/trpc"
import { CoverLetterCardGrid } from "./components/cover-letter-card-grid"
import { CoverLetterTable } from "./components/cover-letter-table"
import { useCoverLettersList } from "./hooks/use-cover-letters-list"
import { TEMPLATE_BROWSER_ITEMS } from "./constants"
import type { CoverLetterItem } from "./types"

const DOCUMENT_STATUSES = ["active", "draft", "archived"] as const

export function CoverLettersPageContent() {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const list = useCoverLettersList()
  const tableFilters = useTableFilters()
  const [exportingId, setExportingId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<ListViewMode>("table")

  const displayColumns = useMemo(
    () => [
      {
        id: "coverLetter",
        label: t("coverLetters.table.columns.coverLetter"),
        locked: true,
      },
      { id: "score", label: t("coverLetters.table.columns.score") },
      { id: "status", label: t("coverLetters.table.columns.status") },
      { id: "updated", label: t("coverLetters.table.columns.updated") },
      { id: "actions", label: t("tableChrome.actions"), locked: true },
    ],
    [t]
  )
  const columnVisibility = useTableColumnVisibility(displayColumns)

  const filterFields = useMemo(
    () => [
      buildLabeledStatusFilterField(
        t("coverLetters.table.columns.status"),
        DOCUMENT_STATUSES,
        (value) => t(`coverLetters.table.statusLabels.${value}`)
      ),
    ],
    [t]
  )

  const { filteredItems, hasActiveQuery } = useStatusTableQuery(
    list.items,
    tableFilters.filters,
    list.hasActiveSearch
  )

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

  const duplicateLetter = trpc.coverLetters.duplicate.useMutation({
    onSuccess: () => {
      toast.success(t("coverLetters.table.toast.duplicated"))
      utils.coverLetters.list.invalidate().catch(() => {})
    },
    onError: () => toast.error(t("coverLetters.table.toast.duplicateFailed")),
  })

  const pdfImport = useImportDocumentPdf("cover-letter")
  const templateStart = useStartFromTemplate("cover-letter")

  const handleDelete = (letter: CoverLetterItem) => {
    deleteLetter.mutate({ id: letter.id })
  }

  const handleExport = async (letter: CoverLetterItem) => {
    if (exportingId) return
    setExportingId(letter.id)
    try {
      await downloadDocumentPdf({
        kind: "cover-letter",
        id: letter.id,
        filename: pdfFilename(letter.title, "cover-letter"),
      })
      toast.success(t("coverLetters.table.toast.exportSuccess"))
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : t("coverLetters.table.toast.exportFailed")
      )
    } finally {
      setExportingId(null)
    }
  }

  const handleDuplicate = (letter: CoverLetterItem) => {
    duplicateLetter.mutate({ id: letter.id })
  }

  const showEmpty = !list.isLoading && filteredItems.length === 0
  const emptyCopy = listEmptyCopy(hasActiveQuery, t, {
    emptyTitle: "coverLetters.table.emptyTitle",
    emptyDescription: "coverLetters.table.emptyDescription",
    emptySearchTitle: "coverLetters.table.emptySearchTitle",
    emptySearchDescription: "coverLetters.table.emptySearchDescription",
  })

  const emptyState = (
    <EntityEmptyState
      icon={Mail}
      title={emptyCopy.title}
      description={emptyCopy.description}
      action={
        hasActiveQuery
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
          filters={
            <TableChromeControls
              filterFields={filterFields}
              isValueSelected={tableFilters.isValueSelected}
              onToggleValue={tableFilters.toggleValue}
              onClearAll={tableFilters.clearAll}
              activeCount={tableFilters.activeCount}
              displayColumns={displayColumns}
              isColumnVisible={columnVisibility.isVisible}
              onToggleColumn={columnVisibility.toggle}
              showDisplay={viewMode === "table"}
              trailing={
                <ViewModeTabs value={viewMode} onValueChange={setViewMode} />
              }
            />
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
                  <Spinner className="size-3.5" />
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
          isEmpty={showEmpty}
          errorMessage={t("coverLetters.table.loadError")}
          loadingMessage={t("coverLetters.table.loading")}
          emptyState={emptyState}
        >
          {viewMode === "table" ? (
            <CoverLetterTable
              coverLetters={filteredItems}
              onDelete={handleDelete}
              onExport={(letter) => void handleExport(letter)}
              onDuplicate={handleDuplicate}
              deletingId={deleteLetter.isPending ? deleteLetter.variables?.id : null}
              exportingId={exportingId}
              duplicatingId={
                duplicateLetter.isPending ? duplicateLetter.variables?.id : null
              }
              isColumnVisible={columnVisibility.isVisible}
            />
          ) : (
            <CoverLetterCardGrid
              coverLetters={filteredItems}
              onDelete={handleDelete}
              onExport={(letter) => void handleExport(letter)}
              onDuplicate={handleDuplicate}
              deletingId={deleteLetter.isPending ? deleteLetter.variables?.id : null}
              exportingId={exportingId}
              duplicatingId={
                duplicateLetter.isPending ? duplicateLetter.variables?.id : null
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
          translationPrefix="coverLetters.templates"
          browseAllTo="/cover-letters/templates"
          pendingId={templateStart.pendingId}
          onUse={(template) => templateStart.startFromTemplate(template.id)}
        />
      </div>
    </DashboardPageShell>
  )
}
