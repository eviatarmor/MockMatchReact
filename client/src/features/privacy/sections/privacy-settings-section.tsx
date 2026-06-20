import { useTranslation } from "react-i18next"
import { Controller, type UseFormReturn } from "react-hook-form"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { SectionShell } from "@/components/layout/section-shell"
import { ToggleRow } from "@/features/privacy/components/toggle-row"
import { PRIVACY_TOGGLES } from "@/features/privacy/constants"
import type { PrivacyForm } from "@/features/privacy/types"

interface PrivacySettingsSectionProps {
  readonly form: UseFormReturn<PrivacyForm>
}

export function PrivacySettingsSection({ form }: PrivacySettingsSectionProps) {
  const { t } = useTranslation("privacy")

  return (
    <SectionShell heading={t("privacy.heading")} description={t("privacy.description")}>
      <Card>
        <CardContent className="flex flex-col gap-4">
          {PRIVACY_TOGGLES.map((toggle, index) => (
            <div key={toggle.field} className="flex flex-col gap-4">
              {index > 0 && <Separator />}
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

      <p className="text-xs text-muted-foreground">{t("privacy.footer")}</p>
    </SectionShell>
  )
}
