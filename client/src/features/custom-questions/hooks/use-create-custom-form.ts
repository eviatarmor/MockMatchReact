import { useCallback, useState } from "react"
import { defaultFormState } from "../constants"
import type { CreateCustomFormState, QuestionFormat } from "../types"

export function useCreateCustomForm(initialFormat?: QuestionFormat) {
  const [form, setForm] = useState<CreateCustomFormState>(() =>
    defaultFormState(initialFormat)
  )

  const setField = useCallback(
    <K extends keyof CreateCustomFormState>(
      key: K,
      value: CreateCustomFormState[K]
    ) => {
      setForm((prev) => ({ ...prev, [key]: value }))
    },
    []
  )

  const selectFormat = useCallback((format: QuestionFormat) => {
    setForm((prev) => ({ ...prev, format }))
  }, [])

  const setOption = useCallback((index: number, value: string) => {
    setForm((prev) => {
      const options = [...prev.options]
      options[index] = value
      return { ...prev, options }
    })
  }, [])

  const addOption = useCallback(() => {
    setForm((prev) => {
      if (prev.options.length >= 6) return prev
      return { ...prev, options: [...prev.options, ""] }
    })
  }, [])

  const removeOption = useCallback((index: number) => {
    setForm((prev) => {
      if (prev.options.length <= 2) return prev
      const options = prev.options.filter((_, i) => i !== index)
      return {
        ...prev,
        options,
        correctIndex: Math.min(prev.correctIndex, options.length - 1),
        correctIndices: prev.correctIndices.filter((i) => i < options.length),
      }
    })
  }, [])

  const toggleCorrectIndex = useCallback((index: number) => {
    setForm((prev) => {
      if (prev.mcqVariant === "multi") {
        const set = new Set(prev.correctIndices)
        if (set.has(index)) set.delete(index)
        else set.add(index)
        return { ...prev, correctIndices: [...set].sort((a, b) => a - b) }
      }
      return { ...prev, correctIndex: index }
    })
  }, [])

  const reset = useCallback((format?: QuestionFormat) => {
    setForm(defaultFormState(format ?? form.format))
  }, [form.format])

  return {
    form,
    setField,
    selectFormat,
    setOption,
    addOption,
    removeOption,
    toggleCorrectIndex,
    reset,
  }
}
