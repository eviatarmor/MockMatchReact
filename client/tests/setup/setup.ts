import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach } from "vitest"

afterEach(() => {
  cleanup()
})

// Monaco (via @mockmatch/ide) probes clipboard APIs at import time.
if (typeof document !== "undefined" && typeof document.queryCommandSupported !== "function") {
  document.queryCommandSupported = () => false
}

// xterm (via @mockmatch/ide) samples canvas for color conversion at import.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return null
  } as typeof HTMLCanvasElement.prototype.getContext
}
