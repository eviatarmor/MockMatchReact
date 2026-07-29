import { useTranslation } from "react-i18next"
import { Users } from "lucide-react"
import { Link } from "react-router-dom"

interface RoomFullGateProps {
  readonly backHref: string
  readonly message?: string | null
}

export function RoomFullGate({ backHref, message }: RoomFullGateProps) {
  const { t } = useTranslation("collab")
  return (
    <div className="flex h-full min-h-[50vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <Users className="size-10 text-muted-foreground" />
      <div className="space-y-1">
        <h2 className="text-lg font-semibold">{t("roomFull.title")}</h2>
        <p className="max-w-sm text-sm text-muted-foreground">
          {message || t("roomFull.description")}
        </p>
      </div>
      <Link
        to={backHref}
        className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
      >
        {t("roomFull.back")}
      </Link>
    </div>
  )
}
