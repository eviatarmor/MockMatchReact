/**
 * Content script — mount on-page chip only when heuristics say
 * "this looks like a job application" (never on MockMatch itself).
 */
import {
  detectApplicationPage,
  type ApplicationDetection,
} from "./detect/application-page"

const HOST_ID = "mockmatch-auto-apply-chip-host"
const RECHECK_MS = 600

let lastHref = ""
let lastMatch = false
let recheckTimer: ReturnType<typeof setTimeout> | null = null
let observer: MutationObserver | null = null

function removeChipHost() {
  document.getElementById(HOST_ID)?.remove()
}

function ensureChipHost(detection: Extract<ApplicationDetection, { match: true }>) {
  let host = document.getElementById(HOST_ID)
  if (host) {
    host.dataset.site = detection.site
    host.dataset.score = String(detection.score)
    return
  }

  host = document.createElement("div")
  host.id = HOST_ID
  host.dataset.site = detection.site
  host.dataset.score = String(detection.score)
  host.style.cssText =
    "all:initial;position:fixed;right:16px;bottom:16px;z-index:2147483646;font-family:Geist,system-ui,sans-serif;"
  document.documentElement.appendChild(host)

  const shadow = host.attachShadow({ mode: "open" })
  const wrap = document.createElement("div")
  wrap.innerHTML = `
    <style>
      .chip {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 8px 12px;
        border-radius: 9999px;
        background: #fff;
        color: #0a0a0a;
        border: 1px solid rgba(0,0,0,0.08);
        box-shadow: 0 4px 16px rgba(0,0,0,0.12);
        font: 500 13px/1.2 Geist, system-ui, sans-serif;
        cursor: pointer;
      }
      .dot {
        width: 8px; height: 8px; border-radius: 9999px;
        background: #5b5ffb;
      }
      .chip:focus-visible { outline: 2px solid #5b5ffb; outline-offset: 2px; }
      .sub {
        font: 400 11px/1.2 Geist, system-ui, sans-serif;
        color: #737373;
        max-width: 140px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .col { display: flex; flex-direction: column; align-items: flex-start; gap: 1px; }
    </style>
    <button type="button" class="chip" part="chip" title="MockMatch Auto Apply">
      <span class="dot" aria-hidden="true"></span>
      <span class="col">
        <span>MockMatch</span>
        <span class="sub" data-sub></span>
      </span>
    </button>
  `
  shadow.appendChild(wrap)
  const sub = wrap.querySelector("[data-sub]")
  if (sub) sub.textContent = detection.site
  wrap.querySelector("button")?.addEventListener("click", () => {
    void chrome.runtime?.sendMessage?.({
      type: "open-side-panel",
      site: detection.site,
      score: detection.score,
    })
  })
}

function applyDetection() {
  const href = location.href
  const detection = detectApplicationPage(document, href)
  const matched = detection.match

  // Skip no-op when URL+match unchanged (DOM recheck still re-runs scoring above)
  if (href === lastHref && matched === lastMatch && matched) {
    if (detection.match) ensureChipHost(detection)
    return
  }

  lastHref = href
  lastMatch = matched

  if (detection.match) {
    ensureChipHost(detection)
  } else {
    removeChipHost()
  }
}

function scheduleRecheck() {
  if (recheckTimer != null) clearTimeout(recheckTimer)
  recheckTimer = setTimeout(() => {
    recheckTimer = null
    applyDetection()
  }, RECHECK_MS)
}

function patchHistory() {
  const wrap =
    (type: "pushState" | "replaceState") =>
    (...args: Parameters<History["pushState"]>) => {
      const ret = History.prototype[type].apply(history, args)
      scheduleRecheck()
      return ret
    }
  history.pushState = wrap("pushState")
  history.replaceState = wrap("replaceState")
  window.addEventListener("popstate", scheduleRecheck)
  window.addEventListener("hashchange", scheduleRecheck)
}

function startObserver() {
  if (observer || !document.documentElement) return
  observer = new MutationObserver(() => scheduleRecheck())
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  })
}

function boot() {
  applyDetection()
  patchHistory()
  startObserver()
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot)
} else {
  boot()
}
