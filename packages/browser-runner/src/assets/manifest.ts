/** Pinned runtime asset URLs (CDN). Bump carefully; re-verify licenses. */

export const ESBUILD_WASM_VERSION = "0.25.5"

/** esbuild WASM binary (MIT) — used with esbuild-wasm npm package. */
export const ESBUILD_WASM_URL = `https://cdn.jsdelivr.net/npm/esbuild-wasm@${ESBUILD_WASM_VERSION}/esbuild.wasm`

export const PYODIDE_VERSION = "0.27.5"

/** Pyodide full dist (MPL-2.0) */
export const PYODIDE_INDEX_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`

export const PYODIDE_MODULE_URL = `${PYODIDE_INDEX_URL}pyodide.mjs`
