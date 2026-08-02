/**
 * Service worker stub — UI phase only.
 * Later: open side panel, auth token handoff, tab messages.
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
