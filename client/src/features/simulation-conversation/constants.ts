import type {
  AgentVoiceId,
  MockConversationScript,
  SessionKind,
  VoiceCatalogEntry,
} from "./types"

export const CONVERSATION_TRACK_IDS = [
  "behavioral-core",
  "product-sense",
  "system-design-talk",
] as const

export type ConversationTrackId = (typeof CONVERSATION_TRACK_IDS)[number]

export function isConversationTrackId(
  value: string | undefined
): value is ConversationTrackId {
  return (
    value !== undefined &&
    (CONVERSATION_TRACK_IDS as readonly string[]).includes(value)
  )
}

/** Same profiles as account-settings voice section (UI mock ids). */
export const AGENT_VOICE_IDS: readonly AgentVoiceId[] = [
  "buttery",
  "resonant",
  "mellow",
  "airy",
  "polished",
  "rounded",
] as const

export const DEFAULT_AGENT_VOICE: AgentVoiceId = "buttery"

export const SESSION_KINDS: readonly SessionKind[] = [
  "practice",
  "fullInterview",
  "freeform",
] as const

/** Metadata for voice dropdown options (product voice ids). */
export const VOICE_CATALOG: readonly VoiceCatalogEntry[] = [
  { id: "buttery", gender: "female", accent: "australian" },
  { id: "resonant", gender: "male", accent: "australian" },
  { id: "mellow", gender: "female", accent: "american" },
  { id: "airy", gender: "male", accent: "american" },
  { id: "polished", gender: "female", accent: "british" },
  { id: "rounded", gender: "male", accent: "british" },
] as const

/** Mock interviewer scripts — frontend only until voice/LLM backend lands. */
export const MOCK_SCRIPTS: Record<ConversationTrackId, MockConversationScript> =
  {
    "behavioral-core": {
      trackId: "behavioral-core",
      agentLines: [
        "Hi — thanks for joining. I’m your MockMatch interviewer. I’ll ask a few behavioral questions; answer out loud when you’re ready.",
        "Tell me about a time you disagreed with a teammate. What was the situation, and how did you handle it?",
        "What was the outcome, and what would you do differently next time?",
        "How did that experience change how you collaborate under pressure?",
        "Great. Last one: describe a goal you set that felt ambitious. How did you measure progress?",
        "That’s a solid close for this mock. You can end the session or keep practicing.",
      ],
      userLines: [
        "I’d like to practice a behavioral answer.",
        "We disagreed on the rollout plan — I focused on risk and they wanted speed.",
        "We shipped a staged rollout and hit the date with fewer incidents.",
        "I schedule alignment earlier when stakes are high.",
        "I tracked weekly milestones and shared a public dashboard.",
      ],
    },
    "product-sense": {
      trackId: "product-sense",
      agentLines: [
        "Welcome. This is a product-sense mock — think out loud. I’ll guide you through a few prompts.",
        "Pick a product you use daily. Who is the core user, and what job are they hiring it for?",
        "What’s one metric you’d watch to know the product is healthy?",
        "If usage dropped 20% this quarter, what are your top three hypotheses?",
        "How would you validate the strongest hypothesis in two weeks?",
        "Nice structure. End when you’re done, or stay for more prompts.",
      ],
      userLines: [
        "I’m ready for product sense.",
        "I use a notes app — knowledge workers capturing and finding ideas.",
        "Weekly active creators and search success rate.",
        "Onboarding friction, search quality, and competitor feature launches.",
        "Ship a search experiment and interview ten power users.",
      ],
    },
    "system-design-talk": {
      trackId: "system-design-talk",
      agentLines: [
        "System design talk track — no code, just architecture. I’ll ask clarifying questions as we go.",
        "Design a URL shortener. What are the functional requirements you’d lock first?",
        "How would you store mappings at scale, and what are the consistency trade-offs?",
        "Where does caching help, and what happens on cache misses?",
        "How would you handle analytics clicks without blocking redirects?",
        "Solid outline. End the session anytime, or keep iterating.",
      ],
      userLines: [
        "Ready for system design discussion.",
        "Create short links, redirect, optional expiry, basic analytics.",
        "Key-value store with unique codes; eventual consistency for analytics is fine.",
        "CDN or edge cache for hot redirects; miss goes to primary store.",
        "Async queue for click events so redirects stay fast.",
      ],
    },
  }

export const JOIN_DELAY_MS = 700
export const THINKING_MS = 900
