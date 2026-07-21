import type { DocumentStyle } from "@/components/document-editor"

const FALLBACK: DocumentStyle = {
  accent: "blue",
  typeface: "geist",
  heading: "accent",
  density: "normal",
}

export function parseDocumentStyle(
  value: unknown,
  fallback: DocumentStyle = FALLBACK
): DocumentStyle {
  if (!value || typeof value !== "object") return fallback
  const v = value as Record<string, unknown>
  return {
    accent: (typeof v.accent === "string" ? v.accent : fallback.accent) as DocumentStyle["accent"],
    typeface: (typeof v.typeface === "string" ? v.typeface : fallback.typeface) as DocumentStyle["typeface"],
    heading: (typeof v.heading === "string" ? v.heading : fallback.heading) as DocumentStyle["heading"],
    density: (typeof v.density === "string" ? v.density : fallback.density) as DocumentStyle["density"],
  }
}
