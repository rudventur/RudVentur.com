# useRbox — shared embed

Single-tag, site-wide version of the useRbox widget (see
`../useRbox-v2-upgraded.html` for the reference/demo build and its
in-file docs).

## Usage

Drop this one tag into a page (works from `<head>` with `defer`, or right
before `</body>`):

```html
<script src="https://rudventur.github.io/RudVentur.com/embed/useRbox.js" defer></script>
```

It injects `useRbox.css` itself (resolved relative to its own `<script>`
tag, so it works from any path depth) and builds its own DOM — no other
markup needed on the host page.

### Per-site translator path override

The widget defaults to `../map-merger-venti/translator_v7.html` next to the script (the hub's copy) for the 🌐
translator link. If a site serves the translator from somewhere else, set
this **before** the `<script src="/embed/useRbox.js">` tag:

```html
<script>window.RUDVENTUR_TRANSLATOR_URL = '/path/to/translator_v7.html';</script>
```

## Status: single-site only, for now

This directory is currently only consumed by pages inside this
(`windows13`) repo. Embedding it across **many separate sites** is planned
but not yet built — see `CLAUDE.md` at the repo root for the open
questions (canonical hosting location, how each site pulls it, full list
of target sites) that need answers before that expansion happens.

---

# rvView — shared fullscreen / view mode (logo click)

One tag, for any page in any RUDVENTUR repo:

```html
<script src="https://rudventur.github.io/RudVentur.com/embed/rvView.js"></script>
```

- **Logo click** opens the same view menu as the hub (Full Screen Horizontal /
  Panoramic / Normal, Settings One → Locked / Default Rotation / Vertical).
  The logo is the element marked `data-rv-logo`, else the first `<h1>`, else
  `.logo`. Pages with their own menu (`window.setView`) or an `onclick` on the
  logo are left alone. `<html data-rv-nologo>` opts a page out.
- The chosen mode is saved in `localStorage['rvViewMode']` (all repos share
  it, they're all on rudventur.github.io).
- **New tabs open in the same mode:** links with `target="_blank"` to a
  RUDVENTUR site get `?view=<mode>`, and the opened page goes fullscreen on
  the first tap/click/key (browsers never allow fullscreen without a gesture).
  Use `rvView.open(url)` for tabs opened from JS; `data-rv-noview` opts a link out.
- JS API: `rvView.set(mode)`, `rvView.open(url)`, `rvView.withView(url)`, `rvView.current()`.

## Fullscreen layer (new tabs that stay fullscreen)

Browsers never let a brand-new tab start fullscreen. So while a fullscreen
mode is on (or RUDVENTUR runs as an installed app), anything that would open a
new tab (`<a target="_blank">`, plain `window.open(url)`) opens in a
full-screen layer over the current page instead. It stays fullscreen with no
extra tap. The tab on the left edge has ↗ (open in a real tab) and ✕ (close).
The phone's back button also closes it. Pages inside a layer hand their
new-tab links and view changes up to the top page. `data-rv-nolayer` on a link
opts it out. Sized pop-ups (`window.open(url, name, 'width=…')`) are untouched.

## Install as an app (always fullscreen)

Every repo has a `manifest.webmanifest` with `"display": "fullscreen"`, and the
logo menu shows **📲 Install RUDVENTUR app** when the browser allows it (on
iPhone it explains Share → Add to Home Screen). The installed app opens
fullscreen straight away. Icons live in `embed/` (icon-192/512, maskable, apple-touch-icon).

# rvDesk — the Windows 13 desktop on the hub

`<script src="embed/rvDesk.js" defer></script>` (after rvView.js) puts the
Windows 13 layout straight onto the page:

- top-left: RUDVENTUR notch menu (Maps, Tools, Social, Bank, OS, ChemVentur,
  View modes, Buy Pumpkin Electricity / Ko-fi)
- top-right: the R circle and useRbox (`useRbox.js`)
- bottom-left: ⌨️ Keyboards, 💬 Global Chat
- bottom-right: 🍿 Popcorn Hub
- bottom-middle: taskbar with 🎃 start button, one button per open window, clock

Services open in floating windows: drag the title bar, resize from the
corner, ⛶ full screen, _ minimise to the taskbar, ↗ open as a real tab, ✕
close. On phones, windows open full size and ⛶ switches the device to
fullscreen. Sites that won't load inside another page (Ko-fi, Zoom Earth) open
as real tabs. Apps are listed in `APPS` / `MENU` at the top of the file.
