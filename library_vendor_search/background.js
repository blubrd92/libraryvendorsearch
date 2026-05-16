const INGRAM_URL = "https://ipage.ingramcontent.com/ipage/common/contentdelivery/hm001View.action";
const BRODART_URL = "https://www.bibz2.com/ActBibzHomeManagerInit.do?actionParam=Home";
const LIBRARIA_URL = "https://www.libraria.com/";

const VENDORS = [
  { id: "searchIngram",   key: "enableIngram",   label: "Ingram",   url: INGRAM_URL,   storagePrefix: "ingram" },
  { id: "searchBrodart",  key: "enableBrodart",  label: "Brodart",  url: BRODART_URL,  storagePrefix: "brodart" },
  { id: "searchLibraria", key: "enableLibraria", label: "Libraria", url: LIBRARIA_URL, storagePrefix: "libraria" }
];

function storageKeys(prefix) {
  return [`${prefix}SearchTerm`, `${prefix}Pending`, `${prefix}TabId`];
}

// Create context menus based on user settings
function createMenus() {
  const defaults = VENDORS.reduce((acc, v) => { acc[v.key] = true; return acc; }, {});

  chrome.storage.sync.get(defaults, (settings) => {
    chrome.contextMenus.removeAll(() => {
      const enabled = VENDORS.filter(v => settings[v.key]);

      if (enabled.length === 0) return;

      if (enabled.length === 1) {
        const v = enabled[0];
        chrome.contextMenus.create({
          id: v.id,
          title: `Search ${v.label} for '%s'`,
          contexts: ["selection"]
        });
        return;
      }

      chrome.contextMenus.create({
        id: "vendorParent",
        title: "Search Library Vendors",
        contexts: ["selection"]
      });

      enabled.forEach(v => {
        chrome.contextMenus.create({
          id: v.id,
          parentId: "vendorParent",
          title: `Search ${v.label} for '%s'`,
          contexts: ["selection"]
        });
      });
    });
  });
}

chrome.runtime.onInstalled.addListener(() => {
  createMenus();
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateMenus') {
    createMenus();
  }
  // Listen for successful search completion to clean up storage
  if (message.action === 'searchSuccess') {
    const vendor = VENDORS.find(v => v.storagePrefix === message.vendor);
    if (vendor) {
      chrome.storage.local.remove(storageKeys(vendor.storagePrefix));
    }
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  let searchTerm = info.selectionText;
  const vendor = VENDORS.find(v => v.id === info.menuItemId);
  if (!vendor || !searchTerm) return;

  chrome.storage.sync.get({
    tabFocus: 'focus',
    sanitizeSearch: false
  }, (settings) => {
    const shouldFocus = settings.tabFocus === 'focus';

    if (settings.sanitizeSearch) {
      searchTerm = searchTerm
        .replace(/[:,]/g, ' ')
        .replace(/\bby\b/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }

    const prefix = vendor.storagePrefix;
    chrome.storage.local.set({
      [`${prefix}SearchTerm`]: searchTerm,
      [`${prefix}Pending`]: true,
      [`${prefix}TabId`]: null
    }, () => {
      chrome.tabs.create({
        url: vendor.url,
        index: tab.index + 1,
        active: shouldFocus
      }, (newTab) => {
        chrome.storage.local.set({ [`${prefix}TabId`]: newTab.id });
      });
    });
  });
});

// Clean up if user closes the vendor tab without logging in
chrome.tabs.onRemoved.addListener((tabId) => {
  const allTabKeys = VENDORS.flatMap(v => [`${v.storagePrefix}TabId`, `${v.storagePrefix}Pending`]);
  chrome.storage.local.get(allTabKeys, (result) => {
    VENDORS.forEach(v => {
      if (tabId === result[`${v.storagePrefix}TabId`] && result[`${v.storagePrefix}Pending`]) {
        chrome.storage.local.remove(storageKeys(v.storagePrefix));
      }
    });
  });
});
