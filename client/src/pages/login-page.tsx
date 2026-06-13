import { useEffect } from "react"

import { LoginPage as LoginPageContent } from "@/components/auth/login-page"

export function LoginPage() {
  useEffect(() => {
    document.title = "Sign in to MockMatch"
  }, [])

  return <LoginPageContent />
}
