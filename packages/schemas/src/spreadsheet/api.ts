import { z } from "zod"
import { entityIdInputSchema } from "../documents/common.js"
import {
  spreadsheetDocumentSchema,
  spreadsheetWorkbookStatusSchema,
} from "./document.js"

export const spreadsheetWorkbookIdInputSchema = entityIdInputSchema

export const spreadsheetWorkbookCreateInputSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  questionId: z.string().uuid().optional(),
  document: spreadsheetDocumentSchema.optional(),
})

export const spreadsheetWorkbookUpdateInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  status: spreadsheetWorkbookStatusSchema.optional(),
  document: spreadsheetDocumentSchema.optional(),
})

export const spreadsheetWorkbookDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: spreadsheetWorkbookStatusSchema,
  questionId: z.string().uuid().nullable(),
  document: spreadsheetDocumentSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type SpreadsheetWorkbookCreateInput = z.infer<
  typeof spreadsheetWorkbookCreateInputSchema
>
export type SpreadsheetWorkbookUpdateInput = z.infer<
  typeof spreadsheetWorkbookUpdateInputSchema
>
