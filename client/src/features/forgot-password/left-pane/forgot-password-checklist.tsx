import { Lock, Mail, Timer, type LucideIcon } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { ForgotPasswordChecklistItem } from "@/features/forgot-password/types"

interface ForgotPasswordChecklistProps {
  readonly items: readonly ForgotPasswordChecklistItem[]
}

const ICONS: Record<ForgotPasswordChecklistItem["icon"], LucideIcon> = {
  mail: Mail,
  timer: Timer,
  lock: Lock,
}

export function ForgotPasswordChecklist({ items }: ForgotPasswordChecklistProps) {
  const { t } = useTranslation("forgot-password")

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
