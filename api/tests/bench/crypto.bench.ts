import { bench, describe } from "vitest"
import { hashToken, safeEqualHex } from "@/lib/crypto.js"

const sample = "refresh-token-payload-" + "x".repeat(200)
const digest = hashToken(sample)
const digest2 = hashToken(sample + "!")

describe("api crypto (auth tokens / OTP)", () => {
  bench("hashToken sha256", () => {
    hashToken(sample)
  })

  bench("safeEqualHex match", () => {
    safeEqualHex(digest, digest)
  })

  bench("safeEqualHex mismatch", () => {
    safeEqualHex(digest, digest2)
  })
})
