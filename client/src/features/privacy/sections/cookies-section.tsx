import { useTranslation } from "react-i18next"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SectionShell } from "@/features/account-settings/right-pane/section-shell"
import { ToggleRow } from "@/features/privacy/components/toggle-row"
import { COOKIE_TOGGLES } from "@/features/privacy/constants"
import type { PrivacyForm } from "@/features/privacy/types"

interface CookiesSectionProps {
  readonly form: UseFormReturn<PrivacyForm>
}

export function CookiesSection({ form }: CookiesSectionProps) {
  const { t } = useTranslation("privacy")

  return (
    <SectionShell heading={t("cookies.heading")} description={t("cookies.description")}>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <ToggleRow
            label={t("cookies.required.label")}
            description={t("cookies.required.description")}
            badge={<Badge variant="secondary">{t("cookies.required.badge")}</Badge>}
            control={<Switch checked disabled />}
          />

          {COOKIE_TOGGLES.map((toggle) => (
            <div key={toggle.field} className="flex flex-col gap-4">
              <Separator />
              <Controller
                control={form.control}
                name={toggle.field}
                render={({ field }) => (
                  <ToggleRow
                    label={t(toggle.labelKey)}
                    description={t(toggle.descriptionKey)}
                    control={<Switch checked={field.value} onCheckedChange={field.onChange} />}
                  />
                )}
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </SectionShell>
  )
}
