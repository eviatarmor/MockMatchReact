import { ExternalLink, Shield } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { AppLogo } from "../components/app-logo"
import { useExtension } from "../state/extension-store"

export function LoggedOutScreen() {
  const { signIn } = useExtension()

  return (
    <div className="flex flex-1 flex-col px-4 py-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <AppLogo className="mb-4 size-16" />
        <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          MockMatch Auto Apply
        </h1>
        <p className="mt-2 max-w-[16rem] text-sm leading-relaxed text-muted-foreground">
          Fill applications with your MockMatch profile, resume, and cover
          letter — then review before you submit.
        </p>
        <Button
          type="button"
          className="mt-6 w-full max-w-[16rem] cursor-pointer"
          onClick={signIn}
        >
          Sign in with MockMatch
          <ExternalLink className="size-3.5" />
        </Button>
        <p className="mt-3 flex items-center justify-center gap-1.5 text-2xs text-muted-foreground">
          <Shield className="size-3 shrink-0" />
          Opens MockMatch in a tab. No password in the extension.
        </p>
      </div>

      <div className="mt-auto border-t border-border/60 pt-4 text-center">
        <a
          href="http://localhost:5173/autofill"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
        >
          Open Auto Apply dashboard
          <ExternalLink className="size-3" />
        </a>
      </div>
    </div>
  )
}
