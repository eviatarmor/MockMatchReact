import { Bell } from "lucide-react"
import { Button } from "@mockmatch/ui/button"

export function NotificationBell() {
  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-8 w-8 cursor-pointer text-muted-foreground hover:text-foreground"
      aria-label="Notifications"
    >
      <Bell className="size-4" />
      <span className="absolute top-1.5 right-1.5 flex h-1.5 w-1.5 rounded-full bg-destructive" />
    </Button>
  )
}
