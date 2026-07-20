export type DomainEvent =
  | {
      type: "auth.otp_requested"
      payload: { userId?: string; email: string }
    }
  | {
      type: "auth.user_signed_in"
      payload: { userId: string }
    }
  | {
      type: "questions.upserted"
      payload: { questionId: string }
    }
  | {
      type: "questions.deleted"
      payload: { questionId: string }
    }
  | {
      type: "files.upload_requested"
      payload: { key: string; userId: string }
    }

export type DomainEventType = DomainEvent["type"]
