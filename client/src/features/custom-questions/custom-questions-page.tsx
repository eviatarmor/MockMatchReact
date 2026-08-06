import { useTranslation } from "react-i18next"
import { FlaskConical, PencilLine } from "lucide-react"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { EntityEmptyState } from "@/components/data/entity-empty-state"
import { EntityListStates } from "@/components/data/entity-list-states"
import { CreateCustomForm } from "./components/create-custom-form"
import { MyQuestionsTable } from "./components/my-questions-table"
import { SimulationTypeGrid } from "./components/simulation-type-grid"
import { useCreateCustomForm } from "./hooks/use-create-custom-form"
import { useCustomQuestions } from "./hooks/use-custom-questions"

export function CustomQuestionsPageContent() {
  const { t } = useTranslation("common")
  const {
    simulationTypes,
    typesLoading,
    typesError,
    items,
    mineLoading,
    mineError,
    isEmpty,
    createQuestion,
    isCreating,
    deploySelf,
    deployingId,
  } = useCustomQuestions()

  const {
    form,
    setField,
    selectFormat,
    setOption,
    addOption,
    removeOption,
    toggleCorrectIndex,
    reset,
  } = useCreateCustomForm()

  const handleCreate = async () => {
    await createQuestion(form)
    reset(form.format)
  }

  return (
    <DashboardPageShell title={t("customQuestions.title")}>
      <div className="flex flex-col gap-8">
        <DashboardPageHeader
          title={t("customQuestions.title")}
          description={t("customQuestions.description")}
        />

        <section className="flex flex-col gap-3" aria-labelledby="cq-types-heading">
          <div className="flex flex-col gap-1">
            <h2
              id="cq-types-heading"
              className="text-sm font-semibold text-foreground"
            >
              {t("customQuestions.types.heading")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("customQuestions.types.description")}
            </p>
          </div>
          {typesError ? (
            <p className="text-sm text-destructive">
              {t("customQuestions.types.loadError")}
            </p>
          ) : (
            <SimulationTypeGrid
              types={simulationTypes}
              selected={form.format}
              onSelect={selectFormat}
              isLoading={typesLoading}
            />
          )}
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="cq-create-heading">
          <h2 id="cq-create-heading" className="sr-only">
            {t("customQuestions.create.heading")}
          </h2>
          <CreateCustomForm
            form={form}
            isPending={isCreating}
            onField={setField}
            onOption={setOption}
            onAddOption={addOption}
            onRemoveOption={removeOption}
            onToggleCorrect={toggleCorrectIndex}
            onSubmit={() => {
              void handleCreate()
            }}
          />
        </section>

        <section className="flex flex-col gap-3" aria-labelledby="cq-mine-heading">
          <div className="flex flex-col gap-1">
            <h2
              id="cq-mine-heading"
              className="text-sm font-semibold text-foreground"
            >
              {t("customQuestions.mine.heading")}
            </h2>
            <p className="text-xs text-muted-foreground">
              {t("customQuestions.mine.description")}
            </p>
          </div>

          <EntityListStates
            isError={mineError}
            isLoading={mineLoading}
            isEmpty={isEmpty}
            errorMessage={t("customQuestions.mine.loadError")}
            loadingMessage={t("customQuestions.mine.loading")}
            emptyState={
              <EntityEmptyState
                icon={PencilLine}
                title={t("customQuestions.mine.emptyTitle")}
                description={t("customQuestions.mine.emptyDescription")}
              />
            }
          >
            <MyQuestionsTable
              items={items}
              deployingId={deployingId}
              onDeploySelf={(id) => {
                void deploySelf(id)
              }}
            />
          </EntityListStates>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <FlaskConical className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            <span>{t("customQuestions.mine.selfOnlyNote")}</span>
          </p>
        </section>
      </div>
    </DashboardPageShell>
  )
}
