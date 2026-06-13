import i18next from "i18next"
import { initReactI18next } from "react-i18next"

import common from "@/locales/en-US/common.json"
import login from "@/locales/en-US/login.json"

export const defaultNS = "common"

i18next.use(initReactI18next).init({
  lng: "en-US",
  fallbackLng: "en-US",
  defaultNS,
  resources: {
    "en-US": { common, login },
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18next
