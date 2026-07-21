import { Mail, Phone, MapPin, Globe, Link2 } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { ContactIconKey } from "@mockmatch/schemas"

const CONTACT_ICONS: Record<ContactIconKey, LucideIcon> = {
  mail: Mail,
  phone: Phone,
  mapPin: MapPin,
  globe: Globe,
  link: Link2,
}

export function resolveContactIcon(key: ContactIconKey | string): LucideIcon {
  return CONTACT_ICONS[key as ContactIconKey] ?? Mail
}
