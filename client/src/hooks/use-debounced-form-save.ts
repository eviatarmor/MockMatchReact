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
 *
 * Flushes a pending save on unmount so navigating away mid-debounce still persists
 * (e.g. change country → Discover before 1s timer fires).
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
  const formRef = useRef(form)
  formRef.current = form
  const validateRef = useRef(validate)
  validateRef.current = validate

  useEffect(() => {
    skipFirstRef.current = true
  }, [enabled])

  useEffect(() => {
    if (!enabled) return

    const timeoutRef = { current: undefined as number | undefined }
    /** True while a change is waiting for the debounce timer. */
    let pending = false

    const runSave = async () => {
      pending = false
      if (validateRef.current) {
        const valid = await formRef.current.trigger()
        if (!valid) return
      }
      onSaveRef.current(formRef.current.getValues())
    }

    const subscription = form.watch(() => {
      if (skipFirstRef.current) {
        skipFirstRef.current = false
        return
      }

      pending = true
      window.clearTimeout(timeoutRef.current)
      timeoutRef.current = window.setTimeout(() => {
        void runSave()
      }, debounceMs)
    })

    return () => {
      subscription.unsubscribe()
      window.clearTimeout(timeoutRef.current)
      // Leave settings mid-debounce → still persist latest form values.
      if (pending) {
        void runSave()
      }
    }
  }, [form, debounceMs, enabled])
}
