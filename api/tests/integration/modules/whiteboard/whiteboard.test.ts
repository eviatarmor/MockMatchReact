import { expect, it } from "vitest"
import {
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"
import { env } from "@/config/env.js"

describeIntegration("whiteboard (integration)", () => {
  it("create → get → update → delete", async () => {
    const caller = await signupAuthedCaller()

    const created = await caller.whiteboard.create({
      title: "Test Board",
    })
    expect(created.id).toBeTruthy()
    expect(created.title).toBe("Test Board")
    expect(created.document).toBeDefined()

    const one = await caller.whiteboard.get({ id: created.id })
    expect(one.id).toBe(created.id)

    const updated = await caller.whiteboard.update({
      id: created.id,
      title: "Renamed Board",
    })
    expect(updated.title).toBe("Renamed Board")

    await caller.whiteboard.delete({ id: created.id })
    await expect(
      caller.whiteboard.get({ id: created.id })
    ).rejects.toBeTruthy()
  })
})
