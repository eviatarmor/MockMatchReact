import { useTranslation } from "react-i18next"
import { Avatar, AvatarFallback } from "@mockmatch/ui/avatar"
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

export function PresenceAvatarStack({
  self,
  peers,
  className,
}: PresenceAvatarStackProps) {
  const { t } = useTranslation("collab")
  const all = self ? [self, ...peers] : [...peers]
  if (all.length === 0) return null

  return (
    <TooltipProvider delay={200}>
      <div
        className={cn("flex items-center -space-x-2", className)}
        aria-label={t("presence.stackLabel", { count: all.length })}
      >
        {all.map((p) => (
          <Tooltip key={p.userId}>
            <TooltipTrigger
              className="inline-flex rounded-full ring-2 ring-background"
              style={{ boxShadow: `0 0 0 2px ${p.color}` }}
            >
              <Avatar size="sm" className="border-2 border-background">
                <AvatarFallback
                  className="text-[10px] font-semibold text-white"
                  style={{ backgroundColor: p.color }}
                >
                  {initials(p.name)}
                </AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              {p.name}
              {self?.userId === p.userId ? ` (${t("presence.you")})` : ""}
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
    </TooltipProvider>
  )
}
