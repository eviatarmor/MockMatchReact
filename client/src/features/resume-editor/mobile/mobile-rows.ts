/** A row in the mobile section list — either the fixed header or a body section. */
export type MobileRow =
  | { readonly kind: "header" }
  | { readonly kind: "section"; readonly sectionId: string }
