import { useTranslation } from "react-i18next"
import { DashboardPageShell } from "@/components/dashboard/dashboard-page-shell"
import { DashboardPageHeader } from "@/components/dashboard/dashboard-page-header"
import { PhotoAttachmentsField } from "@/components/support/photo-attachments-field"
import { Button } from "@mockmatch/ui/button"
import { Input } from "@mockmatch/ui/input"
import { Label } from "@mockmatch/ui/label"
import { Textarea } from "@mockmatch/ui/textarea"
import { Spinner } from "@mockmatch/ui/spinner"
import { SelectCard } from "@mockmatch/ui/card"
import { RadioGroup, RadioGroupItem } from "@mockmatch/ui/radio-group"
import {
  HELP_TOPIC_OPTIONS,
  MAX_HELP_MESSAGE_LENGTH,
  MAX_HELP_SUBJECT_LENGTH,
} from "@/features/help/constants"
import { useHelpForm } from "@/features/help/hooks/use-help-form"
import type { HelpTopic } from "@/features/help/types"

export function HelpPageContent() {
  const { t } = useTranslation("help")
  const {
    values,
    setTopic,
    setSubject,
    setMessage,
    photos,
    setPhotos,
    canSubmit,
    isPending,
    handleSubmit,
  } = useHelpForm()

  return (
    <DashboardPageShell title={t("title")}>
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <DashboardPageHeader title={t("title")} description={t("description")} />

        <form
          className="flex flex-col gap-6 rounded-xl border border-border/60 bg-card p-5 shadow-sm ring-1 ring-foreground/5"
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2">
            <Label id="help-topic-label">{t("fields.topic")}</Label>
            <RadioGroup
              value={values.topic}
              onValueChange={(value) => setTopic(value as HelpTopic)}
              className="grid gap-2 sm:grid-cols-2"
              aria-labelledby="help-topic-label"
              disabled={isPending}
            >
              {HELP_TOPIC_OPTIONS.map((topic) => {
                const Icon = topic.icon
                const selected = values.topic === topic.id
                return (
                  <SelectCard key={topic.id} asChild selected={selected}>
                    <label className="flex items-start gap-3 p-3">
                      <RadioGroupItem value={topic.id} className="mt-0.5 shrink-0" />
                      <span
                        className={
                          selected
                            ? "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/15"
                            : "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground"
                        }
                      >
                        <Icon className="size-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-medium text-foreground">
                          {t(topic.labelKey)}
                        </span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">
                          {t(topic.descriptionKey)}
                        </span>
                      </span>
                    </label>
                  </SelectCard>
                )
              })}
            </RadioGroup>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="help-subject">{t("fields.subject")}</Label>
            <Input
              id="help-subject"
              value={values.subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder={t("fields.subjectPlaceholder")}
              maxLength={MAX_HELP_SUBJECT_LENGTH}
              disabled={isPending}
            />
            <p className="text-xs text-muted-foreground">
              {t("fields.subjectHint")}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="help-message">{t("fields.message")}</Label>
            <Textarea
              id="help-message"
              value={values.message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("fields.messagePlaceholder")}
              maxLength={MAX_HELP_MESSAGE_LENGTH}
              rows={6}
              disabled={isPending}
              className="min-h-32 resize-y"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label>{t("fields.photos")}</Label>
            <PhotoAttachmentsField
              photos={photos}
              onChange={setPhotos}
              disabled={isPending}
              ns="help"
              size="default"
              fullWidth
            />
          </div>

          <div className="flex justify-end">
            <Button
              type="submit"
              className="cursor-pointer gap-1.5"
              disabled={!canSubmit}
            >
              {isPending ? <Spinner className="size-3.5" /> : null}
              {isPending ? t("actions.sending") : t("actions.send")}
            </Button>
          </div>
        </form>
      </div>
    </DashboardPageShell>
  )
}

