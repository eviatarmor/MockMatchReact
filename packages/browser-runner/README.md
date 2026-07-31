# `@mockmatch/browser-runner`

Client-side code execution for IDE hosts (MockMatch practice, future extensions).

- **Host owns chrome** — pair with `@mockmatch/ide` via `onRun` + `terminalFeed`
- **WASM-first** — language adapters; heavy assets lazy-loaded
- **OSS free for commercial** — no WebContainers / CheerpX (see license table)

## Status

| Language | Adapter | Notes |
|----------|---------|--------|
| JavaScript | **Shipped** | Main-thread AsyncFunction + fake console |
| TypeScript | **Shipped** | esbuild-wasm transpile → JS runner |
| Python | **Shipped** | Pyodide (CPython WASM), lazy CDN load |
| C / C++ | Planned | WASI + clang-in-browser |
| Go / Rust / Java / C# | Later | Prefer Linux-in-browser (v86) |
| Node / React / Angular | Later | Sandpack (MIT) and/or Node in VM |

## Install (monorepo)

```json
{
  "dependencies": {
    "@mockmatch/browser-runner": "*"
  }
}
```

## Quick start

```ts
import {
  createBrowserRunner,
  formatRunEventLine,
} from "@mockmatch/browser-runner"

const runner = createBrowserRunner()

await runner.run(
  {
    language: "python",
    files: { "main.py": "print(1 + 2)\n" },
    entryPath: "main.py",
  },
  (event) => {
    const line = formatRunEventLine(event)
    if (line) pushToTerminal(line)
  }
)

runner.dispose()
```

## Security model

| Rule | Behavior |
|------|----------|
| Isolation | Fake console/process; no app DOM / cookies in user code path |
| Network | Not exposed for JS/TS helpers; Pyodide may load packages only if we enable micropip later |
| Timeout | JS/TS ~15s, Python ~30s; abort via `AbortSignal` |
| Untrusted | Treat exercise code as hostile |

## License matrix

| Component | Role | License |
|-----------|------|---------|
| This package | Orchestration | Private monorepo (MockMatch) |
| esbuild-wasm | TS/JS transpile | MIT |
| Pyodide | Python | MPL-2.0 |
| browser_wasi_shim / Runno | WASI host (later) | MIT (verify at pin) |
| LLVM/clang wasm | C/C++ (later) | Apache-2.0 |
| copy/v86 | Linux VM (later) | BSD-2-Clause |
| Sandpack | Web previews (later) | MIT |

**Not used** (commercial restrictions): StackBlitz WebContainers API, CheerpX/WebVM, CheerpJ.

Always re-verify LICENSE files when pinning versions.

## Assets

| Runtime | Source |
|---------|--------|
| esbuild WASM | jsDelivr `esbuild-wasm@0.25.5` |
| Pyodide | jsDelivr `pyodide/v0.27.5/full/` |

See `src/assets/manifest.ts`.
