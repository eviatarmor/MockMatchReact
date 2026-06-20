import { useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SectionShell } from "@/components/layout/section-shell"
import {
  COUNTRY_OPTIONS,
  DATE_FORMAT_OPTIONS,
  TIME_FORMAT_OPTIONS,
  COUNTRY_DIALECT_KEY,
} from "@/features/account-settings/constants"
import type {
  AccountSettingsForm,
  Country,
  DateFormat,
  SelectOption,
  TimeFormat,
} from "@/features/account-settings/types"

function formatDate(date: Date, format: DateFormat): string {
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  const yyyy = String(date.getFullYear())
  if (format === "DD/MM/YYYY") return `${dd}/${mm}/${yyyy}`
  if (format === "YYYY/MM/DD") return `${yyyy}/${mm}/${dd}`
  return `${mm}/${dd}/${yyyy}`
}

function formatTime(date: Date, format: TimeFormat): string {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: format === "12h",
  })
}

interface FieldSelectProps<TValue extends string> {
  readonly id: string
  readonly value: TValue
  readonly onChange: (value: TValue) => void
  readonly options: readonly SelectOption<TValue>[]
}

function FieldSelect<TValue extends string>({ id, value, onChange, options }: FieldSelectProps<TValue>) {
  const { t } = useTranslation("account-settings")
  return (
    <Select value={value} onValueChange={(next) => onChange(next as TValue)}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {t(option.labelKey)}
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

  const country = form.watch("country")
  const dateFormat = form.watch("dateFormat")
  const timeFormat = form.watch("timeFormat")

  return (
    <SectionShell heading={t("region.heading")} description={t("region.description")}>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-3">
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

          <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
            <Badge variant="secondary">{t("region.previewLabel")}</Badge>
            <span className="text-sm text-foreground">
              {formatDate(now, dateFormat)} · {formatTime(now, timeFormat)}
            </span>
            <span className="ml-auto text-xs text-muted-foreground">
              {t(COUNTRY_DIALECT_KEY[country])}
            </span>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  )
}
