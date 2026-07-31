/**
 * Shared read-id set for popover + full page (localStorage until API).
 * useSyncExternalStore so all consumers re-render on mark read / mark all.
 */

const STORAGE_KEY = "mockmatch.notifications.readIds"

function loadReadIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((id): id is string => typeof id === "string"))
  } catch {
    return new Set()
  }
}

function persistReadIds(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // Quota / private mode — ignore
  }
}

let readIds: Set<string> = typeof window !== "undefined" ? loadReadIds() : new Set()
const listeners = new Set<() => void>()

function emit() {
  for (const listener of listeners) listener()
}

export function subscribeNotificationReadIds(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange)
  return () => {
    listeners.delete(onStoreChange)
  }
}

export function getNotificationReadIdsSnapshot(): Set<string> {
  return readIds
}

/** SSR / first paint without window. */
export function getNotificationReadIdsServerSnapshot(): Set<string> {
  return readIds
}

export function markNotificationRead(id: string) {
  if (readIds.has(id)) return
  const next = new Set(readIds)
  next.add(id)
  readIds = next
  persistReadIds(next)
  emit()
}

export function markNotificationsRead(ids: readonly string[]) {
  let changed = false
  const next = new Set(readIds)
  for (const id of ids) {
    if (!next.has(id)) {
      next.add(id)
      changed = true
    }
  }
  if (!changed) return
  readIds = next
  persistReadIds(next)
  emit()
}

export function isNotificationUnread(id: string, ids: Set<string> = readIds): boolean {
  return !ids.has(id)
}
