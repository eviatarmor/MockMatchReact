/**
 * Content script stub — UI phase only.
 * Later: detect ATS forms, mount chip host, highlight fields.
 */
const HOST_ID = "mockmatch-auto-apply-chip-host"

function ensureChipHost() {
  if (document.getElementById(HOST_ID)) return
  const host = document.createElement("div")
  host.id = HOST_ID
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
    </style>
    <button type="button" class="chip" part="chip" title="MockMatch Auto Apply">
      <span class="dot" aria-hidden="true"></span>
      <span>MockMatch</span>
    </button>
  `
  shadow.appendChild(wrap)
  wrap.querySelector("button")?.addEventListener("click", () => {
    void chrome.runtime?.sendMessage?.({ type: "open-side-panel" })
  })
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", ensureChipHost)
} else {
  ensureChipHost()
}
