import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import { Checkbox } from "@/components/ui/checkbox"
import type { PrepTask } from "../types"

interface PrepTaskRowProps {
  readonly task: PrepTask
}

export function PrepTaskRow({ task }: PrepTaskRowProps) {
  const { t } = useTranslation("common")
  const ActionIcon = task.actionIcon

  return (
    <div className="flex items-center justify-between gap-3 border-b py-2.5 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <Checkbox checked={task.completed} disabled />
        <span className={cn("text-sm", task.completed && "text-muted-foreground line-through")}>
          {t(task.labelKey)}
        </span>
      </div>
      {task.actionLabelKey && (
        <span className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
          {ActionIcon && <ActionIcon className="size-3.5" />}
          {t(task.actionLabelKey)}
        </span>
      )}
    </div>
  )
}
