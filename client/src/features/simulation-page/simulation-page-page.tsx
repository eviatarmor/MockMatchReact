import { useCallback, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { IdeChromeBar } from "@mockmatch/ide"
import {
  PageEditor,
  PageShell,
  type PageEditorLabels,
  type PageShellLabels,
} from "@mockmatch/page"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"

const SEED_HTML = `<h1>Document analysis</h1><p>Write a structured analysis below. Type <strong>/</strong> for headings, lists, quotes, and more.</p><p></p>`

/** Freeform Notion/Docs-like writeup practice. */
export function SimulationPagePageContent() {
  const navigate = useNavigate()
  const { t } = useTranslation(["simulation-page", "common"])
  const [html, setHtml] = useState(SEED_HTML)

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
          {t("simulation-page:subtitle")}
        </p>
      }
    />
  )

  return (
    <PageShell chrome={chrome} labels={shellLabels} className="h-full">
      <PageEditor
        value={html}
        onChange={setHtml}
        labels={editorLabels}
        placeholder={t("simulation-page:placeholder")}
      />
    </PageShell>
  )
}
