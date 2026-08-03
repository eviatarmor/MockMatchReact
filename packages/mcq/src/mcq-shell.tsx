import type { ReactNode } from "react"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  XCircle,
} from "lucide-react"
import { IdeChromeBar } from "@mockmatch/ide"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"
import { Checkbox } from "@mockmatch/ui/checkbox"
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@mockmatch/ui/menubar"
import { RadioGroup, RadioGroupItem } from "@mockmatch/ui/radio-group"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@mockmatch/ui/resizable"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@mockmatch/ui/utils"
import { ItemStatusIcon } from "./item-status-icon"
import { McqOrderList } from "./mcq-order-list"
import { SummaryPanel } from "./summary-panel"
import type {
  McqCheckPayload,
  McqChromeProps,
  McqQuestion,
  McqSessionApi,
  McqShellLabels,
} from "./types"
import { OPTION_LETTERS } from "./variant"

export type McqShellProps = {
  readonly questions: readonly McqQuestion[]
  readonly session: McqSessionApi
  readonly labels: McqShellLabels
  readonly chrome: McqChromeProps
  /** Host scores the answer; call `session.applyResult` on success. */
  readonly onCheck: (payload: McqCheckPayload) => void
  readonly checkPending?: boolean
  readonly checkError?: string | null
  /** Optional host badge for difficulty (e.g. DifficultyBadge). */
  readonly renderDifficulty?: (difficulty: string) => ReactNode
  readonly className?: string
}

export function McqShell({
  questions,
  session,
  labels,
  chrome,
  onCheck,
  checkPending = false,
  checkError = null,
  renderDifficulty,
  className,
}: McqShellProps) {
  const {
    index,
    finished,
    itemState,
    answeredCount,
    correctCount,
    canCheck,
    current,
    currentState,
    revealed,
    currentVariant,
    selectSingle,
    toggleMulti,
    reorder,
    goNext,
    goPrev,
    jumpTo,
    restart,
  } = session

  const progressLabel = finished
    ? labels.progress.done(correctCount, questions.length)
    : labels.progress.step(index + 1, questions.length)

  const handleCheck = () => {
    if (!current || revealed || !canCheck) return
    if (currentVariant === "single") {
      if (currentState?.selectedIndex === undefined) return
      onCheck({
        id: current.id,
        variant: "single",
        selectedIndex: currentState.selectedIndex,
      })
      return
    }
    if (currentVariant === "multi") {
      if (!currentState?.selectedIndices?.length) return
      onCheck({
        id: current.id,
        variant: "multi",
        selectedIndices: currentState.selectedIndices,
      })
      return
    }
    if (!currentState?.orderedIndices?.length) return
    onCheck({
      id: current.id,
      variant: "order",
      orderedIndices: currentState.orderedIndices,
    })
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col bg-background",
        className
      )}
    >
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
                    aria-label={labels.header.back}
                    onClick={chrome.onBack}
                  />
                }
              >
                <ArrowLeft className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {labels.header.back}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
        title={chrome.title}
        badge={chrome.formatBadge}
        start={
          <Menubar className="h-8 min-w-0 shrink-0 border-0 bg-transparent p-0 shadow-none">
            <MenubarMenu>
              <MenubarTrigger className="h-7 px-2 text-xs font-medium">
                {labels.menubar.session}
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={restart}>
                  {labels.actions.restart}
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={chrome.onBank}>
                  {labels.actions.bank}
                </MenubarItem>
              </MenubarContent>
            </MenubarMenu>
          </Menubar>
        }
        center={
          <p className="truncate text-xs text-muted-foreground">
            {progressLabel}
          </p>
        }
        end={
          <span className="text-xs tabular-nums text-muted-foreground">
            {labels.score.short(correctCount, answeredCount)}
          </span>
        }
      />

      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-0 flex-1"
        id="mcq-session"
      >
        <ResizablePanel
          id="mcq-rail"
          defaultSize="22"
          minSize="14"
          maxSize="40"
          className="min-h-0 min-w-0"
        >
          <aside className="flex h-full min-h-0 flex-col border-r border-border bg-muted/15">
            <div className="shrink-0 border-b border-border px-3 py-2">
              <p className="text-2xs font-medium tracking-wide text-muted-foreground uppercase">
                {labels.rail.title}
              </p>
            </div>
            <nav
              className="min-h-0 flex-1 overflow-y-auto p-1.5"
              aria-label={labels.rail.title}
            >
              {questions.map((q, i) => {
                const st = itemState[q.id]?.result
                const active = !finished && i === index
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => jumpTo(i)}
                    className={cn(
                      "flex w-full cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors",
                      active
                        ? "bg-primary/10 text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <ItemStatusIcon result={st} />
                    <span className="min-w-0 flex-1">
                      <span className="font-medium tabular-nums">
                        {labels.rail.item(i + 1)}
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-2xs opacity-80">
                        {q.title}
                      </span>
                    </span>
                  </button>
                )
              })}
            </nav>
          </aside>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel
          id="mcq-main"
          defaultSize="78"
          minSize="50"
          className="min-h-0 min-w-0"
        >
          <main className="flex h-full min-h-0 min-w-0 flex-col">
            {finished ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                <SummaryPanel
                  questions={questions}
                  itemState={itemState}
                  correctCount={correctCount}
                  labels={labels}
                  onRestart={restart}
                  onBank={chrome.onBank}
                  onReview={(i) => jumpTo(i)}
                />
              </div>
            ) : current ? (
              <>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <div className="flex w-full flex-col gap-5 p-4 sm:p-5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-medium text-muted-foreground">
                        {labels.questionOf(index + 1, questions.length)}
                      </span>
                      <Badge
                        variant="outline"
                        className="text-2xs font-normal"
                      >
                        {labels.variant[currentVariant]}
                      </Badge>
                      {current.difficulty && renderDifficulty
                        ? renderDifficulty(current.difficulty)
                        : null}
                    </div>

                    <div>
                      <h2 className="text-base font-medium leading-snug text-foreground sm:text-lg">
                        {current.title}
                      </h2>
                      <p className="mt-3 text-sm leading-relaxed text-foreground/90">
                        {current.stem}
                      </p>
                      {currentVariant === "multi" ? (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {labels.hints.multi}
                        </p>
                      ) : null}
                      {currentVariant === "order" ? (
                        <p className="mt-1.5 text-xs text-muted-foreground">
                          {labels.hints.order}
                        </p>
                      ) : null}
                    </div>

                    {currentVariant === "order" ? (
                      <McqOrderList
                        options={current.options}
                        orderedIndices={
                          currentState?.orderedIndices ??
                          current.options.map((_, i) => i)
                        }
                        onReorder={reorder}
                        disabled={revealed}
                        revealed={revealed}
                        correctOrder={
                          currentState?.result?.correctOrder ?? null
                        }
                        dragAriaLabel={labels.actions.drag}
                      />
                    ) : currentVariant === "multi" ? (
                      <div
                        className="grid gap-2"
                        role="group"
                        aria-label={labels.optionsLabel}
                      >
                        {current.options.map((option, optIndex) => {
                          const letter =
                            OPTION_LETTERS[optIndex] ?? String(optIndex + 1)
                          const selected =
                            currentState?.selectedIndices?.includes(
                              optIndex
                            ) ?? false
                          const result = currentState?.result
                          const isCorrectOption =
                            revealed &&
                            (result?.correctIndices?.includes(optIndex) ??
                              false)
                          const isWrongPick =
                            revealed &&
                            selected &&
                            !(result?.correctIndices?.includes(optIndex) ??
                              false)
                          const missed =
                            revealed &&
                            !selected &&
                            (result?.correctIndices?.includes(optIndex) ??
                              false)

                          return (
                            <label
                              key={`${current.id}-m-${optIndex}`}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors",
                                "hover:border-primary/40",
                                selected &&
                                  !revealed &&
                                  "border-primary bg-primary/5",
                                (isCorrectOption || missed) &&
                                  "border-emerald-500/60 bg-emerald-500/10",
                                isWrongPick &&
                                  "border-destructive/60 bg-destructive/10",
                                revealed && "cursor-default"
                              )}
                            >
                              <Checkbox
                                checked={selected}
                                disabled={revealed}
                                onCheckedChange={(v) =>
                                  toggleMulti(optIndex, v === true)
                                }
                                className="mt-0.5"
                              />
                              <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold">
                                {letter}
                              </span>
                              <span className="min-w-0 flex-1 pt-0.5 text-sm leading-snug">
                                {option}
                              </span>
                              {isCorrectOption || missed ? (
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              ) : null}
                              {isWrongPick ? (
                                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                              ) : null}
                            </label>
                          )
                        })}
                      </div>
                    ) : (
                      <RadioGroup
                        value={
                          currentState?.selectedIndex !== undefined
                            ? String(currentState.selectedIndex)
                            : undefined
                        }
                        onValueChange={selectSingle}
                        disabled={revealed}
                        className="grid gap-2"
                        aria-label={labels.optionsLabel}
                      >
                        {current.options.map((option, optIndex) => {
                          const value = String(optIndex)
                          const letter =
                            OPTION_LETTERS[optIndex] ?? String(optIndex + 1)
                          const isSelected =
                            currentState?.selectedIndex === optIndex
                          const result = currentState?.result
                          const isCorrectOption =
                            revealed && result?.correctIndex === optIndex
                          const isWrongPick =
                            revealed &&
                            result &&
                            !result.correct &&
                            currentState?.selectedIndex === optIndex

                          return (
                            <label
                              key={`${current.id}-${optIndex}`}
                              className={cn(
                                "flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-card px-3 py-2.5 transition-colors",
                                "hover:border-primary/40",
                                isSelected &&
                                  !revealed &&
                                  "border-primary bg-primary/5",
                                isCorrectOption &&
                                  "border-emerald-500/60 bg-emerald-500/10",
                                isWrongPick &&
                                  "border-destructive/60 bg-destructive/10",
                                revealed && "cursor-default",
                                revealed &&
                                  !isCorrectOption &&
                                  !isWrongPick &&
                                  "opacity-70"
                              )}
                            >
                              <span
                                className={cn(
                                  "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold",
                                  isCorrectOption &&
                                    "border-emerald-500/50 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
                                  isWrongPick &&
                                    "border-destructive/50 bg-destructive/15 text-destructive",
                                  isSelected &&
                                    !revealed &&
                                    "border-primary bg-primary text-primary-foreground"
                                )}
                              >
                                {letter}
                              </span>
                              <span className="min-w-0 flex-1 pt-0.5 text-sm leading-snug">
                                {option}
                              </span>
                              {isCorrectOption ? (
                                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              ) : null}
                              {isWrongPick ? (
                                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                              ) : null}
                              <RadioGroupItem
                                value={value}
                                className="sr-only"
                                disabled={revealed}
                              />
                            </label>
                          )
                        })}
                      </RadioGroup>
                    )}

                    {currentState?.result ? (
                      <div
                        className={cn(
                          "rounded-lg border px-4 py-3 text-sm",
                          currentState.result.correct
                            ? "border-emerald-500/40 bg-emerald-500/10"
                            : "border-destructive/40 bg-destructive/10"
                        )}
                        role="status"
                      >
                        <p className="flex items-center gap-2 font-medium">
                          {currentState.result.correct ? (
                            <Check className="size-4 text-emerald-600" />
                          ) : (
                            <XCircle className="size-4 text-destructive" />
                          )}
                          {currentState.result.correct
                            ? labels.result.correct
                            : labels.result.incorrect}
                        </p>
                        {currentState.result.explanation ? (
                          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                            {currentState.result.explanation}
                          </p>
                        ) : null}
                      </div>
                    ) : null}

                    {checkError ? (
                      <p className="text-sm text-destructive">{checkError}</p>
                    ) : null}
                  </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-background px-3 py-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 cursor-pointer gap-1"
                    disabled={index === 0}
                    onClick={goPrev}
                  >
                    <ChevronLeft className="size-3.5" />
                    {labels.actions.prev}
                  </Button>
                  <div className="flex items-center gap-2">
                    {!revealed ? (
                      <Button
                        size="sm"
                        className="h-8 cursor-pointer"
                        disabled={!canCheck || checkPending}
                        onClick={handleCheck}
                      >
                        {checkPending
                          ? labels.actions.checking
                          : labels.actions.check}
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-8 cursor-pointer gap-1"
                        onClick={goNext}
                      >
                        {index >= questions.length - 1
                          ? labels.actions.finish
                          : labels.actions.next}
                        {index < questions.length - 1 ? (
                          <ChevronRight className="size-3.5" />
                        ) : null}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : null}
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

export function McqErrorState({
  message,
  detail,
  onBack,
  backLabel,
}: {
  readonly message: string
  readonly detail?: string
  readonly onBack: () => void
  readonly backLabel: string
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6">
      <p className="text-sm text-muted-foreground">{message}</p>
      {detail ? (
        <p className="max-w-sm text-center text-xs text-muted-foreground">
          {detail}
        </p>
      ) : null}
      <Button
        variant="secondary"
        className="h-8 cursor-pointer"
        onClick={onBack}
      >
        {backLabel}
      </Button>
    </div>
  )
}
