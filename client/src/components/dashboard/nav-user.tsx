import { ChevronsUpDown } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { MOCK_USER, USER_MENU_ACTIONS, USER_MENU_LOGOUT } from "@/components/dashboard/constants"

const itemClass = "p-2 text-sm font-medium cursor-pointer gap-2"

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function NavUser() {
  const { t } = useTranslation("common")
  const { isMobile } = useSidebar()
  const user = MOCK_USER

  return (
    <SidebarFooter>
      <SidebarMenu>
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger
              className="w-full cursor-pointer"
              render={<SidebarMenuButton size="lg" className="cursor-pointer" />}
            >
              <Avatar size="sm">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col overflow-hidden text-left">
                <span className="truncate text-sm font-medium">{user.name}</span>
                <span className="truncate text-xs text-muted-foreground">{user.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </DropdownMenuTrigger>

            <DropdownMenuContent
              side={isMobile ? "bottom" : "right"}
              align="end"
              className="w-(--anchor-width) min-w-56 rounded-lg"
            >
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center gap-3 px-2 py-1.5">
                  <Avatar size="sm">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{initials(user.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col overflow-hidden">
                    <span className="truncate text-sm font-medium text-popover-foreground">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuGroup>
                {USER_MENU_ACTIONS.map(({ labelKey, icon: Icon }) => (
                  <DropdownMenuItem key={labelKey} className={itemClass}>
                    <Icon size={16} />
                    <span>{t(labelKey)}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="destructive" className={itemClass}>
                <USER_MENU_LOGOUT.icon size={16} />
                <span>{t(USER_MENU_LOGOUT.labelKey)}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  )
}
