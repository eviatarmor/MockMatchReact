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

import commonEnGB from "@/locales/en-GB/common.json"
import loginEnGB from "@/locales/en-GB/login.json"
import signupEnGB from "@/locales/en-GB/signup.json"
import accountSettingsEnGB from "@/locales/en-GB/account-settings.json"
import privacyEnGB from "@/locales/en-GB/privacy.json"
import billingEnGB from "@/locales/en-GB/billing.json"
import coverLetterEditorEnGB from "@/locales/en-GB/cover-letter-editor.json"
import resumeEditorEnGB from "@/locales/en-GB/resume-editor.json"
import collabEnGB from "@/locales/en-GB/collab.json"

import commonEnAU from "@/locales/en-AU/common.json"
import loginEnAU from "@/locales/en-AU/login.json"
import signupEnAU from "@/locales/en-AU/signup.json"
import accountSettingsEnAU from "@/locales/en-AU/account-settings.json"
import privacyEnAU from "@/locales/en-AU/privacy.json"
import billingEnAU from "@/locales/en-AU/billing.json"
import coverLetterEditorEnAU from "@/locales/en-AU/cover-letter-editor.json"
import resumeEditorEnAU from "@/locales/en-AU/resume-editor.json"
import collabEnAU from "@/locales/en-AU/collab.json"

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
