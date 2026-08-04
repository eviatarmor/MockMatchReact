#!/usr/bin/env node
/**
 * Convert draw.io / mxGraph stencil XML libraries to SVG + catalog JSON.
 *
 * Colors: mxGraph stencils take fill/stroke from the *cell style* set in
 * Sidebar-*.js (not from the XML). We parse those sidebars and bake the
 * defaults into each SVG so icons are not white-on-white.
 *
 * Usage:
 *   node scripts/convert-stencils.mjs --src <path-to-stencils-dir>
 *   node scripts/convert-stencils.mjs --src ... --sidebar <path-to-sidebar-js-dir>
 *   node scripts/convert-stencils.mjs --src ... --out src/stencils/generated
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_OUT = path.resolve(__dirname, "../src/stencils/generated")

/** Fallback when no sidebar style is found (visible monochrome icon). */
const FALLBACK_ICON = { fill: "#232F3E", stroke: "none" }
const FALLBACK_DIAGRAM = { fill: "#ffffff", stroke: "#000000" }

function parseArgs(argv) {
  const args = { src: null, out: DEFAULT_OUT, sidebar: null }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--src") args.src = argv[++i]
    else if (a === "--out") args.out = path.resolve(argv[++i])
    else if (a === "--sidebar") args.sidebar = argv[++i]
    else if (a === "--help" || a === "-h") {
      console.log(
        "Usage: node convert-stencils.mjs --src <stencils-dir> [--sidebar <sidebar-js-dir>] [--out <dir>]"
      )
      process.exit(0)
    }
  }
  return args
}

function slugify(s) {
  return (
    String(s)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "shape"
  )
}

/** Normalize shape name for sidebar lookup: "A1 Instance" → "a1_instance". */
function normShapeName(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_")
    .replace(/_+/g, "_")
}

function attr(tag, name) {
  const re = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`, "i")
  const m = tag.match(re)
  if (m) return m[1]
  const re2 = new RegExp(`\\b${name}\\s*=\\s*'([^']*)'`, "i")
  const m2 = tag.match(re2)
  return m2 ? m2[1] : null
}

function num(v, fallback = 0) {
  if (v == null || v === "") return fallback
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function escapeXml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function normalizeColor(c) {
  if (c == null) return null
  const t = String(c).trim()
  if (!t || t === "null") return null
  if (t === "none") return "none"
  if (t === "fill" || t === "stroke" || t === "font") return t
  if (t.startsWith("#") || t.startsWith("rgb") || t.startsWith("hsl")) return t
  if (/^[0-9a-fA-F]{3,8}$/.test(t)) return `#${t}`
  return t
}

/**
 * Parse draw.io Sidebar-*.js files → Map of "mxgraph.lib.shape_name" → {fill, stroke}.
 * Also stores "mxgraph.lib.*" library defaults (most common fill/stroke).
 */
function loadSidebarStyles(sidebarDir) {
  /** @type {Map<string, { fill: string, stroke: string }>} */
  const map = new Map()
  /** @type {Map<string, Map<string, number>>} */
  const libFillCounts = new Map()
  /** @type {Map<string, Map<string, number>>} */
  const libStrokeCounts = new Map()

  if (!sidebarDir || !fs.existsSync(sidebarDir)) {
    console.warn(`Sidebar dir missing (${sidebarDir}); using fallbacks only.`)
    return map
  }

  const files = fs
    .readdirSync(sidebarDir)
    .filter((f) => /^Sidebar-.*\.js$/i.test(f))
    .map((f) => path.join(sidebarDir, f))

  const MX = {
    "mxConstants.STYLE_SHAPE": "shape",
    "mxConstants.STYLE_VERTICAL_LABEL_POSITION": "verticalLabelPosition",
    "mxConstants.STYLE_VERTICAL_ALIGN": "verticalAlign",
    "mxConstants.STYLE_ALIGN": "align",
    "mxConstants.STYLE_STROKECOLOR": "strokeColor",
    "mxConstants.STYLE_FILLCOLOR": "fillColor",
    "mxConstants.STYLE_FONTCOLOR": "fontColor",
    "mxConstants.STYLE_STROKEWIDTH": "strokeWidth",
  }

  function expandExpr(expr) {
    let e = expr
    for (const [k, v] of Object.entries(MX)) {
      e = e.split(k).join(`"${v}"`)
    }
    // Only keep string-literal concatenations
    const parts = []
    const re = /'([^']*)'|"([^"]*)"/g
    let m
    while ((m = re.exec(e))) parts.push(m[1] ?? m[2] ?? "")
    return parts.join("")
  }

  /**
   * Find last `varName = <expr>;` before `endIndex`, respecting string literals
   * so semicolons inside '…' don't truncate the expression.
   */
  function lastVarAssign(src, varName, endIndex) {
    const before = src.slice(0, endIndex)
    const needle = new RegExp(`\\b(?:var\\s+)?${varName}\\s*=\\s*`, "gi")
    let lastExpr = null
    let m
    while ((m = needle.exec(before))) {
      let i = m.index + m[0].length
      let expr = ""
      let inS = null
      while (i < before.length) {
        const ch = before[i]
        if (inS) {
          expr += ch
          if (ch === "\\" && i + 1 < before.length) {
            expr += before[++i]
          } else if (ch === inS) {
            inS = null
          }
          i++
          continue
        }
        if (ch === "'" || ch === '"') {
          inS = ch
          expr += ch
          i++
          continue
        }
        if (ch === ";") break
        expr += ch
        i++
      }
      lastExpr = expr.trim()
    }
    return lastExpr
  }

  function parseStyleString(s) {
    const style = {}
    for (const piece of s.split(";")) {
      const i = piece.indexOf("=")
      if (i <= 0) continue
      const k = piece.slice(0, i).trim()
      const v = piece.slice(i + 1).trim()
      if (k) style[k] = v
    }
    return style
  }

  function bump(lib, fill, stroke) {
    if (!lib) return
    if (fill && fill !== "none" && fill.startsWith("#")) {
      if (!libFillCounts.has(lib)) libFillCounts.set(lib, new Map())
      const m = libFillCounts.get(lib)
      m.set(fill, (m.get(fill) || 0) + 1)
    }
    if (stroke) {
      if (!libStrokeCounts.has(lib)) libStrokeCounts.set(lib, new Map())
      const m = libStrokeCounts.get(lib)
      m.set(stroke, (m.get(stroke) || 0) + 1)
    }
  }

  function colorScore(fill) {
    if (!fill || fill === "none") return 0
    const f = fill.toLowerCase()
    if (f === "#ffffff" || f === "#fff") return 1
    // AWS "squid ink" neutrals — weak, allow service colors to win
    if (
      f === "#232f3e" ||
      f === "#232f3d" ||
      f === "#1e262e" ||
      f === "#5a6c86" ||
      f === "#879196" ||
      f === FALLBACK_ICON.fill.toLowerCase()
    ) {
      return 2
    }
    return 5 // brand / category colors
  }

  function register(fullShape, fill, stroke) {
    if (!fullShape || !fullShape.startsWith("mxgraph.")) return
    const fillN = normalizeColor(fill) || FALLBACK_ICON.fill
    const strokeN = normalizeColor(stroke) || "none"
    const key = fullShape.toLowerCase()
    const prev = map.get(key)
    // Prefer stronger (more chromatic) fills so service colors beat neutrals
    if (!prev || colorScore(fillN) >= colorScore(prev.fill)) {
      map.set(key, { fill: fillN, stroke: strokeN })
    }
    const libKey = key.replace(/\.[^.]+$/, "")
    bump(libKey, fillN, strokeN)
  }

  for (const file of files) {
    let text = fs.readFileSync(file, "utf8")
    text = text.replace(/\/\*[\s\S]*?\*\//g, " ")
    text = text.replace(/\/\/[^\n]*/g, " ")

    /** @type {Record<string, string>} */
    const vars = {}

    // Collect string-ish vars (respecting ';' inside quotes)
    const varStartRe = /\bvar\s+([a-zA-Z_$][\w$]*)\s*=\s*/g
    let vm
    while ((vm = varStartRe.exec(text))) {
      const name = vm[1]
      let i = vm.index + vm[0].length
      let expr = ""
      let inS = null
      while (i < text.length) {
        const ch = text[i]
        if (inS) {
          expr += ch
          if (ch === "\\" && i + 1 < text.length) expr += text[++i]
          else if (ch === inS) inS = null
          i++
          continue
        }
        if (ch === "'" || ch === '"') {
          inS = ch
          expr += ch
          i++
          continue
        }
        if (ch === ";") break
        expr += ch
        i++
      }
      if (!/['"]/.test(expr)) continue
      const joined = expandExpr(expr)
      if (
        joined.includes("shape=") ||
        joined.includes("fillColor=") ||
        joined.includes("mxgraph.")
      ) {
        vars[name] = joined
      }
      if (/^mxgraph\./i.test(joined) && !joined.includes("shape=")) {
        vars[name] = joined
      }
    }

    // createVertexTemplateEntry(VAR + 'shape_name;...')
    const concatRe =
      /createVertexTemplateEntry\(\s*([a-zA-Z_$][\w$]*)\s*\+\s*['"]([^'"]+)['"]/g
    let cm
    while ((cm = concatRe.exec(text))) {
      const varName = cm[1]
      const suffix = cm[2]
      const lastAssign = lastVarAssign(text, varName, cm.index)
      const base = lastAssign ? expandExpr(lastAssign) : vars[varName] || ""
      if (!base) continue
      const style = parseStyleString(base + suffix)
      let shape = style.shape || ""
      const libMatch = base.match(/shape=(mxgraph\.[a-z0-9_.]+)\.?/i)
      if (libMatch) {
        const lib = libMatch[1].replace(/\.$/, "")
        const namePart = suffix.split(";")[0]
        if (namePart && namePart !== "resourceIcon") {
          shape = `${lib}.${namePart}`
        } else if (namePart === "resourceIcon") {
          const ri = suffix.match(/resIcon=([^;]+)/)
          if (ri) shape = ri[1]
          else shape = `${lib}.resourceIcon`
        }
      }

      if (shape && shape.includes("mxgraph.")) {
        register(
          shape,
          style.fillColor || FALLBACK_ICON.fill,
          style.strokeColor != null ? style.strokeColor : "none"
        )
      }
    }

    // createVertexTemplateEntry(n2 + 'resourceIcon;resIcon=' + gn + '.lambda;')
    const resEntryRe =
      /createVertexTemplateEntry\(\s*([a-zA-Z_$][\w$]*)\s*\+\s*['"]resourceIcon;resIcon=['"]\s*\+\s*([a-zA-Z_$][\w$]*)\s*\+\s*['"]\.([a-z0-9_]+)/gi
    let rm
    while ((rm = resEntryRe.exec(text))) {
      const styleVar = rm[1]
      const sn = rm[3]
      const lastAssign = lastVarAssign(text, styleVar, rm.index)
      const styleStr = lastAssign
        ? expandExpr(lastAssign)
        : vars[styleVar] || ""
      let gn = vars[rm[2]] || ""
      gn = gn.match(/mxgraph\.[a-z0-9_.]+/i)?.[0] || ""
      if (!gn) {
        gn =
          styleStr.match(/mxgraph\.[a-z0-9_.]+/i)?.[0]?.replace(/\.$/, "") ||
          ""
      }
      if (!gn) {
        const before = text.slice(0, rm.index)
        const libs = [...before.matchAll(/['"]mxgraph\.[a-z0-9_]+['"]/gi)]
        if (libs.length) {
          gn = libs[libs.length - 1][0].replace(/['"]/g, "")
        }
      }
      if (!gn || !sn) continue
      const st = parseStyleString(styleStr)
      const fill = st.fillColor || FALLBACK_ICON.fill
      const stroke = st.strokeColor != null ? st.strokeColor : "none"
      register(`${gn}.${sn}`, fill, stroke)
    }

    // Inline createVertexTemplateEntry('...shape=mxgraph...;...')
    const inlineRe = /createVertexTemplateEntry\(\s*['"]([^'"]+)['"]/g
    let im
    while ((im = inlineRe.exec(text))) {
      const style = parseStyleString(im[1])
      if (!style.shape || !style.shape.includes("mxgraph.")) continue
      register(
        style.shape,
        style.fillColor || FALLBACK_DIAGRAM.fill,
        style.strokeColor != null ? style.strokeColor : FALLBACK_DIAGRAM.stroke
      )
    }
  }

  // Library-level defaults from mode of fills
  for (const [lib, counts] of libFillCounts) {
    let best = FALLBACK_ICON.fill
    let bestN = 0
    for (const [c, n] of counts) {
      if (n > bestN) {
        bestN = n
        best = c
      }
    }
    let bestStroke = "none"
    let bestSN = 0
    const sc = libStrokeCounts.get(lib)
    if (sc) {
      for (const [c, n] of sc) {
        if (n > bestSN) {
          bestSN = n
          bestStroke = c
        }
      }
    }
    map.set(`${lib}.*`, { fill: best, stroke: bestStroke })
  }

  console.log(`Sidebar styles: ${map.size} keys from ${files.length} files`)
  return map
}

function lookupStyle(styleMap, mxLibName, shapeName, aspect) {
  const lib = (mxLibName || "").toLowerCase()
  const sn = normShapeName(shapeName)
  const candidates = [
    `${lib}.${sn}`,
    `${lib}.${shapeName.toLowerCase()}`,
    `${lib}.${sn.replace(/_/g, "")}`,
  ]
  for (const k of candidates) {
    const hit = styleMap.get(k)
    if (hit) return normalizeStyleDefaults(hit, aspect)
  }
  const libDefault = styleMap.get(`${lib}.*`)
  if (libDefault) return normalizeStyleDefaults(libDefault, aspect)
  // Fixed-aspect icons → dark fill; variable diagram shapes → white + stroke
  if (aspect === "fixed") return { ...FALLBACK_ICON }
  return { ...FALLBACK_DIAGRAM }
}

/** Avoid white-on-white for stroke-less icon styles. */
function normalizeStyleDefaults(style, aspect) {
  let fill = style.fill
  let stroke = style.stroke
  const fillIsWhite =
    !fill ||
    fill === "none" ||
    fill.toLowerCase() === "#ffffff" ||
    fill.toLowerCase() === "#fff"
  const strokeIsNone = !stroke || stroke === "none"
  if (fillIsWhite && strokeIsNone) {
    // Icon packs need a solid fill; diagram shapes keep white + black stroke
    if (aspect === "fixed") {
      fill = FALLBACK_ICON.fill
      stroke = "none"
    } else {
      fill = FALLBACK_DIAGRAM.fill
      stroke = FALLBACK_DIAGRAM.stroke
    }
  }
  return { fill, stroke }
}

function tokenize(xml) {
  const tokens = []
  const re = /<\/?([a-zA-Z][\w:-]*)\b([^>]*?)\/?>|([^<]+)/g
  let m
  while ((m = re.exec(xml))) {
    if (m[1]) {
      const raw = m[0]
      const name = m[1].toLowerCase()
      const selfClosing = raw.endsWith("/>")
      const closing = raw.startsWith("</")
      tokens.push({
        type: closing ? "close" : "open",
        name,
        attrs: m[2] || "",
        selfClosing: selfClosing || closing,
        raw,
      })
    } else if (m[3] && m[3].trim()) {
      tokens.push({ type: "text", value: m[3] })
    }
  }
  return tokens
}

function createState(defaults) {
  return {
    fill: defaults.fill ?? FALLBACK_DIAGRAM.fill,
    stroke: defaults.stroke ?? FALLBACK_DIAGRAM.stroke,
    /** Cell-style colors for fillcolor color="fill"|"stroke" resolution. */
    styleFill: defaults.fill ?? FALLBACK_DIAGRAM.fill,
    styleStroke: defaults.stroke ?? FALLBACK_DIAGRAM.stroke,
    strokeWidth: 1,
    dashed: false,
    dashPattern: "3 3",
    alpha: 1,
    fillAlpha: 1,
    strokeAlpha: 1,
    lineJoin: "round",
    lineCap: "butt",
    miterLimit: 10,
  }
}

function cloneState(s) {
  return { ...s }
}

function resolveColor(raw, state) {
  const c = normalizeColor(raw)
  if (c == null) return "none"
  if (c === "fill") return state.styleFill
  if (c === "stroke") return state.styleStroke
  if (c === "font") return "#000000"
  if (c === "none") return "none"
  // Real CSS/SVG colors
  if (c.startsWith("#") || c.startsWith("rgb") || c.startsWith("hsl")) return c
  // mxGraph style-key references (fillColor, fillColor2, panelColor, strokeColor, …)
  if (/stroke/i.test(c)) {
    return state.styleStroke !== "none" ? state.styleStroke : state.styleFill
  }
  if (/^[a-zA-Z_][\w]*$/.test(c)) {
    return state.styleFill
  }
  return c
}

/** True if SVG has at least one non-white, non-none paint (fill or stroke). */
function svgIsVisuallyEmpty(svg) {
  const els = [...svg.matchAll(/<(?:path|rect|ellipse) ([^>]+)>/g)].map(
    (m) => m[1]
  )
  if (els.length === 0) return true
  return !els.some((attrs) => {
    const fill = (attrs.match(/fill="([^"]+)"/) || [])[1] || "none"
    const stroke = (attrs.match(/stroke="([^"]+)"/) || [])[1] || "none"
    const fl = fill.toLowerCase()
    const sl = stroke.toLowerCase()
    const fillOk = fl !== "none" && fl !== "#ffffff"
    const strokeOk = sl !== "none" && sl !== "#ffffff"
    const whiteWithStroke = fl === "#ffffff" && strokeOk
    return fillOk || strokeOk || whiteWithStroke
  })
}

/** Force paintable elements to use a non-white fill when conversion left them blank. */
function ensureVisibleSvg(svg, styleDefaults) {
  if (!svgIsVisuallyEmpty(svg)) return svg
  let fill = styleDefaults.fill
  if (
    !fill ||
    fill === "none" ||
    fill.toLowerCase() === "#ffffff" ||
    fill.toLowerCase() === "#fff"
  ) {
    fill = FALLBACK_ICON.fill
  }
  // Rewrite all white / none fills so multi-path icons become visible
  return svg.replace(
    /<(path|rect|ellipse)([^>]*?)fill="(?:none|#ffffff|#FFFFFF|#fff|#FFF)"/g,
    `<$1$2fill="${fill}"`
  )
}

function paintAttrs(state, mode) {
  const parts = []
  const fa = state.fillAlpha * state.alpha
  const sa = state.strokeAlpha * state.alpha
  if (mode === "fill" || mode === "fillstroke") {
    if (state.fill === "none") parts.push(`fill="none"`)
    else {
      parts.push(`fill="${escapeXml(state.fill)}"`)
      if (fa < 0.999) parts.push(`fill-opacity="${fa.toFixed(3)}"`)
    }
  } else {
    parts.push(`fill="none"`)
  }
  if (mode === "stroke" || mode === "fillstroke") {
    if (state.stroke === "none") parts.push(`stroke="none"`)
    else {
      parts.push(`stroke="${escapeXml(state.stroke)}"`)
      parts.push(`stroke-width="${state.strokeWidth}"`)
      if (sa < 0.999) parts.push(`stroke-opacity="${sa.toFixed(3)}"`)
      if (state.dashed) {
        parts.push(`stroke-dasharray="${escapeXml(state.dashPattern)}"`)
      }
      parts.push(`stroke-linejoin="${state.lineJoin}"`)
      parts.push(`stroke-linecap="${state.lineCap}"`)
      if (state.lineJoin === "miter") {
        parts.push(`stroke-miterlimit="${state.miterLimit}"`)
      }
    }
  } else {
    parts.push(`stroke="none"`)
  }
  return parts.join(" ")
}

function convertShapeBody(bodyXml, w, h, styleDefaults) {
  const tokens = tokenize(bodyXml)
  const stack = [createState(styleDefaults)]
  let state = stack[0]
  let pathD = ""
  const out = []
  let i = 0

  const flushPath = (mode) => {
    if (!pathD.trim()) return
    out.push(`<path d="${pathD.trim()}" ${paintAttrs(state, mode)}/>`)
    pathD = ""
  }

  const applyStyleCmd = (name, a) => {
    switch (name) {
      case "fillcolor":
        state.fill = resolveColor(attr(`x ${a}`, "color"), state)
        break
      case "strokecolor":
        state.stroke = resolveColor(attr(`x ${a}`, "color"), state)
        break
      case "strokewidth":
        state.strokeWidth = num(attr(`x ${a}`, "width"), state.strokeWidth)
        break
      case "dashed": {
        const v = attr(`x ${a}`, "dashed")
        state.dashed = v == null ? true : v === "1" || v === "true"
        break
      }
      case "dashpattern":
        state.dashPattern = (attr(`x ${a}`, "pattern") || "3 3").replace(
          /,/g,
          " "
        )
        break
      case "alpha":
        state.alpha = num(attr(`x ${a}`, "alpha"), 1)
        break
      case "fillalpha":
        state.fillAlpha = num(attr(`x ${a}`, "alpha"), 1)
        break
      case "strokealpha":
        state.strokeAlpha = num(attr(`x ${a}`, "alpha"), 1)
        break
      case "linejoin":
        state.lineJoin = attr(`x ${a}`, "join") || "round"
        break
      case "linecap":
        state.lineCap = attr(`x ${a}`, "cap") || "butt"
        break
      case "miterlimit":
        state.miterLimit = num(attr(`x ${a}`, "limit"), 10)
        break
      case "fillstrokecolor": {
        const c = resolveColor(attr(`x ${a}`, "color"), state)
        if (c) {
          state.fill = c
          state.stroke = c
        }
        break
      }
      default:
        break
    }
  }

  while (i < tokens.length) {
    const t = tokens[i]
    if (t.type !== "open" && t.type !== "close") {
      i++
      continue
    }
    const name = t.name
    const a = t.attrs

    if (name === "background" || name === "foreground") {
      i++
      continue
    }
    if (
      name === "connections" ||
      name === "constraint" ||
      name === "labelbounds"
    ) {
      if (name === "connections" && !t.selfClosing) {
        while (i < tokens.length) {
          i++
          if (
            tokens[i]?.type === "close" &&
            tokens[i].name === "connections"
          ) {
            break
          }
        }
      }
      i++
      continue
    }

    if (name === "save") {
      stack.push(cloneState(state))
      state = stack[stack.length - 1]
      i++
      continue
    }
    if (name === "restore") {
      if (stack.length > 1) stack.pop()
      state = stack[stack.length - 1]
      i++
      continue
    }

    if (
      name === "fillcolor" ||
      name === "strokecolor" ||
      name === "strokewidth" ||
      name === "dashed" ||
      name === "dashpattern" ||
      name === "alpha" ||
      name === "fillalpha" ||
      name === "strokealpha" ||
      name === "linejoin" ||
      name === "linecap" ||
      name === "miterlimit" ||
      name === "fillstrokecolor"
    ) {
      applyStyleCmd(name, a)
      i++
      continue
    }

    if (name === "fillstroke") {
      flushPath("fillstroke")
      i++
      continue
    }
    if (name === "fill") {
      flushPath("fill")
      i++
      continue
    }
    if (name === "stroke") {
      flushPath("stroke")
      i++
      continue
    }

    if (name === "path") {
      i++
      while (i < tokens.length) {
        const p = tokens[i]
        if (p.type === "close" && p.name === "path") break
        if (p.type === "open") {
          const pa = p.attrs
          switch (p.name) {
            case "move":
              pathD += `M ${num(attr(`x ${pa}`, "x"))} ${num(attr(`x ${pa}`, "y"))} `
              break
            case "line":
              pathD += `L ${num(attr(`x ${pa}`, "x"))} ${num(attr(`x ${pa}`, "y"))} `
              break
            case "close":
              pathD += "Z "
              break
            case "curve": {
              const x1 = num(attr(`x ${pa}`, "x1"))
              const y1 = num(attr(`x ${pa}`, "y1"))
              const x2 = num(attr(`x ${pa}`, "x2"))
              const y2 = num(attr(`x ${pa}`, "y2"))
              const x3 = num(attr(`x ${pa}`, "x3"))
              const y3 = num(attr(`x ${pa}`, "y3"))
              pathD += `C ${x1} ${y1} ${x2} ${y2} ${x3} ${y3} `
              break
            }
            case "quad": {
              const x1 = num(attr(`x ${pa}`, "x1"))
              const y1 = num(attr(`x ${pa}`, "y1"))
              const x2 = num(attr(`x ${pa}`, "x2"))
              const y2 = num(attr(`x ${pa}`, "y2"))
              pathD += `Q ${x1} ${y1} ${x2} ${y2} `
              break
            }
            case "arc": {
              const rx = num(attr(`x ${pa}`, "rx"))
              const ry = num(attr(`x ${pa}`, "ry"))
              const rot = num(attr(`x ${pa}`, "x-axis-rotation"))
              const large = num(attr(`x ${pa}`, "large-arc-flag"))
              const sweep = num(attr(`x ${pa}`, "sweep-flag"))
              const x = num(attr(`x ${pa}`, "x"))
              const y = num(attr(`x ${pa}`, "y"))
              pathD += `A ${rx} ${ry} ${rot} ${large} ${sweep} ${x} ${y} `
              break
            }
            default:
              break
          }
        }
        i++
      }
      i++
      continue
    }

    if (name === "rect") {
      flushPath("fillstroke")
      const x = num(attr(`x ${a}`, "x"))
      const y = num(attr(`x ${a}`, "y"))
      const rw = num(attr(`x ${a}`, "w"))
      const rh = num(attr(`x ${a}`, "h"))
      out.push(
        `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" ${paintAttrs(state, "fillstroke")}/>`
      )
      i++
      continue
    }

    if (name === "roundrect") {
      flushPath("fillstroke")
      const x = num(attr(`x ${a}`, "x"))
      const y = num(attr(`x ${a}`, "y"))
      const rw = num(attr(`x ${a}`, "w"))
      const rh = num(attr(`x ${a}`, "h"))
      const arcsize = num(attr(`x ${a}`, "arcsize"), 0.1)
      const r = Math.min(rw, rh) * (arcsize > 1 ? arcsize / 100 : arcsize)
      out.push(
        `<rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="${r}" ry="${r}" ${paintAttrs(state, "fillstroke")}/>`
      )
      i++
      continue
    }

    if (name === "ellipse") {
      flushPath("fillstroke")
      const x = num(attr(`x ${a}`, "x"))
      const y = num(attr(`x ${a}`, "y"))
      const ew = num(attr(`x ${a}`, "w"))
      const eh = num(attr(`x ${a}`, "h"))
      out.push(
        `<ellipse cx="${x + ew / 2}" cy="${y + eh / 2}" rx="${ew / 2}" ry="${eh / 2}" ${paintAttrs(state, "fillstroke")}/>`
      )
      i++
      continue
    }

    if (name === "text") {
      if (!t.selfClosing) {
        while (i < tokens.length) {
          i++
          if (tokens[i]?.type === "close" && tokens[i].name === "text") break
        }
      }
      i++
      continue
    }

    if (
      name.startsWith("font") ||
      name === "shadow" ||
      name === "image" ||
      name === "include-shape"
    ) {
      i++
      continue
    }

    i++
  }

  if (pathD.trim()) flushPath("fillstroke")

  const inner = out.join("")
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" fill="none">${inner}</svg>`
}

function extractShapes(fileXml) {
  const shapes = []
  const re = /<shape\b([^>]*)>([\s\S]*?)<\/shape>/gi
  let m
  while ((m = re.exec(fileXml))) {
    const head = m[1]
    const body = m[2]
    const name = attr(`shape ${head}`, "name") || "Unnamed"
    const w = num(attr(`shape ${head}`, "w"), 100)
    const h = num(attr(`shape ${head}`, "h"), 100)
    const aspect = attr(`shape ${head}`, "aspect") || "variable"
    shapes.push({ name, w, h, aspect, body })
  }
  return shapes
}

function extractMxLibName(fileXml) {
  const m = fileXml.match(/<shapes\b[^>]*\bname\s*=\s*"([^"]+)"/i)
  return m ? m[1] : null
}

function libraryIdFromRel(relPath) {
  return relPath
    .replace(/\\/g, "/")
    .replace(/\.xml$/i, "")
    .replace(/\//g, ".")
    .toLowerCase()
}

function libraryTitleFromRel(relPath) {
  const base = relPath.replace(/\\/g, "/").replace(/\.xml$/i, "")
  return base
    .split("/")
    .map((p) =>
      p.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    )
    .join(" / ")
}

function walkXmlFiles(dir) {
  const out = []
  function walk(d) {
    for (const ent of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, ent.name)
      if (ent.isDirectory()) walk(full)
      else if (ent.isFile() && ent.name.toLowerCase().endsWith(".xml")) {
        out.push(full)
      }
    }
  }
  walk(dir)
  return out.sort()
}

function resolveSidebarDir(srcRoot, explicit) {
  if (explicit) return path.resolve(explicit)
  // stencils is .../webapp/stencils → sidebar is .../webapp/js/diagramly/sidebar
  const candidate = path.resolve(
    srcRoot,
    "../js/diagramly/sidebar"
  )
  if (fs.existsSync(candidate)) return candidate
  return null
}

function main() {
  const args = parseArgs(process.argv)
  if (!args.src) {
    console.error("Missing --src <stencils-dir>")
    process.exit(1)
  }
  const srcRoot = path.resolve(args.src)
  if (!fs.existsSync(srcRoot)) {
    console.error(`Source not found: ${srcRoot}`)
    process.exit(1)
  }

  const sidebarDir = resolveSidebarDir(srcRoot, args.sidebar)
  const styleMap = loadSidebarStyles(sidebarDir)

  const outRoot = args.out
  const catDir = path.join(outRoot, "categories")
  fs.rmSync(outRoot, { recursive: true, force: true })
  fs.mkdirSync(catDir, { recursive: true })

  const files = walkXmlFiles(srcRoot)
  const categories = []
  const indexShapes = []
  let total = 0
  let failed = 0
  let styled = 0
  const usedIds = new Set()

  for (const file of files) {
    const rel = path.relative(srcRoot, file)
    const catId = libraryIdFromRel(rel)
    const title = libraryTitleFromRel(rel)
    let xml
    try {
      xml = fs.readFileSync(file, "utf8")
    } catch (e) {
      console.warn(`skip read ${rel}: ${e.message}`)
      continue
    }

    xml = xml.replace(/<!--[\s\S]*?-->/g, "")
    const mxLib = extractMxLibName(xml) || `mxgraph.${catId}`

    const rawShapes = extractShapes(xml)
    const shapes = []
    const slugCounts = new Map()

    for (const s of rawShapes) {
      let baseSlug = slugify(s.name)
      const n = (slugCounts.get(baseSlug) || 0) + 1
      slugCounts.set(baseSlug, n)
      if (n > 1) baseSlug = `${baseSlug}-${n}`

      let id = `${catId}.${baseSlug}`
      if (usedIds.has(id)) {
        let k = 2
        while (usedIds.has(`${id}-${k}`)) k++
        id = `${id}-${k}`
      }
      usedIds.add(id)

      const styleDefaults = lookupStyle(styleMap, mxLib, s.name, s.aspect)
      if (
        styleMap.has(`${mxLib.toLowerCase()}.${normShapeName(s.name)}`) ||
        styleMap.has(`${mxLib.toLowerCase()}.*`)
      ) {
        styled++
      }

      let svg
      try {
        svg = convertShapeBody(s.body, s.w, s.h, styleDefaults)
        svg = ensureVisibleSvg(svg, styleDefaults)
      } catch (e) {
        failed++
        console.warn(`fail ${id}: ${e.message}`)
        svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${s.w} ${s.h}" width="${s.w}" height="${s.h}"><rect x="1" y="1" width="${Math.max(1, s.w - 2)}" height="${Math.max(1, s.h - 2)}" fill="${styleDefaults.fill}" stroke="${styleDefaults.stroke === "none" ? "#999" : styleDefaults.stroke}"/></svg>`
      }

      shapes.push({
        id,
        name: s.name,
        w: s.w,
        h: s.h,
        aspect: s.aspect,
        svg,
      })
      indexShapes.push({
        id,
        name: s.name,
        categoryId: catId,
        w: s.w,
        h: s.h,
      })
      total++
    }

    if (shapes.length === 0) continue

    categories.push({
      id: catId,
      title,
      source: rel.replace(/\\/g, "/"),
      count: shapes.length,
    })

    fs.writeFileSync(
      path.join(catDir, `${catId}.json`),
      JSON.stringify({ id: catId, title, shapes }),
      "utf8"
    )
    process.stdout.write(`  ${catId}: ${shapes.length} shapes\n`)
  }

  categories.sort((a, b) => a.title.localeCompare(b.title))
  indexShapes.sort((a, b) => a.name.localeCompare(b.name))

  const index = {
    version: 1,
    generatedAt: new Date().toISOString(),
    source: "draw.io stencils (mxGraph shape XML) + Sidebar styles",
    categoryCount: categories.length,
    shapeCount: total,
    failedConversions: failed,
    stylesApplied: styled,
    categories,
    shapes: indexShapes,
  }

  fs.writeFileSync(
    path.join(outRoot, "index.json"),
    JSON.stringify(index),
    "utf8"
  )

  const idsTs = `/* auto-generated by convert-stencils.mjs — do not edit */
export const STENCIL_CATEGORY_IDS = ${JSON.stringify(
    categories.map((c) => c.id),
    null,
    2
  )} as const
export type StencilCategoryId = (typeof STENCIL_CATEGORY_IDS)[number]
`
  fs.writeFileSync(path.join(outRoot, "category-ids.ts"), idsTs, "utf8")

  console.log(
    `\nDone: ${total} shapes in ${categories.length} libraries → ${outRoot}` +
      `\n  sidebar style hits: ${styled}, fallbacks used for rest, failed: ${failed}`
  )
}

main()
