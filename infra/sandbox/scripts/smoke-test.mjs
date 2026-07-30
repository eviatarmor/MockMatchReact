/**
 * Per-session jail smoke test (cross-platform Node + docker CLI).
 * Replaces bash smoke-test.sh for Windows Docker Desktop.
 */
import { spawnSync } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { randomBytes } from "node:crypto"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const IMAGE = process.env.SANDBOX_IMAGE || "mockmatch-sandbox:local"
const RUNTIME = process.env.SANDBOX_RUNTIME ?? "runsc"
const NAME = `mockmatch-sandbox-smoke-${randomBytes(3).toString("hex")}`
const WORKSPACE =
  process.env.SANDBOX_SMOKE_WORKSPACE || path.resolve(__dirname, "../workspace")

function docker(args) {
  const r = spawnSync("docker", args, {
    encoding: "utf8",
    windowsHide: true,
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

function cleanup() {
  docker(["rm", "-f", NAME])
}
process.on("exit", cleanup)

console.log(`==> Image: ${IMAGE}`)
const img = docker(["image", "inspect", IMAGE])
if (img.error) {
  fail(`docker not available: ${img.error.message}`)
}
if (img.status !== 0) {
  fail("image missing — run npm run sandbox:up")
}

const abs = path.resolve(WORKSPACE)
const args = [
  "run",
  "-d",
  "--name",
  NAME,
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
  "--memory",
  "512m",
  "--memory-swap",
  "512m",
  "--cpus",
  "1.0",
  "--pids-limit",
  "256",
  "--tmpfs",
  "/tmp:size=64m,mode=1777,noexec,nosuid,nodev",
  "--tmpfs",
  "/run:size=8m,mode=755,nosuid,nodev",
  "-u",
  "0:0",
  "-w",
  "/opt/jail/workspace",
  "-e",
  "HOME=/workspace",
  "-e",
  "MOCKMATCH_SANDBOX=1",
  "-v",
  `${abs}:/opt/jail/workspace`,
  "--label",
  "mockmatch.sandbox=smoke",
]
if (RUNTIME) args.push("--runtime", RUNTIME)
args.push(IMAGE)

console.log("==> Start ephemeral session-style container")
const run = docker(args)
if (run.status !== 0) fail(run.stderr || run.stdout)

for (let i = 0; i < 50; i++) {
  if (docker(["exec", NAME, "test", "-f", "/run/jail-ready"]).status === 0) break
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 100)
}

const runtime = docker([
  "inspect",
  "-f",
  "{{.HostConfig.Runtime}}",
  NAME,
]).stdout
const net = docker([
  "inspect",
  "-f",
  "{{.HostConfig.NetworkMode}}",
  NAME,
]).stdout
const ro = docker([
  "inspect",
  "-f",
  "{{.HostConfig.ReadonlyRootfs}}",
  NAME,
]).stdout
console.log(`runtime=${runtime} network=${net} readonly_rootfs=${ro}`)
if (net !== "none") fail("expected network_mode=none")
if (ro !== "true") fail("expected read-only rootfs")

console.log("==> jail tools")
console.log(docker(["exec", NAME, "jail-run", "--", "uname", "-a"]).stdout)
console.log(docker(["exec", NAME, "jail-run", "--", "node", "-v"]).stdout)
console.log(
  docker(["exec", NAME, "jail-run", "--", "python3", "--version"]).stdout
)

console.log("==> workspace run")
const py = docker([
  "exec",
  NAME,
  "jail-run",
  "--",
  "python3",
  "/workspace/hello.py",
])
if (py.status !== 0) fail(py.stderr || py.stdout)
console.log(py.stdout)
const js = docker([
  "exec",
  NAME,
  "jail-run",
  "--",
  "node",
  "/workspace/hello.js",
])
if (js.status !== 0) fail(js.stderr || js.stdout)
console.log(js.stdout)

const osrel = docker([
  "exec",
  NAME,
  "jail-run",
  "--",
  "cat",
  "/etc/os-release",
]).stdout
console.log(osrel)
if (/debian|ubuntu|bookworm/i.test(osrel) && !/MockMatch Sandbox/i.test(osrel)) {
  fail("jail leaked real distro identity")
}
if (!/MockMatch Sandbox/i.test(osrel)) fail("expected sandbox os-release")

if (
  docker(["exec", NAME, "jail-run", "--", "test", "-d", "/var/lib/dpkg"])
    .status === 0
) {
  fail("/var/lib/dpkg visible inside jail")
}
console.log("OK: no /var/lib/dpkg in jail")

if (docker(["exec", NAME, "sh", "-c", "echo pwn > /etc/pwned"]).status === 0) {
  fail("wrote to outer /etc")
}
console.log("OK: cannot write outer /etc")

const egress = docker([
  "exec",
  NAME,
  "jail-run",
  "--",
  "python3",
  "-c",
  "import socket; s=socket.socket(); s.settimeout(2); s.connect(('1.1.1.1', 80))",
])
if (egress.status === 0) fail("outbound TCP succeeded")
console.log("OK: no outbound TCP")

if (RUNTIME === "runsc" || runtime === "runsc") {
  console.log("==> gVisor")
  if (runtime === "runsc") console.log("OK: runtime is runsc")
  else fail("expected runsc")
}

console.log("Smoke complete — jail isolation profile OK.")
