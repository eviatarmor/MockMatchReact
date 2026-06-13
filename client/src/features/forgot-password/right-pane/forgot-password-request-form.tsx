import type { UseFormReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ForgotPasswordCredentials } from "@mockmatch/schemas"

interface ForgotPasswordRequestFormProps {
  readonly form: UseFormReturn<ForgotPasswordCredentials>
  readonly isSubmitting: boolean
  readonly onSubmit: () => void
}

export function ForgotPasswordRequestForm({ form, isSubmitting, onSubmit }: ForgotPasswordRequestFormProps) {
  const { t } = useTranslation("forgot-password")
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("submittingLabel") : t("submitLabel")}
      </Button>
    </form>
  )
}
