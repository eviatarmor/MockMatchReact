import { useTranslation } from "react-i18next"
import { DoorOpen, Users } from "lucide-react"
import { Link } from "react-router-dom"

interface RoomFullGateProps {
  readonly backHref: string
  readonly message?: string | null
  /** `full` = seat cap; `closed` = owner left / session ended. */
  readonly variant?: "full" | "closed"
}

export function RoomFullGate({
  backHref,
  message,
  variant = "full",
}: RoomFullGateProps) {
  const { t } = useTranslation("collab")
  const closed = variant === "closed"
  const Icon = closed ? DoorOpen : Users
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <Icon className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">
          {closed ? t("roomClosed.title") : t("roomFull.title")}
        </h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {message ||
            (closed
              ? t("roomClosed.description")
              : t("roomFull.description"))}
        </p>
      </div>
      <Link
        to={backHref}
        className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
      >
        {closed ? t("roomClosed.back") : t("roomFull.back")}
      </Link>
    </div>
  )
}
