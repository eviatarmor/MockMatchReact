import "../../../tools/vitest/setup-jsdom.ts"

// Monaco (via @mockmatch/ide) probes clipboard APIs at import time.
if (
  typeof document !== "undefined" &&
  typeof document.queryCommandSupported !== "function"
) {
  document.queryCommandSupported = () => false
}

// xterm (via @mockmatch/ide) samples canvas for color conversion at import.
if (typeof HTMLCanvasElement !== "undefined") {
  HTMLCanvasElement.prototype.getContext = function getContext() {
    return null
  } as typeof HTMLCanvasElement.prototype.getContext
}
