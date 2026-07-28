import type { ComponentType } from "react"
import { useTranslation } from "react-i18next"
import { AnimatePresence, motion } from "motion/react"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@mockmatch/ui/tooltip"
import { GoogleIcon } from "@/components/icons/google-icon"
import { MicrosoftIcon } from "@/components/icons/microsoft-icon"
import { AppleIcon } from "@/components/icons/apple-icon"
import { YahooIcon } from "@/components/icons/yahoo-icon"
import { cn } from "@/lib/utils"
import { EMAIL_PROVIDERS } from "../constants"
import type { EmailProvider } from "../types"

const PROVIDER_ICONS: Record<
  EmailProvider,
  ComponentType<{ className?: string }>
> = {
  google: GoogleIcon,
  microsoft: MicrosoftIcon,
  apple: AppleIcon,
  yahoo: YahooIcon,
}

const pillTransition = {
  type: "spring" as const,
  stiffness: 420,
  damping: 32,
  mass: 0.7,
}

const itemTransition = {
  type: "spring" as const,
  stiffness: 480,
  damping: 34,
  mass: 0.6,
}

interface EmailConnectBarProps {
  readonly connectedProvider: EmailProvider | null
  readonly onConnect: (provider: EmailProvider) => void
  readonly onDisconnect: () => void
}

export function EmailConnectBar({
  connectedProvider,
  onConnect,
  onDisconnect,
}: EmailConnectBarProps) {
  const { t } = useTranslation("common")
  const isConnected = connectedProvider != null

  const visibleProviders = isConnected
    ? EMAIL_PROVIDERS.filter((p) => p.id === connectedProvider)
    : EMAIL_PROVIDERS

  return (
    <motion.div
      layout
      transition={pillTransition}
      className={cn(
        "inline-flex h-9 items-center gap-1 rounded-full border border-border/60 bg-muted/40 p-1 shadow-sm backdrop-blur-sm",
        "supports-[backdrop-filter]:bg-muted/30"
      )}
      role="group"
      aria-label={t("applications.email.syncLabel")}
    >
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={isConnected ? "connected" : "sync"}
          initial={{ opacity: 0, x: -6, filter: "blur(4px)" }}
          animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, x: 6, filter: "blur(4px)" }}
          transition={{ duration: 0.18 }}
          className="hidden pl-1.5 pr-0.5 text-xs font-medium text-muted-foreground sm:inline"
        >
          {isConnected
            ? t("applications.email.connectedShort")
            : t("applications.email.syncLabel")}
        </motion.span>
      </AnimatePresence>

      <div className="flex h-7 items-center gap-0.5">
        <AnimatePresence mode="popLayout" initial={false}>
          {visibleProviders.map((provider) => {
            const Icon = PROVIDER_ICONS[provider.id]
            const active = connectedProvider === provider.id
            const label = active
              ? t("applications.email.disconnect", {
                  provider: t(provider.labelKey),
                })
              : t(provider.connectKey)

            return (
              <motion.div
                key={provider.id}
                layout
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{
                  opacity: 0,
                  scale: 0.5,
                  transition: { duration: 0.16, ease: [0.4, 0, 0.2, 1] },
                }}
                transition={itemTransition}
                className="relative size-7 shrink-0"
              >
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        type="button"
                        className={cn(
                          "relative flex size-7 items-center justify-center rounded-full",
                          "text-foreground outline-none transition-colors",
                          "hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50",
                          "cursor-pointer select-none",
                          active &&
                            "bg-background shadow-sm ring-1 ring-emerald-500/40 hover:bg-background"
                        )}
                        aria-label={label}
                        aria-pressed={active}
                        onClick={() => {
                          if (active) onDisconnect()
                          else onConnect(provider.id)
                        }}
                      />
                    }
                  >
                    <Icon className="size-3.5" />
                  </TooltipTrigger>
                  <TooltipContent side="bottom">{label}</TooltipContent>
                </Tooltip>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
