import { useCallback, useState } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { signupSchema, type SignupCredentials } from "@mockmatch/schemas"

export interface UseSignupFormResult {
  readonly form: UseFormReturn<SignupCredentials>
  readonly isSubmitting: boolean
  readonly isPasswordVisible: boolean
  readonly togglePasswordVisibility: () => void
  readonly onSubmit: () => void
}

// Dummy submit: no backend wired up yet.
const signupRequest: (credentials: SignupCredentials) => Promise<void> = () =>
  new Promise((resolve) => window.setTimeout(resolve, 600))

export function useSignupForm(): UseSignupFormResult {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const navigate = useNavigate()

  const form = useForm<SignupCredentials>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", password: "", agreeToTerms: false },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: signupRequest,
    onSuccess: (_, credentials) => {
      navigate("/signup/verify", { state: { email: credentials.email }, replace: true })
    },
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
