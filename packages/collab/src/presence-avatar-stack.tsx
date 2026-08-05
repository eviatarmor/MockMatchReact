import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback, AvatarImage } from "@mockmatch/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { cn } from "@mockmatch/ui/utils"
import type { CollabPeer } from "./types"

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase()
}

interface PresenceAvatarStackProps {
  readonly self: CollabPeer | null
  readonly peers: readonly CollabPeer[]
  readonly className?: string
}

/**
 * Presence avatars for live collab. Always includes **you** first when `self`
 * is set, then remote peers (deduped by userId). Uses account `avatarUrl` when set.
 */
export function PresenceAvatarStack({
  self,
  peers,
  className,
}: PresenceAvatarStackProps) {
  const { t } = useTranslation("collab")

  const all: CollabPeer[] = []
  const seen = new Set<string>()
  if (self?.userId) {
    all.push(self)
    seen.add(self.userId)
  }
  for (const p of peers) {
    if (!p?.userId || seen.has(p.userId)) continue
    all.push(p)
    seen.add(p.userId)
  }

  if (all.length === 0) return null

  const selfId = self?.userId ?? null

  return (
    <TooltipProvider delay={200}>
      <div
        className={cn("flex items-center -space-x-2", className)}
        aria-label={t("presence.stackLabel", { count: all.length })}
      >
        {all.map((p) => {
          const isYou = selfId != null && p.userId === selfId
          const photo = p.avatarUrl?.trim() || null
          return (
            <Tooltip key={p.userId}>
              <TooltipTrigger
                type="button"
                className={cn(
                  "inline-flex shrink-0 rounded-full ring-2 ring-background",
                  isYou && "z-[1]"
                )}
                style={{ boxShadow: `0 0 0 2px ${p.color}` }}
              >
                <Avatar size="sm" className="border-2 border-background">
                  {photo ? (
                    <AvatarImage src={photo} alt={p.name || t("presence.you")} />
                  ) : null}
                  <AvatarFallback
                    className="text-[10px] font-semibold text-white"
                    style={{ backgroundColor: p.color }}
                  >
                    {initials(p.name || "?")}
                  </AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                {p.name || t("presence.you")}
                {isYou ? ` (${t("presence.you")})` : ""}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
