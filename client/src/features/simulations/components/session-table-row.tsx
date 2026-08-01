import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DocumentScoreBadge } from "@/components/data/document-score-badge"
import { EntityRowActions } from "@/components/data/entity-row-actions"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { avatarClassFor, titleToAvatarText } from "@/lib/title-avatar"
import { idePathForTrackId } from "@/features/simulation-ide/constants"
import { SessionStatusBadge } from "./session-status-badge"
import type { RecentSession } from "../types"

interface SessionTableRowProps {
  readonly session: RecentSession
  readonly onDelete: () => void
  readonly isDeleting?: boolean
}

export function SessionTableRow({
  session,
  onDelete,
  isDeleting,
}: SessionTableRowProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const avatarText = titleToAvatarText(session.title)
  const avatarClass = avatarClassFor(avatarText)

  const openSession = () => {
    if (session.trackId) {
      const path = idePathForTrackId(session.trackId)
      if (path) {
        navigate(path)
        return
      }
    }
    navigate("/simulations/tracks")
  }

  return (
    <tr className="group border-b border-border/40 transition-colors hover:bg-muted/5">
      <td className="px-4 py-3">
        <button
          type="button"
          onClick={openSession}
          className="flex w-full cursor-pointer items-center gap-3 text-left"
        >
          <div
            className={`flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold select-none ${avatarClass}`}
          >
            {avatarText}
          </div>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
              {session.title}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {session.track}
              <span className="mx-1.5 text-border">·</span>
              {session.durationMin}{" "}
              {t("simulations.recentSessions.durationSuffix")}
            </span>
          </div>
        </button>
      </td>

      <td className="px-4 py-3 text-center">
        <DocumentScoreBadge score={session.score} />
      </td>

      <td className="px-4 py-3">
        <SessionStatusBadge status={session.status} />
      </td>

      <td className="hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell">
        {formatRelativeTime(session.updatedAt)}
      </td>

      <td className="px-4 py-3 text-right">
        <EntityRowActions
          translationPrefix="simulations.recentSessions"
          entityTitle={session.title}
          onOpen={openSession}
          onDelete={onDelete}
          isDeleting={isDeleting}
        />
      </td>
    </tr>
  )
}
