import { Settings, Zap } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { Avatar, AvatarFallback } from "@mockmatch/ui/avatar"
import { cn } from "@mockmatch/ui/utils"
import { AppLogo } from "./app-logo"
import { ThemeToggle } from "./theme-toggle"
import { useExtension } from "../state/extension-store"
import type { PanelRoute } from "../types"

const NAV: { route: PanelRoute; label: string; icon: typeof Zap }[] = [
  { route: "apply", label: "Apply", icon: Zap },
  { route: "settings", label: "Settings", icon: Settings },
]

export function PanelHeader() {
  const { signedIn, user, route, setRoute } = useExtension()

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <AppLogo className="size-8 shrink-0 rounded-lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              Auto Apply
            </p>
            <p className="truncate text-2xs text-muted-foreground">MockMatch</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <ThemeToggle />
          {signedIn && user ? (
            <button
              type="button"
              onClick={() => setRoute("account")}
              className={cn(
                "rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                route === "account" && "ring-2 ring-primary/40",
              )}
              aria-label={`Account: ${user.fullName}`}
            >
              <Avatar size="sm">
                <AvatarFallback className="bg-primary/10 text-2xs font-semibold text-primary">
                  {user.initials}
                </AvatarFallback>
              </Avatar>
            </button>
          ) : null}
        </div>
      </div>
      {signedIn ? (
        <nav
          className="flex gap-0.5 px-2 pb-2"
          aria-label="Extension sections"
        >
          {NAV.map(({ route: r, label, icon: Icon }) => (
            <Button
              key={r}
              type="button"
              variant={route === r ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "flex-1 cursor-pointer",
                route === r && "bg-muted font-medium",
              )}
              onClick={() => setRoute(r)}
            >
              <Icon className="size-3.5" />
              {label}
            </Button>
          ))}
        </nav>
      ) : null}
    </header>
  )
}
