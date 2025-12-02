const INGRAM_URL = "https://ipage.ingramcontent.com/ipage/common/contentdelivery/hm001View.action";
const BRODART_URL = "https://www.bibz2.com/ActBibzHomeManagerInit.do?actionParam=Home";

// Create context menus based on user settings
function createMenus() {
  chrome.storage.sync.get({
    enableIngram: true,
    enableBrodart: true
  }, (settings) => {
    chrome.contextMenus.removeAll(() => {
      const ingramEnabled = settings.enableIngram;
      const brodartEnabled = settings.enableBrodart;
      
      if (ingramEnabled && brodartEnabled) {
        chrome.contextMenus.create({
          id: "vendorParent",
          title: "Search Library Vendors",
          contexts: ["selection"]
        });
        
        chrome.contextMenus.create({
          id: "searchIngram",
          parentId: "vendorParent",
          title: "Search Ingram for '%s'",
          contexts: ["selection"]
        });
        
        chrome.contextMenus.create({
          id: "searchBrodart",
          parentId: "vendorParent",
          title: "Search Brodart for '%s'",
          contexts: ["selection"]
        });
      }
      else if (ingramEnabled) {
        chrome.contextMenus.create({
          id: "searchIngram",
          title: "Search Ingram for '%s'",
          contexts: ["selection"]
        });
      }
      else if (brodartEnabled) {
        chrome.contextMenus.create({
          id: "searchBrodart",
          title: "Search Brodart for '%s'",
          contexts: ["selection"]
        });
      }
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
    if (message.vendor === 'ingram') {
      chrome.storage.local.remove(["ingramSearchTerm", "ingramPending", "ingramTabId"]);
    } else if (message.vendor === 'brodart') {
      chrome.storage.local.remove(["brodartSearchTerm", "brodartPending", "brodartTabId"]);
    }
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const searchTerm = info.selectionText;
  
  chrome.storage.sync.get({ tabFocus: 'focus' }, (settings) => {
    const shouldFocus = settings.tabFocus === 'focus';
    
    if (info.menuItemId === "searchIngram" && searchTerm) {
      chrome.storage.local.set({ 
        "ingramSearchTerm": searchTerm,
        "ingramPending": true,
        "ingramTabId": null
      }, () => {
        chrome.tabs.create({
          url: INGRAM_URL,
          index: tab.index + 1,
          active: shouldFocus
        }, (newTab) => {
          chrome.storage.local.set({ "ingramTabId": newTab.id });
        });
      });
    } 
    else if (info.menuItemId === "searchBrodart" && searchTerm) {
      chrome.storage.local.set({ 
        "brodartSearchTerm": searchTerm,
        "brodartPending": true,
        "brodartTabId": null
      }, () => {
        chrome.tabs.create({
          url: BRODART_URL,
          index: tab.index + 1,
          active: shouldFocus
        }, (newTab) => {
          chrome.storage.local.set({ "brodartTabId": newTab.id });
        });
      });
    }
  });
});

// Clean up if user closes the vendor tab without logging in
chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
  chrome.storage.local.get(["ingramTabId", "ingramPending", "brodartTabId", "brodartPending"], (result) => {
    if (tabId === result.ingramTabId && result.ingramPending) {
      chrome.storage.local.remove(["ingramSearchTerm", "ingramPending", "ingramTabId"]);
    }
    
    if (tabId === result.brodartTabId && result.brodartPending) {
      chrome.storage.local.remove(["brodartSearchTerm", "brodartPending", "brodartTabId"]);
    }
  });
});
