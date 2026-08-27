// Library Vendor Search — background script.
//
// One source file runs in both engines. On Chromium it loads as an MV3 service
// worker (manifest `background.service_worker`), so the webextension-polyfill is
// pulled in via importScripts below. On Firefox it loads as a non-persistent
// background *page* (manifest `background.scripts`, which lists the polyfill as
// its first entry), where `importScripts` does not exist — hence the typeof
// guard.
//
// DO NOT REMOVE the importScripts guard. Without it Firefox throws a
// ReferenceError ("importScripts is not defined") on startup. If you refactor
// this file, preserve it.
if (typeof importScripts === 'function') {
  importScripts('vendor/browser-polyfill.min.js', 'catalog.js'); // Chromium service-worker path
}

const INGRAM_URL = "https://ipage.ingramcontent.com/ipage/common/contentdelivery/hm001View.action";
const BRODART_URL = "https://www.bibz2.com/ActBibzHomeManagerInit.do?actionParam=Home";
const LIBRARIA_URL = "https://www.libraria.com/";
const LIBRARIA_SEARCH_URL = "https://www.libraria.com/catalogsearch/result/";
const WORLDCAT_SEARCH_URL = "https://search.worldcat.org/search";

const VENDORS = [
  { id: "searchIngram",   key: "enableIngram",   label: "Ingram",   url: INGRAM_URL,   storagePrefix: "ingram" },
  { id: "searchBrodart",  key: "enableBrodart",  label: "Brodart",  url: BRODART_URL,  storagePrefix: "brodart" },
  // Libraria is a Magento store: search is a plain results URL, so we open it
  // directly (term baked in) rather than relying on the content script to fill
  // the box. content-libraria.js remains a fallback for the post-login case.
  { id: "searchLibraria", key: "enableLibraria", label: "Libraria", url: LIBRARIA_URL, storagePrefix: "libraria",
    searchUrl: (term) => `${LIBRARIA_SEARCH_URL}?${new URLSearchParams({ q: term }).toString()}` },
  // WorldCat is a lookup source, not somewhere you place an order — hence
  // `supplementary`, which puts it below a divider in the menu. Its search is a
  // public results URL with no login, so unlike the vendors above it needs no
  // content script (and therefore no host match in manifest.json and no extra
  // permission). `contentScript: false` records that: with nothing on the far
  // end to hand the term to, openVendorSearch skips the storage.local dance.
  // defaultEnabled: false so an existing install doesn't silently gain a menu
  // item (and an extra tab in every "search all") on update.
  { id: "searchWorldcat", key: "enableWorldcat", label: "WorldCat", url: WORLDCAT_SEARCH_URL, storagePrefix: "worldcat",
    supplementary: true, contentScript: false, defaultEnabled: false,
    searchUrl: (term) => `${WORLDCAT_SEARCH_URL}?${new URLSearchParams({ q: term }).toString()}` },
  // The library's own BiblioCommons catalog. `configKey` marks a source that
  // needs a user-supplied value before it can be used at all: getMenuSettings()
  // drops it from the menu (and from "search all") until normalizeConfig
  // returns something usable, so we never show an item that opens a broken URL.
  { id: "searchCatalog", key: "enableCatalog", label: "Library Catalog", url: null, storagePrefix: "catalog",
    supplementary: true, contentScript: false, defaultEnabled: false,
    configKey: "catalogInstance", normalizeConfig: normalizeBiblioCommonsInstance,
    searchUrl: (term, instance) =>
      `https://${instance}.${BIBLIOCOMMONS_DOMAIN}/v2/search?${new URLSearchParams({ query: term, searchType: 'smart' }).toString()}` }
];

// Menu id for the optional "search every enabled vendor at once" entry. It is
// not a vendor, so it deliberately lives outside the VENDORS array.
const SEARCH_ALL_ID = "searchAllVendors";

function storageKeys(prefix) {
  return [`${prefix}SearchTerm`, `${prefix}Pending`, `${prefix}TabId`];
}

// Read the menu-shaping settings: which vendors the user has switched on, and
// whether the "search all vendors" entry should be offered.
async function getMenuSettings() {
  // Defaults come from VENDORS so background.js and options.js DEFAULTS cannot
  // drift apart — a vendor on by default here but off in the popup would show a
  // menu item whose toggle renders unchecked.
  const defaults = VENDORS.reduce(
    (acc, v) => {
      acc[v.key] = v.defaultEnabled !== false;
      if (v.configKey) acc[v.configKey] = '';
      return acc;
    },
    { enableSearchAll: false }
  );

  const settings = await browser.storage.sync.get(defaults);

  // config is keyed by vendor id and passed to that vendor's searchUrl().
  const config = {};
  const enabled = VENDORS.filter(v => {
    if (!settings[v.key]) return false;
    if (!v.configKey) return true;
    config[v.id] = v.normalizeConfig(settings[v.configKey]);
    // Switched on but not configured (or misconfigured): stay out of the menu
    // rather than offer an item that can't build a URL.
    return Boolean(config[v.id]);
  });

  return { enabled, showSearchAll: settings.enableSearchAll, config };
}

// Create context menus based on user settings
async function createMenus() {
  const { enabled, showSearchAll } = await getMenuSettings();
  await browser.contextMenus.removeAll();

  if (enabled.length === 0) return;

  // With a single vendor enabled, "search all" would just duplicate that one
  // entry, so keep the flat single-item menu regardless of the setting.
  if (enabled.length === 1) {
    const v = enabled[0];
    browser.contextMenus.create({
      id: v.id,
      title: `Search ${v.label} for '%s'`,
      contexts: ["selection"]
    });
    return;
  }

  browser.contextMenus.create({
    id: "vendorParent",
    title: "Search Library Vendors",
    contexts: ["selection"]
  });

  enabled.forEach((v, i) => {
    // Divider where the supplementary sources start, so they read as a separate
    // group from the vendors you actually order from. Skipped when the menu is
    // all one kind or the other.
    if (v.supplementary && i > 0 && !enabled[i - 1].supplementary) {
      browser.contextMenus.create({
        id: "supplementarySeparator",
        parentId: "vendorParent",
        type: "separator",
        contexts: ["selection"]
      });
    }
    browser.contextMenus.create({
      id: v.id,
      parentId: "vendorParent",
      title: `Search ${v.label} for '%s'`,
      contexts: ["selection"]
    });
  });

  if (showSearchAll) {
    browser.contextMenus.create({
      id: "searchAllSeparator",
      parentId: "vendorParent",
      type: "separator",
      contexts: ["selection"]
    });
    browser.contextMenus.create({
      id: SEARCH_ALL_ID,
      parentId: "vendorParent",
      title: `Search all vendors for '%s'`,
      contexts: ["selection"]
    });
  }
}

browser.runtime.onInstalled.addListener(() => {
  createMenus();
});

browser.runtime.onMessage.addListener((message) => {
  if (message.action === 'updateMenus') {
    createMenus();
  }
  // Listen for successful search completion to clean up storage
  if (message.action === 'searchSuccess') {
    const vendor = VENDORS.find(v => v.storagePrefix === message.vendor);
    if (vendor) {
      browser.storage.local.remove(storageKeys(vendor.storagePrefix));
    }
  }
  // Intentionally return undefined: we never send an async response, so the
  // message channel should not be kept open (returning a Promise would).
});

function sanitizeTerm(term) {
  const cleaned = term
    .replace(/[:,]/g, ' ')
    .replace(/\bby\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // Keep the original selection if sanitizing emptied it (e.g. the user
  // selected only "by" or punctuation) so we never run a blank search.
  return cleaned || term;
}

// Stash the term under this vendor's prefix and open its tab. Each vendor owns
// its own storage keys, so several of these can be in flight at once.
async function openVendorSearch(vendor, searchTerm, index, active, config) {
  const prefix = vendor.storagePrefix;
  // These keys exist only to hand the term to a content script. A source whose
  // URL already carries the term and has no content script (WorldCat) has
  // nobody to hand it to — writing them would strand a stale term in
  // storage.local until the tab happened to be closed.
  const needsHandoff = vendor.contentScript !== false;

  if (needsHandoff) {
    await browser.storage.local.set({
      [`${prefix}SearchTerm`]: searchTerm,
      [`${prefix}Pending`]: true,
      [`${prefix}TabId`]: null
    });
  }

  const targetUrl = vendor.searchUrl ? vendor.searchUrl(searchTerm, config) : vendor.url;
  if (!targetUrl) return; // unconfigured source; getMenuSettings should have filtered it

  const newTab = await browser.tabs.create({ url: targetUrl, index, active });

  if (needsHandoff) {
    await browser.storage.local.set({ [`${prefix}TabId`]: newTab.id });
  }
}

// Handle context menu clicks
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  const selection = info.selectionText;
  if (!selection) return;

  const isSearchAll = info.menuItemId === SEARCH_ALL_ID;
  const clickedVendor = VENDORS.find(v => v.id === info.menuItemId);
  if (!isSearchAll && !clickedVendor) return;

  const settings = await browser.storage.sync.get({
    tabFocus: 'focus',
    sanitizeSearch: true
  });
  const shouldFocus = settings.tabFocus === 'focus';
  const searchTerm = settings.sanitizeSearch ? sanitizeTerm(selection) : selection;

  // Always consult getMenuSettings(): it resolves per-source config, and a
  // config-bearing source can be stale in the menu if the value was cleared
  // between the menu being built and the click.
  const { enabled, config } = await getMenuSettings();
  const targets = isSearchAll ? enabled : enabled.filter(v => v === clickedVendor);
  if (targets.length === 0) return;

  // Open sequentially so the tabs land in menu order, immediately right of the
  // source tab. When "focus new tab" is on, only the first tab takes focus —
  // otherwise each new tab would yank focus away from the last.
  for (let i = 0; i < targets.length; i++) {
    await openVendorSearch(targets[i], searchTerm, tab.index + 1 + i, shouldFocus && i === 0, config[targets[i].id]);
  }
});

// Clean up if user closes the vendor tab without logging in
browser.tabs.onRemoved.addListener(async (tabId) => {
  const allTabKeys = VENDORS.flatMap(v => [`${v.storagePrefix}TabId`, `${v.storagePrefix}Pending`]);
  const result = await browser.storage.local.get(allTabKeys);
  VENDORS.forEach(v => {
    if (tabId === result[`${v.storagePrefix}TabId`] && result[`${v.storagePrefix}Pending`]) {
      browser.storage.local.remove(storageKeys(v.storagePrefix));
    }
  });
});
