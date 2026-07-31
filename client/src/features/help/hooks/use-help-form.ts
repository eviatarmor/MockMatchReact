import { useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import {
  encodeSupportPhotos,
  usePhotoAttachments,
} from "@/components/support/photo-attachments-field"
import {
  DEFAULT_HELP_TOPIC,
  MAX_HELP_MESSAGE_LENGTH,
  MAX_HELP_SUBJECT_LENGTH,
  MIN_HELP_MESSAGE_LENGTH,
} from "@/features/help/constants"
import type { HelpFormValues, HelpTopic } from "@/features/help/types"
import { trpc } from "@/lib/trpc"

const emptyForm = (): HelpFormValues => ({
  topic: DEFAULT_HELP_TOPIC,
  subject: "",
  message: "",
})

export function useHelpForm() {
  const { t } = useTranslation("help")
  const [values, setValues] = useState<HelpFormValues>(emptyForm)
  const [encoding, setEncoding] = useState(false)
  const { photos, setPhotos, clearPhotos } = usePhotoAttachments()

  const submit = trpc.support.submitRequest.useMutation({
    onSuccess: () => {
      toast.success(t("toast.success"))
      setValues(emptyForm())
      clearPhotos()
    },
    onError: (error) => {
      toast.error(error.message || t("toast.error"))
    },
  })

  const messageTrimmed = values.message.trim()
  const subjectTrimmed = values.subject.trim()
  const isPending = encoding || submit.isPending
  const canSubmit =
    messageTrimmed.length >= MIN_HELP_MESSAGE_LENGTH &&
    messageTrimmed.length <= MAX_HELP_MESSAGE_LENGTH &&
    subjectTrimmed.length <= MAX_HELP_SUBJECT_LENGTH &&
    !isPending

  function setTopic(topic: HelpTopic) {
    setValues((prev) => ({ ...prev, topic }))
  }

  function setSubject(subject: string) {
    setValues((prev) => ({ ...prev, subject }))
  }

  function setMessage(message: string) {
    setValues((prev) => ({ ...prev, message }))
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSubmit) return
    setEncoding(true)
    try {
      const attachments =
        photos.length > 0 ? await encodeSupportPhotos(photos) : undefined
      await submit.mutateAsync({
        topic: values.topic,
        subject: subjectTrimmed || undefined,
        message: messageTrimmed,
        attachments,
      })
    } catch {
      // toast in mutation
    } finally {
      setEncoding(false)
    }
  }

  return {
    values,
    setTopic,
    setSubject,
    setMessage,
    photos,
    setPhotos,
    canSubmit,
    isPending,
    handleSubmit,
  }
}
