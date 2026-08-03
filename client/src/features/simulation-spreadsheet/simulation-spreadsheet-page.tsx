import { useCallback, useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { ArrowLeft } from "lucide-react"
import { IdeChromeBar } from "@mockmatch/ide"
import {
  SpreadsheetShell,
  createEmptyWorkbook,
  useSpreadsheet,
  type SpreadsheetShellLabels,
} from "@mockmatch/spreadsheet"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"

/** Freeform spreadsheet practice — local workbook (collab host wiring later). */
export function SimulationSpreadsheetPageContent() {
  const navigate = useNavigate()
  const { t } = useTranslation(["simulation-spreadsheet", "common"])

  const sheet = useSpreadsheet({
    initial: createEmptyWorkbook({ sheetName: "Sheet1" }),
  })

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
          {t("simulation-spreadsheet:subtitle")}
        </p>
      }
    />
  )

  return (
    <SpreadsheetShell
      className="h-full"
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
      chrome={chrome}
    />
  )
}
