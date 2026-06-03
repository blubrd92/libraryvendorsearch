# CLAUDE.md

Guidance for working in this repository.

## What this is

**Library Vendor Search** — a Manifest V3 browser extension (Chrome + Firefox)
for librarians. The user selects text on any page, right-clicks, and the
extension opens the selected term as a search in a library book vendor's site
(Ingram, Brodart, or Libraria).

There is **no build system, no tests, and no dependencies**. It is plain
JavaScript/HTML loaded directly as an unpacked extension. "Running" it means
loading `library_vendor_search/` as an unpacked extension in the browser.

## Layout

All source lives in `library_vendor_search/`:

- `manifest.json` — MV3 manifest. Declares the background service worker, the
  per-vendor content scripts (matched to each vendor's domain), the action
  popup (`options.html`), permissions (`contextMenus`, `storage`), and the
  Firefox `gecko` settings.
- `background.js` — service worker. Owns the `VENDORS` config array, builds the
  right-click context menus from saved settings, and on menu click stashes the
  search term in `chrome.storage.local` and opens the vendor tab.
- `content.js` — content script injected into Ingram (`ipage.ingramcontent.com`).
- `content-brodart.js` — content script for Brodart (`bibz2.com`).
- `content-libraria.js` — content script for Libraria (`libraria.com`).
- `options.js` / `options.html` — the toolbar popup UI for toggling vendors and
  search options. Settings are saved to `chrome.storage.sync`.
- `images/` — extension icons (16/48/128).

## How it works (the flow)

1. User selects text and clicks a "Search <Vendor>" context menu item.
2. `background.js` reads `tabFocus` / `sanitizeSearch` settings, optionally
   sanitizes the term (strips `:` `,` and the word "by"), writes
   `<prefix>SearchTerm` / `<prefix>Pending` / `<prefix>TabId` to
   `chrome.storage.local`, and opens the vendor URL in a new tab.
3. The vendor's content script reads `<prefix>SearchTerm` from local storage,
   fills the site's search box, and clicks search.
4. On success the content script sends `{ action: 'searchSuccess', vendor }` and
   `background.js` clears that vendor's storage keys. If the user lands on a
   login page (search box missing) the term stays pending and the script retries
   on the next load. Closing the tab while pending also clears the keys.

## Key conventions

- **Adding/changing a vendor is centralized.** A vendor is defined once in the
  `VENDORS` array in `background.js` (`id`, `key`, `label`, `url`,
  `storagePrefix`). To add a vendor you also need: a `content_scripts` entry +
  host match in `manifest.json`, a new `content-<vendor>.js` that knows that
  site's search input/button selectors, the toggle row in `options.html`, and
  the corresponding `enable<Vendor>` entries in `options.js` `DEFAULTS` and its
  read/save handlers.
- **Storage split:** user preferences → `chrome.storage.sync`; transient
  per-search state → `chrome.storage.local`, keyed by `storagePrefix`.
- Content scripts guard with a `hasRun` flag and tolerate missing search
  elements (login pages) by no-opping and retrying, rather than erroring.
- `chrome.*` APIs are used throughout (works in both Chrome and Firefox MV3).

## Bumping the version

Update `version` in `manifest.json` when shipping changes (currently `7.6.0`).

## Git / workflow

Active development branch for agent work: `claude/intelligent-bohr-wFcVn`.
Do not open a pull request unless explicitly asked.
