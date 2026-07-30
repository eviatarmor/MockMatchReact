/**
 * Always install the **latest** Firecracker release from GitHub.
 *
 * - Fetches releases/latest
 * - Downloads arch tarball + verifies sha256 when published
 * - Installs firecracker + jailer under infra/sandbox/agent/bin/
 * - Writes VERSION + version.json
 *
 * Usage:
 *   node infra/sandbox/scripts/install-firecracker.mjs
 *   node infra/sandbox/scripts/install-firecracker.mjs --check
 *   node infra/sandbox/scripts/install-firecracker.mjs --force
 *
 * Binary is Linux ELF (x86_64 / aarch64). Download works on any OS; **run** only on Linux+KVM.
 */
import { createHash } from "node:crypto"
import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readFileSync,
  renameSync,
  rmSync,
  chmodSync,
  copyFileSync,
  writeFileSync,
  readdirSync,
  statSync,
} from "node:fs"
import { tmpdir } from "node:os"
import path from "node:path"
import { pipeline } from "node:stream/promises"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import { Readable } from "node:stream"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO = "firecracker-microvm/firecracker"
const API = `https://api.github.com/repos/${REPO}/releases/latest`
const BIN_DIR = path.resolve(__dirname, "../agent/bin")
const VERSION_FILE = path.join(BIN_DIR, "VERSION")
const META_FILE = path.join(BIN_DIR, "version.json")

const args = new Set(process.argv.slice(2))
const CHECK_ONLY = args.has("--check")
const FORCE = args.has("--force")

function archTriple() {
  if (process.env.SANDBOX_FC_ARCH) return process.env.SANDBOX_FC_ARCH
  const a = process.arch
  if (a === "x64") return "x86_64"
  if (a === "arm64") return "aarch64"
  // Package Linux agent binaries from Windows/macOS by default as x86_64
  if (process.platform === "win32" || process.platform === "darwin") {
    return "x86_64"
  }
  throw new Error(`Unsupported arch for Firecracker: ${a}`)
}

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "mockmatch-firecracker-installer",
    },
  })
  if (!res.ok) throw new Error(`GitHub API ${res.status}: ${url}`)
  return res.json()
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": "mockmatch-firecracker-installer" },
    redirect: "follow",
  })
  if (!res.ok || !res.body) {
    throw new Error(`Download failed ${res.status}: ${url}`)
  }
  await pipeline(Readable.fromWeb(res.body), createWriteStream(dest))
}

function sha256File(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex")
}

function installedVersion() {
  if (!existsSync(VERSION_FILE)) return null
  return readFileSync(VERSION_FILE, "utf8").trim().replace(/^v/, "")
}

function extractTgz(tgzPath, outDir) {
  mkdirSync(outDir, { recursive: true })
  const r = spawnSync("tar", ["-xzf", tgzPath, "-C", outDir], {
    encoding: "utf8",
    windowsHide: true,
  })
  if (r.status !== 0) {
    throw new Error(`tar extract failed: ${r.stderr || r.stdout || r.status}`)
  }
}

function findBinarySync(root, prefix) {
  const walk = (dir, depth = 0) => {
    if (depth > 4) return null
    for (const name of readdirSync(dir)) {
      const p = path.join(dir, name)
      let st
      try {
        st = statSync(p)
      } catch {
        continue
      }
      if (st.isDirectory()) {
        const found = walk(p, depth + 1)
        if (found) return found
      } else if (name.startsWith(prefix) && !name.includes("debug")) {
        return p
      }
    }
    return null
  }
  return walk(root)
}

function printPaths(version) {
  console.log(`    binary:  ${path.join(BIN_DIR, "firecracker")}`)
  console.log(`    jailer:  ${path.join(BIN_DIR, "jailer")}`)
  console.log(`    version: v${version}`)
  console.log(
    "    note:    Linux ELF — run on Linux+KVM agents (not Windows Docker Desktop)"
  )
}

async function main() {
  const arch = archTriple()
  console.log(`==> Firecracker auto-update (latest) arch=${arch}`)

  const release = await fetchJson(API)
  const tag = release.tag_name
  const version = String(tag).replace(/^v/, "")
  const current = installedVersion()

  console.log(`    latest:    v${version}`)
  console.log(`    installed: ${current ? `v${current}` : "(none)"}`)

  if (CHECK_ONLY) {
    if (current === version && existsSync(path.join(BIN_DIR, "firecracker"))) {
      console.log("OK: up to date")
      process.exit(0)
    }
    console.log("UPDATE available")
    process.exit(2)
  }

  if (
    !FORCE &&
    current === version &&
    existsSync(path.join(BIN_DIR, "firecracker"))
  ) {
    console.log("OK: already on latest — nothing to do")
    printPaths(version)
    return
  }

  const assetName = `firecracker-v${version}-${arch}.tgz`
  const asset = (release.assets || []).find((a) => a.name === assetName)
  if (!asset) {
    throw new Error(
      `Asset not found: ${assetName}. Assets: ${(release.assets || []).map((a) => a.name).join(", ")}`
    )
  }
  const shaAsset = (release.assets || []).find(
    (a) => a.name === `${assetName}.sha256.txt`
  )

  const work = path.join(tmpdir(), `fc-install-${version}-${process.pid}`)
  mkdirSync(work, { recursive: true })
  const tgz = path.join(work, assetName)

  try {
    console.log(`==> download ${asset.browser_download_url}`)
    await download(asset.browser_download_url, tgz)

    if (shaAsset) {
      const shaPath = path.join(work, `${assetName}.sha256.txt`)
      await download(shaAsset.browser_download_url, shaPath)
      const expected = readFileSync(shaPath, "utf8").trim().split(/\s+/)[0]
      const actual = sha256File(tgz)
      if (expected && expected !== actual) {
        throw new Error(`sha256 mismatch: expected ${expected} got ${actual}`)
      }
      console.log("OK: sha256 verified")
    }

    const extractDir = path.join(work, "out")
    extractTgz(tgz, extractDir)

    const fcSrc = findBinarySync(extractDir, "firecracker")
    const jailerSrc = findBinarySync(extractDir, "jailer")
    if (!fcSrc) throw new Error("firecracker binary not found in tarball")

    mkdirSync(BIN_DIR, { recursive: true })
    const fcDest = path.join(BIN_DIR, "firecracker")
    const jailerDest = path.join(BIN_DIR, "jailer")
    const fcTmp = `${fcDest}.new`
    copyFileSync(fcSrc, fcTmp)
    try {
      chmodSync(fcTmp, 0o755)
    } catch {
      // Windows may ignore mode
    }
    renameSync(fcTmp, fcDest)
    if (jailerSrc) {
      copyFileSync(jailerSrc, jailerDest)
      try {
        chmodSync(jailerDest, 0o755)
      } catch {
        // ignore
      }
    }

    writeFileSync(VERSION_FILE, `v${version}\n`, "utf8")
    writeFileSync(
      META_FILE,
      JSON.stringify(
        {
          version: `v${version}`,
          arch,
          tag,
          publishedAt: release.published_at,
          installedAt: new Date().toISOString(),
          source: asset.browser_download_url,
          autoUpdate: true,
        },
        null,
        2
      ) + "\n",
      "utf8"
    )

    console.log(`OK: installed Firecracker v${version}`)
    printPaths(version)
  } finally {
    try {
      rmSync(work, { recursive: true, force: true })
    } catch {
      // ignore
    }
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
