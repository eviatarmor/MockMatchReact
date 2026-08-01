---
name: MockMatch
description: Calm, soft SaaS prep studio — dark enterprise chrome, light content stage, Prep Ultramarine accent.
colors:
  primary: "oklch(0.52 0.21 262)"
  primary-dark: "oklch(0.62 0.21 262)"
  primary-foreground: "oklch(0.985 0 0)"
  foreground: "oklch(0.145 0 0)"
  foreground-inverse: "oklch(0.985 0 0)"
  canvas: "oklch(0.97 0 0)"
  card: "oklch(1 0 0)"
  card-dark: "oklch(0.205 0 0)"
  background-dark: "oklch(0.145 0 0)"
  muted: "oklch(0.97 0 0)"
  muted-foreground: "oklch(0.556 0 0)"
  muted-dark: "oklch(0.269 0 0)"
  muted-foreground-dark: "oklch(0.708 0 0)"
  secondary: "oklch(0.97 0 0)"
  secondary-foreground: "oklch(0.205 0 0)"
  border: "oklch(0.922 0 0)"
  border-dark: "oklch(1 0 0 / 10%)"
  input: "oklch(0.922 0 0)"
  destructive: "oklch(0.577 0.245 27.325)"
  destructive-dark: "oklch(0.704 0.191 22.216)"
  ring: "oklch(0.52 0.21 262)"
  sidebar: "oklch(0.185 0 0)"
  sidebar-dark: "oklch(0.155 0 0)"
  sidebar-foreground: "oklch(0.97 0 0)"
  sidebar-accent: "oklch(1 0 0 / 10%)"
  content-stage: "#fafafa"
  content-stage-dark: "#0a0a0a"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "normal"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "normal"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: 1.375
    letterSpacing: "normal"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "0.05em"
  micro:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.625rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
  document-body:
    fontFamily: "inherit"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
  full: "9999px"
spacing:
  control-y: "0.5rem"
  control-x: "0.625rem"
  card: "1rem"
  page: "1.5rem"
  rail: "0.25rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
    typography: "{typography.body}"
  button-primary-hover:
    backgroundColor: "oklch(0.52 0.21 262 / 80%)"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-outline:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  button-secondary:
    backgroundColor: "{colors.secondary}"
    textColor: "{colors.secondary-foreground}"
    rounded: "{rounded.lg}"
    padding: "0 0.625rem"
    height: "2rem"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.foreground}"
    rounded: "{rounded.lg}"
    padding: "0.25rem 0.625rem"
    height: "2rem"
    typography: "{typography.body}"
  badge-default:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.primary-foreground}"
    rounded: "{rounded.full}"
    padding: "0.125rem 0.5rem"
    height: "1.25rem"
    typography: "{typography.label}"
  card-surface:
    backgroundColor: "{colors.card}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "1rem"
  content-stage:
    backgroundColor: "{colors.content-stage}"
    textColor: "{colors.foreground}"
    rounded: "{rounded.xl}"
    padding: "1.5rem"
---

# Design System: MockMatch

## Overview

**Creative North Star: "The Focused Prep Studio"**

MockMatch is a soft product-SaaS workspace for serious interview prep. The brand stage is a dark enterprise shell (near-black icon rail + section nav) with a softly lifted content card as the work surface — a quiet studio floor, not a marketing landing page. Inside that card, density stays productive: compact controls, clear hierarchy, friendly weight without playful noise.

Personality is approachable and calm: Geist type, rounded-soft geometry, Prep Ultramarine as a confident but sparse accent. Auth heroes may go full primary fields for persuasion; the signed-in app keeps accent for primary actions, focus rings, and readiness/score signals — not wallpaper.

Visual rejections confirmed with the product: no neon gamification, no rainbow chrome as product UI grammar (rainbow/shine/marquee tokens may exist for isolated demos only). Avoid hustle-bro energy and chaotic ornament; the robot mascot is brand presence for waits and empty states, not a carnival of motion.

**Key Characteristics:**
- Dark chrome shell + soft light content stage (card-in-frame)
- Single Prep Ultramarine accent family (light/dark tuned)
- Geist / Geist Mono only for UI chrome
- Compact, soft-approachable controls (default height 2rem / 32px)
- Soft card lift (`shadow-sm` + hairline borders) on muted canvas
- Quiet list/table entrance stagger; reduced-motion respected
- Robot mascot for content-area loading; skeletons for shaped lists; tiny spinners for chrome

## Colors

Neutral-first soft SaaS palette with one vivid indigo-blue brand accent and a fixed dark sidebar chrome that stays enterprise-dark in both themes.

### Primary
- **Prep Ultramarine** (`oklch(0.52 0.21 262)` light / `oklch(0.62 0.21 262)` dark): Primary buttons, links, focus rings, active affordances, auth hero fills, selected badges. On-accent text is near-white (`oklch(0.985 0 0)`).

### Secondary
- **Soft Mist** (`oklch(0.97 0 0)` light / `oklch(0.269 0 0)` dark): Secondary button fills and quiet supporting surfaces — not a second brand hue.

### Tertiary
Omit. Accent rainbow tokens (`--color-1`…`--color-5`) are decorative utilities for isolated effects, not product roles.

### Neutral
- **Ink** (`oklch(0.145 0 0)`): Primary text on light surfaces.
- **Paper White** (`oklch(1 0 0)`): Cards, popovers, clean document-adjacent surfaces.
- **Studio Canvas** (`oklch(0.97 0 0)`): Body / muted page wash behind the content stage; also muted chips.
- **Quiet Gray** (`oklch(0.556 0 0)`): Secondary copy, placeholders, helper text.
- **Hairline** (`oklch(0.922 0 0)` light / white at 10% dark): Borders and input strokes.
- **Enterprise Rail** (`oklch(0.185 0 0)` light shell / `oklch(0.155 0 0)` dark): Sidebar + icon rail background; white/near-white labels (`oklch(0.97 0 0)`); active rail items use translucent white wash (`oklch(1 0 0 / 10%)`).
- **Content Stage** (`#fafafa` / `#0a0a0a`): Dashboard main card fill (`neutral-50` / `neutral-950`) distinct from pure white cards inside it.
- **Alert Coral** (`oklch(0.577 0.245 27.325)` light / brighter in dark): Destructive actions and invalid rings — soft fill variants preferred for buttons (`destructive/10` text-destructive).

### Named Rules
**The One Accent Rule.** Prep Ultramarine is the only chromatic brand voice in product chrome. Keep it on primary CTAs, focus, links, and intentional status — not large decorative fills inside the dashboard stage.

**The Dark Chrome Rule.** Icon rail and section nav stay near-black with light type in both light and dark app themes. Do not lighten the rail to match the content card.

**The Soft Stage Rule.** Signed-in work lives on a rounded content card over the dark shell; body canvas remains muted, not pure white full-bleed.

## Typography

**Display Font:** Geist (with ui-sans-serif, system-ui, sans-serif)
**Body Font:** Geist (same stack; headings share `--font-heading` → sans)
**Label/Mono Font:** Geist Mono (with ui-monospace, SFMono-Regular, monospace)

**Character:** Single-family soft product system — geometric, legible, slightly friendly. Hierarchy comes from weight and size, not a second display face. Mono is reserved for code, IDs, and IDE surfaces.

### Hierarchy
- **Display** (700, ~2.25rem / `text-4xl`, tight leading): Auth hero titles and rare marketing-scale moments on primary fields.
- **Headline** (700, ~1.5rem / `text-2xl`): Page and form titles (login right pane, dialog titles).
- **Title** (500, 1rem / `text-base`, snug): Card titles, section headers (`font-heading`).
- **Body** (400, 0.875rem / `text-sm` at md+; base on mobile inputs): App UI default copy, tables, descriptions.
- **Label** (600, 0.75rem / `text-xs`, often uppercase + wider tracking on auth eyebrows): Badges, eyebrows, meta chips.
- **Micro** (500–700, 0.625rem / `text-2xs`): Dense table headers, rail section labels, tiny badges, progress micro-copy. Prefer over arbitrary `text-[10px]` / `text-[11px]`.
- **Document body** (400, 0.9375rem / 15px): Resume and cover-letter paper content only — not app chrome. Template faces may replace the family on the canvas.
- **Mono** (400, ~0.875rem): Code editors, streamdown fences, technical metadata.

### Named Rules
**The One Family Rule.** Do not introduce a serif or alternate UI face for chrome. Document content may use template fonts inside the resume/cover-letter canvas; app chrome stays Geist.

**The Compact Type Rule.** Prefer `text-sm` for operational UI; reserve large display sizes for auth/marketing heroes, not every dashboard header.

## Layout

Spatial model is **shell + stage**: full-viewport dark sidebar chrome; main work surface is a flex content card with `my-2` / `mr-2` gutters, `rounded-xl`, hairline border, soft shadow. Icon rail is fixed width (`w-14`); section nav collapses; Ask panel pushes the stage (margin transition ~360ms, ease `cubic-bezier(0.22, 1, 0.36, 1)`).

Page rhythm inside the stage: horizontal/vertical padding `1.5rem` (`px-6 py-6`) for list/dashboard routes. Editor routes (resume, cover letter, IDE/simulations) fill edge-to-edge inside the card (no outer page padding).

Density is **productive-soft**: default controls `h-8`, table and card grids with modest gaps, not airy marketing whitespace. Auth is a split layout: primary-filled hero (lg+) + form column.

Breakpoints follow Tailwind defaults (e.g. auth hero `lg:flex`). Body is `overflow-hidden` for app shell; print routes opt out via `.print-surface`.

### Named Rules
**The Stage Padding Rule.** Standard dashboard pages use `1.5rem` stage padding; full-bleed only for document/IDE canvases.

**The Rail Geometry Rule.** Icon rail footprint stays stable (logo slot `size-9`); collapse morphs affordances without shifting section icons.

## Elevation & Depth

Hybrid of **tonal layering + soft structural lift**. Resting product surfaces are mostly flat with rings/borders; the content stage and entity cards use light `shadow-sm` to separate from the muted canvas. Popovers/menus may use stronger blur + shadow (`shadow-xl`, `backdrop-blur`) as transient elevation — not the default for static layout.

Depth is not dramaturgy: no large multi-layer drop stacks on every card.

### Shadow Vocabulary
- **Stage lift** (`shadow-sm` on content main + tables/stat cards): Separates the work surface and data cards from the muted body.
- **Transient float** (`shadow-xl` + soft black/10 or black/40 in dark, often with `ring-1 ring-foreground/10` and blur): Notification menus, elevated overlays.
- **Focus ring** (`ring-3 ring-ring/50` + border-ring): Keyboard focus — color elevation, not shadow.

### Named Rules
**The Soft Lift Rule.** Prefer `shadow-sm` + border for resting product cards; reserve dramatic shadows for temporary layers.

**The Flat Rail Rule.** Sidebar chrome is flat tonal — no soft white cards floating inside the dark rail.

## Shapes

Base radius token `--radius: 0.625rem` (10px) scales the system: sm ~6px, md ~8px, lg 10px, xl ~14px. Controls and inputs use **gently rounded-lg** (~10px). Cards, content stage, and tables use **softer rounded-xl** (~14px). Badges are **pill** (`rounded-4xl` / full). Icon-button sizes tighten radius toward md for small targets.

Borders are hairline (`border`, often `/60` or `/40` opacity on dividers). Cards often use `ring-1 ring-foreground/10` instead of heavy outlines. No sharp zero-radius product chrome.

### Named Rules
**The Soft Corner Rule.** Prefer lg for controls and xl for containers; avoid square industrial edges in app chrome.

**The Pill Meta Rule.** Status chips and badges stay fully rounded; do not square-off score/meta pills.

## Components

Controls feel **soft and approachable**: compact heights, medium weight labels, gentle hover washes, friendly primary fill without aggressive press theatrics (`active` may nudge 1px).

### Buttons
- **Shape:** Gently rounded (`rounded-lg` / ~10px); small sizes clamp toward md radius.
- **Primary:** Prep Ultramarine fill, near-white text, height 2rem, horizontal padding ~0.625rem, `text-sm font-medium`. Hover: primary at 80% opacity.
- **Secondary:** Soft mist fill; hover slightly mixes foreground into secondary.
- **Outline:** Background surface + border; hover muted wash.
- **Ghost:** Transparent; muted hover.
- **Destructive:** Soft tinted fill (`destructive/10`) + destructive text — not a solid red brick by default.
- **Focus:** `border-ring` + `ring-3 ring-ring/50`.
- **Sizes:** default `h-8`, sm `h-7`, xs `h-6`, lg `h-9`, icon mates matching.

### Chips
- **Style:** Badge component — height 1.25rem, pill radius, `text-xs font-medium`, horizontal padding 0.5rem.
- **Primary / secondary / outline / destructive** variants mirror button roles; use for status, difficulty, document meta — not large filters as solid primary walls.

### Cards / Containers
- **Corner Style:** Soft xl (~14px) for stage, entity tables, stat/template cards.
- **Background:** `bg-card` or content-stage neutrals; document thumbnails may force white paper.
- **Shadow Strategy:** Soft stage lift (`shadow-sm`); optional ring.
- **Border:** Hairline `border` / `border-border/60` on stage.
- **Internal Padding:** ~1rem card spacing default; page stage 1.5rem.

### Inputs / Fields
- **Style:** Height 2rem, rounded-lg, transparent/light input fill, hairline `border-input`, `px-2.5`, `text-sm` on md+.
- **Focus:** Border + ring on Prep Ultramarine family.
- **Error:** Destructive border + ring; dark mode uses softer destructive alpha.
- **Disabled:** Reduced opacity; muted input fill.

### Navigation
- **Icon rail:** Width 3.5rem, dark sidebar bg, icon-only sections with tooltips; active section uses translucent sidebar-accent wash.
- **Section nav:** Label column for routes in the active group; collapsible.
- **Navbar:** Breadcrumbs + Ask + notifications + theme + feedback + credits; sits on the content stage (optional rounded top when staged).
- **Mobile:** Shell is desktop-first dense; collapse patterns via section-nav toggle — do not invent a separate neon mobile skin.

### Signature: Content Stage
Dashboard main card — rounded-xl, soft border, `bg-neutral-50` / `dark:bg-neutral-950`, soft shadow — is the primary composition unit for product UI. Nested cards and tables nest *inside* it; do not invent a second full-viewport frame.

### Signature: Robot Loader / Robot Lost
Brand mascot SVG for content-area waits and 404 moments (`sm`/`md`/`lg`). Not for buttons or micro chrome (use Spinner / Loader2). List-shaped waits use Skeleton silhouettes, not the robot.

### Signature: List / Table Stagger
Shared cascade: first 12 items delay `index * 0.04s`, duration `0.22s`, distance `10px`, ease `cubic-bezier(0.25, 0.1, 0.25, 1)`. Tables use `.entity-table-body` CSS; non-tables use `StaggerItem`. Honor `prefers-reduced-motion`.

## Do's and Don'ts

### Do:
- **Do** place signed-in work on the soft content stage over dark chrome.
- **Do** use Prep Ultramarine for primary actions, focus rings, and intentional signals.
- **Do** default interactive controls to ~2rem height with rounded-lg corners.
- **Do** use Geist for UI type and Geist Mono for code.
- **Do** prefer tonal borders + soft `shadow-sm` over heavy multi-layer shadows.
- **Do** use RobotLoader for empty/content waits; Skeleton for list silhouettes; Spinner for chrome.
- **Do** cascade list/table entrances with the shared STAGGER values.
- **Do** keep sidebar chrome near-black in light and dark themes.

### Don't:
- **Don't** use rainbow, shine, or marquee effects as general product navigation or dashboard decoration. **Exception:** AI credits commerce may use `RainbowButton` (navbar credits) and `ShineBorder` (top-up dialog) — colorful on purpose to mark AI spend.
- **Don't** flood large dashboard regions with primary fill (auth hero is the exception).
- **Don't** lighten the icon rail/section nav into a light gray “second app.”
- **Don't** introduce a second UI display typeface or hard-square industrial chrome.
- **Don't** put the robot mascot inside buttons or tiny toolbars.
- **Don't** re-implement per-feature list stagger timings that diverge from STAGGER.
- **Don't** invent testimonials, customer logos-as-endorsement, or neon gamified scoreboard aesthetics.
