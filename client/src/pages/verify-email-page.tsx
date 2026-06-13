import { useEffect } from "react"

import { VerifyEmailPageContent } from "@/features/verify-email/verify-email-page"

export function VerifyEmailPage() {
  useEffect(() => {
    document.title = "Verify your email — MockMatch"
  }, [])

  return <VerifyEmailPageContent />
}
