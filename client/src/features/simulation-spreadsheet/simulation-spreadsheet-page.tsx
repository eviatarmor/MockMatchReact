import { useCallback, useEffect, useMemo, useRef, useState } from "react"
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
import { PresenceAvatarStack, RoomFullGate } from "@mockmatch/collab"
import { SaveStatusBadge } from "@/components/data/save-status-badge"
import { ShareDialog } from "@/features/collab/components/share-dialog"
import { trpc } from "@/lib/trpc"
import { useSpreadsheetWorkbookSession } from "./hooks/use-spreadsheet-workbook-session"
import { useCollabSpreadsheetSession } from "./hooks/use-collab-spreadsheet-session"
import { SpreadsheetRail } from "./right-rail/spreadsheet-rail"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Freeform spreadsheet practice — durable workbook + live collab + share. */
export function SimulationSpreadsheetPageContent() {
  const navigate = useNavigate()
  const { questionId: pathQuestionId } = useParams<{ questionId?: string }>()
  const [params] = useSearchParams()
  const { t } = useTranslation(["simulation-spreadsheet", "common"])
  const legacyId = (() => {
    const id = params.get("id")
    return id && UUID_RE.test(id) ? id : null
  })()
  const questionId = (() => {
    if (pathQuestionId && UUID_RE.test(pathQuestionId)) return pathQuestionId
    const id = params.get("questionId")
    return id && UUID_RE.test(id) ? id : null
  })()
  const shareToken = params.get("share") || params.get("token")

  // Token → workbook id (bank share URLs only carry `?share=`).
  const shareResolve = trpc.collab.resolveShare.useQuery(
    {
      shareToken: shareToken!,
      questionId: questionId ?? undefined,
    },
    {
      enabled: Boolean(shareToken),
      retry: false,
    }
  )
  const resolvedId =
    shareResolve.data?.kind === "spreadsheet"
      ? shareResolve.data.documentId
      : null
  const existingId = legacyId ?? resolvedId

  // Claim share before workbook get (guest must become collaborator first).
  const shareClaim = trpc.collab.getAccess.useQuery(
    {
      kind: "spreadsheet",
      id: existingId!,
      shareToken: shareToken || undefined,
    },
    {
      enabled: Boolean(existingId && shareToken),
      retry: false,
    }
  )
  const shareReady =
    !shareToken ||
    ((shareResolve.isSuccess || shareResolve.isError) &&
      (!existingId || shareClaim.isSuccess || shareClaim.isError))
  // Guest share: only open resolved workbook — never create a new one.
  const canOpenSession =
    shareReady && (!shareToken || Boolean(existingId))

  const session = useSpreadsheetWorkbookSession({
    title: t("simulation-spreadsheet:title"),
    enabled: canOpenSession,
    existingId,
    questionId: shareToken ? null : questionId,
  })

  const sheet = useSpreadsheet({
    initial: createEmptyWorkbook({ sheetName: "Sheet1" }),
  })
  const [seeded, setSeeded] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const workbookId = session.workbookId
  const accessDocId = workbookId ?? existingId
  const collabAccess = trpc.collab.getAccess.useQuery(
    {
      kind: "spreadsheet",
      id: accessDocId!,
      shareToken: shareToken || undefined,
    },
    { enabled: Boolean(accessDocId), retry: false }
  )

  const applyRemoteRef = useRef(sheet.applyRemoteDocument)
  applyRemoteRef.current = sheet.applyRemoteDocument
  const onRemoteDocument = useCallback((doc: SpreadsheetDocument) => {
    applyRemoteRef.current(doc)
  }, [])

  const collabSession = useCollabSpreadsheetSession({
    workbookId,
    shareToken,
    onRemoteDocument,
    localDocument: seeded ? sheet.document : null,
    canEdit: collabAccess.data?.role !== "view",
  })

  const readOnly =
    collabSession.live && !collabSession.permissions.canEditContent

  useEffect(() => {
    if (!session.ready || !session.seedDoc || seeded) return
    sheet.replaceDocument(session.seedDoc)
    setSeeded(true)
  }, [session.ready, session.seedDoc, seeded, sheet])

  const scheduleSave = session.scheduleSave
  useEffect(() => {
    // Solo autosave when not in a live collab room (collab persists via WS)
    if (!seeded || !workbookId || collabSession.live) return
    scheduleSave(sheet.document as SpreadsheetDocument)
  }, [
    sheet.document,
    seeded,
    workbookId,
    scheduleSave,
    collabSession.live,
  ])

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

  const prompt =
    session.prompt?.trim() ||
    t("simulation-spreadsheet:emptyPrompt")

  if (!session.ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-sm text-muted-foreground">
        <RobotLoader size="md" label={t("simulation-spreadsheet:loading")} />
        <p>{t("simulation-spreadsheet:loading")}</p>
      </div>
    )
  }

  if (collabSession.status === "room_full") {
    return (
      <RoomFullGate
        backHref="/simulations"
        message={collabSession.roomError}
      />
    )
  }
  if (collabSession.status === "room_closed") {
    return (
      <RoomFullGate
        backHref="/simulations"
        message={collabSession.roomError}
        variant="closed"
      />
    )
  }

  const saveStatus = collabSession.live
    ? collabSession.collab.docSaveStatus === "saving"
      ? "saving"
      : "saved"
    : session.saveStatus

  const showPresence =
    collabSession.connected ||
    Boolean(collabSession.self) ||
    collabSession.peers.length > 0

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
      end={
        <div className="flex items-center gap-2">
          {showPresence ? (
            <PresenceAvatarStack
              peers={collabSession.peers}
              self={collabSession.self}
            />
          ) : null}

          <SaveStatusBadge
            status={saveStatus}
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
      <SpreadsheetRail prompt={prompt}>
        <SpreadsheetShell
          className="h-full min-h-0"
          document={sheet.document}
          selection={sheet.selection}
          labels={labels}
          getDisplay={sheet.getDisplay}
          formulaDraft={sheet.formulaDraft}
          onFormulaDraftChange={sheet.setFormulaDraft}
          onSelectionChange={sheet.select}
          onDispatch={sheet.dispatch}
          readOnly={readOnly}
          chrome={chrome}
        />
      </SpreadsheetRail>
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
