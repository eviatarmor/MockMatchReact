import { describe, expect, it } from "vitest"
import {
  contactEntrySchema,
  contactIconKeySchema,
  documentStatusSchema,
  documentStyleSchema,
  entityIdInputSchema,
  paginatedListInputSchema,
} from "@/documents/common.js"

describe("documentStyleSchema", () => {
  it("accepts full style", () => {
    const style = documentStyleSchema.parse({
      accent: "blue",
      typeface: "geist",
      heading: "accent",
      density: "normal",
    })
    expect(style.accent).toBe("blue")
  })

  it("accepts all accents / typefaces / headings / densities", () => {
    for (const accent of [
      "blue",
      "teal",
      "indigo",
      "emerald",
      "amber",
      "rose",
      "purple",
      "slate",
    ] as const) {
      expect(
        documentStyleSchema.parse({
          accent,
          typeface: "mono",
          heading: "plain",
          density: "relaxed",
        }).accent
      ).toBe(accent)
    }
  })

  it("rejects unknown accent", () => {
    expect(() =>
      documentStyleSchema.parse({
        accent: "neon",
        typeface: "geist",
        heading: "plain",
        density: "compact",
      })
    ).toThrow()
  })
})

describe("documentStatusSchema", () => {
  it("allows draft/active/archived", () => {
    expect(documentStatusSchema.parse("draft")).toBe("draft")
    expect(documentStatusSchema.parse("active")).toBe("active")
    expect(documentStatusSchema.parse("archived")).toBe("archived")
    expect(() => documentStatusSchema.parse("deleted")).toThrow()
  })
})

describe("contactIconKeySchema / contactEntrySchema", () => {
  it("icon keys", () => {
    for (const k of ["mail", "phone", "mapPin", "globe", "link"] as const) {
      expect(contactIconKeySchema.parse(k)).toBe(k)
    }
    expect(() => contactIconKeySchema.parse("twitter")).toThrow()
  })

  it("contact entry needs id + icon + value", () => {
    const c = contactEntrySchema.parse({
      id: "c1",
      iconKey: "phone",
      value: "+1 555",
    })
    expect(c.value).toBe("+1 555")
    expect(() =>
      contactEntrySchema.parse({ id: "", iconKey: "mail", value: "x" })
    ).toThrow()
  })
})

describe("paginatedListInputSchema", () => {
  it("applies defaults", () => {
    const v = paginatedListInputSchema.parse({})
    expect(v.page).toBe(1)
    expect(v.pageSize).toBe(10)
  })

  it("trims search; caps pageSize", () => {
    expect(paginatedListInputSchema.parse({ search: "  q  " }).search).toBe("q")
    expect(() => paginatedListInputSchema.parse({ pageSize: 100 })).toThrow()
    expect(() => paginatedListInputSchema.parse({ page: 0 })).toThrow()
  })
})

describe("entityIdInputSchema", () => {
  it("requires uuid", () => {
    expect(() => entityIdInputSchema.parse({ id: "not-uuid" })).toThrow()
    const id = "550e8400-e29b-41d4-a716-446655440000"
    expect(entityIdInputSchema.parse({ id }).id).toBe(id)
  })
})
