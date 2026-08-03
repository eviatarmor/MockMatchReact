/**
 * Product-agnostic multiple-choice practice shell.
 * Host supplies questions, scoring transport, i18n labels, and chrome title.
 */

export { McqOrderList, type McqOrderListProps } from "./mcq-order-list"
export { McqShell, McqErrorState, type McqShellProps } from "./mcq-shell"
export { useMcqSession, type UseMcqSessionOptions } from "./use-mcq-session"
export { shuffleIndices } from "./shuffle-indices"
export { variantOf, OPTION_LETTERS } from "./variant"
export { ItemStatusIcon } from "./item-status-icon"
export { SummaryPanel } from "./summary-panel"
export type {
  McqVariant,
  McqQuestion,
  McqItemResult,
  McqItemState,
  McqCheckPayload,
  McqShellLabels,
  McqChromeProps,
  McqSessionApi,
} from "./types"
