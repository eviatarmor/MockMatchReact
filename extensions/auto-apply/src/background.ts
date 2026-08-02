/**
 * Service worker — side panel open + action click.
 */
chrome.runtime?.onInstalled?.addListener(() => {
  if (chrome.sidePanel?.setPanelBehavior) {
    void chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
  }
})

chrome.action?.onClicked?.addListener((tab) => {
  if (tab.id != null && chrome.sidePanel?.open) {
    void chrome.sidePanel.open({ tabId: tab.id })
  }
})

chrome.runtime?.onMessage?.addListener((message, sender, sendResponse) => {
  if (message?.type === "open-side-panel") {
    const tabId = sender.tab?.id
    if (tabId != null && chrome.sidePanel?.open) {
      void chrome.sidePanel.open({ tabId }).then(
        () => sendResponse({ ok: true }),
        () => sendResponse({ ok: false }),
      )
      return true
    }
    sendResponse({ ok: false, reason: "no-tab" })
  }
  return false
})
