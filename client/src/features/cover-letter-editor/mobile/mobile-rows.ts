/** A row in the mobile section list — either a fixed document part or a body block. */
export type MobileRow =
  | { readonly kind: "basic-info" }
  | { readonly kind: "recipient" }
  | { readonly kind: "date" }
  | { readonly kind: "block"; readonly blockId: string }
