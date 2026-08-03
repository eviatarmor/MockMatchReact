import { beforeAll, bench, describe } from "vitest"
import {
  deleteOtpChallenge,
  getOtpChallenge,
  setOtpChallenge,
  storeRefreshToken,
  getRefreshToken,
  revokeRefreshToken,
} from "@/lib/auth-store.js"
import { hashToken } from "@/lib/crypto.js"
import {
  describeBenchIntegration,
  integrationAvailable,
} from "../../helpers/integration.js"

/**
 * Auth store on real Redis (OTP + refresh hashes) — multi-replica shared path.
 */
describeBenchIntegration("db redis auth-store", () => {
  const email = `bench-otp+${Date.now()}@example.com`
  let refreshHash = ""

  beforeAll(async () => {
    if (!integrationAvailable()) return
    await setOtpChallenge(
      email,
      "login",
      {
        codeHash: hashToken("000000"),
        purpose: "login",
        fullName: null,
      },
      600
    )
    refreshHash = hashToken(`refresh-bench-${Date.now()}`)
    await storeRefreshToken(refreshHash, "00000000-0000-4000-8000-000000000001", 600)
  })

  bench("setOtpChallenge", async () => {
    await setOtpChallenge(
      email,
      "login",
      {
        codeHash: hashToken("111111"),
        purpose: "login",
        fullName: null,
      },
      600
    )
  })

  bench("getOtpChallenge", async () => {
    await getOtpChallenge(email, "login")
  })

  bench("storeRefreshToken", async () => {
    const h = hashToken(`r-${Math.random()}`)
    await storeRefreshToken(h, "00000000-0000-4000-8000-000000000001", 60)
    await revokeRefreshToken(h)
  })

  bench("getRefreshToken", async () => {
    await getRefreshToken(refreshHash)
  })
})

