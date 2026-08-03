import { bench, describe } from "vitest"
import { resumeDocumentSchema } from "@/resumes/document.js"
import { requestOtpSchema, verifyOtpSchema } from "@/auth/otp.js"
import { jobSearchInputSchema } from "@/jobs/api.js"
import { documentStyleSchema } from "@/documents/common.js"

const resume = {
  header: {
    name: "Ada Lovelace",
    headline: "Software Engineer",
    contacts: [
      { id: "c1", iconKey: "mail" as const, value: "ada@example.com" },
      { id: "c2", iconKey: "phone" as const, value: "+1 555" },
    ],
  },
  sections: [
    { id: "s1", type: "summary" as const, text: "I write code and proofs." },
    {
      id: "s2",
      type: "experience" as const,
      entries: Array.from({ length: 5 }, (_, i) => ({
        id: `e${i}`,
        title: `Role ${i}`,
        org: "Acme",
        location: "Remote",
        url: "",
        startDate: "2020",
        endDate: "Present",
        bullets: "• shipped features\n• mentored juniors",
      })),
    },
    {
      id: "s3",
      type: "skills" as const,
      items: Array.from({ length: 12 }, (_, i) => ({
        id: `k${i}`,
        text: `Skill ${i}`,
      })),
    },
  ],
}

describe("schemas Zod parse (request validation)", () => {
  bench("resumeDocumentSchema", () => {
    resumeDocumentSchema.parse(resume)
  })

  bench("requestOtpSchema login", () => {
    requestOtpSchema.parse({ purpose: "login", email: "a@b.co" })
  })

  bench("verifyOtpSchema", () => {
    verifyOtpSchema.parse({
      email: "a@b.co",
      code: "000000",
      purpose: "login",
    })
  })

  bench("jobSearchInputSchema defaults", () => {
    jobSearchInputSchema.parse({ query: "react engineer", where: "Sydney" })
  })

  bench("documentStyleSchema", () => {
    documentStyleSchema.parse({
      accent: "blue",
      typeface: "geist",
      heading: "accent",
      density: "normal",
    })
  })
})
