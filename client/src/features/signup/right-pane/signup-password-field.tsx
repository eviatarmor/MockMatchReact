import { CheckCircle2, X } from "lucide-react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { AuthPasswordField } from "@/components/auth/auth-password-field"
import { PASSWORD_STRENGTH_CHECKS } from "@/features/signup/constants"

interface SignupPasswordFieldProps {
  readonly register: UseFormRegisterReturn
  readonly password: string
  readonly error?: string
  readonly isPasswordVisible: boolean
  readonly onTogglePasswordVisibility: () => void
}

const STRENGTH_COLORS = ["bg-muted", "bg-red-500", "bg-orange-500", "bg-teal-400", "bg-teal-500"]
const STRENGTH_TEXT_COLORS = ["text-muted-foreground", "text-red-500", "text-orange-500", "text-teal-400", "text-teal-500"]
const STRENGTH_LABEL_KEYS = ["", "passwordStrength.weak", "passwordStrength.moderate", "passwordStrength.strong", "passwordStrength.veryStrong"]

export function SignupPasswordField({
  register,
  password,
  error,
  isPasswordVisible,
  onTogglePasswordVisibility,
}: SignupPasswordFieldProps) {
  const { t } = useTranslation("signup")
  const results = PASSWORD_STRENGTH_CHECKS.map((check) => check.test(password))
  const strength = results.filter(Boolean).length

  return (
    <AuthPasswordField
      register={register}
      label={t("passwordLabel")}
      placeholder={t("passwordPlaceholder")}
      autoComplete="new-password"
      error={error}
      isPasswordVisible={isPasswordVisible}
      onTogglePasswordVisibility={onTogglePasswordVisibility}
      belowField={
        <div className="flex flex-col gap-2 pt-1">
          <div className="h-1 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={cn("h-full transition-all duration-500 ease-out", STRENGTH_COLORS[strength])}
              style={{ width: `${(strength / PASSWORD_STRENGTH_CHECKS.length) * 100}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs font-medium">
            <span className="text-muted-foreground">{t("passwordHint")}</span>
            {strength > 0 ? (
              <span className={STRENGTH_TEXT_COLORS[strength]}>{t(STRENGTH_LABEL_KEYS[strength])}</span>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            {PASSWORD_STRENGTH_CHECKS.map((check, index) => (
              <div
                key={check.labelKey}
                className={cn(
                  "flex items-center gap-2 text-sm transition-colors duration-200",
                  results[index] ? "text-teal-400" : "text-muted-foreground"
                )}
              >
                {results[index] ? <CheckCircle2 className="size-3.5" /> : <X className="size-3.5" />}
                <span className="text-[13px]">{t(check.labelKey)}</span>
              </div>
            ))}
          </div>
        </div>
      }
    />
  )
}
