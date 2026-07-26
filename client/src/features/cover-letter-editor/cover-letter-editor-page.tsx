import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { AlertCircle, Loader2 } from "lucide-react"
import { useNavbarSlots } from "@/hooks/use-navbar-slots"
import { useIsMobile } from "@/hooks/use-mobile"
import { useCanvasViewport } from "@/hooks/use-canvas-viewport"
import {
  EditorSecondaryBar,
  resolveStyleClasses,
} from "@/components/document-editor"
import { SaveStatusBadge } from "@/components/data/save-status-badge"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc"
import { parseDocumentStyle } from "@/lib/parse-document-style"
import { PresenceAvatarStack } from "@/features/collab/components/presence-avatar-stack"
import { RoomFullGate } from "@/features/collab/components/room-full-gate"
import { BreadcrumbName } from "./top-bar/breadcrumb-name"
import { EditorBottomBar, EditorToolbarActions } from "./top-bar/editor-toolbar"
import { EditorCanvas } from "./canvas/editor-canvas"
import { LetterDocument } from "./canvas/letter-document"
import { EditorRail } from "./right-rail/editor-rail"
import { MobileEditor } from "./mobile/mobile-editor"
import {
  parseCoverLetterDocument,
  parseEditorTemplateId,
  useCoverLetterEditorSession,
} from "./hooks/use-cover-letter-editor-session"
import { EDITOR_TEMPLATES } from "./constants"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function CoverLetterEditorLoaded({
  seed,
}: {
  readonly seed: {
    id: string
    title: string
    templateId: ReturnType<typeof parseEditorTemplateId>
    style: ReturnType<typeof parseDocumentStyle>
    document: ReturnType<typeof parseCoverLetterDocument>
    shareToken?: string | null
  }
}) {
  const { t } = useTranslation("cover-letter-editor")
  const isMobile = useIsMobile()
  const viewport = useCanvasViewport()
  const session = useCoverLetterEditorSession(seed)
  const resolvedStyle = useMemo(
    () => resolveStyleClasses(session.style),
    [session.style]
  )

  const saveLabels = useMemo(
    () => ({
      saved: t("toolbar.saved"),
      saving: t("toolbar.saving"),
      error: t("toolbar.saveError"),
    }),
    [t]
  )

  const crumb = useMemo(
    () => (
      <BreadcrumbName
        value={session.letterName}
        onChange={session.setLetterName}
      />
    ),
    [session.letterName, session.setLetterName]
  )
  const center = useMemo(
    () =>
      isMobile ? (
        <BreadcrumbName
          value={session.letterName}
          onChange={session.setLetterName}
        />
      ) : null,
    [isMobile, session.letterName, session.setLetterName]
  )
  useNavbarSlots({ crumb, center, end: null })

  const previewNode = useMemo(
    () => (
      <div className="flex justify-center bg-neutral-100 py-6 dark:bg-neutral-950">
        <LetterDocument
          document={session.document}
          template={session.template}
          style={resolvedStyle}
        />
      </div>
    ),
    [session.document, session.template, resolvedStyle]
  )

  if (session.collab.status === "room_full") {
    return (
      <RoomFullGate
        backHref="/cover-letters"
        message={session.collab.roomError}
      />
    )
  }

  if (isMobile) {
    return (
      <MobileEditor
        document={session.document}
        style={resolvedStyle}
        documentStyle={session.style}
        onStyleChange={session.updateStyle}
        templateId={session.templateId}
        onTemplateChange={session.selectTemplate}
        handlers={session.handlers}
      />
    )
  }

  return (
    // Secondary bar overlays the canvas so glass transparency reveals the dots.
    <div className="relative h-full min-h-0">
      <EditorSecondaryBar
        className="absolute inset-x-0 top-0 z-20"
        left={
          <>
            <PresenceAvatarStack
              self={session.collab.self}
              peers={session.collab.peers}
            />
            <BreadcrumbName
              value={session.letterName}
              onChange={session.setLetterName}
            />
            <SaveStatusBadge status={session.saveStatus} labels={saveLabels} />
          </>
        }
        right={
          <EditorToolbarActions
            letterId={seed.id}
            title={session.letterName}
            permissions={session.permissions}
            preview={previewNode}
          />
        }
      />
      <div className="relative h-full min-h-0">
        <EditorCanvas
          document={session.document}
          template={session.template}
          style={resolvedStyle}
          viewport={viewport}
          handlers={session.handlers}
          peers={session.collab.peers}
          sendCursor={session.collab.sendCursor}
          clearCursor={session.collab.clearCursor}
        />
        <EditorBottomBar viewport={viewport} history={session.history} />
        <EditorRail
          activeTemplateId={session.templateId}
          onTemplateChange={session.selectTemplate}
          style={session.style}
          onStyleChange={session.updateStyle}
          document={session.document}
          handlers={session.handlers}
          permissions={session.permissions}
        />
      </div>
    </div>
  )
}

export function CoverLetterEditorPageContent() {
  const { t } = useTranslation("cover-letter-editor")
  const navigate = useNavigate()
  const { letterId } = useParams<{ letterId: string }>()
  const [searchParams] = useSearchParams()
  const shareToken = searchParams.get("share")
  const isValidId = typeof letterId === "string" && UUID_RE.test(letterId)

  const access = trpc.collab.getAccess.useQuery(
    {
      kind: "cover_letter",
      id: letterId!,
      shareToken: shareToken || undefined,
    },
    { enabled: isValidId && Boolean(shareToken), retry: false }
  )

  const query = trpc.coverLetters.get.useQuery(
    { id: letterId! },
    {
      enabled: isValidId && (!shareToken || access.isSuccess || access.isError),
      retry: false,
    }
  )

  if (!isValidId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertCircle className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("notFound")}</p>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => navigate("/cover-letters")}
        >
          {t("backToList")}
        </Button>
      </div>
    )
  }

  if (query.isLoading || (shareToken && access.isLoading)) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        {t("loading")}
      </div>
    )
  }

  if (query.isError || !query.data) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertCircle className="size-8 text-destructive" />
        <p className="text-sm text-muted-foreground">{t("loadError")}</p>
        <Button
          variant="outline"
          className="cursor-pointer"
          onClick={() => navigate("/cover-letters")}
        >
          {t("backToList")}
        </Button>
      </div>
    )
  }

  const data = query.data
  const seed = {
    id: data.id,
    title: data.title,
    templateId: parseEditorTemplateId(data.templateId),
    style: parseDocumentStyle(data.style, EDITOR_TEMPLATES[0].defaultStyle),
    document: parseCoverLetterDocument(data.document),
    shareToken,
  }

  return <CoverLetterEditorLoaded key={seed.id} seed={seed} />
}
