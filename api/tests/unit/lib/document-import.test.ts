import { describe, expect, it } from "vitest"
import { TRPCError } from "@trpc/server"
import { PDF_IMPORT_MAX_BYTES } from "@mockmatch/schemas"
import { decodePdfBase64 } from "@/lib/document-import.js"

function toBase64(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64")
}

describe("decodePdfBase64", () => {
  it("accepts valid small PDF magic payload", () => {
    const pdf = new TextEncoder().encode("%PDF-1.4 minimal content")
    const out = decodePdfBase64(toBase64(pdf))
    expect(out).toBeInstanceOf(Uint8Array)
    expect(new TextDecoder().decode(out.subarray(0, 5))).toBe("%PDF-")
    expect(out.byteLength).toBe(pdf.byteLength)
  })

  it("strips whitespace from base64", () => {
    const pdf = new TextEncoder().encode("%PDF-1.7 body")
    const b64 = toBase64(pdf)
    const spaced = b64.match(/.{1,8}/g)!.join("\n ")
    const out = decodePdfBase64(spaced)
    expect(out.byteLength).toBe(pdf.byteLength)
  })

  it("rejects empty payload", () => {
    try {
      decodePdfBase64("")
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError)
      expect((error as TRPCError).code).toBe("BAD_REQUEST")
      expect((error as TRPCError).message).toMatch(/empty/i)
    }
  })

  it("rejects non-PDF magic", () => {
    try {
      decodePdfBase64(toBase64(new TextEncoder().encode("not a pdf")))
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError)
      expect((error as TRPCError).code).toBe("BAD_REQUEST")
      expect((error as TRPCError).message).toMatch(/PDF/i)
    }
  })

  it("rejects oversized PDF", () => {
    const head = new TextEncoder().encode("%PDF-")
    const big = new Uint8Array(PDF_IMPORT_MAX_BYTES + 1)
    big.set(head, 0)
    try {
      decodePdfBase64(toBase64(big))
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(TRPCError)
      expect((error as TRPCError).code).toBe("PAYLOAD_TOO_LARGE")
    }
  })
})
