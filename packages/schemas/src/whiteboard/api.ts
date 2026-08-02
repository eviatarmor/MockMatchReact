import { z } from "zod"
import { entityIdInputSchema } from "../documents/common.js"
import {
  whiteboardBoardStatusSchema,
  whiteboardDocumentSchema,
} from "./document.js"

export const whiteboardBoardIdInputSchema = entityIdInputSchema

export const whiteboardBoardCreateInputSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  questionId: z.string().uuid().optional(),
  document: whiteboardDocumentSchema.optional(),
})

export const whiteboardBoardUpdateInputSchema = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(200).optional(),
  status: whiteboardBoardStatusSchema.optional(),
  document: whiteboardDocumentSchema.optional(),
})

export const whiteboardBoardDtoSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  status: whiteboardBoardStatusSchema,
  questionId: z.string().uuid().nullable(),
  document: whiteboardDocumentSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type WhiteboardBoardCreateInput = z.infer<
  typeof whiteboardBoardCreateInputSchema
>
export type WhiteboardBoardUpdateInput = z.infer<
  typeof whiteboardBoardUpdateInputSchema
>
