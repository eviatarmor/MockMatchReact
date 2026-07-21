import { useEffect, useRef } from "react"
import type { FieldValues, UseFormReturn } from "react-hook-form"

export interface UseDebouncedFormSaveOptions<T extends FieldValues> {
  readonly form: UseFormReturn<T>
  readonly debounceMs: number
  /** When false, skip watching (e.g. still loading defaults). */
  readonly enabled?: boolean
  /** Run form validation before save. Default true. */
  readonly validate?: boolean
  readonly onSave: (values: T) => void
}

/**
 * Shared debounced autosave for RHF forms (account settings, privacy, etc.).
 * Domain hooks supply mutate + toast; this owns watch/debounce only.
 */
export function useDebouncedFormSave<T extends FieldValues>({
  form,
  debounceMs,
  enabled = true,
  validate = true,
  onSave,
}: UseDebouncedFormSaveOptions<T>): void {
  const onSaveRef = useRef(onSave)
  onSaveRef.current = onSave
  const skipFirstRef = useRef(true)

  useEffect(() => {
    skipFirstRef.current = true
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const timeoutRef = { current: undefined as number | undefined }

    const subscription = form.watch(() => {
      if (skipFirstRef.current) {
        skipFirstRef.current = false
        return
      }

      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(async () => {
        if (validate) {
          const valid = await form.trigger()
          if (!valid) return
        }
        onSaveRef.current(form.getValues())
      }, debounceMs)
    })

    return () => {
      subscription.unsubscribe()
      window.clearTimeout(timeoutRef.current)
    }
  }, [form, debounceMs, enabled, validate])
}
