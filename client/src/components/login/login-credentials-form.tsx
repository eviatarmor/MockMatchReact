import type { UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LoginPasswordField } from "@/components/login/login-password-field"
import { LOGIN_COPY } from "@/components/login/lib/constants"
import type { LoginCredentials } from "@mockmatch/schemas"

interface LoginCredentialsFormProps {
  readonly form: UseFormReturn<LoginCredentials>
  readonly isSubmitting: boolean
  readonly isPasswordVisible: boolean
  readonly onTogglePasswordVisibility: () => void
  readonly onSubmit: () => void
}

export function LoginCredentialsForm({
  form,
  isSubmitting,
  isPasswordVisible,
  onTogglePasswordVisibility,
  onSubmit,
}: LoginCredentialsFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = form

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email ? (
          <p className="text-sm text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <LoginPasswordField
        register={register("password")}
        error={errors.password?.message}
        isPasswordVisible={isPasswordVisible}
        onTogglePasswordVisibility={onTogglePasswordVisibility}
      />

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : LOGIN_COPY.submitLabel}
      </Button>
    </form>
  )
}
