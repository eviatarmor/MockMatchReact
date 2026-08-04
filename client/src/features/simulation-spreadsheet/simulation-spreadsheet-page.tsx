import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Share2 } from "lucide-react"
import { IdeChromeBar } from "@mockmatch/ide"
import {
  SpreadsheetShell,
  createEmptyWorkbook,
  useSpreadsheet,
  type SpreadsheetDocument,
  type SpreadsheetShellLabels,
} from "@mockmatch/spreadsheet"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"
import { RobotLoader } from "@mockmatch/ui/robot-loader"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { SaveStatusBadge } from "@/components/data/save-status-badge"
import { ShareDialog } from "@/features/collab/components/share-dialog"
import { trpc } from "@/lib/trpc"
import { useSpreadsheetWorkbookSession } from "./hooks/use-spreadsheet-workbook-session"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Freeform spreadsheet practice — durable workbook + optional share. */
export function SimulationSpreadsheetPageContent() {
  const navigate = useNavigate()
  const { questionId: pathQuestionId } = useParams<{ questionId?: string }>()
  const [params] = useSearchParams()
  const { t } = useTranslation(["simulation-spreadsheet", "common"])
  const existingId = (() => {
    const id = params.get("id")
    return id && UUID_RE.test(id) ? id : null
  })()
  const questionId = (() => {
    if (pathQuestionId && UUID_RE.test(pathQuestionId)) return pathQuestionId
    const id = params.get("questionId")
    return id && UUID_RE.test(id) ? id : null
  })()

  const session = useSpreadsheetWorkbookSession({
    title: t("simulation-spreadsheet:title"),
    enabled: true,
    existingId,
    questionId,
  })

  const sheet = useSpreadsheet({
    initial: createEmptyWorkbook({ sheetName: "Sheet1" }),
  })
  const [seeded, setSeeded] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const workbookId = session.workbookId
  const collabAccess = trpc.collab.getAccess.useQuery(
    { kind: "spreadsheet", id: workbookId! },
    { enabled: Boolean(workbookId), retry: false }
  )

  useEffect(() => {
    if (!session.ready || !session.seedDoc || seeded) return
    sheet.replaceDocument(session.seedDoc)
    setSeeded(true)
  }, [session.ready, session.seedDoc, seeded, sheet])

  const scheduleSave = session.scheduleSave
  useEffect(() => {
    if (!seeded || !workbookId) return
    scheduleSave(sheet.document as SpreadsheetDocument)
  }, [sheet.document, seeded, workbookId, scheduleSave])

  const labels: SpreadsheetShellLabels = useMemo(
    () => ({
      formulaBarAria: t("simulation-spreadsheet:formulaBarAria"),
      nameBoxAria: t("simulation-spreadsheet:nameBoxAria"),
      gridAria: t("simulation-spreadsheet:gridAria"),
      sheetTabsAria: t("simulation-spreadsheet:sheetTabsAria"),
      addSheet: t("simulation-spreadsheet:actions.addSheet"),
      renameSheet: t("simulation-spreadsheet:actions.renameSheet"),
      deleteSheet: t("simulation-spreadsheet:actions.deleteSheet"),
      sheetFallback: (n) => t("simulation-spreadsheet:sheetFallback", { n }),
      cannotDeleteLastSheet: t(
        "simulation-spreadsheet:cannotDeleteLastSheet"
      ),
    }),
    [t]
  )

  const goSims = useCallback(() => navigate("/simulations"), [navigate])

  if (!session.ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-sm text-muted-foreground">
        <RobotLoader size="md" label={t("simulation-spreadsheet:loading")} />
        <p>{t("simulation-spreadsheet:loading")}</p>
      </div>
    )
  }

  const chrome = (
    <IdeChromeBar
      leading={
        <TooltipProvider delay={300}>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="size-8 shrink-0 cursor-pointer"
                  aria-label={t("simulation-spreadsheet:header.back")}
                  onClick={goSims}
                />
              }
            >
              <ArrowLeft className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t("simulation-spreadsheet:header.back")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      }
      title={t("simulation-spreadsheet:title")}
      badge={
        <Badge variant="secondary" className="shrink-0 text-xs font-normal">
          {t("common:simulations.format.spreadsheet", {
            defaultValue: "Spreadsheet",
          })}
        </Badge>
      }
      center={
        <p className="truncate text-xs text-muted-foreground">
          {session.prompt ?? t("simulation-spreadsheet:subtitle")}
        </p>
      }
      end={
        <div className="flex items-center gap-2">
          <SaveStatusBadge
            status={session.saveStatus}
            labels={{
              saved: t("simulation-spreadsheet:save.saved"),
              saving: t("simulation-spreadsheet:save.saving"),
              error: t("simulation-spreadsheet:save.error"),
            }}
          />

          {workbookId ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 cursor-pointer"
              aria-label={t("simulation-spreadsheet:actions.share")}
              onClick={() => setShareOpen(true)}
            >
              <Share2 className="size-4" />
            </Button>
          ) : null}
        </div>
      }
    />
  )

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <SpreadsheetShell
        className="h-full min-h-0"
        document={sheet.document}
        selection={sheet.selection}
        labels={labels}
        getDisplay={sheet.getDisplay}
        onSelect={sheet.select}
        onCommitCell={sheet.commitCell}
        formulaDraft={sheet.formulaDraft}
        onFormulaDraftChange={sheet.setFormulaDraft}
        onFormulaCommit={sheet.commitFormulaBar}
        onSetActiveSheet={sheet.setActiveSheet}
        onAddSheet={sheet.addSheet}
        onRenameSheet={sheet.renameSheet}
        onDeleteSheet={(id) => {
          sheet.deleteSheet(id)
        }}
        onEnsureBounds={sheet.ensureBounds}
        onSetColWidth={sheet.setColWidth}
        onSetRowHeight={sheet.setRowHeight}
        onSelectColumn={sheet.selectColumn}
        onSelectRow={sheet.selectRow}
        onSelectAll={sheet.selectAll}
        chrome={chrome}
      />
      {workbookId ? (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          kind="spreadsheet"
          documentId={workbookId}
          canShare={collabAccess.data?.canShare ?? false}
          isOwner={collabAccess.data?.role === "owner"}
          isPaidOwner={collabAccess.data?.isPaidOwner ?? false}
          documentTitle={t("simulation-spreadsheet:title")}
        />
      ) : null}
    </div>
  )
}
