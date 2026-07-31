import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { PanelLeftOpen } from "lucide-react"
import { cn } from "@/lib/utils"
import { forceLogout } from "@/lib/auth/session-guard"
import { Avatar, AvatarFallback, AvatarImage } from "@mockmatch/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@mockmatch/ui/tooltip"
import { UserMenu, initials } from "@mockmatch/ui/user-menu"
import { AppLogo } from "@/components/icons/app-logo"
import {
  NAV_SECTIONS,
  USER_MENU_ACTIONS,
  USER_MENU_LOGOUT,
} from "@/components/dashboard/constants"
import { getUser } from "@/lib/auth/session"
import { trpc } from "@/lib/trpc"

const USER_MENU_ROUTES: Record<string, string> = {
  "userMenu.accountSettings": "/account-settings",
  "userMenu.billing": "/billing",
  "userMenu.privacy": "/privacy",
  "userMenu.help": "/help",
}

interface IconRailProps {
  readonly activeSectionId: string
  readonly onNavigate?: () => void
  /** When section-nav is collapsed, logo morphs to expand icon on rail hover. */
  readonly collapsed?: boolean
  readonly onExpand?: () => void
}

// Far-left icon-only column: brand mark, one icon per nav section, user avatar.
// Selecting a section navigates to its first route, which drives the label column.
export function IconRail({
  activeSectionId,
  onNavigate,
  collapsed = false,
  onExpand,
}: IconRailProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const me = trpc.auth.me.useQuery(undefined, { staleTime: 60_000 })
  const sessionUser = getUser()
  const user = {
    name:
      me.data?.fullName ||
      sessionUser?.fullName ||
      me.data?.email ||
      sessionUser?.email ||
      t("appName"),
    email: me.data?.email || sessionUser?.email || "",
    avatarUrl: me.data?.avatarUrl ?? undefined,
  }

  return (
    <nav className="group/rail flex w-14 shrink-0 flex-col items-center gap-1 bg-sidebar py-3 text-sidebar-foreground">
      {/* Fixed size-9 slot — same footprint expanded/collapsed so rail icons don't jump. */}
      {collapsed ? (
        <button
          type="button"
          onClick={onExpand}
          aria-label={t("nav.expand")}
          className="relative mb-2 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
        >
          {/* Logo → expand icon on hover of entire rail (group/rail). */}
          <AppLogo
            className={cn(
              "size-7 transition-all duration-200 ease-out",
              "group-hover/rail:scale-50 group-hover/rail:opacity-0 group-hover/rail:rotate-90"
            )}
          />
          <PanelLeftOpen
            className={cn(
              "pointer-events-none absolute size-4",
              "scale-50 opacity-0 -rotate-90 transition-all duration-200 ease-out",
              "group-hover/rail:scale-100 group-hover/rail:opacity-100 group-hover/rail:rotate-0"
            )}
            aria-hidden
          />
        </button>
      ) : (
        <Link
          to="/"
          aria-label={t("appName")}
          className="mb-2 flex size-9 shrink-0 items-center justify-center"
        >
          <AppLogo className="size-7" />
        </Link>
      )}

      <div className="flex flex-1 flex-col items-center gap-1">
        {NAV_SECTIONS.map((section) => {
          const Icon = section.icon
          const isActive = section.id === activeSectionId
          const target = section.items[0]?.href ?? "/"
          return (
            <Tooltip key={section.id}>
              <TooltipTrigger
                render={
                  <button
                    type="button"
                    onClick={() => {
                      onNavigate?.()
                      navigate(target)
                    }}
                    aria-pressed={isActive}
                    aria-label={t(section.labelKey)}
                    className={cn(
                      "flex size-9 cursor-pointer items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-foreground"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                    )}
                  />
                }
              >
                <Icon className="size-[18px]" />
              </TooltipTrigger>
              <TooltipContent side="right">{t(section.labelKey)}</TooltipContent>
            </Tooltip>
          )
        })}
      </div>

      <UserMenu
        user={user}
        side="right"
        align="end"
        contentClassName="w-64"
        items={USER_MENU_ACTIONS.map(({ labelKey, icon }) => {
          const route = USER_MENU_ROUTES[labelKey]
          return {
            label: t(labelKey),
            icon,
            onSelect: route ? () => navigate(route) : undefined,
          }
        })}
        logoutItem={{
          label: t(USER_MENU_LOGOUT.labelKey),
          icon: USER_MENU_LOGOUT.icon,
          destructive: USER_MENU_LOGOUT.destructive,
          onSelect: () => {
            void forceLogout(queryClient)
          },
        }}
        triggerRender={
          <button type="button" className="mt-1 flex cursor-pointer items-center justify-center rounded-full" aria-label={user.name} />
        }
        trigger={
          <Avatar key={user.avatarUrl ?? "no-avatar"} size="sm">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            ) : null}
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
        }
      />
    </nav>
  )
}
