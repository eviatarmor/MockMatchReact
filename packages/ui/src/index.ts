/**
 * Shared UI package.
 * Layout: `shadcn/` (primitives), `shadcn-space/`, `kibo-ui/`, `lib/`, `hooks/`.
 * Prefer deep imports: `@mockmatch/ui/button` (shadcn) or `@mockmatch/ui/shadcn/button`.
 */
export { cn } from "./lib/utils"
export { composeRefs, useComposedRefs } from "./lib/compose-refs"
export {
  startThemeViewTransition,
  type StartThemeViewTransitionOptions,
  type TransitionVariant,
} from "./lib/theme-view-transition"
export { useIsMobile } from "./hooks/use-mobile"
export { useAsRef } from "./hooks/use-as-ref"
export { useLazyRef } from "./hooks/use-lazy-ref"
export { useIsomorphicLayoutEffect } from "./hooks/use-isomorphic-layout-effect"
