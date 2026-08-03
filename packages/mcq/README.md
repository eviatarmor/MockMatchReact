# `@mockmatch/mcq`

Product-agnostic multiple-choice practice shell:

- **Session layout** — resizable question rail + main pane, chrome bar slot
- **Variants** — single, multi-select, order (drag reorder)
- **Check / reveal** — host owns scoring; shell applies result payloads
- **Summary** — end-of-set score + review list

Host supplies questions, i18n labels, submit/transport, difficulty badge, and navigation (e.g. question bank).

> **Status:** private monorepo package. UI + pure session state only.

## Install (monorepo)

```json
{
  "dependencies": {
    "@mockmatch/mcq": "*",
    "@mockmatch/ide": "*",
    "@mockmatch/ui": "*"
  }
}
```

Tailwind must scan this package:

```css
@source "../../packages/mcq/src/**/*.{ts,tsx}";
```

### Peers

| Peer | Role |
|------|------|
| `react` / `react-dom` | UI |
| `@mockmatch/ui` | Buttons, radio, checkbox, resizable, badge |
| `@mockmatch/ide` | `IdeChromeBar` |
| `@dnd-kit/*` | Order-variant drag list |
| Host CSS | Tailwind v4 + shadcn CSS variables |

## Quick start

```tsx
import { McqShell, useMcqSession, type McqQuestion } from "@mockmatch/mcq"

function PracticeMcq({ questions }: { questions: McqQuestion[] }) {
  const session = useMcqSession({ questions })

  return (
    <McqShell
      questions={questions}
      session={session}
      labels={labels}
      chrome={{
        title: "Algorithms",
        formatBadge: "Multiple choice",
        onBack: () => navigate("/question-bank"),
      }}
      onCheck={(payload) => {
        // host scores, then:
        session.applyResult(payload.id, result)
      }}
      onPerfectSet={() => fireCelebrationConfetti()}
    />
  )
}
```

## MockMatch host

`/simulations/mcq/:questionId` — `client/src/features/simulation-mcq`.
