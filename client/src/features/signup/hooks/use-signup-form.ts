import { useCallback, useState } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation } from "@tanstack/react-query"
import { useNavigate } from "react-router-dom"
import { signupSchema, type SignupCredentials } from "@mockmatch/schemas"
import { useOtpVerification, type UseOtpVerificationResult } from "@/hooks/use-otp-verification"

export type SignupStep = "details" | "code"

export interface UseSignupFormResult {
  readonly form: UseFormReturn<SignupCredentials>
  readonly step: SignupStep
  readonly email: string
  readonly isSendingCode: boolean
  readonly onSubmitDetails: () => void
  readonly onBackToDetails: () => void
  readonly otp: UseOtpVerificationResult
}

// Dummy requests: no backend wired up yet.
const sendCodeRequest: (credentials: SignupCredentials) => Promise<void> = () =>
  new Promise((resolve) => window.setTimeout(resolve, 600))

const resendCodeRequest: () => Promise<void> = () =>
  new Promise((resolve) => window.setTimeout(resolve, 400))

export function useSignupForm(): UseSignupFormResult {
  const [step, setStep] = useState<SignupStep>("details")
  const [email, setEmail] = useState("")
  const navigate = useNavigate()

  const form = useForm<SignupCredentials>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", agreeToTerms: false },
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

  const onSubmitDetails = useCallback(() => {
    sendCode(form.getValues())
  }, [sendCode, form])

  const onBackToDetails = useCallback(() => {
    setStep("details")
  }, [])

  return {
    form,
    step,
    email,
    isSendingCode,
    onSubmitDetails,
    onBackToDetails,
    otp,
  }
}
