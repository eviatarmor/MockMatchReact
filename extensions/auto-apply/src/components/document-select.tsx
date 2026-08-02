import { Label } from "@mockmatch/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mockmatch/ui/select"

interface DocOption {
  readonly id: string
  readonly title: string
  readonly updatedLabel: string
  readonly isFit?: boolean
}

/** Account-settings-style field select for resume / cover letter. */
export function DocumentSelect({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
  emptyHint,
}: {
  readonly id: string
  readonly label: string
  readonly value: string | null
  readonly options: readonly DocOption[]
  readonly placeholder: string
  readonly onChange: (id: string) => void
  readonly emptyHint?: string
}) {
  if (options.length === 0) {
    return (
      <div className="space-y-1.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-xs text-muted-foreground">
          {emptyHint ?? "Nothing here yet."}
        </p>
      </div>
    )
  }

  const items = options.map((o) => ({
    value: o.id,
    label: o.isFit ? `${o.title} · Fit` : o.title,
  }))

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value ?? undefined}
        onValueChange={(next) => {
          if (typeof next === "string") onChange(next)
        }}
        items={items}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent align="start">
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              <span className="flex min-w-0 flex-col items-start gap-0.5">
                <span className="truncate font-medium">
                  {o.title}
                  {o.isFit ? " · Fit" : ""}
                </span>
                <span className="text-2xs text-muted-foreground">
                  {o.updatedLabel}
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
