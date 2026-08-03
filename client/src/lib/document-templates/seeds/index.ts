import type { RoleSeed } from "../types"
import { CONSULTING_SEEDS } from "./consulting"
import { ENGINEERING_SEEDS } from "./engineering"
import { FINANCE_SEEDS } from "./finance"
import { HEALTHCARE_SEEDS } from "./healthcare"
import { LEGAL_SEEDS } from "./legal"
import { TECH_SEEDS } from "./tech"

/** Full unique content for every role-directory id. */
export const ROLE_SEEDS: Readonly<Record<string, RoleSeed>> = {
  ...TECH_SEEDS,
  ...FINANCE_SEEDS,
  ...CONSULTING_SEEDS,
  ...HEALTHCARE_SEEDS,
  ...ENGINEERING_SEEDS,
  ...LEGAL_SEEDS,
}

export function getRoleSeed(id: string): RoleSeed | undefined {
  return ROLE_SEEDS[id]
}
