# `@mockmatch/browser-runner`

Client-side code execution for IDE hosts (MockMatch practice, future extensions).

- **Host owns chrome** — pair with `@mockmatch/ide` via `onRun` + `terminalFeed`
- **WASM-first** — language adapters in Dedicated Workers where possible
- **Lazy assets** — heavy runtimes download on first use (later phases)
- **OSS free for commercial** — no WebContainers / CheerpX (see license table)

## Status

| Language | Adapter | Notes |
|----------|---------|--------|
| JavaScript | **Shipped** | Worker sandbox, console → stdout |
| TypeScript | Planned | esbuild-wasm |
| Python | Planned | Pyodide (MPL-2.0) |
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
  languageFromPath,
} from "@mockmatch/browser-runner"

const runner = createBrowserRunner()

await runner.run(
  {
    language: "javascript",
    files: { "main.js": "console.log(1 + 2)\n" },
    entryPath: "main.js",
  },
  (event) => {
    const line = formatRunEventLine(event)
    if (line) pushToTerminal(line)
  }
)

runner.dispose()
```

React:

```ts
import { useBrowserRunner } from "@mockmatch/browser-runner"

const runner = useBrowserRunner()
```

## Security model

| Rule | Behavior |
|------|----------|
| Isolation | User JS runs in a **Dedicated Worker** (no app DOM / cookies) |
| Network | Not exposed to user code (no `fetch` bridge) |
| Timeout | Default 15s; abort via `AbortSignal` |
| Untrusted | Treat exercise code as hostile |

## License matrix (planned / in use)

| Component | Role | License |
|-----------|------|---------|
| This package | Orchestration | Private monorepo (MockMatch) |
| Pyodide | Python | MPL-2.0 |
| esbuild-wasm | TS/JS transpile | MIT |
| browser_wasi_shim / Runno | WASI host | MIT (verify at pin) |
| LLVM/clang wasm | C/C++ | Apache-2.0 |
| copy/v86 | Linux VM (later) | BSD-2-Clause |
| Sandpack | Web previews (later) | MIT |

**Not used** (commercial restrictions): StackBlitz WebContainers API, CheerpX/WebVM, CheerpJ.

Always re-verify LICENSE files when pinning versions.

## Architecture

```
createBrowserRunner()
  → LanguageAdapter per language
  → Worker / WASM engine
  → RunEvent stream → host terminal
```

See repo plan: client-side code execution (`@mockmatch/browser-runner`).
