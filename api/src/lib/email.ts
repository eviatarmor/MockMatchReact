import nodemailer from "nodemailer"
import type { Transporter } from "nodemailer"
import { env } from "../config/env.js"
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

function createTransport(): Transporter {
  if (env.SMTP_HOST) {
    return nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_PORT === 465,
      auth:
        env.SMTP_USER && env.SMTP_PASS
          ? { user: env.SMTP_USER, pass: env.SMTP_PASS }
          : undefined,
    })
  }

  // No SMTP: json transport — message logged, nothing leaves the box
  return nodemailer.createTransport({ jsonTransport: true })
}

const transport = createTransport()

export const emailClient: EmailClient = {
  async send(input) {
    const info = await transport.sendMail({
      from: env.SMTP_FROM,
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    })

    if (!env.SMTP_HOST) {
      logger.info(
        {
          to: input.to,
          subject: input.subject,
          preview: input.text,
          message: typeof info.message === "string" ? info.message : undefined,
        },
        "email sent (dev json transport — configure SMTP_* for real delivery)"
      )
      return
    }

    logger.info(
      { to: input.to, subject: input.subject, messageId: info.messageId },
      "email sent"
    )
  },
}

export async function sendOtpEmail(input: {
  to: string
  code: string
  purpose: "login" | "signup"
}): Promise<void> {
  const action = input.purpose === "signup" ? "finish signing up" : "sign in"
  const subject = `Your MockMatch code: ${input.code}`
  const text = [
    `Your MockMatch verification code is ${input.code}.`,
    ``,
    `Use it to ${action}. It expires in ${env.OTP_TTL_MINUTES} minutes.`,
    ``,
    `If you did not request this, ignore this email.`,
  ].join("\n")

  const html = `
    <p>Your MockMatch verification code is <strong style="font-size:1.25rem;letter-spacing:0.15em">${input.code}</strong>.</p>
    <p>Use it to ${action}. It expires in ${env.OTP_TTL_MINUTES} minutes.</p>
    <p style="color:#666">If you did not request this, ignore this email.</p>
  `

  await emailClient.send({ to: input.to, subject, text, html })
}
