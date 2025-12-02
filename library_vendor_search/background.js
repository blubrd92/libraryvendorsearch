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
  // New: Listen for successful search completion to clean up storage
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
          url: "https://ipage.ingramcontent.com/ipage/common/contentdelivery/hm001View.action",
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
          url: "https://www.bibz2.com/ActBibzHomeManagerInit.do?actionParam=Home",
          index: tab.index + 1,
          active: shouldFocus
        }, (newTab) => {
          chrome.storage.local.set({ "brodartTabId": newTab.id });
        });
      });
    }
  });
});

// Listen for navigation events - retry search after login
// Improved: We keep 'pending' true until the content script confirms success
chrome.webNavigation.onCompleted.addListener((details) => {
  chrome.storage.local.get(["ingramSearchTerm", "ingramPending"], (result) => {
    if (result.ingramSearchTerm && result.ingramPending) {
      chrome.tabs.sendMessage(details.tabId, { action: 'retrySearch' });
    }
  });
}, {
  url: [{ hostContains: 'ingramcontent.com' }]
});

chrome.webNavigation.onCompleted.addListener((details) => {
  chrome.storage.local.get(["brodartSearchTerm", "brodartPending"], (result) => {
    if (result.brodartSearchTerm && result.brodartPending) {
      chrome.tabs.sendMessage(details.tabId, { action: 'retrySearch' });
    }
  });
}, {
  url: [{ hostContains: 'bibz2.com' }]
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

// Clean up if user navigates away from vendor site without logging in
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url) {
    chrome.storage.local.get(["ingramTabId", "ingramPending", "brodartTabId", "brodartPending"], (result) => {
      if (tabId === result.ingramTabId && result.ingramPending && 
          !changeInfo.url.includes('ingramcontent.com')) {
        chrome.storage.local.remove(["ingramSearchTerm", "ingramPending", "ingramTabId"]);
      }
      
      if (tabId === result.brodartTabId && result.brodartPending && 
          !changeInfo.url.includes('bibz2.com')) {
        chrome.storage.local.remove(["brodartSearchTerm", "brodartPending", "brodartTabId"]);
      }
    });
  }
});
