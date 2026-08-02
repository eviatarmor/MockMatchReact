import {
  createConnector,
  createEmptyBoard,
  createShape,
  createSticky,
  createText,
  remapDocumentIds,
} from "../document"
import type { WhiteboardDocument, WhiteboardTemplate } from "../types"

const blank: WhiteboardTemplate = {
  id: "blank",
  titleKey: "templates.blank.title",
  descriptionKey: "templates.blank.description",
  document: createEmptyBoard(),
}

const systemDesign: WhiteboardTemplate = {
  id: "system-design",
  titleKey: "templates.systemDesign.title",
  descriptionKey: "templates.systemDesign.description",
  document: (() => {
    const client = createShape({
      x: 80,
      y: 200,
      w: 140,
      h: 80,
      label: "Client",
      fill: "#dbeafe",
      stroke: "#2563eb",
      z: 1,
    })
    const api = createShape({
      x: 320,
      y: 200,
      w: 140,
      h: 80,
      label: "API",
      fill: "#dcfce7",
      stroke: "#16a34a",
      z: 2,
    })
    const service = createShape({
      x: 560,
      y: 200,
      w: 140,
      h: 80,
      label: "Service",
      fill: "#fef3c7",
      stroke: "#d97706",
      z: 3,
    })
    const db = createShape({
      x: 560,
      y: 360,
      w: 140,
      h: 80,
      shape: "ellipse",
      label: "DB",
      fill: "#f3e8ff",
      stroke: "#7c3aed",
      z: 4,
    })
    const title = createText({
      x: 80,
      y: 80,
      text: "System design",
      fontSize: 22,
      w: 280,
      z: 5,
    })
    const c1 = createConnector({
      from: { kind: "element", elementId: client.id, anchor: "e" },
      to: { kind: "element", elementId: api.id, anchor: "w" },
      z: 6,
    })
    const c2 = createConnector({
      from: { kind: "element", elementId: api.id, anchor: "e" },
      to: { kind: "element", elementId: service.id, anchor: "w" },
      z: 7,
    })
    const c3 = createConnector({
      from: { kind: "element", elementId: service.id, anchor: "s" },
      to: { kind: "element", elementId: db.id, anchor: "n" },
      z: 8,
    })
    return {
      version: 1 as const,
      elements: Object.fromEntries(
        [title, client, api, service, db, c1, c2, c3].map((e) => [e.id, e])
      ),
    }
  })(),
}

const matrix: WhiteboardTemplate = {
  id: "2x2-matrix",
  titleKey: "templates.matrix.title",
  descriptionKey: "templates.matrix.description",
  document: (() => {
    const title = createText({
      x: 200,
      y: 40,
      text: "2×2 matrix",
      fontSize: 20,
      w: 200,
      z: 1,
    })
    const q1 = createSticky({
      x: 120,
      y: 100,
      color: "#bbf7d0",
      text: "High impact\nEasy",
      z: 2,
    })
    const q2 = createSticky({
      x: 320,
      y: 100,
      color: "#fde68a",
      text: "High impact\nHard",
      z: 3,
    })
    const q3 = createSticky({
      x: 120,
      y: 280,
      color: "#e5e5e5",
      text: "Low impact\nEasy",
      z: 4,
    })
    const q4 = createSticky({
      x: 320,
      y: 280,
      color: "#fecaca",
      text: "Low impact\nHard",
      z: 5,
    })
    return {
      version: 1 as const,
      elements: Object.fromEntries(
        [title, q1, q2, q3, q4].map((e) => [e.id, e])
      ),
    }
  })(),
}

const flowchart: WhiteboardTemplate = {
  id: "flowchart",
  titleKey: "templates.flowchart.title",
  descriptionKey: "templates.flowchart.description",
  document: (() => {
    const start = createShape({
      x: 280,
      y: 60,
      shape: "ellipse",
      w: 120,
      h: 56,
      label: "Start",
      fill: "#dcfce7",
      stroke: "#16a34a",
      z: 1,
    })
    const decision = createShape({
      x: 260,
      y: 180,
      shape: "diamond",
      w: 160,
      h: 100,
      label: "Decision?",
      fill: "#fef9c3",
      stroke: "#ca8a04",
      z: 2,
    })
    const yes = createShape({
      x: 80,
      y: 360,
      w: 120,
      h: 64,
      label: "Yes",
      fill: "#dbeafe",
      stroke: "#2563eb",
      z: 3,
    })
    const no = createShape({
      x: 480,
      y: 360,
      w: 120,
      h: 64,
      label: "No",
      fill: "#fee2e2",
      stroke: "#dc2626",
      z: 4,
    })
    const end = createShape({
      x: 280,
      y: 500,
      shape: "ellipse",
      w: 120,
      h: 56,
      label: "End",
      fill: "#e5e5e5",
      stroke: "#525252",
      z: 5,
    })
    const c1 = createConnector({
      from: { kind: "element", elementId: start.id, anchor: "s" },
      to: { kind: "element", elementId: decision.id, anchor: "n" },
      z: 6,
    })
    const c2 = createConnector({
      from: { kind: "element", elementId: decision.id, anchor: "w" },
      to: { kind: "element", elementId: yes.id, anchor: "n" },
      z: 7,
    })
    const c3 = createConnector({
      from: { kind: "element", elementId: decision.id, anchor: "e" },
      to: { kind: "element", elementId: no.id, anchor: "n" },
      z: 8,
    })
    const c4 = createConnector({
      from: { kind: "element", elementId: yes.id, anchor: "s" },
      to: { kind: "element", elementId: end.id, anchor: "w" },
      z: 9,
    })
    const c5 = createConnector({
      from: { kind: "element", elementId: no.id, anchor: "s" },
      to: { kind: "element", elementId: end.id, anchor: "e" },
      z: 10,
    })
    return {
      version: 1 as const,
      elements: Object.fromEntries(
        [start, decision, yes, no, end, c1, c2, c3, c4, c5].map((e) => [
          e.id,
          e,
        ])
      ),
    }
  })(),
}

const swot: WhiteboardTemplate = {
  id: "swot",
  titleKey: "templates.swot.title",
  descriptionKey: "templates.swot.description",
  document: (() => {
    const title = createText({
      x: 280,
      y: 40,
      text: "SWOT",
      fontSize: 22,
      w: 120,
      z: 1,
    })
    const s = createSticky({
      x: 120,
      y: 100,
      color: "#bbf7d0",
      text: "Strengths",
      w: 180,
      h: 160,
      z: 2,
    })
    const w = createSticky({
      x: 340,
      y: 100,
      color: "#fecaca",
      text: "Weaknesses",
      w: 180,
      h: 160,
      z: 3,
    })
    const o = createSticky({
      x: 120,
      y: 300,
      color: "#bfdbfe",
      text: "Opportunities",
      w: 180,
      h: 160,
      z: 4,
    })
    const t = createSticky({
      x: 340,
      y: 300,
      color: "#fde68a",
      text: "Threats",
      w: 180,
      h: 160,
      z: 5,
    })
    return {
      version: 1 as const,
      elements: Object.fromEntries(
        [title, s, w, o, t].map((e) => [e.id, e])
      ),
    }
  })(),
}

const userJourney: WhiteboardTemplate = {
  id: "user-journey",
  titleKey: "templates.userJourney.title",
  descriptionKey: "templates.userJourney.description",
  document: (() => {
    const title = createText({
      x: 80,
      y: 40,
      text: "User journey",
      fontSize: 20,
      w: 220,
      z: 1,
    })
    const stages = ["Aware", "Consider", "Try", "Use", "Advocate"]
    const colors = ["#dbeafe", "#e0e7ff", "#fce7f3", "#dcfce7", "#fef3c7"]
    const stickies = stages.map((label, i) =>
      createSticky({
        x: 80 + i * 180,
        y: 120,
        color: colors[i],
        text: label,
        w: 150,
        h: 120,
        z: i + 2,
      })
    )
    const connectors = stickies.slice(0, -1).map((el, i) =>
      createConnector({
        from: { kind: "element", elementId: el.id, anchor: "e" },
        to: {
          kind: "element",
          elementId: stickies[i + 1]!.id,
          anchor: "w",
        },
        z: 20 + i,
      })
    )
    return {
      version: 1 as const,
      elements: Object.fromEntries(
        [title, ...stickies, ...connectors].map((e) => [e.id, e])
      ),
    }
  })(),
}

export const WHITEBOARD_TEMPLATES: readonly WhiteboardTemplate[] = [
  blank,
  systemDesign,
  matrix,
  flowchart,
  swot,
  userJourney,
]

export function getWhiteboardTemplate(
  id: string
): WhiteboardTemplate | undefined {
  return WHITEBOARD_TEMPLATES.find((t) => t.id === id)
}

/** Apply template document with fresh ids. */
export function applyTemplateDocument(
  template: WhiteboardTemplate
): WhiteboardDocument {
  if (template.id === "blank") return createEmptyBoard()
  return remapDocumentIds(template.document)
}
