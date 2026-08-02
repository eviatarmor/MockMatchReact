import { useTranslation } from "react-i18next"
import {
  ChatPanel as VoiceChatPanel,
  type ChatPanelProps as BaseProps,
} from "@mockmatch/voice-agent"

type ChatPanelProps = Omit<BaseProps, "labels" | "lang">

/** Host wrapper — injects i18n labels into package chat panel. */
export function ChatPanel(props: ChatPanelProps) {
  const { t, i18n } = useTranslation("simulation-conversation")
  return (
    <VoiceChatPanel
      {...props}
      lang={i18n.language || "en-US"}
      labels={{
        title: t("chat.title"),
        empty: t("chat.empty"),
        roleAgent: t("chat.role.agent"),
        roleUser: t("chat.role.user"),
        roleSystem: t("chat.role.system"),
        input: {
          placeholder: t("input.placeholder"),
          placeholderListening: t("input.placeholderListening"),
          startListening: t("input.startListening"),
          stopListening: t("input.stopListening"),
          send: t("input.send"),
          stop: t("input.stop"),
        },
      }}
    />
  )
}
