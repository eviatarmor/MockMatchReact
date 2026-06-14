import { ChevronsUpDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { UserMenu, initials } from "@/components/ui/user-menu"
import { MOCK_USER, USER_MENU_ACTIONS, USER_MENU_LOGOUT } from "@/components/dashboard/constants"

export function NavUser() {
  const { t } = useTranslation("common")
  const user = MOCK_USER

  return (
    <SidebarFooter className="p-0">
      <SidebarMenu>
        <SidebarMenuItem>
          <UserMenu
            user={user}
            side="right"
            align="end"
            contentClassName="w-64"
            items={USER_MENU_ACTIONS.map(({ labelKey, icon }) => ({ label: t(labelKey), icon }))}
            logoutItem={{
              label: t(USER_MENU_LOGOUT.labelKey),
              icon: USER_MENU_LOGOUT.icon,
              destructive: USER_MENU_LOGOUT.destructive,
            }}
            triggerRender={<SidebarMenuButton size="lg" className="cursor-pointer group-data-[collapsible=icon]:justify-center" />}
            trigger={
              <>
                <Avatar size="sm">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback>{initials(user.name)}</AvatarFallback>
                </Avatar>
                <div className="flex flex-col overflow-hidden text-left group-data-[collapsible=icon]:hidden">
                  <span className="truncate text-sm font-medium">{user.name}</span>
                  <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
              </>
            }
          />
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
