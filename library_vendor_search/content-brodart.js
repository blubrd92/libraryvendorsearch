(function() {
  let hasRun = false;

  function performSearch() {
    if (hasRun) return;
    
    chrome.storage.local.get(["brodartSearchTerm"], (result) => {
      const searchTerm = result.brodartSearchTerm;
      
      if (searchTerm) {
        const searchInput = document.getElementById("quicksearch");
        const searchButton = document.getElementById("quickSearchInput");
        
        // Error Handling: Check if elements exist before interacting
        if (!searchInput || !searchButton) {
          console.error("Library Vendor Search: Could not find Brodart search elements. The website layout may have changed.");
          // We do not set hasRun = true here, allowing for a potential retry if the DOM is just slow
          return;
        }

        hasRun = true;
        
        // Input the search term and trigger events to wake up the site's scripts
        searchInput.value = searchTerm;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Fragility Fix: Polling mechanism instead of a blind timeout
        // We attempt to click up to 10 times over 1 second, ensuring the site processes the input
        let attempts = 0;
        const maxAttempts = 10;
        
        const clickInterval = setInterval(() => {
          attempts++;
          
          // Ensure the value is still correct before clicking
          if (searchInput.value === searchTerm) {
            searchButton.click();
            clearInterval(clickInterval);
            chrome.storage.local.remove(["brodartSearchTerm", "brodartPending"]);
          } else {
            // Re-apply if the site wiped it
            searchInput.value = searchTerm;
          }
          
          if (attempts >= maxAttempts) {
            clearInterval(clickInterval);
            console.warn("Library Vendor Search: Timed out waiting to click Brodart search button.");
          }
        }, 100);

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
