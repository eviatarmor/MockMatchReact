import { X } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { useExtension } from "../state/extension-store"

export function Banner() {
  const { banner, authError, setBanner, setAuthError } = useExtension()
  const message = authError ?? banner
  if (!message) return null

  const isError = Boolean(authError)

  return (
    <div
      role={isError ? "alert" : "status"}
      className={
        isError
          ? "flex items-start gap-2 border-b border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          : "flex items-start gap-2 border-b border-primary/15 bg-primary/5 px-3 py-2 text-sm text-foreground"
      }
    >
      <p className="min-w-0 flex-1 leading-snug">{message}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="cursor-pointer shrink-0"
        onClick={() => {
          setBanner(null)
          setAuthError(null)
        }}
        aria-label="Dismiss"
      >
        <X className="size-3.5" />
      </Button>
    </div>
  )
}
