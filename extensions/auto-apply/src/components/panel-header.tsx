import { ArrowLeft, Settings, SlidersHorizontal, LifeBuoy, LogOut } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@mockmatch/ui/avatar"
import { UserMenu } from "@mockmatch/ui/user-menu"
import { AppLogo } from "./app-logo"
import { ThemeToggle } from "./theme-toggle"
import { useExtension } from "../state/extension-store"

const WEB_ORIGIN = "http://localhost:5173"

function openWeb(path: string) {
  window.open(`${WEB_ORIGIN}${path}`, "_blank", "noopener,noreferrer")
}

export function PanelHeader() {
  const { signedIn, user, route, setRoute, signOut } = useExtension()
  const onSettings = route === "settings"

  return (
    <header className="sticky top-0 z-10 border-b border-border/60 bg-card/95 backdrop-blur-sm">
      <div className="flex items-center justify-between gap-2 px-3 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          {onSettings ? (
            <>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="shrink-0 cursor-pointer"
                onClick={() => setRoute("apply")}
                aria-label="Back to Apply"
              >
                <ArrowLeft className="size-4" />
              </Button>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  Settings
                </p>
                <p className="truncate text-2xs text-muted-foreground">
                  Auto Apply
                </p>
              </div>
            </>
          ) : (
            <>
              <AppLogo className="size-8 shrink-0 rounded-lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  Auto Apply
                </p>
                <p className="truncate text-2xs text-muted-foreground">
                  MockMatch
                </p>
              </div>
            </>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          {!onSettings ? <ThemeToggle /> : null}
          {signedIn && user ? (
            <UserMenu
              user={{
                name: user.fullName,
                email: user.email,
                avatarUrl: user.avatarUrl,
              }}
              side="bottom"
              align="end"
              contentClassName="w-56"
              items={[
                {
                  label: "Settings",
                  icon: SlidersHorizontal,
                  onSelect: () => setRoute("settings"),
                },
                {
                  label: "Account settings",
                  icon: Settings,
                  onSelect: () => openWeb("/account-settings"),
                },
                {
                  label: "Help",
                  icon: LifeBuoy,
                  onSelect: () => openWeb("/help"),
                },
              ]}
              logoutItem={{
                label: "Sign out",
                icon: LogOut,
                destructive: true,
                onSelect: signOut,
              }}
              triggerRender={
                <button
                  type="button"
                  className="flex cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  aria-label={`Account: ${user.fullName}`}
                />
              }
              trigger={
                <Avatar key={user.avatarUrl ?? "no-avatar"} size="sm">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.fullName} />
                  ) : null}
                  <AvatarFallback className="bg-primary/10 text-2xs font-semibold text-primary">
                    {user.initials}
                  </AvatarFallback>
                </Avatar>
              }
            />
          ) : null}
        </div>
      </div>
    </header>
  )
}
