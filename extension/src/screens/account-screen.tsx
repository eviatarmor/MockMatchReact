import { ExternalLink, LogOut } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { Avatar, AvatarFallback } from "@mockmatch/ui/avatar"
import { Card, CardContent } from "@mockmatch/ui/card"
import { SectionShell } from "../components/section-shell"
import { useExtension } from "../state/extension-store"

export function AccountScreen() {
  const { user, signOut, setRoute } = useExtension()

  if (!user) return null

  return (
    <div className="flex flex-1 flex-col gap-8 p-4">
      <div>
        <h1 className="font-heading text-lg font-semibold tracking-tight text-foreground">
          Account
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Session for Auto Apply. Manage profile on MockMatch.
        </p>
      </div>

      <SectionShell
        heading="Signed in"
        description="Your MockMatch identity used for form fill."
      >
        <Card>
          <CardContent className="flex items-center gap-3">
            <Avatar size="lg">
              <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
                {user.initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {user.fullName}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </CardContent>
        </Card>
      </SectionShell>

      <SectionShell
        heading="On the web"
        description="Open MockMatch for full account and activity tools."
      >
        <Card>
          <CardContent className="flex flex-col gap-0 px-0">
            <a
              href="http://localhost:5173/settings"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/50"
            >
              Account settings
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </a>
            <div className="border-t border-border/60" />
            <a
              href="http://localhost:5173/autofill"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-between px-4 py-3 text-sm text-foreground transition-colors hover:bg-muted/50"
            >
              Auto Apply activity
              <ExternalLink className="size-3.5 text-muted-foreground" />
            </a>
          </CardContent>
        </Card>
      </SectionShell>

      <div className="mt-auto space-y-2">
        <Button
          type="button"
          variant="outline"
          className="w-full cursor-pointer"
          onClick={() => setRoute("apply")}
        >
          Back to Apply
        </Button>
        <Button
          type="button"
          variant="destructive"
          className="w-full cursor-pointer"
          onClick={signOut}
        >
          <LogOut className="size-3.5" />
          Sign out
        </Button>
      </div>
    </div>
  )
}
