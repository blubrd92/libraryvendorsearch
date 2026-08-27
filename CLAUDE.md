# CLAUDE.md

Guidance for working in this repository.

## What this is

**Library Vendor Search** — a Manifest V3 browser extension (Chrome + Firefox)
for librarians. The user selects text on any page, right-clicks, and the
extension opens the selected term as a search in a library book vendor's site
(Ingram, Brodart, or Libraria) or in WorldCat.

It is plain JavaScript/HTML loaded directly as an unpacked extension — there is
**no bundler and no test suite**. "Running" it means loading
`library_vendor_search/` as an unpacked extension in the browser.

There **is** a small Node packaging step for the stores: `npm run
package:extension` (`build-zips.mjs`) emits two store-ready zips into `dist/`.
The only runtime dependency is the bundled `webextension-polyfill` in
`library_vendor_search/vendor/` (MPL-2.0; see `LICENSE`).

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
  search options. Settings are saved to `browser.storage.sync`.
- `vendor/browser-polyfill.min.js` — Mozilla's `webextension-polyfill`, loaded
  first by every runtime (service worker, content scripts, options page).
- `images/` — extension icons (16/48/128).

Repo-root tooling (not part of the shipped extension):

- `build-zips.mjs` / `package.json` — the two-zip cross-store build.
- `STORE_LISTING.md` — publish/re-submit playbook, release notes, per-store
  gotchas. **Read this before any store upload.**
- `LICENSE` — proprietary, with the bundled polyfill's MPL-2.0 notice.

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
  read/save handlers. The optional "search all vendors" menu item needs no
  per-vendor work — it fans out over whatever `getMenuSettings()` reports as
  enabled.
- **A source whose search is a plain results URL needs far less.** Set
  `searchUrl` and `contentScript: false` and you skip the content script, the
  `manifest.json` host match, and the added permission entirely — WorldCat is
  the worked example. `contentScript: false` also skips the `storage.local`
  handoff, which exists only to pass the term to a content script.
- **Per-vendor defaults live in `VENDORS`** (`defaultEnabled: false` opts a
  source out). `getMenuSettings()` derives its defaults from that array, so it
  cannot drift from `options.js` `DEFAULTS` — but the two must still agree, and
  a mismatch shows a menu item whose popup toggle renders unchecked.
- **`supplementary: true`** groups a source below a divider in the context menu
  (and in its own popup card): a lookup you consult, not a vendor you order
  from. It still joins "search all" when enabled.
- **Storage split:** user preferences → `browser.storage.sync`; transient
  per-search state → `browser.storage.local`, keyed by `storagePrefix`.
- Content scripts guard with a `hasRun` flag and tolerate missing search
  elements (login pages) by no-opping and retrying, rather than erroring.
- **Use promise-based `browser.*`** (not callback `chrome.*`) — provided by the
  bundled `webextension-polyfill` (native in Firefox, shim on Chromium).
- **Do not remove the `importScripts` guard at the top of `background.js`.** It
  loads the polyfill on the Chromium service-worker path; Firefox loads it via
  `manifest background.scripts` and has no `importScripts` (removing the guard
  → `ReferenceError` on Firefox startup).

## Building for the stores

`npm run package:extension` produces, from the single source in
`library_vendor_search/`, two zips in `dist/`:

- `*-firefox.zip` — manifest keeps **both** background keys (AMO requires
  `background.scripts` for MV3).
- `*-chromium.zip` — manifest has `background.scripts` **deleted**; this one zip
  goes to **both Chrome and Edge** (Edge rejects `background.scripts` in MV3).

The build only mutates *copies* of the manifest — never the source. See
`STORE_LISTING.md` for upload steps and per-store gotchas.

## Bumping the version

Update `version` in `manifest.json` when shipping changes (currently `7.9.0`).
**Every store re-upload requires a new version**, and each bump must be paired
with a matching entry in the `STORE_LISTING.md` "Release notes" section (that
text is what stores ask you to paste). `package.json`'s `version` is cosmetic —
the build reads the shipped version from `manifest.json`.

## Cross-file couplings (don't break these)

- `manifest.json version` ↔ `STORE_LISTING.md` release notes — bump together.
- `manifest.json background` ↔ `build-zips.mjs` strip logic — the build assumes
  the source keeps both background keys and strips `scripts` only for chromium.
- polyfill load order — `background.js` `importScripts` guard,
  `content_scripts[].js[0]`, and the `options.html` `<script>` all load
  `vendor/browser-polyfill.min.js` first.

## Git / workflow

Active development branch for agent work: `claude/project-setup-rilkes`.
Do not open a pull request unless explicitly asked.
