import { useCallback, useState } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { loginSchema, type LoginCredentials } from "@mockmatch/schemas"

export interface UseLoginFormResult {
  readonly form: UseFormReturn<LoginCredentials>
  readonly isSubmitting: boolean
  readonly isPasswordVisible: boolean
  readonly togglePasswordVisibility: () => void
  readonly onSubmit: () => void
}

// Dummy submit: no backend wired up yet.
const loginRequest: (credentials: LoginCredentials) => Promise<void> = () =>
  new Promise((resolve) => window.setTimeout(resolve, 600))

export function useLoginForm(): UseLoginFormResult {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: loginRequest,
  })

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((previous) => !previous)
  }, [])

  const onSubmit = useCallback(() => {
    mutate(form.getValues())
  }, [mutate, form])

  return {
    form,
    isSubmitting: isPending,
    isPasswordVisible,
    togglePasswordVisibility,
    onSubmit,
  }
}
