import { useEffect } from "react"

import { LoginPageContent } from "@/components/login/login-page"

export function LoginPage() {
  useEffect(() => {
    document.title = "Sign in to MockMatch"
  }, [])

  return <LoginPageContent />
}
