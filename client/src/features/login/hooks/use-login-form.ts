import { useCallback, useState } from "react"
import { useForm, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { loginSchema, type LoginCredentials } from "@mockmatch/schemas"
import { useOtpVerification, type UseOtpVerificationResult } from "@/hooks/use-otp-verification"
import { setUser } from "@/lib/auth/session"
import { trpc } from "@/lib/trpc"

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

function trpcErrorMessage(error: unknown, fallback: string): string {
  if (error && typeof error === "object" && "message" in error) {
    const message = (error as { message?: string }).message
    if (message) return message
  }
  return fallback
}

export function useLoginForm(): UseLoginFormResult {
  const [step, setStep] = useState<LoginStep>("email")
  const [email, setEmail] = useState("")
  const navigate = useNavigate()

  const form = useForm<LoginCredentials>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" },
  })

  const requestOtp = trpc.auth.requestOtp.useMutation({
    onSuccess: (_data, variables) => {
      setEmail(variables.email)
      setStep("code")
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
        purpose: "login",
      })
    },
    onResend: async () => {
      await requestOtp.mutateAsync({
        purpose: "login",
        email: email || form.getValues("email"),
      })
    },
  })

  const onSubmitEmail = useCallback(() => {
    void form.handleSubmit((values) => {
      requestOtp.mutate({
        purpose: "login",
        email: values.email,
      })
    })()
  }, [form, requestOtp])

  const onBackToEmail = useCallback(() => {
    setStep("email")
  }, [])

  return {
    form,
    step,
    email,
    isSendingCode: requestOtp.isPending,
    onSubmitEmail,
    onBackToEmail,
    otp,
  }
}
