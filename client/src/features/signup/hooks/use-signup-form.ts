import { useCallback, useState } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { signupSchema, type SignupCredentials } from "@mockmatch/schemas"
import { useOtpVerification, type UseOtpVerificationResult } from "@/hooks/use-otp-verification"
import { setUser } from "@/lib/auth/session"
import { trpc } from "@/lib/trpc"

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

function trpcErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message
    if (message) return message
  }
  return fallback
}

export function useSignupForm(): UseSignupFormResult {
  const [step, setStep] = useState<SignupStep>("details")
  const [email, setEmail] = useState("")
  const navigate = useNavigate()

  const form = useForm<SignupCredentials>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: "", email: "", agreeToTerms: false },
  })

  const requestOtp = trpc.auth.requestOtp.useMutation({
    onSuccess: (_data, variables) => {
      if (variables.purpose === "signup") {
        setEmail(variables.email)
        setStep("code")
      }
    },
    onError: (error) => {
      toast.error(trpcErrorMessage(error, "Could not send code"))
    },
  })

  const verifyOtp = trpc.auth.verifyOtp.useMutation({
    onSuccess: (data) => {
      // Tokens arrive as HttpOnly cookies from the API response.
      setUser(data.user)
      navigate("/resume-lab", { replace: true })
    },
    onError: (error) => {
      toast.error(trpcErrorMessage(error, "Invalid code"))
    },
  })

  const otp = useOtpVerification({
    onVerify: async (code) => {
      await verifyOtp.mutateAsync({
        email,
        code,
        purpose: "signup",
      })
    },
    onResend: async () => {
      const values = form.getValues()
      await requestOtp.mutateAsync({
        purpose: "signup",
        fullName: values.fullName,
        email: email || values.email,
        agreeToTerms: values.agreeToTerms,
      })
    },
  })

  const onSubmitDetails = useCallback(() => {
    void form.handleSubmit((values) => {
      requestOtp.mutate({
        purpose: "signup",
        fullName: values.fullName,
        email: values.email,
        agreeToTerms: values.agreeToTerms,
      })
    })()
  }, [form, requestOtp])

  const onBackToDetails = useCallback(() => {
    setStep("details")
  }, [])

  return {
    form,
    step,
    email,
    isSendingCode: requestOtp.isPending,
    onSubmitDetails,
    onBackToDetails,
    otp,
  }
}
