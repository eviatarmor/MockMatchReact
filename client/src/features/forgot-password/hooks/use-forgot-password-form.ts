import { useCallback, useEffect, useState } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { forgotPasswordSchema, type ForgotPasswordCredentials } from "@mockmatch/schemas"
import { RESEND_COOLDOWN_SECONDS } from "@/features/forgot-password/constants"

export interface UseForgotPasswordFormResult {
  readonly form: UseFormReturn<ForgotPasswordCredentials>
  readonly isSubmitting: boolean
  readonly isSent: boolean
  readonly submittedEmail: string
  readonly resendSecondsLeft: number
  readonly canResend: boolean
  readonly onSubmit: () => void
  readonly onResend: () => void
}

// Dummy requests: no backend wired up yet.
const forgotPasswordRequest: (credentials: ForgotPasswordCredentials) => Promise<void> = () =>
  new Promise((resolve) => window.setTimeout(resolve, 600))

export function useForgotPasswordForm(): UseForgotPasswordFormResult {
  const [submittedEmail, setSubmittedEmail] = useState("")
  const [resendSecondsLeft, setResendSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS)

  const form = useForm<ForgotPasswordCredentials>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: forgotPasswordRequest,
    onSuccess: (_, credentials) => {
      setSubmittedEmail(credentials.email)
      setResendSecondsLeft(RESEND_COOLDOWN_SECONDS)
    },
  })

  const { mutate: resend } = useMutation({
    mutationFn: forgotPasswordRequest,
    onSuccess: () => setResendSecondsLeft(RESEND_COOLDOWN_SECONDS),
  })

  useEffect(() => {
    if (!isSuccess || resendSecondsLeft <= 0) return

    const timer = window.setInterval(() => {
      setResendSecondsLeft((previous) => Math.max(0, previous - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [isSuccess, resendSecondsLeft])

  const onSubmit = useCallback(() => {
    mutate(form.getValues())
  }, [mutate, form])

  const onResend = useCallback(() => {
    if (resendSecondsLeft > 0) return
    resend({ email: submittedEmail })
  }, [resend, resendSecondsLeft, submittedEmail])

  return {
    form,
    isSubmitting: isPending,
    isSent: isSuccess,
    submittedEmail,
    resendSecondsLeft,
    canResend: resendSecondsLeft <= 0,
    onSubmit,
    onResend,
  }
}
