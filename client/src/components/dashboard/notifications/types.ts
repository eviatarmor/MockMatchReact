export type NotificationKind =
  | "info"
  | "success"
  | "warning"
  | "product"
  | "credits"

export interface AppNotification {
  readonly id: string
  readonly kind: NotificationKind
  /** i18n key under `notifications.items.<key>.title` / `.body` */
  readonly itemKey: string
  readonly createdAt: string
  /** Optional in-app route when the row is activated */
  readonly href?: string
}
