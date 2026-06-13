import { useCallback, useState } from "react"
import type { LoginCredentials } from "@/lib/auth/types"

const INITIAL_CREDENTIALS: LoginCredentials = {
  email: "",
  password: "",
}

export interface UseLoginFormResult {
  readonly credentials: LoginCredentials
  readonly isSubmitting: boolean
  readonly isPasswordVisible: boolean
  readonly setEmail: (email: string) => void
  readonly setPassword: (password: string) => void
  readonly togglePasswordVisibility: () => void
  readonly handleSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

export function useLoginForm(): UseLoginFormResult {
  const [credentials, setCredentials] = useState<LoginCredentials>(INITIAL_CREDENTIALS)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)

  const setEmail = useCallback((email: string) => {
    setCredentials((previous) => ({ ...previous, email }))
  }, [])

  const setPassword = useCallback((password: string) => {
    setCredentials((previous) => ({ ...previous, password }))
  }, [])

  const togglePasswordVisibility = useCallback(() => {
    setIsPasswordVisible((previous) => !previous)
  }, [])

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setIsSubmitting(true)

      // Dummy submit: no backend wired up yet.
      window.setTimeout(() => {
        setIsSubmitting(false)
      }, 600)
    },
    []
  )

  return {
    credentials,
    isSubmitting,
    isPasswordVisible,
    setEmail,
    setPassword,
    togglePasswordVisibility,
    handleSubmit,
  }
}
