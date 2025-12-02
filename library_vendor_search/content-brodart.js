(function() {
  let hasRun = false;

  function performSearch() {
    if (hasRun) return;
    
    chrome.storage.local.get(["brodartSearchTerm"], (result) => {
      const searchTerm = result.brodartSearchTerm;
      
      if (searchTerm) {
        const searchInput = document.getElementById("quicksearch");
        const searchButton = document.getElementById("quickSearchInput");
        
        // Graceful Handling: If we are on the login page (inputs missing), do nothing.
        // The background script will keep 'pending' true, so when the user logs in
        // and reaches the dashboard, this script will run again and succeed.
        if (!searchInput || !searchButton) {
          console.log("Library Vendor Search: Waiting for login or navigation to dashboard...");
          return;
        }

        hasRun = true;
        
        // Input the search term and wake up the page scripts
        searchInput.value = searchTerm;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.dispatchEvent(new Event('change', { bubbles: true }));
        
        // Robust click mechanism
        let attempts = 0;
        const maxAttempts = 10;
        
        const clickInterval = setInterval(() => {
          attempts++;
          
          if (searchInput.value === searchTerm) {
            searchButton.click();
            clearInterval(clickInterval);
            // Notify background to clear storage now that we succeeded
            chrome.runtime.sendMessage({ action: 'searchSuccess', vendor: 'brodart' });
          } else {
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

  // Listen for retry messages
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'retrySearch') {
      performSearch();
    }
  });
})();
