export const QUEUE_NAMES = {
  default: "default",
  email: "email",
  indexing: "indexing",
} as const

export type QueueName = (typeof QUEUE_NAMES)[keyof typeof QUEUE_NAMES]

/** Map domain event types → queue for BullMQ routing. */
export const EVENT_QUEUE_MAP = {
  "auth.otp_requested": QUEUE_NAMES.email,
  "auth.user_signed_in": QUEUE_NAMES.default,
  "questions.upserted": QUEUE_NAMES.indexing,
  "questions.deleted": QUEUE_NAMES.indexing,
  "files.upload_requested": QUEUE_NAMES.default,
} as const
