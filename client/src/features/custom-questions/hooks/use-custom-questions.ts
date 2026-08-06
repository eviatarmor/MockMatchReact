import { useCallback, useMemo } from "react"
import { toast } from "sonner"
import { useTranslation } from "react-i18next"
import { trpc } from "@/lib/trpc"
import type { CreateCustomFormState } from "../types"
import {
  buildCreateInputFields,
  buildCreatePayload,
} from "../lib/build-create-payload"
import { mapMineItems } from "../lib/map-mine-items"

function toastTrpcError(message: string | undefined, fallback: string) {
  toast.error(message || fallback)
}

function useMineList() {
  const mineQuery = trpc.questions.listMine.useQuery({
    page: 1,
    pageSize: 50,
  })
  const items = useMemo(
    () => mapMineItems(mineQuery.data?.items ?? []),
    [mineQuery.data?.items]
  )
  return {
    items,
    mineLoading: mineQuery.isLoading,
    mineError: mineQuery.isError,
    isEmpty: !mineQuery.isLoading && items.length === 0,
  }
}

function useCustomQuestionMutations() {
  const { t } = useTranslation("common")
  const utils = trpc.useUtils()

  const createMut = trpc.questions.createCustom.useMutation({
    onSuccess: async () => {
      await utils.questions.listMine.invalidate()
      toast.success(t("customQuestions.toast.created"))
    },
    onError: (err) => {
      toastTrpcError(err.message, t("customQuestions.toast.createFailed"))
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
      toastTrpcError(err.message, t("customQuestions.toast.deployFailed"))
    },
  })

  const createQuestion = useCallback(
    async (state: CreateCustomFormState) => {
      return createMut.mutateAsync({
        ...buildCreateInputFields(state),
        payload: buildCreatePayload(state),
      })
    },
    [createMut]
  )

  const deploySelf = useCallback(
    async (id: string) => {
      return deployMut.mutateAsync({ id, scope: "self" as const })
    },
    [deployMut]
  )

  return {
    createQuestion,
    isCreating: createMut.isPending,
    deploySelf,
    deployingId: deployMut.isPending ? deployMut.variables?.id ?? null : null,
  }
}

/**
 * listMine + createCustom + deploy(self) for the Custom questions surface.
 * Deploy always sends scope "self" — never team/global.
 */
export function useCustomQuestions() {
  const typesQuery = trpc.questions.simulationTypes.useQuery()
  const mine = useMineList()
  const mutations = useCustomQuestionMutations()

  return {
    simulationTypes: typesQuery.data ?? [],
    typesLoading: typesQuery.isLoading,
    typesError: typesQuery.isError,
    ...mine,
    ...mutations,
  }
}
