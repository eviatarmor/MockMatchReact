import { tool } from "ai"
import { z } from "zod"

export const replaceDocumentTextInputSchema = z.object({
  find: z
    .string()
    .min(1)
    .describe(
      "Exact text currently present in the document that should be replaced. Prefer a unique contiguous snippet."
    ),
  replacement: z
    .string()
    .describe("The new text that should replace `find`."),
  targetId: z
    .string()
    .optional()
    .describe(
      "Optional section/entry/block id from the document dump (or @ mention id) to limit the search."
    ),
  locationLabel: z
    .string()
    .optional()
    .describe("Short human label for the UI, e.g. Experience · Acme bullets."),
})

export type ReplaceDocumentTextInput = z.infer<
  typeof replaceDocumentTextInputSchema
>

export type ReplaceDocumentTextOutput = {
  success: boolean
  message: string
  find: string
  replacement: string
  targetId?: string
  locationLabel?: string
}

/** Tool definition: requires user approval before server returns the apply payload. */
export const replaceDocumentTextTool = tool({
  description:
    "Propose replacing specific text in the user's resume or cover letter. " +
    "Always call this when the user wants a rewrite applied into the document " +
    "(not just suggested in chat). The user must approve before the change is applied.",
  inputSchema: replaceDocumentTextInputSchema,
  needsApproval: true,
  execute: async (input): Promise<ReplaceDocumentTextOutput> => {
    // Actual mutation is client-side after approval. Server returns the plan.
    return {
      success: true,
      message: "Replacement approved — applied in the editor.",
      find: input.find,
      replacement: input.replacement,
      targetId: input.targetId,
      locationLabel: input.locationLabel,
    }
  },
})

export const documentAiTools = {
  replace_document_text: replaceDocumentTextTool,
}
