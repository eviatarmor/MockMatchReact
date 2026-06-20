import { useTranslation } from "react-i18next"
import type { UseFormReturn } from "react-hook-form"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { initials } from "@/components/ui/user-menu"
import { SectionShell } from "@/components/layout/section-shell"
import type { AccountSettingsForm } from "@/features/account-settings/types"

interface ProfileSectionProps {
  readonly form: UseFormReturn<AccountSettingsForm>
  readonly email: string
}

export function ProfileSection({ form, email }: ProfileSectionProps) {
  const { t } = useTranslation("account-settings")
  const fullName = form.watch("fullName")

  return (
    <SectionShell heading={t("profile.heading")} description={t("profile.description")}>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback>{initials(fullName || email)}</AvatarFallback>
            </Avatar>
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">{fullName}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-email">{t("profile.emailLabel")}</Label>
            <Input id="account-email" value={email} readOnly disabled />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="account-full-name">{t("profile.fullNameLabel")}</Label>
            <Input
              id="account-full-name"
              placeholder={t("profile.fullNamePlaceholder")}
              aria-invalid={Boolean(form.formState.errors.fullName)}
              {...form.register("fullName", { required: true, maxLength: 256 })}
            />
            <p className="text-xs text-muted-foreground">{t("profile.fullNameHelp")}</p>
          </div>
        </CardContent>
      </Card>
    </SectionShell>
  )
}
