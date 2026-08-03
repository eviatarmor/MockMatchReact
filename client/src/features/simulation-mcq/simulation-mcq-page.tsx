import { useCallback, useEffect, useMemo } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import {
  McqErrorState,
  McqShell,
  useMcqSession,
  type McqCheckPayload,
  type McqQuestion,
  type McqShellLabels,
} from "@mockmatch/mcq"
import { Badge } from "@mockmatch/ui/badge"
import { fireCelebrationConfetti } from "@mockmatch/ui/confetti"
import { RobotLoader } from "@mockmatch/ui/robot-loader"
import { trpc } from "@/lib/trpc"
import { DifficultyBadge } from "@/components/data/difficulty-badge"
import { practicePathForBankQuestion } from "@/features/simulations/lib/practice-path"
import type { QuestionMcqDetail } from "@mockmatch/schemas"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const DEFAULT_LIMIT = 8

function toMcqQuestion(q: QuestionMcqDetail): McqQuestion {
  return {
    id: q.id,
    title: q.title,
    stem: q.stem,
    options: q.options,
    variant: q.variant ?? "single",
    difficulty: q.difficulty,
  }
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

  const questions = useMemo(
    () => (sessionQuery.data?.questions ?? []).map(toMcqQuestion),
    [sessionQuery.data?.questions]
  )

  const labels: McqShellLabels = useMemo(
    () => ({
      optionsLabel: t("simulation-mcq:optionsLabel"),
      variant: {
        single: t("simulation-mcq:variant.single"),
        multi: t("simulation-mcq:variant.multi"),
        order: t("simulation-mcq:variant.order"),
      },
      hints: {
        multi: t("simulation-mcq:hints.multi"),
        order: t("simulation-mcq:hints.order"),
      },
      header: {
        back: t("simulation-mcq:header.back"),
      },
      menubar: {
        session: t("simulation-mcq:menubar.session"),
      },
      rail: {
        title: t("simulation-mcq:rail.title"),
        item: (n) => t("simulation-mcq:rail.item", { n }),
      },
      questionOf: (current, total) =>
        t("simulation-mcq:questionOf", { current, total }),
      progress: {
        step: (current, total) =>
          t("simulation-mcq:progress.step", { current, total }),
        done: (correct, total) =>
          t("simulation-mcq:progress.done", { correct, total }),
      },
      score: {
        short: (correct, answered) =>
          t("simulation-mcq:score.short", { correct, answered }),
      },
      actions: {
        check: t("simulation-mcq:actions.check"),
        checking: t("simulation-mcq:actions.checking"),
        next: t("simulation-mcq:actions.next"),
        prev: t("simulation-mcq:actions.prev"),
        finish: t("simulation-mcq:actions.finish"),
        restart: t("simulation-mcq:actions.restart"),
        bank: t("simulation-mcq:actions.bank"),
        drag: t("simulation-mcq:actions.drag"),
      },
      result: {
        correct: t("simulation-mcq:result.correct"),
        incorrect: t("simulation-mcq:result.incorrect"),
      },
      summary: {
        title: t("simulation-mcq:summary.title"),
        score: (correct, total) =>
          t("simulation-mcq:summary.score", { correct, total }),
      },
      errors: {
        submitFailed: t("simulation-mcq:errors.submitFailed"),
      },
    }),
    [t]
  )

  const onPerfectSet = useCallback(() => {
    void fireCelebrationConfetti()
  }, [])

  const session = useMcqSession({
    questions,
    sessionKey: seedId
      ? `${seedId}:${sessionQuery.dataUpdatedAt}`
      : undefined,
    onPerfectSet,
  })

  const submit = trpc.questions.submitMcq.useMutation({
    onSuccess: async (data, variables) => {
      session.applyResult(
        variables.id,
        {
          correct: data.correct,
          variant: data.variant,
          correctIndex: data.correctIndex,
          correctIndices: data.correctIndices,
          correctOrder: data.correctOrder,
          explanation: data.explanation,
        },
        {
          selectedIndex: variables.selectedIndex,
          selectedIndices: variables.selectedIndices,
          orderedIndices: variables.orderedIndices,
        }
      )
      await utils.questions.list.invalidate()
    },
  })

  const handleCheck = useCallback(
    (payload: McqCheckPayload) => {
      if (payload.variant === "single") {
        submit.mutate({
          id: payload.id,
          selectedIndex: payload.selectedIndex,
        })
        return
      }
      if (payload.variant === "multi") {
        submit.mutate({
          id: payload.id,
          selectedIndices: payload.selectedIndices,
        })
        return
      }
      submit.mutate({
        id: payload.id,
        orderedIndices: payload.orderedIndices,
      })
    },
    [submit]
  )

  const goBank = useCallback(() => navigate("/question-bank"), [navigate])

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

  return (
    <McqShell
      questions={questions}
      session={session}
      labels={labels}
      chrome={{
        title: domainLabel,
        formatBadge: (
          <Badge variant="secondary" className="shrink-0 text-xs font-normal">
            {t("common:simulations.format.mcq")}
          </Badge>
        ),
        onBack: goBank,
        onBank: goBank,
      }}
      onCheck={handleCheck}
      checkPending={submit.isPending}
      checkError={
        submit.isError
          ? submit.error.message || labels.errors.submitFailed
          : null
      }
      renderDifficulty={(difficulty) => (
        <DifficultyBadge
          difficulty={difficulty as QuestionMcqDetail["difficulty"]}
          translationPrefix="questionBank.difficulty"
        />
      )}
    />
  )
}
