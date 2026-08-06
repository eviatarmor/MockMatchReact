import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { DocumentScoreBadge } from "@/components/data/document-score-badge"
import { EntityRowActions } from "@/components/data/entity-row-actions"
import { columnCellClass } from "@/lib/column-visibility"
import { formatRelativeTime } from "@/lib/format-relative-time"
import { avatarClassFor, titleToAvatarText } from "@/lib/title-avatar"
import { practicePathForTrackId } from "../lib/practice-path"
import { SessionStatusBadge } from "./session-status-badge"
import type { RecentSession } from "../types"

interface SessionTableRowProps {
  readonly session: RecentSession
  readonly onDelete: () => void
  readonly isDeleting?: boolean
  readonly isColumnVisible?: (columnId: string) => boolean
}

const BANK_PRACTICE_PATH =
  /^\/simulations\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function trackPathOrFallback(trackId: string | undefined): string {
  if (!trackId) return "/simulations/tracks"
  return practicePathForTrackId(trackId) ?? "/simulations/tracks"
}

/** Bank practice reopens durable board/workspace; catalog freeform keeps workspace id. */
function appendWorkspaceQuery(path: string, session: RecentSession): string {
  if (BANK_PRACTICE_PATH.test(path)) return path
  const workspaceId = session._workspaceId ?? session.workspaceId
  if (!workspaceId) return path
  return `${path}?id=${workspaceId}`
}

function resolveSessionPath(session: RecentSession): string {
  return appendWorkspaceQuery(trackPathOrFallback(session.trackId), session)
}

export function SessionTableRow({
  session,
  onDelete,
  isDeleting,
  isColumnVisible = () => true,
}: SessionTableRowProps) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const avatarText = titleToAvatarText(session.title)
  const avatarClass = avatarClassFor(avatarText)
  const openSession = () => navigate(resolveSessionPath(session))

  return (
    <tr className="group border-b border-border/40 transition-colors hover:bg-muted/5">
      <td className={columnCellClass(isColumnVisible("session"), "px-4 py-3")}>
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

      <td className={columnCellClass(isColumnVisible("score"), "px-4 py-3 text-center")}>
        <DocumentScoreBadge score={session.score} />
      </td>

      <td className={columnCellClass(isColumnVisible("status"), "px-4 py-3")}>
        <SessionStatusBadge status={session.status} />
      </td>

      <td
        className={columnCellClass(
          isColumnVisible("updated"),
          "hidden px-4 py-3 text-sm text-muted-foreground sm:table-cell"
        )}
      >
        {formatRelativeTime(session.updatedAt)}
      </td>

      <td className={columnCellClass(isColumnVisible("actions"), "px-4 py-3 text-right")}>
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
