import { Eye, EyeOff } from "lucide-react"
import type { ReactNode } from "react"
import type { UseFormRegisterReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface AuthPasswordFieldProps {
  readonly register: UseFormRegisterReturn
  readonly label: string
  readonly placeholder: string
  readonly autoComplete: "current-password" | "new-password"
  readonly error?: string
  readonly isPasswordVisible: boolean
  readonly onTogglePasswordVisibility: () => void
  readonly labelEndSlot?: ReactNode
  readonly belowField?: ReactNode
}

export function AuthPasswordField({
  register,
  label,
  placeholder,
  autoComplete,
  error,
  isPasswordVisible,
  onTogglePasswordVisibility,
  labelEndSlot,
  belowField,
}: AuthPasswordFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor="password">{label}</Label>
        {labelEndSlot}
      </div>
      <div className="relative">
        <Input
          id="password"
          type={isPasswordVisible ? "text" : "password"}
          autoComplete={autoComplete}
          placeholder={placeholder}
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
      {belowField}
    </div>
  )
}
