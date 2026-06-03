# Store listing & re-submission guide

Operational playbook for publishing and **re-publishing** Library Vendor Search
to the Chrome Web Store, Microsoft Edge Add-ons, and Firefox Add-ons (AMO).
Read this before every upload — the gotchas here are the ones that actually
bite.

---

## TL;DR build & upload

```bash
npm run package:extension   # → dist/library-vendor-search-<version>-firefox.zip
                            # → dist/library-vendor-search-<version>-chromium.zip
```

| Zip | Upload to | Background key |
|-----|-----------|----------------|
| `…-chromium.zip` | **Chrome Web Store** AND **Microsoft Edge Add-ons** | `background.scripts` **removed** |
| `…-firefox.zip`  | **Firefox Add-ons (AMO)** | keeps **both** `service_worker` + `background.scripts` |

One source of truth lives in `library_vendor_search/`. The only per-store
difference is the `background` key, applied by `build-zips.mjs` to a *copy* of
the manifest — never the source.

---

## Why two zips? (the MV3 `background` trap)

The three stores disagree on the MV3 `background` key, and no single manifest
satisfies all of them:

- **Firefox (AMO)** *requires* `background.scripts` for MV3 (it runs the
  background as a non-persistent page via `scripts` and ignores
  `service_worker`). Missing it → rejection.
- **Edge** *rejects* `background.scripts` at validation with the exact error:
  `The background.scripts field cannot be used with manifest version 3`.
- **Chrome** uses `service_worker` and accepts either form.

So the source manifest declares **both** keys, and the build emits:
- firefox zip → both keys kept.
- chromium zip → `background.scripts` deleted (serves Chrome *and* Edge).

### One background.js, two runtimes
`background.js` loads the polyfill differently per engine, guarded so the same
file works in both:

```js
if (typeof importScripts === 'function') {
  importScripts('vendor/browser-polyfill.min.js'); // Chromium service worker
}
// Firefox loads the polyfill as the first entry of manifest background.scripts
```

**Do not remove that guard.** Without it Firefox throws
`ReferenceError: importScripts is not defined` on startup. Content scripts and
the options page load the polyfill via the manifest (`content_scripts[].js` and
a `<script>` tag in `options.html`), so they need no guard.

---

## Versioning + release-notes discipline

- **Every re-upload needs a NEW `version` in `library_vendor_search/manifest.json`.**
  All three stores reject a re-upload of an already-used version, even if the
  bytes differ.
- **Pair every bump with a release-notes entry below.** Each store asks
  "what's new in this version" at upload — paste the matching block.
- Convention: **patch** (`x.y.Z`) for bug fixes, validator workarounds, copy
  tweaks, and single-string changes (e.g. adding a host permission); **minor**
  (`x.Y.0`) for new behavior, a runtime/packaging change, or anything that
  changes compatibility (e.g. raising `strict_min_version`).
- `package.json` also carries a `version`, but it is cosmetic — the build reads
  the shipped version straight from `manifest.json`, which is authoritative.

### Release notes

#### 7.7.0
- Cross-store publishing infrastructure: two-zip build (`npm run
  package:extension`) producing Firefox and Chromium/Edge packages from one
  source.
- Migrated the codebase from callback-style `chrome.*` to promise-based
  `browser.*` via Mozilla's `webextension-polyfill` (bundled in `vendor/`).
- Fixed the Firefox `strict_min_version` to `140.0` so it matches the declared
  `data_collection_permissions` feature (AMO would otherwise reject the
  mismatch). Note: this drops support for Firefox 109–139.

---

## Per-store metadata to (re)confirm

Stores sometimes re-ask for these on resubmission — keep answers handy:

- **Privacy policy URL** — required by Chrome/Edge if any permission could touch
  user data. This extension stores only a transient search term and user
  toggles locally; no remote collection. Published policy:
  https://docs.google.com/document/d/e/2PACX-1vR2FNp7vnlQ37xpuu-FwKskRNwU9VLTDLO4JUV6gc9_tjwXv6yT23E3OJyV72MkeMlPoKczucsqCdR2/pub
  (mirrored in `PRIVACY.md`).
- **Single-purpose statement** — "Lets a librarian search a selected term on a
  library book vendor's site (Ingram, Brodart, Libraria) via the right-click
  menu."
- **Permission justifications:**
  - `contextMenus` — adds the right-click "Search <Vendor>" entries.
  - `storage` — temporarily passes the selected term to the vendor tab
    (`storage.local`, cleared after the search) and saves user preferences —
    enabled vendors, foreground/background tab, clean-up-text option
    (`storage.sync`). Nothing is collected or transmitted.
  - host matches (`ipage.ingramcontent.com`, `bibz2.com`, `libraria.com`) —
    the content scripts that fill each vendor's search box run only on those
    sites.
- **Data collection (AMO):** manifest declares
  `data_collection_permissions: { required: ["none"] }`.

---

## Per-store gotchas (carry these forward)

### Chrome Web Store
- One-time **$5 developer registration fee** (first publish only).
- Upload the **chromium** zip.
- Review typically **1–3 days**.

### Firefox Add-ons (AMO)
- Free. Review usually **< 24h**, but the **strictest validator**.
- Upload the **firefox** zip (must contain `background.scripts`).
- Common rejections to avoid:
  - Dynamic `innerHTML` in popups/pages (we don't use it — keep it that way;
    set values via `.value`/`.textContent`, not by injecting HTML strings).
  - Missing `background.scripts`.
  - `strict_min_version` not matching a declared feature (the reason it is
    pinned to `140.0` for `data_collection_permissions`).
- Requires `browser_specific_settings.gecko` with a stable `id` (already set:
  `library-vendor-search@your-library.org`).

### Microsoft Edge Add-ons
- Free. Review typically **24–72h** (Microsoft states up to 7 business days).
- Upload the **chromium** zip.
- Rejects `background.scripts` in MV3 — exact error:
  `The background.scripts field cannot be used with manifest version 3`.
- **First time publishing to Edge?** See **`EDGE_SUBMISSION.md`** for the full
  Partner Center walkthrough (account setup, the 2026 Privacy page, and
  paste-ready listing copy + reviewer notes). Privacy policy URL:
  [Google Doc](https://docs.google.com/document/d/e/2PACX-1vR2FNp7vnlQ37xpuu-FwKskRNwU9VLTDLO4JUV6gc9_tjwXv6yT23E3OJyV72MkeMlPoKczucsqCdR2/pub)
  (text mirrored in **`PRIVACY.md`**).

---

## Refreshing the bundled polyfill

The shipped polyfill is `library_vendor_search/vendor/browser-polyfill.min.js`
(pinned to `webextension-polyfill@0.12.0` in `package.json`). To update it:

```bash
npm pack webextension-polyfill@<version>
tar -xzf webextension-polyfill-<version>.tgz
cp package/dist/browser-polyfill.min.js library_vendor_search/vendor/
cp package/LICENSE library_vendor_search/vendor/browser-polyfill-LICENSE.txt
rm -rf package webextension-polyfill-*.tgz
```

Then bump the pin in `package.json` and add a release-notes entry.

---

## Cross-file couplings (don't break these)

- `manifest.json version` ↔ this doc's **Release notes** — bump and document
  together.
- `manifest.json background` ↔ `build-zips.mjs` strip logic — the build assumes
  the source keeps **both** background keys and deletes `scripts` only for the
  chromium variant. If you change the background shape, update the build.
- `manifest.json background.scripts[0]` / `content_scripts[].js[0]` /
  `options.html` `<script>` ↔ `vendor/browser-polyfill.min.js` — every runtime
  loads the polyfill first; the service worker loads it via `importScripts`.
