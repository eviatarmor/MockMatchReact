import type {
  CoverLetterDocumentDto,
  CoverLetterTemplateId,
  DocumentStyleDto,
} from "@mockmatch/schemas"

export const DEFAULT_TEMPLATE_ID: CoverLetterTemplateId = "modern"

export const DEFAULT_STYLE: DocumentStyleDto = {
  accent: "blue",
  typeface: "geist",
  heading: "accent",
  density: "normal",
}

export function blankCoverLetterDocument(): CoverLetterDocumentDto {
  return {
    sender: {
      name: "",
      title: "",
      contacts: [
        { id: "email", iconKey: "mail", value: "" },
        { id: "phone", iconKey: "phone", value: "" },
        { id: "location", iconKey: "mapPin", value: "" },
        { id: "website", iconKey: "globe", value: "" },
        { id: "linkedin", iconKey: "link", value: "" },
      ],
    },
    date: "",
    recipient: {
      name: "",
      company: "",
      addressLines: [""],
    },
    blocks: [
      { id: crypto.randomUUID(), type: "greeting", text: "" },
      { id: crypto.randomUUID(), type: "paragraph", text: "" },
      {
        id: crypto.randomUUID(),
        type: "signoff",
        closing: "",
        signature: "",
      },
    ],
  }
}
