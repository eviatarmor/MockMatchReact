import { z } from "zod"

export const whiteboardBoardStatusSchema = z.enum([
  "draft",
  "active",
  "archived",
])

const connectorEndSchema = z.union([
  z.object({
    kind: z.literal("point"),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    kind: z.literal("element"),
    elementId: z.string(),
    anchor: z.enum(["n", "s", "e", "w", "c"]),
  }),
])

const stickySchema = z.object({
  id: z.string(),
  type: z.literal("sticky"),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  z: z.number(),
  color: z.string(),
  text: z.string(),
})

const textSchema = z.object({
  id: z.string(),
  type: z.literal("text"),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  z: z.number(),
  text: z.string(),
  fontSize: z.number(),
})

const shapeSchema = z.object({
  id: z.string(),
  type: z.literal("shape"),
  shape: z.enum(["rect", "ellipse", "triangle", "diamond"]),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  z: z.number(),
  fill: z.string(),
  stroke: z.string(),
  label: z.string().optional(),
})

const pathSchema = z.object({
  id: z.string(),
  type: z.literal("path"),
  points: z.array(z.object({ x: z.number(), y: z.number() })),
  z: z.number(),
  stroke: z.string(),
  strokeWidth: z.number(),
})

const connectorSchema = z.object({
  id: z.string(),
  type: z.literal("connector"),
  from: connectorEndSchema,
  to: connectorEndSchema,
  z: z.number(),
  stroke: z.string(),
  strokeWidth: z.number(),
  startArrow: z.boolean(),
  endArrow: z.boolean(),
})

export const whiteboardElementSchema = z.union([
  stickySchema,
  textSchema,
  shapeSchema,
  pathSchema,
  connectorSchema,
])

export const whiteboardDocumentSchema = z.object({
  version: z.literal(1),
  elements: z.record(z.string(), whiteboardElementSchema),
})

export type WhiteboardDocumentDto = z.infer<typeof whiteboardDocumentSchema>
