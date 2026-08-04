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
  shape: z.enum([
    "rect",
    "ellipse",
    "triangle",
    "diamond",
    "line",
    "arrow",
    "elbowArrow",
    "blockArrow",
    "divider",
  ]),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  z: z.number(),
  fill: z.string(),
  stroke: z.string(),
  label: z.string().optional(),
})

/** draw.io-derived icon; svg embedded for self-contained documents. */
const stencilSchema = z.object({
  id: z.string(),
  type: z.literal("stencil"),
  stencilId: z.string(),
  name: z.string(),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  z: z.number(),
  svg: z.string(),
  label: z.string().optional(),
})

const pathSchema = z.object({
  id: z.string(),
  type: z.literal("path"),
  points: z.array(z.object({ x: z.number(), y: z.number() })),
  z: z.number(),
  stroke: z.string(),
  strokeWidth: z.number(),
  strokeKind: z.enum(["pen", "highlighter", "smart"]).optional(),
  opacity: z.number().min(0).max(1).optional(),
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
  routing: z.enum(["straight", "elbow"]).optional(),
})

export const whiteboardElementSchema = z.union([
  stickySchema,
  textSchema,
  shapeSchema,
  stencilSchema,
  pathSchema,
  connectorSchema,
])

export const whiteboardDocumentSchema = z.object({
  version: z.literal(1),
  elements: z.record(z.string(), whiteboardElementSchema),
})

export type WhiteboardDocumentDto = z.infer<typeof whiteboardDocumentSchema>
