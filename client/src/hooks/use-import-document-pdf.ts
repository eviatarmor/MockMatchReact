import { useCallback, useRef, useState, type ChangeEvent } from "react"
import { useNavigate } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { PDF_IMPORT_MAX_BYTES } from "@mockmatch/schemas"
import { fileToBase64 } from "@/lib/file-to-base64"
import { trpc } from "@/lib/trpc"

export type ImportDocumentKind = "resume" | "cover-letter"

/**
 * Shared PDF import for Resume Lab + Cover Letters.
 * Picks a PDF → base64 → tRPC importPdf → navigate to editor.
 */
export function useImportDocumentPdf(kind: ImportDocumentKind) {
  const { t } = useTranslation("common")
  const navigate = useNavigate()
  const utils = trpc.useUtils()
  const inputRef = useRef<HTMLInputElement>(null)
  const [reading, setReading] = useState(false)

  const resumeImport = trpc.resumes.importPdf.useMutation({
    onSuccess: (doc) => {
      utils.resumes.list.invalidate().catch(() => {})
      toast.success(t("resumeLab.table.toast.importSuccess"))
      navigate(`/resumes/${doc.id}`)
    },
    onError: (error) => {
      toast.error(error.message || t("resumeLab.table.toast.importFailed"))
    },
  })

  const letterImport = trpc.coverLetters.importPdf.useMutation({
    onSuccess: (doc) => {
      utils.coverLetters.list.invalidate().catch(() => {})
      toast.success(t("coverLetters.table.toast.importSuccess"))
      navigate(`/cover-letters/${doc.id}`)
    },
    onError: (error) => {
      toast.error(error.message || t("coverLetters.table.toast.importFailed"))
    },
  })

  const mutation = kind === "resume" ? resumeImport : letterImport
  const isPending = reading || mutation.isPending

  const openPicker = useCallback(() => {
    if (isPending) return
    inputRef.current?.click()
  }, [isPending])

  const onFileChange = useCallback(
    async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      // Allow re-selecting the same file later.
      event.target.value = ""
      if (!file) return

      if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        toast.error(t("dashboard.import.invalidType"))
        return
      }
      if (file.size > PDF_IMPORT_MAX_BYTES) {
        toast.error(t("dashboard.import.tooLarge"))
        return
      }

      setReading(true)
      try {
        const pdfBase64 = await fileToBase64(file)
        await mutation.mutateAsync({
          filename: file.name,
          pdfBase64,
        })
      } catch {
        // toast handled in onError / file read
      } finally {
        setReading(false)
      }
    },
    [mutation, t]
  )

  const fileInput = {
    ref: inputRef,
    type: "file" as const,
    accept: "application/pdf,.pdf",
    className: "hidden",
    onChange: onFileChange,
    "aria-hidden": true as const,
    tabIndex: -1,
  }

  return {
    openPicker,
    fileInput,
    isPending,
  }
}
