/**
 * Dev seed bank rows for code_run practice (IDE via `/simulations/:questionId`).
 * Idempotent via content_hash — no format slugs.
 */

import type { CodeRunQuestionPayload } from "../../db/schema/questions.js"

export type SeedCodeRunQuestion = {
  title: string
  body: string
  domain:
    | "coding"
    | "systemDesign"
    | "caseStudy"
    | "product"
    | "behavioral"
    | "finance"
    | "clinical"
    | "dataScience"
    | "ml"
    | "security"
    | "devops"
    | "design"
    | "consulting"
    | "marketing"
    | "sales"
  difficulty: "easy" | "medium" | "hard"
  format: "code_run"
  language: string
  company?: string
  tags: string[]
  roleFamilies: string[]
  payload: CodeRunQuestionPayload
  /** File bodies for IDE open (dev mirror; bank source of truth). */
  contentCache: Record<string, string>
}

const TWO_SUM_STARTER = `// Exercise: Two Sum
// Line 1: target (integer)
// Line 2: space-separated integers
// Print two 0-based indices (ascending) that sum to target.
// Exactly one solution is guaranteed in the test cases.

function twoSum(nums, target) {
  // TODO: return [i, j] with i < j
  return [0, 1]
}

const raw = readStdin().trim() || "9\\n2 7 11 15"
const lines = raw.split("\\n")
const target = Number(lines[0])
const nums = (lines[1] ?? "")
  .trim()
  .split(/\\s+/)
  .filter(Boolean)
  .map(Number)
const [i, j] = twoSum(nums, target)
console.log(\`\${i} \${j}\`)
`

export const CODE_RUN_SEED_QUESTIONS: SeedCodeRunQuestion[] = [
  {
    title: "Two Sum",
    body: "Find two indices whose values sum to a target integer. Classic hash-map interview problem.",
    domain: "coding",
    difficulty: "medium",
    format: "code_run",
    language: "javascript",
    company: "MockMatch Labs",
    tags: ["algorithms", "javascript", "hash-map", "two-sum", "seed"],
    roleFamilies: ["engineering"],
    payload: {
      prompt: `Line 1: target integer.
Line 2: space-separated integers.

Print two **0-based indices** (ascending order) whose values sum to the target.
Exactly one solution is guaranteed. Do not reuse the same index twice.

**Example**
\`\`\`
9
2 7 11 15
\`\`\`
Output: \`0 1\` (because 2 + 7 = 9).

Prefer O(n) time with a hash map (complement lookup).`,
      language: "javascript",
      entryPath: "two-sum.js",
      starterCode: TWO_SUM_STARTER,
      durationMin: 20,
      tests: [
        {
          name: "classic",
          stdin: "9\n2 7 11 15\n",
          expectedStdout: "0 1",
        },
        {
          name: "middle pair",
          stdin: "6\n3 2 4\n",
          expectedStdout: "1 2",
        },
        {
          name: "duplicates",
          stdin: "6\n3 3\n",
          expectedStdout: "0 1",
        },
      ],
    },
    contentCache: {
      "two-sum.js": TWO_SUM_STARTER,
    },
  },
]
