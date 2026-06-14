import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
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

export interface UserMenuUser {
  readonly name: string
  readonly email: string
  readonly avatarUrl?: string
}

export interface UserMenuItem {
  readonly label: string
  readonly icon: LucideIcon
  readonly destructive?: boolean
  readonly onSelect?: () => void
}

export interface UserMenuProps {
  readonly user: UserMenuUser
  readonly items: UserMenuItem[]
  readonly logoutItem?: UserMenuItem
  readonly trigger: ReactNode
  readonly triggerRender?: React.ReactElement
  readonly side?: "top" | "right" | "bottom" | "left"
  readonly align?: "start" | "center" | "end"
  readonly contentClassName?: string
}

const itemClass = "p-2 text-sm font-medium cursor-pointer gap-2"

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase()
}

export function UserMenu({
  user,
  items,
  logoutItem,
  trigger,
  triggerRender,
  side = "bottom",
  align = "end",
  contentClassName,
}: UserMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer" render={triggerRender}>
        {trigger}
      </DropdownMenuTrigger>

      <DropdownMenuContent side={side} align={align} className={contentClassName}>
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
          {items.map(({ label, icon: Icon, destructive, onSelect }) => (
            <DropdownMenuItem
              key={label}
              variant={destructive ? "destructive" : "default"}
              className={itemClass}
              onClick={onSelect}
            >
              <Icon size={16} />
              <span>{label}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>

        {logoutItem && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant={logoutItem.destructive ? "destructive" : "default"}
              className={itemClass}
              onClick={logoutItem.onSelect}
            >
              <logoutItem.icon size={16} />
              <span>{logoutItem.label}</span>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
