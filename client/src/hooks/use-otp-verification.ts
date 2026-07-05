import { useCallback, useEffect, useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { OTP_LENGTH, RESEND_COOLDOWN_SECONDS } from "@/lib/auth/constants"

export interface UseOtpVerificationOptions {
  readonly onVerify: (code: string) => Promise<void>
  readonly onResend: () => Promise<void>
}

export interface UseOtpVerificationResult {
  readonly code: string
  readonly setCode: (code: string) => void
  readonly isSubmitting: boolean
  readonly isComplete: boolean
  readonly resendSecondsLeft: number
  readonly canResend: boolean
  readonly onSubmit: () => void
  readonly onResend: () => void
}

export function useOtpVerification({ onVerify, onResend }: UseOtpVerificationOptions): UseOtpVerificationResult {
  const [code, setCode] = useState("")
  const [resendSecondsLeft, setResendSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS)

  const { mutate: verify, isPending: isVerifying } = useMutation({
    mutationFn: onVerify,
  })

  const { mutate: resend, isPending: isResending } = useMutation({
    mutationFn: onResend,
    onSuccess: () => setResendSecondsLeft(RESEND_COOLDOWN_SECONDS),
  })

  useEffect(() => {
    if (resendSecondsLeft <= 0) return

    const timer = window.setInterval(() => {
      setResendSecondsLeft((previous) => Math.max(0, previous - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [resendSecondsLeft])

  const isComplete = code.length === OTP_LENGTH

  const onSubmit = useCallback(() => {
    if (!isComplete) return
    verify(code)
  }, [verify, code, isComplete])

  const handleResend = useCallback(() => {
    if (resendSecondsLeft > 0) return
    resend()
  }, [resend, resendSecondsLeft])

  return {
    code,
    setCode,
    isSubmitting: isVerifying || isResending,
    isComplete,
    resendSecondsLeft,
    canResend: resendSecondsLeft <= 0,
    onSubmit,
    onResend: handleResend,
  }
}
