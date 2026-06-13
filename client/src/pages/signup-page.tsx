import { useEffect } from "react"

import { SignupPageContent } from "@/features/signup/signup-page"

export function SignupPage() {
  useEffect(() => {
    document.title = "Create your MockMatch account"
  }, [])

  return <SignupPageContent />
}
