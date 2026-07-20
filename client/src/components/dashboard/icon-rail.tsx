import { useTranslation } from "react-i18next"
import { Link, useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"
import { forceLogout } from "@/lib/auth/session-guard"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { UserMenu, initials } from "@/components/ui/user-menu"
import { AppLogo } from "@/components/icons/app-logo"
import {
  NAV_SECTIONS,
  MOCK_USER,
  USER_MENU_ACTIONS,
  USER_MENU_LOGOUT,
} from "@/components/dashboard/constants"

const USER_MENU_ROUTES: Record<string, string> = {
  "userMenu.accountSettings": "/account-settings",
  "userMenu.billing": "/billing",
  "userMenu.privacy": "/privacy",
}

interface IconRailProps {
  readonly activeSectionId: string
  readonly onNavigate?: () => void
}

// Far-left icon-only column: brand mark, one icon per nav section, user avatar.
// Selecting a section navigates to its first route, which drives the label column.
export function IconRail({ activeSectionId, onNavigate }: IconRailProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const user = MOCK_USER

  return (
    <nav className="flex w-14 shrink-0 flex-col items-center gap-1 bg-sidebar py-3 text-sidebar-foreground">
      <Link to="/" aria-label={t("appName")} className="mb-2 flex size-9 items-center justify-center">
        <AppLogo className="size-7" />
      </Link>

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
          <Avatar size="sm">
            <AvatarImage src={user.avatarUrl} alt={user.name} />
            <AvatarFallback>{initials(user.name)}</AvatarFallback>
          </Avatar>
        }
      />
    </nav>
  )
}
