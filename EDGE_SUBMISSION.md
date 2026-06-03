# First-time Microsoft Edge Add-ons submission

A start-to-finish guide for publishing **Library Vendor Search** to Microsoft
Edge Add-ons for the **first time**. For ongoing re-uploads and the cross-store
overview, see `STORE_LISTING.md`. The reusable copy you'll paste (single-purpose
statement, permission justifications, certification notes, description) lives at
the bottom of this file.

> Which file to upload: **`dist/library-vendor-search-<version>-chromium.zip`**
> (the variant with `background.scripts` removed). Build it with
> `npm run package:extension`.

---

## 0. One-time account setup
- Edge extensions are **free** — there is **no registration fee** (Chrome's $5
  fee does not apply here).
- Create a developer account at **Partner Center**:
  https://partner.microsoft.com/dashboard/microsoftedge/public/login
- The account needs a **Microsoft account (MSA)** as the **Primary Owner**.
- This is a separate dashboard from the Chrome Web Store and AMO; the same zip
  (chromium) you give Chrome is what you upload here.

## 1. Create the extension entry
1. In the Partner Center dashboard, click the **+** icon to create a new
   extension.
2. The **Upload package (.zip file)** page opens — drop in the **chromium** zip.
3. Partner Center validates the package and shows an **Extension overview**.
   - If it complains `The background.scripts field cannot be used with manifest
     version 3`, you uploaded the **firefox** zip by mistake. Upload the
     **chromium** one.
4. Click **Continue** → **Availability**.

## 2. Availability
- **Visibility:** `Public` (discoverable) unless you have a reason to pick
  `Hidden` (URL-only).
- **Markets:** default is **all markets** — leave as-is unless you need to
  restrict regions.
- **Save & Continue.**

## 3. Properties
- **Category (required):** `Productivity` is the best fit for a librarian search
  tool. (No "library" category exists; `Productivity` or `Search Tools` are the
  usual picks.)
- **Website (optional):** your library/department site, if any.
- **Support contact (optional):** a support email or URL.
- **Mature content:** leave unchecked.
- **Save & Continue.**

## 4. Privacy page  ← the 2026 addition, where first-timers get stuck
This dedicated page replaced the old "privacy" box. Fill every section:

- **Single purpose** — paste the statement from §A below.
- **Permission justifications** — one line per declared permission; paste from
  §B below. List `contextMenus`, `storage`, and the three host matches.
- **Remote code:** **No.** This is an MV3 extension; it ships no remote code and
  loads no external scripts. (All JS, including the polyfill, is bundled.)
- **Data usage certification:** the extension collects/transmits **no** user
  data — the selected term and the on/off toggles never leave the browser
  (`storage.local` / `storage.sync` only). Check the boxes that assert **no data
  collection**.
- **Privacy policy URL (required):** you must supply a hosted URL. A ready-to-
  publish policy is included in this repo at **`PRIVACY.md`** — host it (e.g.
  GitHub Pages, or a page on your library site) and paste that URL here. Without
  a reachable URL the Privacy page won't let you continue.
- **Save & Continue.**

## 5. Store listing (per language — at minimum English)
Click **Edit details** on the language row. Required:
- **Description** — 250–10,000 characters. Paste §C below (it's already over the
  250 minimum) and tweak to taste.
- **Extension logo** — 300×300 px recommended (128×128 minimum). The repo ships
  `images/icon-128.png`; that satisfies the minimum, but exporting a **300×300**
  PNG looks sharper in the store.
- **Name** and **short description** are pulled from the manifest
  (`Library Vendor Search` / "Select text, right-click, and search Ingram,
  Brodart, or Libraria.").

Strongly recommended (improves listing quality / approval odds):
- **Screenshots** — up to 6, at **1280×800** or 640×480. At least **one** is
  expected. Good shots: the right-click menu showing "Search Library Vendors",
  and the popup with the vendor toggles.
- **Small promotional tile** — 440×280 (optional).
- **Search terms** — up to 7 phrases / 21 words, e.g. `library`, `cataloging`,
  `book vendor`, `Ingram`, `Brodart`, `Libraria`, `acquisitions`.

**Save draft**, then make sure the language row shows **Complete**.

## 6. Submit for certification
- Click **Publish** → the **Submit your extension** page opens.
- **Notes for certification (critical for this extension):** paste §D below.
  These three vendor sites require library/institutional logins, so a reviewer
  without an account can't watch the search box auto-fill. The note explains the
  flow and what *is* observable without an account — this is the single biggest
  thing that prevents a "the extension doesn't appear to do anything" rejection.
- Click **Publish** to submit.
- **Certification:** up to **7 business days** (often faster, ~24–72h). Status
  moves through the pipeline and ends at **In the Store**.

---

## Paste-ready content

### §A — Single-purpose statement
```
Library Vendor Search lets a librarian highlight a term on any web page,
right-click it, and open that term as a search on a library book vendor's
website (Ingram, Brodart, or Libraria). That is its only function.
```

### §B — Permission justifications
```
contextMenus — Adds the right-click "Search <Vendor>" menu items that the user
clicks to launch a search. This is the extension's entire user interface for
starting a search.

storage — Saves the user's vendor on/off toggles and search preferences
(storage.sync) and temporarily holds the selected search term while the vendor
page loads (storage.local). No data is sent anywhere; it stays in the browser.

Host access to ipage.ingramcontent.com, www.bibz2.com, and www.libraria.com —
A content script runs only on these three vendor sites to type the user's
selected term into that site's own search box and submit it. The extension does
not run on any other site.
```

### §C — Store description (≥250 chars)
```
Library Vendor Search is a simple right-click tool for librarians and
acquisitions staff. Highlight any text on a web page — a title, author, or ISBN
— right-click it, and choose a library book vendor to search. The extension
opens the vendor's site in a new tab and drops your selected term straight into
its search box, saving you the copy-paste round trip.

Supported vendors: Ingram (ipage), Brodart (Bibz), and Libraria. Use the toolbar
popup to turn individual vendors on or off, choose whether the vendor tab opens
in the foreground or background, and optionally clean up selected text (removing
stray colons, commas, and the word "by") before searching.

Your data stays on your device. The extension keeps only your vendor preferences
and the term you're currently searching, in the browser's own storage — nothing
is collected or sent to any server. The vendor sites themselves may require your
library's existing login.
```

### §D — Notes for certification (reviewer instructions)
```
HOW TO TEST

1. Open any web page and select/highlight some text (for example, a book title).
2. Right-click the selection. You will see "Search Library Vendors" with
   sub-items "Search Ingram / Brodart / Libraria for '<your text>'" (or a single
   "Search <Vendor>" item if only one vendor is enabled in the popup).
3. Click one of them. A new tab opens to that vendor's website. The extension
   then types your selected text into that site's search box and submits it.

IMPORTANT — these are gated library-vendor portals:
The three supported sites (ipage.ingramcontent.com, www.bibz2.com,
www.libraria.com) are professional library purchasing portals that require an
institutional/library account to reach their search page. If you do not have an
account, the new tab will land on the vendor's login screen instead of a search
results page — this is expected. In that case the extension simply waits: it
keeps the pending term and fills the search box automatically once you are logged
in and the search box is present.

What is observable WITHOUT a vendor account:
- The right-click context-menu items appear on any selected text.
- Clicking an item opens the correct vendor URL in a new tab.
- The toolbar popup lets you enable/disable each vendor and set options.

DATA: The extension transmits no data. The selected term and the vendor toggles
are stored only in the browser (storage.local / storage.sync). It loads no
remote code; all scripts, including the bundled webextension-polyfill, ship
inside the package.
```
