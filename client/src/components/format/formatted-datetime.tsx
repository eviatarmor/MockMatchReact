import { formatDate, formatDateTime, formatTime } from "@/lib/format-datetime"
import { useRegionPreferences } from "@/hooks/use-region-preferences"
import { cn } from "@/lib/utils"
import type { DateTimeInput } from "@/lib/format-datetime"

interface FormattedValueProps {
  readonly value: DateTimeInput
  readonly className?: string
}

/** Renders a date using the user's region date format. */
export function FormattedDate({ value, className }: FormattedValueProps) {
  const { dateFormat } = useRegionPreferences()
  return <span className={cn(className)}>{formatDate(value, dateFormat)}</span>
}

/** Renders a time using the user's region time format. */
export function FormattedTime({ value, className }: FormattedValueProps) {
  const { timeFormat } = useRegionPreferences()
  return <span className={cn(className)}>{formatTime(value, timeFormat)}</span>
}

/** Renders date + time using the user's region formats. */
export function FormattedDateTime({ value, className }: FormattedValueProps) {
  const { dateFormat, timeFormat } = useRegionPreferences()
  return (
    <span className={cn(className)}>
      {formatDateTime(value, dateFormat, timeFormat)}
    </span>
  )
}
