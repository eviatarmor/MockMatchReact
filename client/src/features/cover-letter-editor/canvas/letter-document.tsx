import { cn } from "@/lib/utils"
import type { CoverLetterDocument, EditorTemplate } from "../types"

interface LetterDocumentProps {
  readonly document: CoverLetterDocument
  readonly template: EditorTemplate
}

/**
 * Presentational A4 cover-letter page.
 *
 * Pure render of a {@link CoverLetterDocument} — no editor/canvas concerns — so
 * it can be reused for read-only previews, thumbnails, or export elsewhere.
 * Fixed page width (816px ≈ US Letter @ 96dpi); the canvas handles scaling.
 */
export function LetterDocument({ document, template }: LetterDocumentProps) {
  const { sender, recipient, paragraphs } = document

  return (
    <article
      className={cn(
        "w-[816px] min-h-[1056px] shrink-0 bg-white px-24 py-20 text-neutral-800 shadow-2xl",
        template.serif ? "font-serif" : "font-sans"
      )}
    >
      <header className={cn(template.id === "classic" && "text-center")}>
        <h1 className={cn("text-4xl font-bold tracking-tight text-neutral-900", template.id === "minimal" && "text-3xl font-semibold uppercase tracking-[0.2em]")}>
          {sender.name}
        </h1>
        <p className={cn("mt-1 text-base font-medium", template.accentClass)}>{sender.title}</p>

        <ul className={cn("mt-3 flex flex-wrap gap-x-5 gap-y-1 text-sm text-neutral-600", template.id === "classic" && "justify-center")}>
          {sender.contacts.map((contact) => {
            const Icon = contact.icon
            return (
              <li key={contact.id} className="flex items-center gap-1.5">
                <Icon className={cn("size-3.5", template.accentClass)} />
                <span>{contact.value}</span>
              </li>
            )
          })}
        </ul>

        <hr className={cn("mt-4 border-t-2", template.id === "modern" ? "border-blue-600" : "border-neutral-300")} />
      </header>

      <div className="mt-8 text-[15px] leading-relaxed">
        <p className="text-neutral-500">{document.date}</p>

        <address className="mt-6 not-italic text-neutral-700">
          {recipient.name && <p className="font-medium text-neutral-900">{recipient.name}</p>}
          {recipient.title && <p>{recipient.title}</p>}
          <p className="font-medium text-neutral-900">{recipient.company}</p>
          {recipient.addressLines?.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </address>

        <p className="mt-6 font-medium text-neutral-900">{document.salutation}</p>

        <div className="mt-4 space-y-4 text-justify">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>

        <div className="mt-8">
          <p>{document.closing}</p>
          <p className={cn("mt-6 text-lg font-semibold text-neutral-900", template.serif && "font-serif")}>
            {document.signature}
          </p>
        </div>
      </div>
    </article>
  )
}
