import { useCallback, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams, useSearchParams } from "react-router-dom"
import { AlertCircle, Loader2 } from "lucide-react"
import { useNavbarSlots } from "@/hooks/use-navbar-slots"
import { useIsMobile } from "@/hooks/use-mobile"
import { useCanvasViewport } from "@/hooks/use-canvas-viewport"
import {
  DocumentAiAssistProvider,
  EditorSecondaryBar,
  resolveStyleClasses,
} from "@/components/document-editor"
import {
  DocumentAssistantProvider,
  useDocumentAssistant,
} from "@/features/document-assistant"
import { DocumentEditorOnboarding } from "@/components/onboarding/document-editor-onboarding"
import { SaveStatusBadge } from "@/components/data/save-status-badge"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc"
import { parseDocumentStyle } from "@/lib/parse-document-style"
import { PresenceAvatarStack } from "@/features/collab/components/presence-avatar-stack"
import { RoomFullGate } from "@/features/collab/components/room-full-gate"
import type { CollabPermissions } from "@/features/collab/types"
import { BreadcrumbName } from "./top-bar/breadcrumb-name"
import { EditorBottomBar, EditorToolbarActions } from "./top-bar/editor-toolbar"
import { EditorCanvas } from "./canvas/editor-canvas"
import { ResumeDocumentView } from "./canvas/resume-document"
import { EditorRail } from "./right-rail/editor-rail"
import { MobileEditor } from "./mobile/mobile-editor"
import {
  parseEditorTemplateId,
  parseResumeDocument,
  useResumeEditorSession,
} from "./hooks/use-resume-editor-session"
import { EDITOR_TEMPLATES } from "./constants"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function ResumeEditorLoaded({
  seed,
}: {
  readonly seed: {
    id: string
    title: string
    templateId: ReturnType<typeof parseEditorTemplateId>
    style: ReturnType<typeof parseDocumentStyle>
    document: ReturnType<typeof parseResumeDocument>
    shareToken?: string | null
  }
}) {
  const { t } = useTranslation("resume-editor")
  const isMobile = useIsMobile()
  const viewport = useCanvasViewport()
  const session = useResumeEditorSession(seed)
  const resolvedStyle = useMemo(
    () => resolveStyleClasses(session.style),
    [session.style]
  )

  const replaceDocument = session.replaceDocument
  const onDocumentReplace = useCallback(
    (next: unknown) => {
      replaceDocument(next as Parameters<typeof replaceDocument>[0])
    },
    [replaceDocument]
  )

  return (
    <DocumentAssistantProvider
      kind="resume"
      document={session.document}
      i18nNs="resume-editor"
      onDocumentReplace={onDocumentReplace}
    >
      <ResumeEditorSessionBody
        seed={seed}
        session={session}
        resolvedStyle={resolvedStyle}
        isMobile={isMobile}
        viewport={viewport}
        t={t}
      />
    </DocumentAssistantProvider>
  )
}

function ResumeEditorSessionBody({
  seed,
  session,
  resolvedStyle,
  isMobile,
  viewport,
  t,
}: {
  readonly seed: {
    id: string
    title: string
    templateId: ReturnType<typeof parseEditorTemplateId>
    style: ReturnType<typeof parseDocumentStyle>
    document: ReturnType<typeof parseResumeDocument>
    shareToken?: string | null
  }
  readonly session: ReturnType<typeof useResumeEditorSession>
  readonly resolvedStyle: ReturnType<typeof resolveStyleClasses>
  readonly isMobile: boolean
  readonly viewport: ReturnType<typeof useCanvasViewport>
  readonly t: ReturnType<typeof useTranslation>["t"]
}) {
  const assistant = useDocumentAssistant()
  const canUseAi = session.permissions?.canUseAi !== false

  const onAiBlock = useCallback(
    (id: string) => {
      if (!canUseAi) return
      assistant.openWithMention(id)
    },
    [assistant, canUseAi]
  )

  const onAiAssist = useCallback(
    (text: string) => {
      if (!canUseAi) return
      assistant.openWithAttachment(text, t("ai.attachment.selectedText"))
    },
    [assistant, canUseAi, t]
  )

  const saveLabels = useMemo(
    () => ({
      saved: t("toolbar.saved"),
      saving: t("toolbar.saving"),
      error: t("toolbar.saveError"),
    }),
    [t]
  )

  // Main navbar stays like Resume Lab: breadcrumb name only
  const crumb = useMemo(
    () => (
      <BreadcrumbName
        value={session.resumeName}
        onChange={session.setResumeName}
      />
    ),
    [session.resumeName, session.setResumeName]
  )
  const center = useMemo(
    () =>
      isMobile ? (
        <BreadcrumbName
          value={session.resumeName}
          onChange={session.setResumeName}
        />
      ) : null,
    [isMobile, session.resumeName, session.setResumeName]
  )
  useNavbarSlots({ crumb, center, end: null })

  const previewNode = useMemo(
    () => (
      <div className="flex justify-center bg-neutral-100 py-6 dark:bg-neutral-950">
        <ResumeDocumentView
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
      <RoomFullGate backHref="/resume-lab" message={session.collab.roomError} />
    )
  }

  if (isMobile) {
    return (
      <DocumentAiAssistProvider onAiAssist={canUseAi ? onAiAssist : null}>
        <MobileEditor
          document={session.document}
          style={resolvedStyle}
          documentStyle={session.style}
          onStyleChange={session.updateStyle}
          templateId={session.templateId}
          onTemplateChange={session.selectTemplate}
          handlers={session.handlers}
        />
      </DocumentAiAssistProvider>
    )
  }

  return (
    // Resizable group: canvas | side panel (AI wider) | icon rail
    <DocumentAiAssistProvider onAiAssist={canUseAi ? onAiAssist : null}>
      <div className="flex h-full min-h-0 w-full">
        <div id="editor-tour-rail" className="flex h-full min-h-0 w-full min-w-0">
          <EditorRail
            resumeId={seed.id}
            activeTemplateId={session.templateId}
            onTemplateChange={session.selectTemplate}
            style={session.style}
            onStyleChange={session.updateStyle}
            document={session.document}
            handlers={session.handlers}
            permissions={session.permissions}
            onHistoryRestored={session.applyRestoredVersion}
          >
            <div className="relative h-full min-h-0 min-w-0">
              <EditorSecondaryBar
                className="absolute inset-x-0 top-0 z-20"
                left={
                  <>
                    <div id="editor-tour-collab" className="flex items-center gap-2">
                      <PresenceAvatarStack
                        self={session.collab.self}
                        peers={session.collab.peers}
                      />
                    </div>
                    <BreadcrumbName
                      value={session.resumeName}
                      onChange={session.setResumeName}
                    />
                    <SaveStatusBadge status={session.saveStatus} labels={saveLabels} />
                  </>
                }
                right={
                  <div id="editor-tour-actions">
                    <EditorToolbarActions
                      resumeId={seed.id}
                      title={session.resumeName}
                      permissions={session.permissions}
                      preview={previewNode}
                    />
                  </div>
                }
              />
              <div id="editor-tour-canvas" className="h-full min-h-0">
                <EditorCanvas
                  document={session.document}
                  template={session.template}
                  style={resolvedStyle}
                  viewport={viewport}
                  handlers={session.handlers}
                  onAiBlock={canUseAi ? onAiBlock : undefined}
                  peers={session.collab.peers}
                  sendCursor={session.collab.sendCursor}
                  clearCursor={session.collab.clearCursor}
                />
              </div>
              <EditorBottomBar viewport={viewport} history={session.history} />
            </div>
          </EditorRail>
        </div>
        <DocumentEditorOnboarding />
      </div>
    </DocumentAiAssistProvider>
  )
}

export function ResumeEditorPageContent() {
  const { t } = useTranslation("resume-editor")
  const navigate = useNavigate()
  const { resumeId } = useParams<{ resumeId: string }>()
  const [searchParams] = useSearchParams()
  const shareToken = searchParams.get("share")
  const isValidId = typeof resumeId === "string" && UUID_RE.test(resumeId)

  const access = trpc.collab.getAccess.useQuery(
    { kind: "resume", id: resumeId!, shareToken: shareToken || undefined },
    { enabled: isValidId && Boolean(shareToken), retry: false }
  )

  const query = trpc.resumes.get.useQuery(
    { id: resumeId! },
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
          onClick={() => navigate("/resume-lab")}
        >
          {t("backToLab")}
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
          onClick={() => navigate("/resume-lab")}
        >
          {t("backToLab")}
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
    document: parseResumeDocument(data.document),
    shareToken,
  }

  return <ResumeEditorLoaded key={seed.id} seed={seed} />
}

export type { CollabPermissions }
