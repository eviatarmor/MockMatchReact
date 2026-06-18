import i18next from "i18next"
import { initReactI18next } from "react-i18next"

import common from "@/locales/en-US/common.json"
import login from "@/locales/en-US/login.json"
import signup from "@/locales/en-US/signup.json"
import verifyEmail from "@/locales/en-US/verify-email.json"
import resetPassword from "@/locales/en-US/reset-password.json"
import forgotPassword from "@/locales/en-US/forgot-password.json"
import accountSettings from "@/locales/en-US/account-settings.json"
import privacy from "@/locales/en-US/privacy.json"
import billing from "@/locales/en-US/billing.json"

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
      "verify-email": verifyEmail,
      "reset-password": resetPassword,
      "forgot-password": forgotPassword,
      "account-settings": accountSettings,
      privacy,
      billing,
    },
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18next
