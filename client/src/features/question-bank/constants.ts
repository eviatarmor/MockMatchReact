import type { BankQuestion, QuestionDomain, QuestionDifficulty, QuestionStatus } from "./types"

export const MOCK_QUESTIONS: readonly BankQuestion[] = [
  { id: "q1",  title: "Two Sum",                               domain: "coding",       difficulty: "easy",   company: "Stripe",    status: "mastered" },
  { id: "q2",  title: "LRU cache",                             domain: "coding",       difficulty: "hard",   company: "Meta",      status: "attempted" },
  { id: "q3",  title: "Merge k sorted lists",                  domain: "coding",       difficulty: "medium", company: null,        status: "new" },
  { id: "q4",  title: "Design a rate limiter",                 domain: "systemDesign", difficulty: "hard",   company: "Cloudflare",status: "new" },
  { id: "q5",  title: "Design a news feed ranking system",     domain: "systemDesign", difficulty: "hard",   company: "Meta",      status: "attempted" },
  { id: "q6",  title: "Estimate the coffee shops in a city",   domain: "caseStudy",    difficulty: "medium", company: "McKinsey",  status: "new" },
  { id: "q7",  title: "Diagnose a 20% drop in daily active users", domain: "product",  difficulty: "medium", company: null,        status: "attempted" },
  { id: "q8",  title: "Prioritize the next-quarter roadmap",   domain: "product",      difficulty: "easy",   company: null,        status: "mastered" },
  { id: "q9",  title: "Tell me about a time you failed",       domain: "behavioral",   difficulty: "easy",   company: null,        status: "mastered" },
  { id: "q10", title: "Describe a conflict with your manager", domain: "behavioral",   difficulty: "medium", company: null,        status: "new" },
  { id: "q11", title: "Build a DCF for a SaaS company",        domain: "finance",      difficulty: "hard",   company: "Citadel",   status: "new" },
  { id: "q12", title: "Read a chest CT for signs of pneumonia",domain: "clinical",     difficulty: "hard",   company: "Epic",      status: "new" },
  { id: "q13", title: "Walk me through a go-to-market plan",   domain: "product",      difficulty: "medium", company: null,        status: "new" },
  { id: "q14", title: "Binary search on rotated array",        domain: "coding",       difficulty: "medium", company: "Stripe",    status: "attempted" },
]

export const QUESTION_DOMAINS: readonly QuestionDomain[] = [
  "coding", "systemDesign", "caseStudy", "product", "behavioral", "finance", "clinical",
]

export const QUESTION_DIFFICULTIES: readonly QuestionDifficulty[] = ["easy", "medium", "hard"]

export const QUESTION_STATUSES: readonly QuestionStatus[] = ["new", "attempted", "mastered"]
