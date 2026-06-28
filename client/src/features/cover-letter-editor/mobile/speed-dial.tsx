import { Plus } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import {
  SpeedDial as SpeedDialRoot,
  SpeedDialTrigger,
  SpeedDialContent,
  SpeedDialItem,
  SpeedDialLabel,
  SpeedDialAction,
} from "@/components/ui/speed-dial"

export interface SpeedDialAction {
  readonly id: string
  readonly icon: LucideIcon
  readonly label: string
  readonly onClick: () => void
}

interface SpeedDialProps {
  readonly actions: readonly SpeedDialAction[]
  readonly openLabel: string
}

/**
 * Bottom-right floating action button (diceui speed-dial) that fans its actions
 * straight up. Fixed to the viewport so it stays pinned while the card scrolls.
 */
export function SpeedDial({ actions, openLabel }: SpeedDialProps) {
  return (
    <SpeedDialRoot side="top" className="fixed bottom-6 right-6 z-40">
      <SpeedDialTrigger aria-label={openLabel} className="size-14 [&_svg]:size-6 [&_svg]:transition-transform data-[state=open]:[&_svg]:rotate-45">
        <Plus />
      </SpeedDialTrigger>
      <SpeedDialContent>
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <SpeedDialItem key={action.id}>
              <SpeedDialLabel>{action.label}</SpeedDialLabel>
              <SpeedDialAction aria-label={action.label} onClick={action.onClick}>
                <Icon />
              </SpeedDialAction>
            </SpeedDialItem>
          )
        })}
      </SpeedDialContent>
    </SpeedDialRoot>
  )
}
