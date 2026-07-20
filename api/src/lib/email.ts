import { logger } from "./logger.js"

export interface SendEmailInput {
  to: string
  subject: string
  text: string
  html?: string
}

export interface EmailClient {
  send(input: SendEmailInput): Promise<void>
}

/** Dev/no-op adapter. Swap for Resend/SES later. */
export const emailClient: EmailClient = {
  async send(input) {
    logger.info(
      { to: input.to, subject: input.subject },
      "email send (noop — configure provider later)"
    )
  },
}
