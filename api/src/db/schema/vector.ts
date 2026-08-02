import { customType } from "drizzle-orm/pg-core"

/** pgvector `vector(1536)` — OpenAI text-embedding-3-small compatible. */
export const vector1536 = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(1536)"
  },
  toDriver(value: number[]): string {
    return `[${value.join(",")}]`
  },
  fromDriver(value: unknown): number[] {
    if (typeof value !== "string") return []
    const inner = value.replace(/^\[/, "").replace(/\]$/, "")
    if (!inner.trim()) return []
    return inner.split(",").map((n) => Number(n.trim()))
  },
})
