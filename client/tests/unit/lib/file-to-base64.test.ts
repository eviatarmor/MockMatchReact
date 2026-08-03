import { describe, expect, it } from "vitest"
import { fileToBase64 } from "@/lib/file-to-base64"

describe("fileToBase64", () => {
  it("strips data-URL prefix", async () => {
    const file = new File(["hello"], "hello.txt", { type: "text/plain" })
    const b64 = await fileToBase64(file)
    expect(b64).not.toContain("data:")
    expect(b64).not.toContain(",")
    // "hello" base64
    expect(b64).toBe(btoa("hello"))
  })

  it("handles binary-ish content", async () => {
    const bytes = new Uint8Array([0, 1, 2, 255])
    const file = new File([bytes], "bin.dat", { type: "application/octet-stream" })
    const b64 = await fileToBase64(file)
    expect(typeof b64).toBe("string")
    expect(b64.length).toBeGreaterThan(0)
  })
})
