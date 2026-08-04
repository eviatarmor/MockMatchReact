import { z } from "zod"

export const spreadsheetWorkbookStatusSchema = z.enum([
  "draft",
  "active",
  "archived",
])

export const spreadsheetNumberFormatSchema = z.enum([
  "general",
  "number",
  "percent",
  "currency",
  "integer",
])

export const spreadsheetCellSchema = z.object({
  raw: z.string(),
  format: spreadsheetNumberFormatSchema.optional(),
})

export const spreadsheetSheetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  cells: z.record(z.string(), spreadsheetCellSchema),
  rowCount: z.number().int().min(1).max(10_000),
  colCount: z.number().int().min(1).max(500),
  /** Sparse col index → width px. */
  colWidths: z.record(z.string(), z.number().positive().max(640)).optional(),
  /** Sparse row index → height px. */
  rowHeights: z.record(z.string(), z.number().positive().max(200)).optional(),
})

export const spreadsheetDocumentSchema = z.object({
  version: z.literal(1),
  sheets: z.array(spreadsheetSheetSchema).min(1).max(50),
  activeSheetId: z.string().min(1),
})

export type SpreadsheetDocumentDto = z.infer<typeof spreadsheetDocumentSchema>
