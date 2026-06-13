import { useEffect } from "react"

import { LoginPageContent } from "@/features/login/login-page"

export function LoginPage() {
  useEffect(() => {
    document.title = "Sign in to MockMatch"
  }, [])

  return <LoginPageContent />
}
