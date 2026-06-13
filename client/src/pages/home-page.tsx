import { useEffect } from "react"
import { Link } from "react-router-dom"

import { APP_NAME, HERO_HEADLINE } from "@/lib/login/constants"

export function HomePage() {
  useEffect(() => {
    document.title = APP_NAME
  }, [])

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="max-w-xl text-4xl font-bold leading-tight">{HERO_HEADLINE.title}</h1>
      <p className="max-w-md text-muted-foreground">{HERO_HEADLINE.description}</p>
      <Link
        to="/login"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80"
      >
        Sign in
      </Link>
    </div>
  )
}
