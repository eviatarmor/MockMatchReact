import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mockmatch/ui/select"

export function FieldSelect<TValue extends string>({
  id,
  value,
  onChange,
  items,
}: {
  readonly id: string
  readonly value: TValue
  readonly onChange: (value: TValue) => void
  readonly items: readonly { value: TValue; label: string }[]
}) {
  return (
    <Select
      value={value}
      onValueChange={(next) => onChange(next as TValue)}
      items={items.map((i) => ({ value: i.value, label: i.label }))}
    >
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
