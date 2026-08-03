import { z } from "zod"

export const spreadsheetWorkbookStatusSchema = z.enum([
  "draft",
  "active",
  "archived",
])

export const spreadsheetCellSchema = z.object({
  raw: z.string(),
})

export const spreadsheetSheetSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(80),
  cells: z.record(z.string(), spreadsheetCellSchema),
  rowCount: z.number().int().min(1).max(10_000),
  colCount: z.number().int().min(1).max(200),
})

export const spreadsheetDocumentSchema = z.object({
  version: z.literal(1),
  sheets: z.array(spreadsheetSheetSchema).min(1).max(50),
  activeSheetId: z.string().min(1),
})

export type SpreadsheetDocumentDto = z.infer<typeof spreadsheetDocumentSchema>
