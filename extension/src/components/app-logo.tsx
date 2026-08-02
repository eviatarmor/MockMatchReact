import { cn } from "@mockmatch/ui/utils"

/** Same robot mark as client `AppLogo` — assets in extension `public/icons/`. */
export function AppLogo({ className }: { readonly className?: string }) {
  return (
    <img
      src="/icons/app-logo.svg"
      alt=""
      width={32}
      height={32}
      className={cn("block", className)}
      draggable={false}
    />
  )
}
