# The shared RUDVENTUR scripts (`embed/`)

Every RUDVENTUR app can use two shared scripts that live here in the hub. Fix
something once here and every app gets the fix the next time it loads.

| File | What it gives a page |
|---|---|
| `rvView.js` | the view mode (Full Screen Horizontal / Panoramic / Vertical / Normal), the green **R** tab, the Redirect helper, the full-screen layer, "Install RUDVENTUR app" |
| `useRbox.js` (+ `useRbox.css`, loaded by itself) | the profile box: the **R** circle top right with name, motto, location and saved places |

Also here: `rvDesk.js` (the Windows 13 desktop on the hub page, see the end),
`popcoin-reward.js` / `popcoin.js` (PopCOIN rewards) and the app icons.

## Add them to any app — one line each

Put these two lines inside `<head>` of the page (any repository, any folder):

```html
<script src="https://rudventur.github.io/RudVentur.com/embed/rvView.js"></script>
<script src="https://rudventur.github.io/RudVentur.com/embed/useRbox.js" defer></script>
```

That's all. Always use the full `https://rudventur.github.io/RudVentur.com/embed/…`
address (pages inside this hub repository may also use `embed/…` or
`../embed/…`). Loading a script twice on one page does no harm; the second copy
does nothing.

---

## The view mode — `rvView.js`

- **The four modes:** `horizontal` (full screen, turned sideways),
  `panoramic` (full screen, any rotation), `vertical` (full screen, upright),
  `normal` (the ordinary browser). The old names `panoramic-locked` and
  `panoramic-default` still work and mean `horizontal` and `panoramic`.
- **Remembered everywhere:** the chosen mode is saved under the local storage
  key **`rvViewMode`**. All RUDVENTUR apps are on `rudventur.github.io`, so they
  all see the same saved mode.
- **Passed along in the address:** `?view=<mode>` at the end of an address
  switches that page to the mode (that's the only thing that crosses over from
  other sites such as rudventur.com). The script then tidies `?view=` out of the
  address bar. Browsers only allow full screen after a tap, so the page goes
  full screen on the first tap, click or key press.
- **Logo menu and R tab:** clicking the page's logo opens the view menu. The
  logo is whatever has `data-rv-logo`, otherwise the first `<h1>`, otherwise
  `.logo`. A small green **R** tab on the left edge opens the same menu.
  A page that still has its own menu (its own `window.setView` function) is
  left alone. `<html data-rv-nologo>` switches the logo menu off.
- **Phones:** `<html data-rv-phone-fullscreen>` makes a phone go full screen on
  the first tap even when no mode was chosen yet (Snout First did this).

### Redirect — going to another app in the same mode

```js
rvView.redirect('snout-first.html');                        // new tab, same mode
rvView.redirect('https://rudventur.github.io/rudTrip20/');  // works for full addresses too
rvView.redirect('translator_v7.html', { sameTab: true });   // go there in this tab
```

It adds `?view=<current mode>` and keeps any `?…` or `#…` the address already
has. Links written as `<a href="…" target="_blank">` to a RUDVENTUR site get
`?view=` added by themselves when clicked (`data-rv-noview` on a link opts out).

### The full-screen layer, and what it is allowed to open

A brand-new tab can never start full screen. So while a full-screen mode is on
(or RUDVENTUR runs as an installed app), a link to **a RUDVENTUR page** that
would open a new tab opens in a full-screen layer on top instead. ✕ or the
phone's back button closes it, ↗ opens it in a real tab. `data-rv-nolayer` on a
link opts it out.

**Only these addresses ever open in the layer:**
`https://rudventur.github.io/…`, `https://rudventur.com/…`,
`https://www.rudventur.com/…`, and the page's own site. Every other link
(Ko-fi, YouTube, anything else) opens as a normal new tab, exactly as it would
without this script, so an outside site never runs inside a RUDVENTUR page.

A page inside the layer may only use:

- on every RUDVENTUR page: full screen, sound, copying to the clipboard, the
  share sheet, and location (the profile box's GPS button is on every page, and
  the maps, Snout First and rudTrip20 use location);
- microphone: only Voice of God and the ChemVentur games (sound gun,
  microphone mode);
- camera: only the punk-script Wi-Fi mapper with camera;
- tilt sensors: only the punk-script room mapper.

A link can ask for one more of those four with, for example,
`<a href="…" target="_blank" data-rv-allow="camera">`; it is still only ever
granted to RUDVENTUR addresses. The Windows 13 desktop windows (`rvDesk.js`)
use the same list, and outside sites shown in a desktop window get full screen
only.

### For programmers: `window.rvView`

| Call | What it does |
|---|---|
| `rvView.set(mode)` | save the mode and switch to it |
| `rvView.apply(mode)` | switch without saving |
| `rvView.current()` | the saved mode (`''` if none) |
| `rvView.redirect(url, {sameTab})` | go to another app in the same mode |
| `rvView.open(url)` | open in a new tab (or the layer) with `?view=` |
| `rvView.withView(url)` | the address with `?view=<mode>` added |
| `rvView.openLayer(url)`, `rvView.closeLayer()` | the full-screen layer by hand (non-RUDVENTUR addresses open a normal tab instead) |
| `rvView.layerAllowed(url)`, `rvView.permissionsFor(url)` | the allow-list checks above |
| `rvView.install()`, `rvView.canInstall()`, `rvView.installed()` | install as an app |
| `rvView.KEY`, `rvView.MODES`, `rvView.version` | `'rvViewMode'`, the four modes, the date of this version |

---

## The profile box — `useRbox.js`

The R circle top right: username, channel, motto ("P.S."), current location,
saved places, social links, and a 🌐 button for the translator.

### Where it saves things (local storage key names)

| Key | What's in it |
|---|---|
| **`rud_useRbox_v3`** | the profile: `username`, `psignature` (the motto), `currentLoc`, `lat`, `lon`, `saveMessages`, `savedLocations` (`[{id, name, lat, lon}]`), `updatedAt`, `migration.notes` |
| `rud_useRbox_v3_migration` | which old keys have already been copied in, and when |
| `rud_useRbox_collapsed` | `'1'` when the box is folded to its notch |
| `rud_useRbox_transparent` | `'1'` when the see-through background is on |
| `rudventur_channel` | the channel picked at the Windows 13 login (the box only reads it) |
| `rvViewMode` | the view mode (belongs to `rvView.js`) |

### Old profile boxes — copied in by themselves

Before this, there were three different profile boxes that didn't see each
other's saved profiles. The first time the new box loads, it copies these old
keys into `rud_useRbox_v3`:

| Old key | Written by |
|---|---|
| `rud_useRbox_v2` | windows13 `useRbox-v2-upgraded.html`, windows13 `userbox-v2-ultimate.html` (motto saved as `signature` instead of `psignature`) and the old version of this file |
| `rv_username` | Snout First's display name |
| `sf_owner_signature` | Snout First's "Your Motto" |
| `sf_walk_spots` | Snout First's saved walk spots |

- Copying in **never deletes or changes** the old keys.
- Saved places from all boxes are added together; the same place twice
  (same name and position) is kept once.
- If two boxes had different names or mottos, one is used and the other is
  kept in `migration.notes`, so nothing is lost. A default name nobody chose
  ("Rudy", "Anonymous Walker") gives way to a real one.
- If an app that hasn't switched over yet changes one of the old keys later,
  that change is copied in the next time the box loads (and counts as newer).
- To keep those apps in step until they switch over, saving in the new box also
  updates `rud_useRbox_v2` (read by windows13, LuxWin13 and the PopCOIN
  wallet), `rv_username` and `sf_owner_signature` (read by Snout First).

All profile text is put on the page as plain text, never as page code, so a
name like `<img src=x onerror=…>` just shows up as those characters.

### For programmers: `window.rvUserbox`

```js
rvUserbox.get()                       // a copy of the profile
rvUserbox.save({ username: 'Pumpkin' }) // change some fields and save
rvUserbox.KEY, rvUserbox.LEGACY_KEYS  // 'rud_useRbox_v3', the old keys
```

The translator button opens
`https://rudventur.github.io/map-merger-venti/translator_v7.html` in the
current view mode. To point it somewhere else, put this **before** the
`useRbox.js` line:

```html
<script>window.RUDVENTUR_TRANSLATOR_URL = 'https://rudventur.github.io/…';</script>
```

---

## Checklist: switching the other apps over

Every app below already loads `rvView.js`. The work is removing the old copies
so there is only one of each. Do one app at a time and try it on a phone.

### Map Merger (`map-merger-venti`: `index.html`, `ui.js`)
- [ ] `ui.js`: delete the "View mode" block at the top (`VIEW_MODE_KEY`,
      `requestFS`, `exitFS`, `lockOrientation`, `unlockOrientation`,
      `applyViewMode`, `currentViewMode`, `setView` and the "adopt ?view=" part).
- [ ] `index.html`: either keep the logo menu markup and make its buttons call
      `rvView.set('horizontal')` etc., or delete the menu and put
      `data-rv-logo` on the logo so the shared menu appears there.
- [ ] `index.html`: replace the body of `goTo(url)` with
      `closeRedirectMenu(); rvView.redirect(url);`
- [ ] add the `useRbox.js` line.

### Snout First (`map-merger-venti/snout-first.html`)
- [ ] delete the inline "View mode" block (same functions as Map Merger) and
      make the menu and Redirect use `rvView.set` / `rvView.redirect` as above.
- [ ] add `data-rv-phone-fullscreen` to `<html>` to keep "full screen on the first
      tap on a phone".
- [ ] delete the inline account box (`#sfuHub` and its script: `sfuToggle`,
      `sfuLoad`, `sfuSaveName`, `sfuSaveSpot` …) and add the `useRbox.js` line.
      Its name, motto and walk spots are copied into the shared box by
      themselves.
- [ ] `js/firebase-config.js` `getUserName()`: read
      `window.rvUserbox ? rvUserbox.get().username : …` first, and
      `setUserName(name)` → `rvUserbox.save({ username: name })` (keep writing
      `rv_username` too, the pets and lost-pet reports use it).
- [ ] check the shared box's R circle doesn't sit on top of the right panel.

### Translator (`map-merger-venti/translator_v7.html`), and Voice of God
- [ ] Translator: delete the inline "View mode" block, make the menu and
      Redirect use `rvView.set` / `rvView.redirect`.
- [ ] add the `useRbox.js` line to both pages.

### windows13 (and its copy LuxWin13)
- [ ] every page already has the `rvView.js` line; add the `useRbox.js` line.
- [ ] `useRbox-v2-upgraded.html` and `userbox-v2-ultimate.html`: load and save
      through `rvUserbox.get()` / `rvUserbox.save({...})` instead of
      `localStorage['rud_useRbox_v2']` — or replace both with one page that just
      loads `useRbox.js`.
- [ ] `WINDOWS13-MASTER.html`: read the name with `rvUserbox.get().username`
      instead of parsing `rud_useRbox_v2`; the "useRbox" desktop window can
      show the shared box instead of its placeholder text.

### rudTrip20
- [ ] already loads `rvView.js`; add the `useRbox.js` line.
- [ ] links in its "RudVentur Universe" box to other apps can use
      `rvView.redirect(url)` (plain `target="_blank"` links already carry the mode).

### When every app has switched
- [ ] the copying of the old keys and the mirrors into them can stay (they are
      cheap) or be removed; don't delete the old keys from people's browsers.
- [ ] delete the hub's old `map-merger-venti/` copy once nothing links to it.

---

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
full screen. Sites that won't load inside another page (Ko-fi, Zoom Earth) open
as real tabs. Apps are listed in `APPS` / `MENU` at the top of the file.

# 🍿 popcornWindow + popcornMovie — the sealed bunker and movie maker

```html
<script src="https://rudventur.github.io/RudVentur.com/embed/popcornWindow.js" defer></script>
<script src="https://rudventur.github.io/RudVentur.com/embed/popcornMovie.js" defer></script>
```

- **Camera and microphone are only used inside the popcorn window.** Nothing runs
  behind the website.
- **Entering seals the page:** a Content-Security-Policy makes the browser refuse
  every connection (fetch, WebSocket, beacons, images, frames, forms). WebRTC is
  switched off and open windows/iframes close. A probe request must be refused
  before 📷 / 🎤 can turn on (the palette shows 🔒 SEALED). The seal can't be
  lifted from inside the page, so leaving reloads it. It can't protect against
  a hacked phone or browser, extensions, or the operating system.
- **🌐 online / 🕶 private**, per device (`localStorage.rvPrivacy`). Private
  greys out 📷 and 🎤 and puts useRbox into incognito (no profile, nothing saved).
- **📷 and 🎤** each have their own allowance, remembered per device.
- **Back-recording** keeps the last 60–120 s (picture + drawings + mic sound).
- **Session saver:** IndexedDB `rvPopcornSession`, on the device only. The
  🗑 bin has ↩ restore and 🔥 hard remove.
- **🎬 Movie maker** (`popcornMovie.js`):
  - clips: order, trim, ✂ split, ⏸📸 freeze frame
  - audio: remix, 🎙 voice-over
  - items at any moment: text, horizon line, air, ground (striped)
  - a description
  - **MAKE MOVIE** records the plan into one file in the session.
- Config: `window.rvPopcornConfig = { onPopcorn, onChat, onUser, zIndex, userOffset,
  bottomOffset, button, legacyDB }`. 🍿 and 💬 leave the bunker first, then run.
