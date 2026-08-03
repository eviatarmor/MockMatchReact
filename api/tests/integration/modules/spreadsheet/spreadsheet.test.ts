import { expect, it } from "vitest"
import {
  describeIntegration,
  signupAuthedCaller,
} from "../../../helpers/integration.js"

describeIntegration("spreadsheet (integration)", () => {
  it("create → get → update → delete", async () => {
    const caller = await signupAuthedCaller()

    const created = await caller.spreadsheet.create({
      title: "Case Model",
    })
    expect(created.id).toBeTruthy()
    expect(created.title).toBe("Case Model")
    expect(created.document.version).toBe(1)
    expect(created.document.sheets.length).toBeGreaterThanOrEqual(1)

    const one = await caller.spreadsheet.get({ id: created.id })
    expect(one.id).toBe(created.id)

    const sheet = created.document.sheets[0]!
    const updated = await caller.spreadsheet.update({
      id: created.id,
      title: "Case Model v2",
      document: {
        ...created.document,
        sheets: [
          {
            ...sheet,
            cells: { "0:0": { raw: "42" }, "0:1": { raw: "=A1*2" } },
          },
        ],
      },
    })
    expect(updated.title).toBe("Case Model v2")
    expect(updated.document.sheets[0]?.cells["0:0"]?.raw).toBe("42")

    await caller.spreadsheet.delete({ id: created.id })
    await expect(
      caller.spreadsheet.get({ id: created.id })
    ).rejects.toBeTruthy()
  })

  it("collab getAccess owner on spreadsheet", async () => {
    const caller = await signupAuthedCaller()
    const created = await caller.spreadsheet.create({ title: "Share me" })
    const access = await caller.collab.getAccess({
      kind: "spreadsheet",
      id: created.id,
    })
    expect(access.role).toBe("owner")
    expect(access.permissions.canEditContent).toBe(true)
    await caller.spreadsheet.delete({ id: created.id })
  })
})
