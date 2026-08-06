export interface LandingCompany {
  readonly id: string
  readonly name: string
  readonly logoSrc: string
}

export interface LandingBentoFeature {
  readonly id: string
  readonly nameKey: string
  readonly descriptionKey: string
  readonly className: string
}

export interface LandingFaqItem {
  readonly id: string
  readonly questionKey: string
  readonly answerKey: string
}

export interface LandingChangelogItem {
  readonly id: string
  readonly labelKey: string
  readonly bodyKey: string
}

export interface LandingIntegrationNode {
  readonly id: string
  readonly labelKey: string
}
