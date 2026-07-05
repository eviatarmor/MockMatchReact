import i18next from "i18next"
import { initReactI18next } from "react-i18next"

import common from "@/locales/en-US/common.json"
import login from "@/locales/en-US/login.json"
import signup from "@/locales/en-US/signup.json"
import accountSettings from "@/locales/en-US/account-settings.json"
import privacy from "@/locales/en-US/privacy.json"
import billing from "@/locales/en-US/billing.json"
import coverLetterEditor from "@/locales/en-US/cover-letter-editor.json"
import resumeEditor from "@/locales/en-US/resume-editor.json"

export const defaultNS = "common"

i18next.use(initReactI18next).init({
  lng: "en-US",
  fallbackLng: "en-US",
  defaultNS,
  resources: {
    "en-US": {
      common,
      login,
      signup,
      "account-settings": accountSettings,
      privacy,
      billing,
      "cover-letter-editor": coverLetterEditor,
      "resume-editor": resumeEditor,
    },
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18next
