---
name: frontend-design
description: Design system and UI conventions for the SAGAE frontend (SAGAE — Sistema de Activos y Gestión Administrativa Educativa). Use this skill whenever building, editing, or reviewing any screen, component, or style in index.html, SAGAE_index_mobile.html, SAGAE_portal_reportes.html, or any new page added to this project — new views, dashboards, forms, cards, modals, buttons, status badges, tables, empty states, login/auth screens, PWA icons/manifest tweaks, or general "make this look better / more consistent" requests. Also use it before adding a new HTML entry point, so it starts from the same tokens instead of drifting. Trigger even if the user doesn't say "design system" or "frontend" explicitly — any visual/CSS change to this repo should go through it.
---

# SAGAE Frontend Design

SAGAE is a plain HTML/CSS/JS project (no build step, no framework) for a school
asset-management portal, in Spanish, used by field technicians on mobile and
by admins on desktop. Every screen is a single self-contained `.html` file
with an inline `<style>` block. Keep new work consistent with the existing
screens rather than inventing a new visual language.

## Canonical design tokens

`index.html` defines the most complete and current token set in its `:root`.
Treat it as the source of truth — copy these custom properties into the
`:root` of any new or edited file instead of hardcoding hex values:

```css
:root{
  --bg:#FFFFFF; --bg2:#F8F9FA; --bg3:#F0F2F5;
  --text:#1A1A1A; --text2:#444444; --text3:#888888;
  --border:#E0E0E0; --border2:#CCCCCC;

  --navy:#1B3A6B; --navy-d:#132B50;      /* primary brand color */
  --gold:#B8960C;                          /* accent (also --purple alias) */
  --purple:#B8960C; --purple-l:#FDF8E1; --purple-m:#D4AF37;

  /* semantic status colors — each has a light bg, a dark text/icon tone,
     and a mid tone for borders/badges */
  --green-l:#EAF3DE;  --green:#085041;  --green-m:#9FE1CB;   /* success */
  --amber-l:#FAEEDA;  --amber:#633806;  --amber-m:#FAC775;   /* warning */
  --red-l:#FCEBEB;    --red:#791F1F;    --red-m:#F7C1C1;     /* danger */
  --blue-l:#E6F1FB;   --blue:#0C447C;   --blue-m:#B5D4F4;    /* info */
  --teal-l:#E1F5EE;   --teal:#085041;                         /* alt success */

  --r-md:8px; --r-lg:12px; --r-xl:16px;   /* border-radius scale */
  --shadow:0 4px 24px rgba(20,35,65,.10);
  --shadow-sm:0 1px 3px rgba(20,35,65,.08);
  --shadow-lg:0 12px 40px rgba(20,35,65,.16);
  --ease:cubic-bezier(.4,0,.2,1);
}
```

**Brand identity**: navy (`#1B3A6B`) + gold (`#B8960C`) is the SAGAE mark —
use it for the logo, primary actions, and active states. Don't introduce a
different primary color for new features.

**Status colors**: always use the `-l` (light) variant for a badge/chip
background, the plain (dark) variant for its text, and the `-m` (mid)
variant for its border — this is the pattern used throughout for ticket
status, inventory state, etc. Pick the semantic color by meaning (green =
resolved/ok, amber = pending/warning, red = urgent/error, blue = info,
never by "what looks nice here".

## Typography

- `index.html` loads Google Fonts **Inter** (weights 400–800) via
  `<link>` in `<head>` and uses it as the primary font. Prefer Inter for
  new full-screen/desktop views to match it.
- `SAGAE_index_mobile.html` and `SAGAE_portal_reportes.html` currently use
  the system font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI',
  Arial, sans-serif`) with no external font load, since it's a mobile PWA
  entry point optimized for fast first paint. Match whichever stack the
  file you're editing already uses — don't mix both in one file.
- All UI copy is **Spanish** (`lang="es"`). Write new labels, buttons, and
  messages in Spanish, matching the existing tone (concise, plain,
  professional — e.g. "Mis Tickets", "Consultar inventario").

## Layout conventions

- Each screen is wrapped in a `.screen` container: `max-width:1200px`
  (or a mobile-appropriate width for the mobile file), rounded corners
  (`--r-xl`), `box-shadow: var(--shadow-lg)`, and a `1px solid
  rgba(20,35,65,.06)` border — this is the "app window" look for both
  the desktop portal and the mobile PWA shell.
- Cards/panels use `--bg` background, `1px solid var(--border)`,
  `border-radius: var(--r-lg)` or `var(--r-xl)`, and `--shadow-sm` or
  `--shadow` depending on elevation.
- Buttons, badges, and pills use pronounced `border-radius` (pills often
  `20px`+) and the semantic color pairs above.
- Use the `--ease` cubic-bezier for transitions/animations to match
  existing motion (e.g. the `.sdot` pulse, hover states).

## File & security conventions

- New pages should stay **single-file**: HTML + inline `<style>` + inline
  `<script>` in one `.html`, no external JS/CSS files, no bundler. This
  keeps the project deployable as static files (see `sw.js`,
  `manifest.json`).
- Copy the security `<meta>` tags already present in `index.html` into any
  new top-level page:
  ```html
  <meta http-equiv="Content-Security-Policy" content="default-src * 'unsafe-inline' 'unsafe-eval' data: blob:; script-src * 'unsafe-inline' 'unsafe-eval'; style-src * 'unsafe-inline'; img-src * data: blob:; connect-src *; font-src * data:;">
  <meta http-equiv="X-Content-Type-Options" content="nosniff">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ```
- If a new page is meant to be a PWA entry point or add a shortcut, update
  `manifest.json` (icons, `shortcuts`) and check whether `sw.js` needs the
  new URL added to its cache list.

## Working across the existing files

- `index.html` — main/desktop portal, most complete token set, largest file.
- `SAGAE_index_mobile.html` — mobile PWA shell for technicians (login,
  tickets, inventory); this is `start_url` in `manifest.json`.
- `SAGAE_portal_reportes.html` — reports portal, smaller, shares the same
  status-color palette as `index.html` but doesn't declare CSS custom
  properties — when editing it, prefer introducing a `:root` block with
  the tokens above over continuing to hardcode hex values, so it converges
  with `index.html` instead of drifting further.
- When a change should apply to more than one screen (e.g. a color fix,
  a new status type), apply it consistently across all files that contain
  the same pattern — grep for the hex value or class name first rather
  than editing only the file you happened to open.

## Before finishing a visual change

- Open the file in a browser (or describe the rendered result) and check
  it against the existing screens for consistency — spacing, radius,
  color pairing, Spanish copy tone.
- Prefer reusing an existing class/pattern already in the file over
  inventing a new one for the same purpose (e.g. don't add a second
  "card" style when `.login-card`-style rules already exist nearby).
