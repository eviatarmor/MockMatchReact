import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Copy, Share2 } from "lucide-react"
import { Button } from "@mockmatch/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mockmatch/ui/dropdown-menu"
import { TelegramIcon } from "@/components/icons/telegram-icon"
import { WhatsappIcon } from "@/components/icons/whatsapp-icon"
import {
  formatJobShareText,
  jobPageAbsoluteUrl,
  telegramShareUrl,
  whatsappShareUrl,
} from "../lib/share-job"
import type { DiscoverJob } from "../types"

interface JobShareMenuProps {
  readonly job: DiscoverJob
  /** Icon-only trigger (footer) vs labeled. */
  readonly variant?: "icon" | "button"
}

export function JobShareMenu({ job, variant = "icon" }: JobShareMenuProps) {
  const { t } = useTranslation("common")
  const pageUrl = jobPageAbsoluteUrl(job.id)
  const shareText = formatJobShareText(job, pageUrl)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareText)
      toast.success(t("discover.share.copied"))
    } catch {
      toast.error(t("discover.share.copyFailed"))
    }
  }

  function openShare(url: string) {
    window.open(url, "_blank", "noopener,noreferrer")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          variant === "icon" ? (
            <Button
              variant="ghost"
              size="icon-sm"
              className="cursor-pointer text-muted-foreground"
              title={t("discover.share.menu")}
            />
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 cursor-pointer"
            />
          )
        }
      >
        <Share2 className="size-4" />
        {variant === "button" ? t("discover.share.menu") : null}
        {variant === "icon" ? (
          <span className="sr-only">{t("discover.share.menu")}</span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-48">
        <DropdownMenuItem className="cursor-pointer" onClick={() => void handleCopy()}>
          <Copy className="size-4" />
          {t("discover.share.copy")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => openShare(whatsappShareUrl(shareText))}
        >
          <WhatsappIcon className="size-4" />
          {t("discover.share.whatsapp")}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => openShare(telegramShareUrl(shareText, pageUrl))}
        >
          <TelegramIcon className="size-4" />
          {t("discover.share.telegram")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
