import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Card, CardContent } from "@mockmatch/ui/card"
import { Label } from "@mockmatch/ui/label"
import { Badge } from "@mockmatch/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mockmatch/ui/select"
import { SectionShell } from "@/components/layout/section-shell"
import {
  COUNTRY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIME_FORMAT_OPTIONS,
} from "@/features/account-settings/constants"
import type {
  AccountSettingsForm,
  Country,
  DateFormat,
  Language,
  SelectOption,
  TimeFormat,
} from "@/features/account-settings/types"
import { formatDate, formatTime } from "@/lib/format-datetime"
import { setAppLanguage } from "@/lib/i18n"

interface FieldSelectProps<TValue extends string> {
  readonly id: string
  readonly value: TValue
  readonly onChange: (value: TValue) => void
  readonly options: readonly SelectOption<TValue>[]
}

function FieldSelect<TValue extends string>({ id, value, onChange, options }: FieldSelectProps<TValue>) {
  const { t } = useTranslation("account-settings")
  // Base UI SelectValue shows raw `value` unless Root has `items` label map.
  const items = options.map((option) => ({
    value: option.value,
    label: t(option.labelKey),
  }))
  return (
    <Select value={value} onValueChange={(next) => onChange(next as TValue)} items={items}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

interface RegionSectionProps {
  readonly form: UseFormReturn<AccountSettingsForm>
}

export function RegionSection({ form }: RegionSectionProps) {
  const { t } = useTranslation("account-settings")
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(interval)
  }, [])

  const language = form.watch("language")
  const dateFormat = form.watch("dateFormat")
  const timeFormat = form.watch("timeFormat")

  return (
    <SectionShell heading={t("region.heading")} description={t("region.description")}>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-language">{t("region.languageLabel")}</Label>
              <Controller
                control={form.control}
                name="language"
                render={({ field }) => (
                  <FieldSelect<Language>
                    id="account-language"
                    value={field.value}
                    onChange={(next) => {
                      field.onChange(next)
                      setAppLanguage(next)
                    }}
                    options={LANGUAGE_OPTIONS}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-country">{t("region.countryLabel")}</Label>
              <Controller
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FieldSelect<Country>
                    id="account-country"
                    value={field.value}
                    onChange={field.onChange}
                    options={COUNTRY_OPTIONS}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-date-format">{t("region.dateFormatLabel")}</Label>
              <Controller
                control={form.control}
                name="dateFormat"
                render={({ field }) => (
                  <FieldSelect<DateFormat>
                    id="account-date-format"
                    value={field.value}
                    onChange={field.onChange}
                    options={DATE_FORMAT_OPTIONS}
                  />
                )}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="account-time-format">{t("region.timeFormatLabel")}</Label>
              <Controller
                control={form.control}
                name="timeFormat"
                render={({ field }) => (
                  <FieldSelect<TimeFormat>
                    id="account-time-format"
                    value={field.value}
                    onChange={field.onChange}
                    options={TIME_FORMAT_OPTIONS}
                  />
                )}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/30 p-3">
            <Badge variant="secondary">{t("region.previewLabel")}</Badge>
            <span className="text-sm tabular-nums text-foreground">
              {formatDate(now, dateFormat)} · {formatTime(now, timeFormat)}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {t(`region.languages.${language}`)}
            </span>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  )
}
