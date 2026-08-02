import { Avatar, AvatarFallback } from "@mockmatch/ui/avatar"
import { Card, CardContent } from "@mockmatch/ui/card"
import type { ProfileSummary } from "../types"

/** Always-visible profile block at top of Apply (fills from this data). */
export function ProfileSummaryCard({
  profile,
  initials,
}: {
  readonly profile: ProfileSummary
  readonly initials: string
}) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <Avatar size="lg">
            <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">
              {profile.fullName}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {profile.email}
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-1 gap-1.5 border-t border-border/60 pt-3 text-xs">
          {(
            [
              ["Phone", profile.phone],
              ["LinkedIn", profile.linkedIn],
              ["Location", profile.location],
            ] as const
          ).map(([k, v]) => (
            <div key={k} className="flex justify-between gap-2">
              <dt className="shrink-0 text-muted-foreground">{k}</dt>
              <dd className="truncate text-right font-medium text-foreground">
                {v}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  )
}
