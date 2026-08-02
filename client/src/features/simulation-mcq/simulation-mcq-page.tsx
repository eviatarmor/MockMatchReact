import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  RotateCcw,
  XCircle,
} from "lucide-react"
import { IdeChromeBar } from "@mockmatch/ide"
import { Badge } from "@mockmatch/ui/badge"
import { Button } from "@mockmatch/ui/button"
import { Checkbox } from "@mockmatch/ui/checkbox"
import { fireCelebrationConfetti } from "@mockmatch/ui/confetti"
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
import { RobotLoader } from "@mockmatch/ui/robot-loader"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@/lib/utils"
import { trpc } from "@/lib/trpc"
import { DifficultyBadge } from "@/components/data/difficulty-badge"
import { practicePathForBankQuestion } from "@/features/simulations/lib/practice-path"
import type { McqVariant, QuestionMcqDetail } from "@mockmatch/schemas"
import {
  McqOrderList,
  shuffleIndices,
} from "./components/mcq-order-list"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"] as const
const DEFAULT_LIMIT = 8

type ItemResult = {
  correct: boolean
  variant: McqVariant
  correctIndex: number | null
  correctIndices: number[] | null
  correctOrder: number[] | null
  explanation: string | null
}

type ItemState = {
  /** single */
  selectedIndex?: number
  /** multi */
  selectedIndices?: number[]
  /** order — display order as original option indices */
  orderedIndices?: number[]
  result?: ItemResult
}

function variantOf(q: QuestionMcqDetail): McqVariant {
  return q.variant ?? "single"
}

export function SimulationMcqPageContent() {
  const { questionId: questionIdParam } = useParams<{ questionId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(["simulation-mcq", "common"])
  const utils = trpc.useUtils()

  const seedId =
    questionIdParam && UUID_RE.test(questionIdParam) ? questionIdParam : null

  const sessionQuery = trpc.questions.forMcqSession.useQuery(
    { seedId: seedId!, limit: DEFAULT_LIMIT },
    {
      enabled: Boolean(seedId),
      retry: false,
      staleTime: 60_000,
    }
  )

  const summaryQuery = trpc.questions.get.useQuery(
    { id: seedId! },
    {
      enabled: Boolean(seedId) && sessionQuery.isError,
      retry: false,
    }
  )

  useEffect(() => {
    if (!seedId || !summaryQuery.data) return
    if (summaryQuery.data.format === "mcq") return
    const path = practicePathForBankQuestion({
      id: summaryQuery.data.id,
      format: summaryQuery.data.format,
    })
    if (path) navigate(path, { replace: true })
  }, [seedId, summaryQuery.data, navigate])

  const questions = sessionQuery.data?.questions ?? []
  const [index, setIndex] = useState(0)
  const [itemState, setItemState] = useState<Record<string, ItemState>>({})
  const [finished, setFinished] = useState(false)

  useEffect(() => {
    setIndex(0)
    setItemState({})
    setFinished(false)
  }, [seedId, sessionQuery.dataUpdatedAt])

  const current: QuestionMcqDetail | undefined = questions[index]
  const currentState = current ? itemState[current.id] : undefined
  const revealed = Boolean(currentState?.result)
  const currentVariant = current ? variantOf(current) : "single"

  // Seed order-variant shuffle when first viewing a question
  useEffect(() => {
    if (!current || currentVariant !== "order") return
    setItemState((prev) => {
      if (prev[current.id]?.orderedIndices) return prev
      return {
        ...prev,
        [current.id]: {
          ...prev[current.id],
          orderedIndices: shuffleIndices(current.options.length, current.id),
        },
      }
    })
  }, [current, currentVariant])

  const submit = trpc.questions.submitMcq.useMutation({
    onSuccess: async (data, variables) => {
      setItemState((prev) => {
        const prior = prev[variables.id] ?? {}
        return {
          ...prev,
          [variables.id]: {
            ...prior,
            selectedIndex: variables.selectedIndex,
            selectedIndices: variables.selectedIndices,
            orderedIndices: variables.orderedIndices ?? prior.orderedIndices,
            result: {
              correct: data.correct,
              variant: data.variant,
              correctIndex: data.correctIndex,
              correctIndices: data.correctIndices,
              correctOrder: data.correctOrder,
              explanation: data.explanation,
            },
          },
        }
      })
      await utils.questions.list.invalidate()
    },
  })

  const answeredCount = useMemo(
    () =>
      questions.filter((q) => itemState[q.id]?.result !== undefined).length,
    [questions, itemState]
  )
  const correctCount = useMemo(
    () =>
      questions.filter((q) => itemState[q.id]?.result?.correct === true).length,
    [questions, itemState]
  )

  const canCheck = useMemo(() => {
    if (!current || revealed) return false
    if (currentVariant === "single") {
      return currentState?.selectedIndex !== undefined
    }
    if (currentVariant === "multi") {
      return (currentState?.selectedIndices?.length ?? 0) > 0
    }
    return (currentState?.orderedIndices?.length ?? 0) === current.options.length
  }, [current, currentState, currentVariant, revealed])

  const handleSelectSingle = useCallback(
    (value: string | null) => {
      if (!current || revealed || value == null) return
      const n = Number.parseInt(value, 10)
      if (Number.isNaN(n)) return
      setItemState((prev) => ({
        ...prev,
        [current.id]: { ...prev[current.id], selectedIndex: n },
      }))
    },
    [current, revealed]
  )

  const handleToggleMulti = useCallback(
    (optIndex: number, checked: boolean) => {
      if (!current || revealed) return
      setItemState((prev) => {
        const cur = prev[current.id]?.selectedIndices ?? []
        const next = checked
          ? [...new Set([...cur, optIndex])].sort((a, b) => a - b)
          : cur.filter((i) => i !== optIndex)
        return {
          ...prev,
          [current.id]: { ...prev[current.id], selectedIndices: next },
        }
      })
    },
    [current, revealed]
  )

  const handleReorder = useCallback(
    (next: number[]) => {
      if (!current || revealed) return
      setItemState((prev) => ({
        ...prev,
        [current.id]: { ...prev[current.id], orderedIndices: next },
      }))
    },
    [current, revealed]
  )

  const handleCheck = useCallback(() => {
    if (!current || revealed || !canCheck) return
    if (currentVariant === "single") {
      if (currentState?.selectedIndex === undefined) return
      submit.mutate({
        id: current.id,
        selectedIndex: currentState.selectedIndex,
      })
      return
    }
    if (currentVariant === "multi") {
      if (!currentState?.selectedIndices?.length) return
      submit.mutate({
        id: current.id,
        selectedIndices: currentState.selectedIndices,
      })
      return
    }
    if (!currentState?.orderedIndices?.length) return
    submit.mutate({
      id: current.id,
      orderedIndices: currentState.orderedIndices,
    })
  }, [current, currentState, currentVariant, revealed, canCheck, submit])

  const goNext = useCallback(() => {
    if (index >= questions.length - 1) {
      // Perfect set → same confetti as IDE “Run tests” all-pass
      const allCorrect =
        questions.length > 0 &&
        questions.every((q) => itemState[q.id]?.result?.correct === true)
      setFinished(true)
      if (allCorrect) {
        void fireCelebrationConfetti()
      }
      return
    }
    setIndex((i) => i + 1)
    submit.reset()
  }, [index, questions.length, submit, itemState])

  const goPrev = useCallback(() => {
    setFinished(false)
    setIndex((i) => Math.max(0, i - 1))
    submit.reset()
  }, [submit])

  const jumpTo = useCallback(
    (i: number) => {
      setFinished(false)
      setIndex(i)
      submit.reset()
    },
    [submit]
  )

  const handleRestart = useCallback(() => {
    setIndex(0)
    setItemState({})
    setFinished(false)
    submit.reset()
  }, [submit])

  const goBank = () => navigate("/question-bank")

  if (!seedId) {
    return (
      <McqErrorState
        message={t("simulation-mcq:errors.invalidId")}
        onBack={goBank}
        backLabel={t("simulation-mcq:errors.backToQuestionBank")}
      />
    )
  }

  if (sessionQuery.isLoading || sessionQuery.isFetching) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 bg-background p-6 text-sm text-muted-foreground">
        <RobotLoader size="md" label={t("simulation-mcq:loading")} />
        <p>{t("simulation-mcq:loading")}</p>
      </div>
    )
  }

  if (sessionQuery.isError || !sessionQuery.data || questions.length === 0) {
    return (
      <McqErrorState
        message={t("simulation-mcq:errors.notFound")}
        detail={sessionQuery.error?.message}
        onBack={goBank}
        backLabel={t("simulation-mcq:errors.backToQuestionBank")}
      />
    )
  }

  const domainLabel = t(
    `common:questionBank.domains.${sessionQuery.data.domain}`
  )
  const progressLabel = finished
    ? t("simulation-mcq:progress.done", {
        correct: correctCount,
        total: questions.length,
      })
    : t("simulation-mcq:progress.step", {
        current: index + 1,
        total: questions.length,
      })

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
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
                    aria-label={t("simulation-mcq:header.back")}
                    onClick={goBank}
                  />
                }
              >
                <ArrowLeft className="size-4" />
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {t("simulation-mcq:header.back")}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        }
        title={domainLabel}
        badge={
          <Badge variant="secondary" className="shrink-0 text-xs font-normal">
            {t("common:simulations.format.mcq")}
          </Badge>
        }
        start={
          <Menubar className="h-8 min-w-0 shrink-0 border-0 bg-transparent p-0 shadow-none">
            <MenubarMenu>
              <MenubarTrigger className="h-7 px-2 text-xs font-medium">
                {t("simulation-mcq:menubar.session")}
              </MenubarTrigger>
              <MenubarContent>
                <MenubarItem onClick={handleRestart}>
                  {t("simulation-mcq:actions.restart")}
                </MenubarItem>
                <MenubarSeparator />
                <MenubarItem onClick={goBank}>
                  {t("simulation-mcq:actions.bank")}
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
            {t("simulation-mcq:score.short", {
              correct: correctCount,
              answered: answeredCount,
            })}
          </span>
        }
      />

      <ResizablePanelGroup
        orientation="horizontal"
        className="min-h-0 flex-1"
        id="mcq-session"
      >
        {/*
          react-resizable-panels v4: numbers = pixels, bare strings = %.
          Voice shell uses "34"/"66" — match that pattern.
        */}
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
                {t("simulation-mcq:rail.title")}
              </p>
            </div>
            <nav
              className="min-h-0 flex-1 overflow-y-auto p-1.5"
              aria-label={t("simulation-mcq:rail.title")}
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
                        {t("simulation-mcq:rail.item", { n: i + 1 })}
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
                    onRestart={handleRestart}
                    onBank={goBank}
                    onReview={(i) => jumpTo(i)}
                  />
                </div>
              ) : current ? (
                <>
                  <div className="min-h-0 flex-1 overflow-y-auto">
                    <div className="flex w-full flex-col gap-5 p-4 sm:p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground">
                          {t("simulation-mcq:questionOf", {
                            current: index + 1,
                            total: questions.length,
                          })}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-2xs font-normal"
                        >
                          {t(`simulation-mcq:variant.${currentVariant}`)}
                        </Badge>
                        <DifficultyBadge
                          difficulty={current.difficulty}
                          translationPrefix="questionBank.difficulty"
                        />
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
                            {t("simulation-mcq:hints.multi")}
                          </p>
                        ) : null}
                        {currentVariant === "order" ? (
                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {t("simulation-mcq:hints.order")}
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
                          onReorder={handleReorder}
                          disabled={revealed}
                          revealed={revealed}
                          correctOrder={
                            currentState?.result?.correctOrder ?? null
                          }
                          dragAriaLabel={t("simulation-mcq:actions.drag")}
                        />
                      ) : currentVariant === "multi" ? (
                        <div
                          className="grid gap-2"
                          role="group"
                          aria-label={t("simulation-mcq:optionsLabel")}
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
                                    handleToggleMulti(optIndex, v === true)
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
                          onValueChange={handleSelectSingle}
                          disabled={revealed}
                          className="grid gap-2"
                          aria-label={t("simulation-mcq:optionsLabel")}
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
                              ? t("simulation-mcq:result.correct")
                              : t("simulation-mcq:result.incorrect")}
                          </p>
                          {currentState.result.explanation ? (
                            <p className="mt-2 text-sm leading-relaxed text-foreground/90">
                              {currentState.result.explanation}
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {submit.isError ? (
                        <p className="text-sm text-destructive">
                          {submit.error.message ||
                            t("simulation-mcq:errors.submitFailed")}
                        </p>
                      ) : null}
                    </div>
                  </div>

                  {/* Sticky bottom chrome — prev / check / next */}
                  <div className="flex shrink-0 items-center justify-between gap-2 border-t border-border bg-background px-3 py-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 cursor-pointer gap-1"
                      disabled={index === 0}
                      onClick={goPrev}
                    >
                      <ChevronLeft className="size-3.5" />
                      {t("simulation-mcq:actions.prev")}
                    </Button>
                    <div className="flex items-center gap-2">
                      {!revealed ? (
                        <Button
                          size="sm"
                          className="h-8 cursor-pointer"
                          disabled={!canCheck || submit.isPending}
                          onClick={handleCheck}
                        >
                          {submit.isPending
                            ? t("simulation-mcq:actions.checking")
                            : t("simulation-mcq:actions.check")}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="h-8 cursor-pointer gap-1"
                          onClick={goNext}
                        >
                          {index >= questions.length - 1
                            ? t("simulation-mcq:actions.finish")
                            : t("simulation-mcq:actions.next")}
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

function ItemStatusIcon({
  result,
}: {
  readonly result?: { correct: boolean }
}) {
  if (!result) {
    return <Circle className="mt-0.5 size-3.5 shrink-0 opacity-40" />
  }
  if (result.correct) {
    return (
      <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
    )
  }
  return <XCircle className="mt-0.5 size-3.5 shrink-0 text-destructive" />
}

function SummaryPanel({
  questions,
  itemState,
  correctCount,
  onRestart,
  onBank,
  onReview,
}: {
  readonly questions: readonly QuestionMcqDetail[]
  readonly itemState: Record<string, ItemState>
  readonly correctCount: number
  readonly onRestart: () => void
  readonly onBank: () => void
  readonly onReview: (index: number) => void
}) {
  const { t } = useTranslation("simulation-mcq")
  return (
    <div className="flex w-full flex-col gap-6 p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-medium">{t("summary.title")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("summary.score", {
            correct: correctCount,
            total: questions.length,
          })}
        </p>
      </div>
      <ul className="flex flex-col gap-1.5">
        {questions.map((q, i) => {
          const r = itemState[q.id]?.result
          return (
            <li key={q.id}>
              <button
                type="button"
                className="flex w-full cursor-pointer items-center gap-2 rounded-md border border-border/60 px-3 py-2 text-left text-sm hover:bg-muted/40"
                onClick={() => onReview(i)}
              >
                <ItemStatusIcon result={r} />
                <span className="min-w-0 flex-1 truncate">{q.title}</span>
              </button>
            </li>
          )
        })}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button className="h-9 cursor-pointer gap-1.5" onClick={onRestart}>
          <RotateCcw className="size-3.5" />
          {t("actions.restart")}
        </Button>
        <Button
          variant="secondary"
          className="h-9 cursor-pointer"
          onClick={onBank}
        >
          {t("actions.bank")}
        </Button>
      </div>
    </div>
  )
}

function McqErrorState({
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
