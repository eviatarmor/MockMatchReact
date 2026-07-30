/**
 * Remove all per-session sandbox containers (label mockmatch.sandbox=session).
 * Also drops legacy shared container `mockmatch-sandbox` if present.
 * Used by `npm run sandbox:down`.
 */
import { spawnSync } from "node:child_process"

function idsFromFilter(filter) {
  const list = spawnSync("docker", ["ps", "-aq", "--filter", filter], {
    encoding: "utf8",
  })
  if (list.error) {
    console.error(list.error.message)
    return []
  }
  return (list.stdout || "")
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
}

const ids = [...idsFromFilter("label=mockmatch.sandbox=session")]
// Legacy shared container (pre per-session model)
const legacy = spawnSync("docker", ["inspect", "-f", "{{.Id}}", "mockmatch-sandbox"], {
  encoding: "utf8",
})
if (legacy.status === 0 && legacy.stdout?.trim()) {
  ids.push(legacy.stdout.trim())
}

if (ids.length === 0) {
  console.log("No session sandbox containers.")
  process.exit(0)
}

const rm = spawnSync("docker", ["rm", "-f", ...ids], {
  encoding: "utf8",
  stdio: "inherit",
})
process.exit(rm.status ?? 0)
