import i18next from "i18next"
import { initReactI18next } from "react-i18next"
import type { Language } from "@mockmatch/schemas"

import commonEnUS from "@/locales/en-US/common.json"
import loginEnUS from "@/locales/en-US/login.json"
import signupEnUS from "@/locales/en-US/signup.json"
import accountSettingsEnUS from "@/locales/en-US/account-settings.json"
import privacyEnUS from "@/locales/en-US/privacy.json"
import billingEnUS from "@/locales/en-US/billing.json"
import coverLetterEditorEnUS from "@/locales/en-US/cover-letter-editor.json"
import resumeEditorEnUS from "@/locales/en-US/resume-editor.json"
import collabEnUS from "@/locales/en-US/collab.json"
import askEnUS from "@/locales/en-US/ask.json"
import simulationIdeEnUS from "@/locales/en-US/simulation-ide.json"
import simulationConversationEnUS from "@/locales/en-US/simulation-conversation.json"
import helpEnUS from "@/locales/en-US/help.json"
import notFoundEnUS from "@/locales/en-US/not-found.json"

import commonEnGB from "@/locales/en-GB/common.json"
import loginEnGB from "@/locales/en-GB/login.json"
import signupEnGB from "@/locales/en-GB/signup.json"
import accountSettingsEnGB from "@/locales/en-GB/account-settings.json"
import privacyEnGB from "@/locales/en-GB/privacy.json"
import billingEnGB from "@/locales/en-GB/billing.json"
import coverLetterEditorEnGB from "@/locales/en-GB/cover-letter-editor.json"
import resumeEditorEnGB from "@/locales/en-GB/resume-editor.json"
import collabEnGB from "@/locales/en-GB/collab.json"
import askEnGB from "@/locales/en-GB/ask.json"
import simulationIdeEnGB from "@/locales/en-GB/simulation-ide.json"
import simulationConversationEnGB from "@/locales/en-GB/simulation-conversation.json"
import helpEnGB from "@/locales/en-GB/help.json"
import notFoundEnGB from "@/locales/en-GB/not-found.json"

import commonEnAU from "@/locales/en-AU/common.json"
import loginEnAU from "@/locales/en-AU/login.json"
import signupEnAU from "@/locales/en-AU/signup.json"
import accountSettingsEnAU from "@/locales/en-AU/account-settings.json"
import privacyEnAU from "@/locales/en-AU/privacy.json"
import billingEnAU from "@/locales/en-AU/billing.json"
import coverLetterEditorEnAU from "@/locales/en-AU/cover-letter-editor.json"
import resumeEditorEnAU from "@/locales/en-AU/resume-editor.json"
import collabEnAU from "@/locales/en-AU/collab.json"
import askEnAU from "@/locales/en-AU/ask.json"
import simulationIdeEnAU from "@/locales/en-AU/simulation-ide.json"
import simulationConversationEnAU from "@/locales/en-AU/simulation-conversation.json"
import helpEnAU from "@/locales/en-AU/help.json"
import notFoundEnAU from "@/locales/en-AU/not-found.json"

import {
  DEFAULT_LANGUAGE,
  persistLanguage,
  readStoredLanguage,
  SUPPORTED_LANGUAGES,
} from "@/lib/i18n/language"

export const defaultNS = "common"

const enUS = {
  common: commonEnUS,
  login: loginEnUS,
  signup: signupEnUS,
  "account-settings": accountSettingsEnUS,
  privacy: privacyEnUS,
  billing: billingEnUS,
  "cover-letter-editor": coverLetterEditorEnUS,
  "resume-editor": resumeEditorEnUS,
  collab: collabEnUS,
  ask: askEnUS,
  "simulation-ide": simulationIdeEnUS,
  "simulation-conversation": simulationConversationEnUS,
  help: helpEnUS,
  "not-found": notFoundEnUS,
}

const enGB = {
  common: commonEnGB,
  login: loginEnGB,
  signup: signupEnGB,
  "account-settings": accountSettingsEnGB,
  privacy: privacyEnGB,
  billing: billingEnGB,
  "cover-letter-editor": coverLetterEditorEnGB,
  "resume-editor": resumeEditorEnGB,
  collab: collabEnGB,
  ask: askEnGB,
  "simulation-ide": simulationIdeEnGB,
  "simulation-conversation": simulationConversationEnGB,
  help: helpEnGB,
  "not-found": notFoundEnGB,
}

const enAU = {
  common: commonEnAU,
  login: loginEnAU,
  signup: signupEnAU,
  "account-settings": accountSettingsEnAU,
  privacy: privacyEnAU,
  billing: billingEnAU,
  "cover-letter-editor": coverLetterEditorEnAU,
  "resume-editor": resumeEditorEnAU,
  collab: collabEnAU,
  ask: askEnAU,
  "simulation-ide": simulationIdeEnAU,
  "simulation-conversation": simulationConversationEnAU,
  help: helpEnAU,
  "not-found": notFoundEnAU,
}

const initialLanguage = readStoredLanguage() ?? DEFAULT_LANGUAGE

i18next.use(initReactI18next).init({
  lng: initialLanguage,
  fallbackLng: "en-US",
  supportedLngs: [...SUPPORTED_LANGUAGES],
  defaultNS,
  resources: {
    "en-US": enUS,
    "en-GB": enGB,
    "en-AU": enAU,
  },
  interpolation: {
    escapeValue: false,
  },
})

if (typeof document !== "undefined") {
  document.documentElement.lang = initialLanguage
}

/** Persist + apply UI locale. Safe to call on every language change. */
export function setAppLanguage(language: Language): void {
  persistLanguage(language)
  if (i18next.language !== language) {
    void i18next.changeLanguage(language)
  }
  if (typeof document !== "undefined") {
    document.documentElement.lang = language
  }
}

export { DEFAULT_LANGUAGE, isLanguage, readStoredLanguage, SUPPORTED_LANGUAGES } from "@/lib/i18n/language"

export default i18next
