import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft, Share2 } from "lucide-react"
import { IdeChromeBar } from "@mockmatch/ide"
import {
  PageEditor,
  PageShell,
  type PageEditorLabels,
  type PageShellLabels,
} from "@mockmatch/page"
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
import { usePageDocumentSession } from "./hooks/use-page-document-session"

const SEED_HTML = `<h1>Document analysis</h1><p>Write a structured analysis below. Type <strong>/</strong> for headings, lists, quotes, and more.</p><p></p>`

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** Freeform Notion/Docs-like writeup practice with durable page + share. */
export function SimulationPagePageContent() {
  const navigate = useNavigate()
  const { questionId: pathQuestionId } = useParams<{ questionId?: string }>()
  const [params] = useSearchParams()
  const { t } = useTranslation(["simulation-page", "common"])
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

  const shareResolve = trpc.collab.resolveShare.useQuery(
    {
      shareToken: shareToken!,
      questionId: questionId ?? undefined,
      kind: "page",
    },
    {
      enabled: Boolean(shareToken),
      retry: false,
    }
  )
  const resolvedId =
    shareResolve.data?.kind === "page" ? shareResolve.data.documentId : null
  const existingId = legacyId ?? resolvedId

  const shareClaim = trpc.collab.getAccess.useQuery(
    {
      kind: "page",
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
  const canOpenSession =
    shareReady && (!shareToken || Boolean(existingId))

  const session = usePageDocumentSession({
    title: t("simulation-page:title"),
    enabled: canOpenSession,
    seedHtml: SEED_HTML,
    existingId,
    questionId: shareToken ? null : questionId,
  })

  const [html, setHtml] = useState(SEED_HTML)
  const [seeded, setSeeded] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)

  const pageId = session.pageId
  const accessDocId = pageId ?? existingId
  const collabAccess = trpc.collab.getAccess.useQuery(
    {
      kind: "page",
      id: accessDocId!,
      shareToken: shareToken || undefined,
    },
    { enabled: Boolean(accessDocId), retry: false }
  )

  useEffect(() => {
    if (!session.ready || !session.seedDoc || seeded) return
    setHtml(session.seedDoc.html || SEED_HTML)
    setSeeded(true)
  }, [session.ready, session.seedDoc, seeded])

  const onChange = useCallback(
    (next: string) => {
      setHtml(next)
      if (seeded) session.scheduleSave(next)
    },
    [seeded, session]
  )

  const editorLabels: PageEditorLabels = useMemo(
    () => ({
      bold: t("simulation-page:toolbar.bold"),
      italic: t("simulation-page:toolbar.italic"),
      underline: t("simulation-page:toolbar.underline"),
      strikethrough: t("simulation-page:toolbar.strikethrough"),
      heading1: t("simulation-page:toolbar.heading1"),
      heading2: t("simulation-page:toolbar.heading2"),
      heading3: t("simulation-page:toolbar.heading3"),
      bulletList: t("simulation-page:toolbar.bulletList"),
      numberedList: t("simulation-page:toolbar.numberedList"),
      checkList: t("simulation-page:toolbar.checkList"),
      quote: t("simulation-page:toolbar.quote"),
      code: t("simulation-page:toolbar.code"),
      divider: t("simulation-page:toolbar.divider"),
      link: t("simulation-page:toolbar.link"),
      linkPrompt: t("simulation-page:toolbar.linkPrompt"),
      paragraph: t("simulation-page:toolbar.paragraph"),
      slashMenuAria: t("simulation-page:slashMenuAria"),
      placeholder: t("simulation-page:placeholder"),
    }),
    [t]
  )

  const shellLabels: PageShellLabels = useMemo(
    () => ({
      canvasAria: t("simulation-page:canvasAria"),
    }),
    [t]
  )

  const goSims = useCallback(() => navigate("/simulations"), [navigate])

  if (!session.ready) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-sm text-muted-foreground">
        <RobotLoader size="md" label={t("simulation-page:loading")} />
        <p>{t("simulation-page:loading")}</p>
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
                  aria-label={t("simulation-page:header.back")}
                  onClick={goSims}
                />
              }
            >
              <ArrowLeft className="size-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {t("simulation-page:header.back")}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      }
      title={t("simulation-page:title")}
      badge={
        <Badge variant="secondary" className="shrink-0 text-xs font-normal">
          {t("common:simulations.format.page", {
            defaultValue: "Document",
          })}
        </Badge>
      }
      center={
        <p className="truncate text-xs text-muted-foreground">
          {session.prompt ?? t("simulation-page:subtitle")}
        </p>
      }
      end={
        <div className="flex items-center gap-2">
          <SaveStatusBadge
            status={session.saveStatus}
            labels={{
              saved: t("simulation-page:save.saved"),
              saving: t("simulation-page:save.saving"),
              error: t("simulation-page:save.error"),
            }}
          />

          {pageId ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="size-8 cursor-pointer"
              aria-label={t("simulation-page:actions.share")}
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
    <>
      <PageShell chrome={chrome} labels={shellLabels} className="h-full">
        <PageEditor
          value={html}
          onChange={onChange}
          labels={editorLabels}
          placeholder={t("simulation-page:placeholder")}
        />
      </PageShell>
      {pageId ? (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          kind="page"
          documentId={pageId}
          canShare={collabAccess.data?.canShare ?? false}
          isOwner={collabAccess.data?.role === "owner"}
          isPaidOwner={collabAccess.data?.isPaidOwner ?? false}
          documentTitle={t("simulation-page:title")}
        />
      ) : null}
    </>
  )
}
