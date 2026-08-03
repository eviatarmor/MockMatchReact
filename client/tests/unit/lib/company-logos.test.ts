import { describe, expect, it } from "vitest"
import { companyLogoUrl } from "@/lib/company-logos"

describe("companyLogoUrl", () => {
  it("returns local svg path for known companies", () => {
    expect(companyLogoUrl("Google")).toBe("/icons/companies/google.svg")
    expect(companyLogoUrl("Amazon")).toBe("/icons/companies/amazon.svg")
    expect(companyLogoUrl("Goldman Sachs")).toBe(
      "/icons/companies/goldman-sachs.svg"
    )
    expect(companyLogoUrl("Johnson & Johnson")).toBe(
      "/icons/companies/johnson-and-johnson.svg"
    )
  })

  it("returns undefined for unknown or empty names", () => {
    expect(companyLogoUrl("Unknown Corp")).toBeUndefined()
    expect(companyLogoUrl("")).toBeUndefined()
    expect(companyLogoUrl("google")).toBeUndefined() // case-sensitive keys
  })
})
