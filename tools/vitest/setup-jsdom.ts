/**
 * Shared jsdom setup for packages that render React (ui, ai-chat, collab, client).
 */
import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(() => {
  cleanup()
})
