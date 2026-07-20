/**
 * Emit Mermaid ER diagram from Drizzle schema modules.
 * Usage: npx tsx scripts/generate-schema-mermaid.ts
 */
import { mkdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { getTableConfig, type PgTable } from "drizzle-orm/pg-core"
import * as schema from "../src/db/schema/index.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const outDir = join(__dirname, "../docs")
const mmdPath = join(outDir, "schema.mmd")
const mdPath = join(outDir, "schema.md")

function isPgTable(value: unknown): value is PgTable {
  return (
    typeof value === "object" &&
    value !== null &&
    // drizzle tables carry Symbol.for('drizzle:IsDrizzleTable') or config via getTableConfig
    "getSQL" in (value as object)
  )
}

function sanitizeIdent(name: string): string {
  return name.replace(/[^a-zA-Z0-9_]/g, "_")
}

function columnType(col: {
  dataType?: string
  columnType?: string
  getSQLType?: () => string
}): string {
  try {
    if (typeof col.getSQLType === "function") return col.getSQLType()
  } catch {
    /* fall through */
  }
  return col.columnType ?? col.dataType ?? "unknown"
}

const tables: PgTable[] = []
for (const value of Object.values(schema)) {
  if (isPgTable(value)) {
    tables.push(value)
  }
}

const lines: string[] = ["erDiagram"]

for (const table of tables) {
  const cfg = getTableConfig(table)
  const name = sanitizeIdent(cfg.name)
  lines.push(`  ${name} {`)
  for (const col of cfg.columns) {
    const colName = sanitizeIdent(col.name)
    const type = sanitizeIdent(columnType(col).replace(/\s+/g, "_"))
    const pk = col.primary ? " PK" : ""
    lines.push(`    ${type} ${colName}${pk}`)
  }
  lines.push("  }")
}

for (const table of tables) {
  const cfg = getTableConfig(table)
  const from = sanitizeIdent(cfg.name)
  for (const fk of cfg.foreignKeys) {
    const ref = fk.reference()
    const toTable = getTableConfig(ref.foreignTable)
    const to = sanitizeIdent(toTable.name)
    // many-to-one from child → parent
    lines.push(`  ${from} }o--|| ${to} : "fk"`)
  }
}

const mermaid = `${lines.join("\n")}\n`
const markdown = `# Database schema

Auto-generated from Drizzle schema via \`npm run db:schema:mermaid\`. Do not edit by hand.

\`\`\`mermaid
${mermaid.trim()}
\`\`\`
`

mkdirSync(outDir, { recursive: true })
writeFileSync(mmdPath, mermaid, "utf8")
writeFileSync(mdPath, markdown, "utf8")
console.log(`Wrote ${mmdPath}`)
console.log(`Wrote ${mdPath}`)
console.log(`Tables: ${tables.map((t) => getTableConfig(t).name).join(", ")}`)
