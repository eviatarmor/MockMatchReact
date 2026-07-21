import type {
  DocumentStyleDto,
  ResumeDocumentDto,
  ResumeTemplateId,
} from "@mockmatch/schemas"

export const DEFAULT_TEMPLATE_ID: ResumeTemplateId = "modern"

export const DEFAULT_STYLE: DocumentStyleDto = {
  accent: "blue",
  typeface: "geist",
  heading: "accent",
  density: "normal",
}

/** Empty starter document for new resumes. */
export function blankResumeDocument(): ResumeDocumentDto {
  return {
    header: {
      name: "",
      headline: "",
      contacts: [
        { id: "email", iconKey: "mail", value: "" },
        { id: "phone", iconKey: "phone", value: "" },
        { id: "location", iconKey: "mapPin", value: "" },
        { id: "website", iconKey: "globe", value: "" },
        { id: "linkedin", iconKey: "link", value: "" },
      ],
    },
    sections: [
      {
        id: crypto.randomUUID(),
        type: "summary",
        text: "",
      },
      {
        id: crypto.randomUUID(),
        type: "experience",
        entries: [
          {
            id: crypto.randomUUID(),
            title: "",
            org: "",
            location: "",
            url: "",
            startDate: "",
            endDate: "",
            bullets: "",
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        type: "education",
        entries: [
          {
            id: crypto.randomUUID(),
            title: "",
            org: "",
            location: "",
            url: "",
            startDate: "",
            endDate: "",
            bullets: "",
          },
        ],
      },
      {
        id: crypto.randomUUID(),
        type: "skills",
        items: [{ id: crypto.randomUUID(), text: "" }],
      },
    ],
  }
}
