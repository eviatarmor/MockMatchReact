import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useParams } from "react-router-dom"
import { AlertCircle, Loader2 } from "lucide-react"
import { useNavbarSlots } from "@/hooks/use-navbar-slots"
import { useIsMobile } from "@/hooks/use-mobile"
import { useCanvasViewport } from "@/hooks/use-canvas-viewport"
import { resolveStyleClasses } from "@/components/document-editor"
import { SaveStatusBadge } from "@/components/data/save-status-badge"
import { Button } from "@/components/ui/button"
import { trpc } from "@/lib/trpc"
import { parseDocumentStyle } from "@/lib/parse-document-style"
import { BreadcrumbName } from "./top-bar/breadcrumb-name"
import { EditorBottomBar, EditorToolbarActions } from "./top-bar/editor-toolbar"
import { EditorCanvas } from "./canvas/editor-canvas"
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
  }
}) {
  const { t } = useTranslation("resume-editor")
  const isMobile = useIsMobile()
  const viewport = useCanvasViewport()
  const session = useResumeEditorSession(seed)
  const resolvedStyle = useMemo(() => resolveStyleClasses(session.style), [session.style])

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
      <span className="flex items-center gap-2">
        <BreadcrumbName value={session.resumeName} onChange={session.setResumeName} />
        <SaveStatusBadge status={session.saveStatus} labels={saveLabels} />
      </span>
    ),
    [session.resumeName, session.setResumeName, session.saveStatus, saveLabels]
  )

  const center = useMemo(
    () => (isMobile ? <BreadcrumbName value={session.resumeName} onChange={session.setResumeName} /> : null),
    [isMobile, session.resumeName, session.setResumeName]
  )
  const end = useMemo(
    () => <EditorToolbarActions resumeId={seed.id} title={session.resumeName} />,
    [seed.id, session.resumeName]
  )
  useNavbarSlots({ crumb, center, end })

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
    <div className="relative h-full min-h-0">
      <EditorCanvas
        document={session.document}
        template={session.template}
        style={resolvedStyle}
        viewport={viewport}
        handlers={session.handlers}
      />
      <EditorBottomBar viewport={viewport} />
      <EditorRail
        activeTemplateId={session.templateId}
        onTemplateChange={session.selectTemplate}
        style={session.style}
        onStyleChange={session.updateStyle}
        document={session.document}
        handlers={session.handlers}
      />
    </div>
  )
}

export function ResumeEditorPageContent() {
  const { t } = useTranslation("resume-editor")
  const navigate = useNavigate()
  const { resumeId } = useParams<{ resumeId: string }>()
  const isValidId = typeof resumeId === "string" && UUID_RE.test(resumeId)

  const query = trpc.resumes.get.useQuery(
    { id: resumeId! },
    { enabled: isValidId, retry: false }
  )

  if (!isValidId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <AlertCircle className="size-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">{t("notFound")}</p>
        <Button variant="outline" className="cursor-pointer" onClick={() => navigate("/resume-lab")}>
          {t("backToLab")}
        </Button>
      </div>
    )
  }

  if (query.isLoading) {
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
        <Button variant="outline" className="cursor-pointer" onClick={() => navigate("/resume-lab")}>
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
  }

  return <ResumeEditorLoaded key={seed.id} seed={seed} />
}
