import { Eye, EyeOff } from "lucide-react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface LoginPasswordFieldProps {
  readonly register: UseFormRegisterReturn
  readonly error?: string
  readonly isPasswordVisible: boolean
  readonly onTogglePasswordVisibility: () => void
}

export function LoginPasswordField({
  register,
  error,
  isPasswordVisible,
  onTogglePasswordVisibility,
}: LoginPasswordFieldProps) {
  const { t } = useTranslation("login")

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="password">Password</Label>
        <a href="#" className="text-sm font-medium text-primary hover:underline">
          {t("forgotPasswordLabel")}
        </a>
      </div>
      <div className="relative">
        <Input
          id="password"
          type={isPasswordVisible ? "text" : "password"}
          autoComplete="current-password"
          placeholder="Enter your password"
          className="bg-transparent pr-9"
          aria-invalid={!!error}
          {...register}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onTogglePasswordVisibility}
          className="absolute top-0 right-0 h-full cursor-pointer px-3 hover:bg-transparent"
          aria-label={isPasswordVisible ? "Hide password" : "Show password"}
        >
          {isPasswordVisible ? (
            <EyeOff className="size-4 text-muted-foreground" />
          ) : (
            <Eye className="size-4 text-muted-foreground" />
          )}
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  )
}
