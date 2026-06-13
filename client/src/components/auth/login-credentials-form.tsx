import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LOGIN_COPY } from "@/lib/auth/constants"
import type { LoginCredentials } from "@/lib/auth/types"

interface LoginCredentialsFormProps {
  readonly credentials: LoginCredentials
  readonly isSubmitting: boolean
  readonly isPasswordVisible: boolean
  readonly onEmailChange: (email: string) => void
  readonly onPasswordChange: (password: string) => void
  readonly onTogglePasswordVisibility: () => void
  readonly onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function LoginCredentialsForm({
  credentials,
  isSubmitting,
  isPasswordVisible,
  onEmailChange,
  onPasswordChange,
  onTogglePasswordVisibility,
  onSubmit,
}: LoginCredentialsFormProps) {
  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={credentials.email}
          onChange={(event) => onEmailChange(event.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>
          <a
            href="#"
            className="text-sm font-medium text-primary hover:underline"
          >
            {LOGIN_COPY.forgotPasswordLabel}
          </a>
        </div>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={credentials.password}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="bg-transparent pr-9"
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
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Signing in…" : LOGIN_COPY.submitLabel}
      </Button>
    </form>
  )
}
