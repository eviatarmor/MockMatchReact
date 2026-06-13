import type { UseFormReturn } from "react-hook-form"
import { Trans, useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { SignupPasswordField } from "@/features/signup/right-pane/signup-password-field"
import type { SignupCredentials } from "@mockmatch/schemas"

interface SignupCredentialsFormProps {
  readonly form: UseFormReturn<SignupCredentials>
  readonly isSubmitting: boolean
  readonly isPasswordVisible: boolean
  readonly onTogglePasswordVisibility: () => void
  readonly onSubmit: () => void
}

export function SignupCredentialsForm({
  form,
  isSubmitting,
  isPasswordVisible,
  onTogglePasswordVisibility,
  onSubmit,
}: SignupCredentialsFormProps) {
  const { t } = useTranslation("signup")
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = form

  const password = watch("password")
  const agreeToTerms = watch("agreeToTerms")

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="fullName">{t("fullNameLabel")}</Label>
        <Input
          id="fullName"
          type="text"
          autoComplete="name"
          placeholder={t("fullNamePlaceholder")}
          aria-invalid={!!errors.fullName}
          {...register("fullName")}
        />
        {errors.fullName ? (
          <p className="text-sm text-destructive">{errors.fullName.message}</p>
        ) : null}
      </div>

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
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <SignupPasswordField
        register={register("password")}
        password={password}
        error={errors.password?.message}
        isPasswordVisible={isPasswordVisible}
        onTogglePasswordVisibility={onTogglePasswordVisibility}
      />

      <div className="flex flex-col gap-1.5">
        <div className="flex items-start gap-2">
          <Checkbox
            id="agreeToTerms"
            className="mt-0.5 cursor-pointer"
            checked={agreeToTerms}
            onCheckedChange={(checked) => setValue("agreeToTerms", checked === true)}
            aria-invalid={!!errors.agreeToTerms}
          />
          <Label htmlFor="agreeToTerms" className="text-sm font-normal text-muted-foreground">
            <Trans
              i18nKey="signup:agreeToTermsLabel"
              components={{
                terms: <a href="#" className="underline" />,
                privacy: <a href="#" className="underline" />,
              }}
            />
          </Label>
        </div>
        {errors.agreeToTerms ? (
          <p className="text-sm text-destructive">{errors.agreeToTerms.message}</p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? t("submittingLabel") : t("submitLabel")}
      </Button>
    </form>
  )
}
