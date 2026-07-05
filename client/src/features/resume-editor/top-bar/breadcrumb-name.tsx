import { useEffect, useRef, useState } from "react"

interface BreadcrumbNameProps {
  readonly value: string
  readonly onChange: (next: string) => void
}

/** Inline-editable breadcrumb segment for the resume name. Click to rename. */
export function BreadcrumbName({ value, onChange }: BreadcrumbNameProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (editing) inputRef.current?.select()
  }, [editing])

  const commit = () => {
    const trimmed = draft.trim()
    onChange(trimmed === "" ? value : trimmed)
    setEditing(false)
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === "Enter") commit()
          if (event.key === "Escape") {
            setDraft(value)
            setEditing(false)
          }
        }}
        className="h-6 w-40 rounded-sm border border-input bg-background px-1.5 text-sm font-medium text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => {
        setDraft(value)
        setEditing(true)
      }}
      className="max-w-48 cursor-text truncate rounded-sm px-1 py-0.5 text-sm font-medium text-foreground hover:bg-muted"
      title={value}
    >
      {value}
    </button>
  )
}
