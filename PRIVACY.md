# Privacy Policy — Library Vendor Search

_Last updated: 2026-06-03_

Library Vendor Search is a browser extension that lets you select text on a web
page, right-click, and open that text as a search on a library book vendor's
website (Ingram, Brodart, or Libraria).

## What the extension stores

The extension stores two kinds of information, **only inside your own browser**:

- **Your preferences** — which vendors are enabled, whether the vendor tab opens
  in the foreground or background, and the optional "clean up search text"
  setting. These are saved using the browser's `storage.sync` so they can follow
  your browser profile.
- **The current search term** — when you launch a search, the selected text is
  briefly saved using the browser's `storage.local` so the vendor page can read
  it and fill in the search box. It is removed once the search runs (or when you
  close the vendor tab).

## What the extension does NOT do

- It does **not** collect, transmit, sell, or share any personal information.
- It does **not** send your selected text, browsing activity, or preferences to
  the developer or to any third-party server.
- It does **not** include analytics, tracking, or advertising.
- It does **not** load or execute any remote code; all of its code ships inside
  the extension package.

## Third-party vendor sites

When you run a search, the extension opens the vendor's own website
(`ipage.ingramcontent.com`, `www.bibz2.com`, or `www.libraria.com`) in a new
tab. Anything you do on those sites — including logging in with your library
account — is governed by **those sites' own privacy policies**, not this one.

## Permissions

- `contextMenus` — to add the right-click "Search <Vendor>" menu items.
- `storage` — to save the preferences and the transient search term described
  above.
- Access to the three vendor domains — so the extension can fill in the search
  box on those sites only.

## Contact

Questions about this policy can be directed to the extension's listed support
contact in the store.
