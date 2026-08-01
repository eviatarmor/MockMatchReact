# `@mockmatch/ai-chat`

Reusable AI chat shell (hooks + message UI) built on the [Vercel AI SDK](https://ai-sdk.dev/).

Designed for **MockMatch web + future browser extensions**. Product copy, auth, and API routes stay in the host app.

> **Status:** private monorepo package. Intended for a later open-source extract to its own git repo / npm publish.

## Install (monorepo)

```json
{
  "dependencies": {
    "@mockmatch/ai-chat": "*",
    "@mockmatch/ui": "*"
  }
}
```

### Peer dependencies

| Peer | Role |
|------|------|
| `react` / `react-dom` | UI |
| `@mockmatch/ui` | Button, ScrollArea, Alert, etc. |
| Host CSS | Tailwind v4 + shadcn CSS variables (`bg-primary`, …) |

Also ensure Tailwind scans this package:

```css
@source "../../../packages/ai-chat/src/**/*.{ts,tsx}";
```

## Quick start

```tsx
import { useMemo } from "react"
import { DefaultChatTransport } from "ai"
import {
  useAssistantChat,
  AssistantMessages,
  AssistantSuggestions,
} from "@mockmatch/ai-chat"
import { SpeechInput } from "@mockmatch/ai-chat/ai-elements/speech-input"

function ChatPanel() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        credentials: "include",
      }),
    []
  )

  const chat = useAssistantChat({
    chatId: "demo-0",
    transport,
    welcomeId: "welcome",
    greeting: "Hi — how can I help?",
  })

  return (
    <div>
      <AssistantMessages
        messages={chat.messages}
        status={chat.status}
        error={chat.error}
        welcomeId="welcome"
        thinkingLabel="Thinking…"
        errorLabel="Something went wrong"
      />
      <AssistantSuggestions
        suggestions={["What can you do?", "Help me get started"]}
        onSelect={(text) => void chat.sendText(text)}
        disabled={chat.isBusy}
      />
      {/* Wire input + SpeechInput as needed */}
    </div>
  )
}
```

## API surface

### Hooks

- **`useAssistantChat`** — welcome message, draft input, busy flag, `sendText` / `handleSubmit`
- **`useInputHistory`** — up/down arrow history for the input
- **`createWelcomeMessage`** — build a single assistant `UIMessage`

### Components

- **`AssistantMessages`** — text + reasoning parts; optional `renderPart` for tools
- **`AssistantSuggestions`** — suggestion chips / marquee

### AI elements (deep imports)

`@mockmatch/ai-chat/ai-elements/*` — Message, Reasoning, SpeechInput, Attachments, Confirmation, Suggestion, Conversation, Shimmer, Transcription, MicSelector, VoiceSelector.

## Host responsibilities

| Concern | Owner |
|---------|--------|
| Auth + cookies | Host |
| `ChatTransport` / API route | Host |
| System prompt / tools | Host (or host API) |
| i18n labels | Host injects strings |
| Theme CSS variables | Host |

## Future open-source extract

1. Split `packages/ai-chat` into its own repository
2. Publish under a public package name
3. Either publish `@mockmatch/ui` as well, or relax the UI peer to injectable shadcn-compatible primitives

Until then, only monorepo consumers (web app, extensions) use this package.
