import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { I18nextProvider } from "react-i18next"
import i18n from "i18next"
import { initReactI18next } from "react-i18next"
import { PresenceAvatarStack } from "@/presence-avatar-stack"
import type { CollabPeer } from "@/types"

void i18n.use(initReactI18next).init({
  lng: "en",
  resources: {
    en: {
      collab: {
        presence: { stackLabel: "{{count}} people", you: "you" },
      },
    },
  },
})

function wrap(node: React.ReactNode) {
  return renderToStaticMarkup(
    <I18nextProvider i18n={i18n}>{node}</I18nextProvider>
  )
}

const self: CollabPeer = {
  userId: "u1",
  name: "Ada Lovelace",
  color: "#f00",
  role: "owner",
  avatarUrl: "https://example.com/ada.png",
}

const peer: CollabPeer = {
  userId: "u2",
  name: "Grace Hopper",
  color: "#0f0",
  role: "edit",
}

const selfWithPhoto: CollabPeer = {
  ...self,
  avatarUrl: "https://cdn.example/photo.jpg",
}

describe("PresenceAvatarStack", () => {
  it("renders null when empty", () => {
    expect(wrap(<PresenceAvatarStack self={null} peers={[]} />)).toBe("")
  })

  it("always includes self first when present", () => {
    const html = wrap(
      <PresenceAvatarStack self={self} peers={[peer]} />
    )
    expect(html).toContain("AL")
    expect(html).toContain("GH")
    expect(html).toContain('aria-label="2 people"')
    // self initials appear before peer
    expect(html.indexOf("AL")).toBeLessThan(html.indexOf("GH"))
    // self elevated (z-[1]) so you stand out in the stack
    expect(html).toContain("z-[1]")
  })

  it("shows self alone", () => {
    const html = wrap(<PresenceAvatarStack self={self} peers={[]} />)
    expect(html).toContain("AL")
    expect(html).toContain('aria-label="1 people"')
  })

  it("dedupes self if also listed in peers", () => {
    const html = wrap(
      <PresenceAvatarStack self={self} peers={[self, peer]} />
    )
    // only one AL (self once)
    expect(html.split("AL").length - 1).toBe(1)
  })

  it("accepts avatarUrl without throwing (AvatarImage is client-load)", () => {
    // Radix AvatarImage only mounts the <img> after load — SSR falls back to initials.
    expect(() =>
      wrap(<PresenceAvatarStack self={selfWithPhoto} peers={[]} />)
    ).not.toThrow()
    const html = wrap(
      <PresenceAvatarStack self={selfWithPhoto} peers={[]} />
    )
    expect(html).toContain("AL")
  })
})
