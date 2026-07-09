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
  importScripts('vendor/browser-polyfill.min.js'); // Chromium service-worker path
}

const INGRAM_URL = "https://ipage.ingramcontent.com/ipage/common/contentdelivery/hm001View.action";
const BRODART_URL = "https://www.bibz2.com/ActBibzHomeManagerInit.do?actionParam=Home";
const LIBRARIA_URL = "https://www.libraria.com/";
const LIBRARIA_SEARCH_URL = "https://www.libraria.com/catalogsearch/result/";

const VENDORS = [
  { id: "searchIngram",   key: "enableIngram",   label: "Ingram",   url: INGRAM_URL,   storagePrefix: "ingram" },
  { id: "searchBrodart",  key: "enableBrodart",  label: "Brodart",  url: BRODART_URL,  storagePrefix: "brodart" },
  // Libraria is a Magento store: search is a plain results URL, so we open it
  // directly (term baked in) rather than relying on the content script to fill
  // the box. content-libraria.js remains a fallback for the post-login case.
  { id: "searchLibraria", key: "enableLibraria", label: "Libraria", url: LIBRARIA_URL, storagePrefix: "libraria",
    searchUrl: (term) => `${LIBRARIA_SEARCH_URL}?${new URLSearchParams({ q: term }).toString()}` }
];

function storageKeys(prefix) {
  return [`${prefix}SearchTerm`, `${prefix}Pending`, `${prefix}TabId`];
}

// Create context menus based on user settings
async function createMenus() {
  const defaults = VENDORS.reduce((acc, v) => { acc[v.key] = true; return acc; }, {});

  const settings = await browser.storage.sync.get(defaults);
  await browser.contextMenus.removeAll();

  const enabled = VENDORS.filter(v => settings[v.key]);
  if (enabled.length === 0) return;

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

  enabled.forEach(v => {
    browser.contextMenus.create({
      id: v.id,
      parentId: "vendorParent",
      title: `Search ${v.label} for '%s'`,
      contexts: ["selection"]
    });
  });
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

// Handle context menu clicks
browser.contextMenus.onClicked.addListener(async (info, tab) => {
  let searchTerm = info.selectionText;
  const vendor = VENDORS.find(v => v.id === info.menuItemId);
  if (!vendor || !searchTerm) return;

  const settings = await browser.storage.sync.get({
    tabFocus: 'focus',
    sanitizeSearch: true
  });
  const shouldFocus = settings.tabFocus === 'focus';

  if (settings.sanitizeSearch) {
    const cleaned = searchTerm
      .replace(/[:,]/g, ' ')
      .replace(/\bby\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    // Keep the original selection if sanitizing emptied it (e.g. the user
    // selected only "by" or punctuation) so we never run a blank search.
    if (cleaned) searchTerm = cleaned;
  }

  const prefix = vendor.storagePrefix;
  await browser.storage.local.set({
    [`${prefix}SearchTerm`]: searchTerm,
    [`${prefix}Pending`]: true,
    [`${prefix}TabId`]: null
  });

  const targetUrl = vendor.searchUrl ? vendor.searchUrl(searchTerm) : vendor.url;
  const newTab = await browser.tabs.create({
    url: targetUrl,
    index: tab.index + 1,
    active: shouldFocus
  });
  await browser.storage.local.set({ [`${prefix}TabId`]: newTab.id });
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
