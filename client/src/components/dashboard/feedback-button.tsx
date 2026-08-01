import { useState } from "react"
import { MessageSquarePlus } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"
import { Button } from "@mockmatch/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@mockmatch/ui/popover"
import { Textarea } from "@mockmatch/ui/textarea"
import { Spinner } from "@mockmatch/ui/spinner"
import { trpc } from "@/lib/trpc"

const MIN_MESSAGE_LENGTH = 10
const MAX_MESSAGE_LENGTH = 2000

export function FeedbackButton() {
  const { t, i18n } = useTranslation("common")
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")

  const submit = trpc.support.submitFeedback.useMutation({
    onSuccess: () => {
      toast.success(t("feedback.success"))
      setMessage("")
      setOpen(false)
    },
    onError: (error) => {
      toast.error(error.message || t("feedback.error"))
    },
  })

  const trimmed = message.trim()
  const canSend =
    trimmed.length >= MIN_MESSAGE_LENGTH &&
    trimmed.length <= MAX_MESSAGE_LENGTH &&
    !submit.isPending

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!canSend) return
    submit.mutate({
      message: trimmed,
      path: pathname,
      locale: i18n.language,
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="cursor-pointer gap-1.5"
            aria-label={t("navbar.feedback")}
          />
        }
      >
        <MessageSquarePlus className="size-3.5" />
        <span className="hidden sm:inline">{t("navbar.feedback")}</span>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        side="bottom"
        className="w-80 gap-3 rounded-xl p-3 shadow-xl shadow-black/10 ring-1 ring-foreground/10 sm:w-96 dark:shadow-black/40"
      >
        <PopoverHeader>
          <PopoverTitle>{t("feedback.title")}</PopoverTitle>
        </PopoverHeader>

        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder={t("feedback.placeholder")}
            maxLength={MAX_MESSAGE_LENGTH}
            rows={4}
            disabled={submit.isPending}
            className="min-h-24 resize-none"
            aria-label={t("feedback.title")}
          />

          <div className="flex items-center gap-3">
            <p className="min-w-0 flex-1 text-xs leading-snug text-muted-foreground">
              {t("feedback.privacy")}
            </p>
            <Button
              type="submit"
              size="sm"
              className="shrink-0 cursor-pointer gap-1.5"
              disabled={!canSend}
            >
              {submit.isPending ? <Spinner className="size-3.5" /> : null}
              {submit.isPending ? t("feedback.sending") : t("feedback.send")}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  )
}
