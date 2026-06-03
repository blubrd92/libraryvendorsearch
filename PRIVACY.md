# Privacy Policy for "Library Vendor Search"

> **Canonical published URL** (this is the link to paste into every store's
> privacy-policy field — Chrome Web Store, Microsoft Edge Add-ons, Firefox AMO):
> https://docs.google.com/document/d/1DueDWKq1bzZXkNUAlZkDMXeXb8OAKxrXg-zmVjtEaIw/edit?usp=sharing
>
> This file is the version-controlled copy. If you edit one, update the other so
> the published policy and the repo stay in sync.

Effective Date: June 3, 2026

This browser extension is a simple productivity tool designed to help users
search for book titles on the Ingram iPage, Brodart Bibz, and Libraria websites.

## Data Handling

This extension does not collect, save, or transmit any user data to the
developer or any third-party servers. All data remains on your device.

## How the Extension Works

- The user highlights a book title on any webpage
- The user right-clicks and selects a vendor from the context menu — for example
  "Search Ingram for...", "Search Brodart for...", or "Search Libraria for..."
  (when more than one vendor is enabled, these appear under a "Search Library
  Vendors" submenu)
- The extension temporarily saves the selected text to the browser's local
  storage (`chrome.storage.local`). This data stays on the user's computer
- The extension opens a new tab to one of:
  - Ingram iPage dashboard (ipage.ingramcontent.com),
  - Brodart Bibz dashboard (www.bibz2.com), or
  - Libraria (www.libraria.com)
- A content script, which runs only on the specific vendor URL, retrieves the
  saved title from local storage, pastes it into the search bar, and clicks the
  search button
- The text is cleared from the browser's local storage after the search is
  performed (or if the vendor tab is closed before searching)
- These vendor websites are operated by third parties and may require your
  library's own login; anything you do on those sites is governed by their own
  privacy policies

## User Preferences

The extension includes an options page where users can customize their
experience. User preferences are stored using `chrome.storage.sync`, which
includes:

- Which vendors to enable (Ingram, Brodart, and/or Libraria)
- Whether new tabs should open in the foreground or background
- Whether to clean up the selected text (removing stray colons, commas, and the
  word "by") before searching

These preferences are stored locally and synced across your browser
installations through your browser's built-in sync feature (if enabled). This
data never leaves your browser ecosystem and is not transmitted to the developer
or any third parties.

## Permissions

The extension requires the following permissions:

- **contextMenus**: To add search options to the right-click menu
- **storage**: To temporarily store search terms and save user preferences
  locally
- **Access to the vendor sites** (ipage.ingramcontent.com, www.bibz2.com,
  www.libraria.com): So the extension can fill in the search box on those sites
  only

## Data Security

No personally identifiable information, browsing history, or sensitive user data
is collected, accessed, or transmitted by this extension.

## Changes to This Policy

Any updates to this privacy policy will be reflected in the extension listing on
the Chrome Web Store, Microsoft Edge Add-ons, and Firefox Add-ons store.
