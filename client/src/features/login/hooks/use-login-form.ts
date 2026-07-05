import { useCallback, useState } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { loginSchema, type LoginCredentials } from "@mockmatch/schemas"
import { useOtpVerification, type UseOtpVerificationResult } from "@/hooks/use-otp-verification"

export type LoginStep = "email" | "code"

export interface UseLoginFormResult {
  readonly form: UseFormReturn<LoginCredentials>
  readonly step: LoginStep
  readonly email: string
  readonly isSendingCode: boolean
  readonly onSubmitEmail: () => void
  readonly onBackToEmail: () => void
  readonly otp: UseOtpVerificationResult
}

// Dummy requests: no backend wired up yet.
const sendCodeRequest: (credentials: LoginCredentials) => Promise<void> = () =>
  new Promise((resolve) => window.setTimeout(resolve, 600))

const resendCodeRequest: () => Promise<void> = () =>
  new Promise((resolve) => window.setTimeout(resolve, 400))

export function useLoginForm(): UseLoginFormResult {
  const [step, setStep] = useState<LoginStep>("email")
  const [email, setEmail] = useState("")
  const navigate = useNavigate()

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" },
  })

  const { mutate: sendCode, isPending: isSendingCode } = useMutation({
    mutationFn: sendCodeRequest,
    onSuccess: (_, credentials) => {
      setEmail(credentials.email)
      setStep("code")
    },
  })

  const verifyCodeRequest = useCallback(
    () =>
      new Promise<void>((resolve) => window.setTimeout(resolve, 600)).then(() => {
        // Stub redirect target until auth/session wiring lands.
        navigate("/resume-lab", { replace: true })
      }),
    [navigate]
  )

  const otp = useOtpVerification({
    onVerify: verifyCodeRequest,
    onResend: resendCodeRequest,
  })

  const onSubmitEmail = useCallback(() => {
    sendCode(form.getValues())
  }, [sendCode, form])

  const onBackToEmail = useCallback(() => {
    setStep("email")
  }, [])

  return {
    form,
    step,
    email,
    isSendingCode,
    onSubmitEmail,
    onBackToEmail,
    otp,
  }
}
