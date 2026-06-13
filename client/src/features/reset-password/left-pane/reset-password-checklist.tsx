import { CaseSensitive, Hash, Lock, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ResetPasswordChecklistItem } from "@/features/reset-password/types"

interface ResetPasswordChecklistProps {
  readonly items: readonly ResetPasswordChecklistItem[]
}

const ICONS: Record<ResetPasswordChecklistItem["icon"], LucideIcon> = {
  lock: Lock,
  case: CaseSensitive,
  hash: Hash,
}

export function ResetPasswordChecklist({ items }: ResetPasswordChecklistProps) {
  const { t } = useTranslation("reset-password")

  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => {
        const Icon = ICONS[item.icon]

        return (
          <li key={item.id} className="flex items-center gap-3">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-semibold">
              <Icon className="size-3.5" />
            </span>
            <span className="text-sm font-semibold text-white">{t(item.labelKey)}</span>
          </li>
        )
      })}
    </ul>
  )
}
