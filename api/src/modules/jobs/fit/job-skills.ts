/**
 * Extract skills the *job* needs (not resume gaps).
 * Used by heuristic fit and as a fallback when AI skills are empty.
 */

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s/-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Common tech / workplace skills to pull from free-text postings. */
const KNOWN_SKILLS: readonly string[] = [
  "TypeScript",
  "JavaScript",
  "React",
  "React Native",
  "Next.js",
  "Node.js",
  "Vue",
  "Angular",
  "Python",
  "Django",
  "Flask",
  "FastAPI",
  "Java",
  "Spring",
  "Kotlin",
  "Swift",
  "Objective-C",
  "Go",
  "Rust",
  "C#",
  ".NET",
  "C++",
  "PHP",
  "Ruby",
  "Rails",
  "SQL",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Elasticsearch",
  "GraphQL",
  "REST",
  "gRPC",
  "AWS",
  "Azure",
  "GCP",
  "Docker",
  "Kubernetes",
  "Terraform",
  "CI/CD",
  "Linux",
  "Git",
  "GitHub Actions",
  "Jenkins",
  "Kafka",
  "RabbitMQ",
  "Spark",
  "Hadoop",
  "Pandas",
  "NumPy",
  "PyTorch",
  "TensorFlow",
  "Machine Learning",
  "Deep Learning",
  "NLP",
  "Data Engineering",
  "Data Science",
  "ETL",
  "dbt",
  "Snowflake",
  "BigQuery",
  "Airflow",
  "Figma",
  "Sketch",
  "Adobe XD",
  "UI/UX",
  "Product Design",
  "User Research",
  "Agile",
  "Scrum",
  "Jira",
  "Salesforce",
  "SAP",
  "Tableau",
  "Power BI",
  "Excel",
  "Communication",
  "Leadership",
  "Project Management",
  "Stakeholder Management",
  "Problem Solving",
  "System Design",
  "Microservices",
  "API Design",
  "Security",
  "DevOps",
  "SRE",
  "Observability",
  "Testing",
  "TDD",
  "Playwright",
  "Cypress",
  "Jest",
  "HTML",
  "CSS",
  "Tailwind",
  "Sass",
  "Webpack",
  "Vite",
  "iOS",
  "Android",
  "Flutter",
  "Kotlin Multiplatform",
  "Solidity",
  "Blockchain",
  "LLM",
  "Prompt Engineering",
  "OpenAI",
  "LangChain",
]

function prettyKnown(skill: string): string {
  return skill
}

/**
 * Pull up to `max` skills the job text asks for.
 * Prefer known multi-word skills (longest first) so "React Native" beats "React".
 */
export function extractJobRequiredSkills(
  jobText: string,
  max = 6
): Array<{ label: string; matched: boolean }> {
  const hay = normalize(jobText)
  if (!hay) return []

  const sorted = [...KNOWN_SKILLS].sort((a, b) => b.length - a.length)
  const found: string[] = []
  const usedSpans: Array<{ start: number; end: number }> = []

  for (const skill of sorted) {
    if (found.length >= max) break
    const needle = normalize(skill)
    if (needle.length < 2) continue

    let from = 0
    while (from < hay.length) {
      const idx = hay.indexOf(needle, from)
      if (idx < 0) break
      const end = idx + needle.length
      // word-ish boundary: avoid matching "go" inside "golang" wrongly handled via longer first
      const before = idx === 0 ? " " : hay[idx - 1]!
      const after = end >= hay.length ? " " : hay[end]!
      const boundaryOk =
        /[\s,./+#-]/.test(before) && /[\s,./+#-]/.test(after)
      if (!boundaryOk && needle.length <= 3) {
        from = idx + 1
        continue
      }

      const overlaps = usedSpans.some((s) => idx < s.end && end > s.start)
      if (!overlaps) {
        found.push(prettyKnown(skill))
        usedSpans.push({ start: idx, end })
        break
      }
      from = idx + 1
    }
  }

  // Fallback: frequent non-stop tokens if nothing known matched
  if (found.length === 0) {
    const stop = new Set([
      "and",
      "the",
      "for",
      "with",
      "you",
      "our",
      "will",
      "are",
      "job",
      "role",
      "work",
      "team",
      "years",
      "experience",
      "ability",
      "skills",
      "required",
      "preferred",
      "including",
      "must",
      "have",
      "this",
      "that",
      "from",
      "about",
      "your",
      "their",
      "other",
      "such",
      "into",
      "using",
      "across",
      "within",
    ])
    const freq = new Map<string, number>()
    for (const t of hay.split(" ")) {
      if (stop.has(t) || t.length < 4) continue
      freq.set(t, (freq.get(t) ?? 0) + 1)
    }
    const top = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, max)
      .map(([w]) => w.charAt(0).toUpperCase() + w.slice(1))
    for (const label of top) {
      found.push(label)
    }
  }

  return found.slice(0, max).map((label) => ({ label, matched: false }))
}
