(function() {
  let hasRun = false;

  function performSearch() {
    if (hasRun) return;
    
    chrome.storage.local.get(["brodartSearchTerm"], (result) => {
      const searchTerm = result.brodartSearchTerm;
      
      if (searchTerm) {
        const searchInput = document.getElementById("quicksearch");
        const searchButton = document.getElementById("quickSearchInput");
        
        // Only run if we find the search elements (meaning we're on the right page)
        if (searchInput && searchButton) {
          hasRun = true;
          
          searchInput.value = searchTerm;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
          searchInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          setTimeout(() => {
            searchButton.click();
            chrome.storage.local.remove(["brodartSearchTerm", "brodartPending"]);
          }, 300);
        } else {
          // If we're not on the dashboard yet, try navigating there
          if (window.location.href !== 'https://www.bibz2.com/ActBibzHomeManagerInit.do?actionParam=Home') {
            window.location.href = 'https://www.bibz2.com/ActBibzHomeManagerInit.do?actionParam=Home';
          }
        }
      }
    });
  }

  // Try search on initial load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performSearch);
  } else {
    performSearch();
  }

  // Listen for retry messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'retrySearch') {
      performSearch();
    }
  });
})();
