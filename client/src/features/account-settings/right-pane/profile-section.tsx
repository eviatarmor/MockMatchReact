import { useState } from "react"
import { useTranslation } from "react-i18next"
import type { UseFormReturn } from "react-hook-form"
import { Camera } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@mockmatch/ui/avatar"
import { Button } from "@mockmatch/ui/button"
import { Card, CardContent } from "@mockmatch/ui/card"
import { Input } from "@mockmatch/ui/input"
import { Label } from "@mockmatch/ui/label"
import { Spinner } from "@mockmatch/ui/spinner"
import { cn } from "@/lib/utils"
import { initials } from "@mockmatch/ui/user-menu"
import { SectionShell } from "@/components/layout/section-shell"
import { useProfileAvatar } from "@/features/account-settings/hooks/use-profile-avatar"
import { ProfilePhotoDialog } from "@/features/account-settings/right-pane/profile-photo-dialog"
import type { AccountSettingsForm } from "@/features/account-settings/types"

interface ProfileSectionProps {
  readonly form: UseFormReturn<AccountSettingsForm>
  readonly email: string
  readonly avatarUrl: string | null
}

export function ProfileSection({ form, email, avatarUrl }: ProfileSectionProps) {
  const { t } = useTranslation("account-settings")
  const fullName = form.watch("fullName")
  const [photoDialogOpen, setPhotoDialogOpen] = useState(false)
  const avatar = useProfileAvatar(avatarUrl)

  const displayName = fullName || email
  const busy = avatar.isUploading || avatar.isRemoving

  return (
    <SectionShell heading={t("profile.heading")} description={t("profile.description")}>
      <Card>
        <CardContent className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPhotoDialogOpen(true)}
              disabled={busy}
              aria-label={
                avatar.avatarUrl
                  ? t("profile.photo.change")
                  : t("profile.photo.add")
              }
              className={cn(
                "group relative shrink-0 cursor-pointer rounded-full outline-none",
                "focus-visible:ring-3 focus-visible:ring-ring/50",
                "disabled:pointer-events-none disabled:opacity-50"
              )}
            >
              <Avatar key={avatar.avatarUrl ?? "no-avatar"} size="lg">
                {avatar.avatarUrl ? (
                  <AvatarImage src={avatar.avatarUrl} alt={displayName} />
                ) : null}
                <AvatarFallback>{initials(displayName)}</AvatarFallback>
              </Avatar>
              <span
                className={cn(
                  "pointer-events-none absolute inset-0 flex items-center justify-center rounded-full",
                  "bg-black/50 text-white opacity-0 transition-opacity",
                  "group-hover:opacity-100 group-focus-visible:opacity-100"
                )}
                aria-hidden
              >
                <Camera className="size-4" />
              </span>
            </button>
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
              <span className="truncate text-sm font-medium text-foreground">{fullName}</span>
              <span className="truncate text-xs text-muted-foreground">{email}</span>
              <p className="mt-1 text-xs text-muted-foreground">
                {t("profile.photo.clickHint")}
              </p>
              {avatar.avatarUrl ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-1 h-auto w-fit cursor-pointer px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                  onClick={() => void avatar.remove()}
                  disabled={busy}
                >
                  {avatar.isRemoving ? (
                    <>
                      <Spinner className="size-3.5" />
                      {t("profile.photo.removing")}
                    </>
                  ) : (
                    t("profile.photo.remove")
                  )}
                </Button>
              ) : null}
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

      <ProfilePhotoDialog
        open={photoDialogOpen}
        onOpenChange={setPhotoDialogOpen}
        validateSourceFile={avatar.validateSourceFile}
        onSave={avatar.uploadCropped}
        isUploading={avatar.isUploading}
      />
    </SectionShell>
  )
}
