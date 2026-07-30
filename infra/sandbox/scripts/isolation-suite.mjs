/**
 * Isolation / multi-tenant assurance checks (local Docker backend).
 * Cross-platform (Windows Docker Desktop + Linux/macOS).
 *
 * Usage: node infra/sandbox/scripts/isolation-suite.mjs
 *        npm run sandbox:isolation
 */
import { spawnSync } from "node:child_process"
import { mkdirSync, writeFileSync, rmSync } from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { randomBytes } from "node:crypto"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IMAGE = process.env.SANDBOX_IMAGE || "mockmatch-sandbox:local"
const RUNTIME = process.env.SANDBOX_RUNTIME ?? "runsc"
const suffix = randomBytes(3).toString("hex")
const NAME_A = `mm-isolation-a-${suffix}`
const NAME_B = `mm-isolation-b-${suffix}`
const ROOT = path.resolve(__dirname, "../workspace")
const WA = path.join(ROOT, "sessions", `isolation-a-${suffix}`)
const WB = path.join(ROOT, "sessions", `isolation-b-${suffix}`)

function docker(args, opts = {}) {
  const r = spawnSync("docker", args, {
    encoding: "utf8",
    windowsHide: true,
    ...opts,
  })
  return {
    status: r.status,
    stdout: (r.stdout || "").trim(),
    stderr: (r.stderr || "").trim(),
    error: r.error,
  }
}

function fail(msg) {
  console.error(`FAIL: ${msg}`)
  process.exit(1)
}

function ok(msg) {
  console.log(`OK: ${msg}`)
}

function cleanup() {
  docker(["rm", "-f", NAME_A, NAME_B])
  try {
    rmSync(WA, { recursive: true, force: true })
    rmSync(WB, { recursive: true, force: true })
  } catch {
    // ignore
  }
}

process.on("exit", cleanup)
process.on("SIGINT", () => {
  cleanup()
  process.exit(130)
})

console.log("==> image")
const inspect = docker(["image", "inspect", IMAGE])
if (inspect.error) {
  fail(
    `docker not available: ${inspect.error.message}\n` +
      "Is Docker Desktop running? Use PowerShell/cmd docker, not Git-Bash-only socket."
  )
}
if (inspect.status !== 0) {
  fail(`image missing — run npm run sandbox:up\n${inspect.stderr}`)
}

mkdirSync(WA, { recursive: true })
mkdirSync(WB, { recursive: true })
writeFileSync(path.join(WA, "secret.txt"), "secret-a\n", "utf8")
writeFileSync(path.join(WB, "secret.txt"), "secret-b\n", "utf8")

function runBox(name, hostDir) {
  const abs = path.resolve(hostDir)
  const args = [
    "run",
    "-d",
    "--name",
    name,
    "--network",
    "none",
    "--read-only",
    "--security-opt",
    "no-new-privileges",
    "--cap-drop",
    "ALL",
    "--cap-add",
    "SYS_ADMIN",
    "--cap-add",
    "SYS_CHROOT",
    "--cap-add",
    "SETUID",
    "--cap-add",
    "SETGID",
    "--cap-add",
    "MKNOD",
    "--tmpfs",
    "/tmp:size=64m,mode=1777,noexec",
    "--tmpfs",
    "/run:size=8m,mode=755",
    "-u",
    "0:0",
    "-v",
    `${abs}:/opt/jail/workspace`,
    "--label",
    "mockmatch.sandbox=session",
  ]
  if (RUNTIME) {
    args.push("--runtime", RUNTIME)
  }
  args.push(IMAGE)
  const r = docker(args)
  if (r.status !== 0) {
    fail(`docker run ${name}: ${r.stderr || r.stdout}`)
  }
}

console.log("==> two session containers")
runBox(NAME_A, WA)
runBox(NAME_B, WB)

// Wait for jail-ready
for (let i = 0; i < 40; i++) {
  const r = docker(["exec", NAME_A, "test", "-f", "/run/jail-ready"])
  if (r.status === 0) break
  if (i === 39) {
    const logs = docker(["logs", NAME_A])
    fail(`jail not ready\n${logs.stderr || logs.stdout}`)
  }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
}

console.log("==> network deny")
const net = docker([
  "exec",
  NAME_A,
  "jail-run",
  "--",
  "python3",
  "-c",
  "import socket;s=socket.socket();s.settimeout(2);s.connect(('1.1.1.1',80))",
])
if (net.status === 0) fail("egress allowed")
ok("no egress")

console.log("==> cross-session file isolation")
const secretA = docker([
  "exec",
  NAME_A,
  "jail-run",
  "--",
  "cat",
  "/workspace/secret.txt",
])
if (!secretA.stdout.includes("secret-a")) {
  fail(`A missing secret: ${secretA.stdout} ${secretA.stderr}`)
}
ok("A sees own secret")
if (secretA.stdout.includes("secret-b")) {
  fail("A can see B secret")
}
ok("A cannot see B secret content")

const secretB = docker([
  "exec",
  NAME_B,
  "jail-run",
  "--",
  "cat",
  "/workspace/secret.txt",
])
if (!secretB.stdout.includes("secret-b")) {
  fail(`B missing secret: ${secretB.stdout}`)
}

console.log("==> jail os-release stub")
const osrel = docker([
  "exec",
  NAME_A,
  "jail-run",
  "--",
  "cat",
  "/etc/os-release",
])
if (!osrel.stdout.includes("MockMatch Sandbox")) {
  fail(`expected stub os-release, got:\n${osrel.stdout}`)
}
ok("stub os-release")

console.log("==> no dpkg in jail")
const dpkg = docker([
  "exec",
  NAME_A,
  "jail-run",
  "--",
  "test",
  "-d",
  "/var/lib/dpkg",
])
if (dpkg.status === 0) fail("dpkg visible")
ok("no package db")

console.log("==> wipe destroy")
docker(["rm", "-f", NAME_A])
const still = docker(["ps", "-a", "--format", "{{.Names}}"])
if (still.stdout.split(/\r?\n/).includes(NAME_A)) {
  fail("container still listed")
}
ok("destroy")

console.log("Isolation suite PASSED")
process.exitCode = 0
