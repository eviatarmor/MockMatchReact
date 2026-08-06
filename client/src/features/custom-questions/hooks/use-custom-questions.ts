import { useCallback, useMemo } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { trpc } from "@/lib/trpc"
import type { CreateCustomFormState, CustomQuestionRow } from "../types"
import { buildCreatePayload } from "../constants"

/**
 * listMine + createCustom + deploy(self) for the Custom questions surface.
 * Deploy always sends scope "self" — never team/global.
 */
export function useCustomQuestions() {
  const { t } = useTranslation("common")
  const utils = trpc.useUtils()

  const typesQuery = trpc.questions.simulationTypes.useQuery()
  const mineQuery = trpc.questions.listMine.useQuery({
    page: 1,
    pageSize: 50,
  })

  const createMut = trpc.questions.createCustom.useMutation({
    onSuccess: async () => {
      await utils.questions.listMine.invalidate()
      toast.success(t("customQuestions.toast.created"))
    },
    onError: (err) => {
      toast.error(
        err.message || t("customQuestions.toast.createFailed")
      )
    },
  })

  const deployMut = trpc.questions.deploy.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.questions.listMine.invalidate(),
        utils.questions.list.invalidate(),
      ])
      toast.success(t("customQuestions.toast.deployed"))
    },
    onError: (err) => {
      toast.error(
        err.message || t("customQuestions.toast.deployFailed")
      )
    },
  })

  const items: CustomQuestionRow[] = useMemo(
    () =>
      (mineQuery.data?.items ?? []).map((q) => ({
        id: q.id,
        title: q.title,
        domain: q.domain,
        difficulty: q.difficulty,
        format: q.format,
        publishStatus: q.publishStatus,
        company: q.company,
        language: q.language,
        updatedAt: q.updatedAt,
      })),
    [mineQuery.data?.items]
  )

  const createQuestion = useCallback(
    async (state: CreateCustomFormState) => {
      const payload = buildCreatePayload(state)
      return createMut.mutateAsync({
        title: state.title.trim(),
        domain: state.domain,
        difficulty: state.difficulty,
        format: state.format,
        body: state.prompt.trim(),
        language:
          state.format === "code_run" ||
          state.format === "workspace" ||
          state.format === "terminal"
            ? state.language
            : null,
        company: state.company.trim() || null,
        payload,
      })
    },
    [createMut]
  )

  /** Self-only deploy — never expose team/global in the UI. */
  const deploySelf = useCallback(
    async (id: string) => {
      return deployMut.mutateAsync({ id, scope: "self" })
    },
    [deployMut]
  )

  return {
    simulationTypes: typesQuery.data ?? [],
    typesLoading: typesQuery.isLoading,
    typesError: typesQuery.isError,
    items,
    mineLoading: mineQuery.isLoading,
    mineError: mineQuery.isError,
    isEmpty: !mineQuery.isLoading && items.length === 0,
    createQuestion,
    isCreating: createMut.isPending,
    deploySelf,
    deployingId: deployMut.isPending ? deployMut.variables?.id : null,
  }
}
