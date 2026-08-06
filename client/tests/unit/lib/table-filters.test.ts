import { describe, expect, it } from "vitest"
import {
  clearAllTableFilters,
  clearTableFilterField,
  countActiveTableFilters,
  emptyTableFilters,
  filterByTableFilters,
  hasActiveTableFilters,
  matchesTableFilters,
  toggleTableFilterValue,
} from "@/lib/table-filters"

describe("table-filters", () => {
  it("starts empty", () => {
    const filters = emptyTableFilters()
    expect(hasActiveTableFilters(filters)).toBe(false)
    expect(countActiveTableFilters(filters)).toBe(0)
  })

  it("toggles values per field", () => {
    let filters = emptyTableFilters()
    filters = toggleTableFilterValue(filters, "status", "draft")
    filters = toggleTableFilterValue(filters, "status", "active")
    expect(countActiveTableFilters(filters)).toBe(2)
    expect(filters.get("status")?.has("draft")).toBe(true)

    filters = toggleTableFilterValue(filters, "status", "draft")
    expect(filters.get("status")?.has("draft")).toBe(false)
    expect(countActiveTableFilters(filters)).toBe(1)
  })

  it("clears a field and all filters", () => {
    let filters = toggleTableFilterValue(emptyTableFilters(), "status", "active")
    filters = toggleTableFilterValue(filters, "score", "strong")
    filters = clearTableFilterField(filters, "status")
    expect(filters.has("status")).toBe(false)
    expect(hasActiveTableFilters(filters)).toBe(true)

    filters = clearAllTableFilters()
    expect(hasActiveTableFilters(filters)).toBe(false)
  })

  it("matches items against multi-field filters", () => {
    let filters = toggleTableFilterValue(emptyTableFilters(), "status", "draft")
    expect(
      matchesTableFilters(filters, (field) =>
        field === "status" ? "draft" : null
      )
    ).toBe(true)
    expect(
      matchesTableFilters(filters, (field) =>
        field === "status" ? "active" : null
      )
    ).toBe(false)

    filters = toggleTableFilterValue(filters, "status", "active")
    expect(
      matchesTableFilters(filters, (field) =>
        field === "status" ? "active" : null
      )
    ).toBe(true)
  })

  it("filters arrays client-side", () => {
    const items = [
      { id: "1", status: "draft" },
      { id: "2", status: "active" },
      { id: "3", status: "archived" },
    ]
    const filters = toggleTableFilterValue(emptyTableFilters(), "status", "active")
    const next = filterByTableFilters(
      items,
      filters,
      (item, fieldId) => (fieldId === "status" ? item.status : null)
    )
    expect(next.map((item) => item.id)).toEqual(["2"])
  })
})
