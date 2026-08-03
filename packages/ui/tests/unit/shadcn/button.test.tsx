import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Button } from "@/shadcn/button"

describe("Button", () => {
  it("renders children", () => {
    render(<Button>Save</Button>)
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument()
  })

  it("forwards disabled state", () => {
    render(<Button disabled>Save</Button>)
    const btn = screen.getByRole("button", { name: "Save" })
    expect(btn).toBeDisabled()
    expect(btn).toHaveAttribute("data-disabled")
  })

  it("applies data-slot", () => {
    render(<Button>Go</Button>)
    expect(screen.getByRole("button", { name: "Go" })).toHaveAttribute(
      "data-slot",
      "button"
    )
  })
})
