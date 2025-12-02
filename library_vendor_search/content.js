(function() {
  let hasRun = false;

  function performSearch() {
    if (hasRun) return;
    
    chrome.storage.local.get(["ingramSearchTerm"], (result) => {
      const searchTerm = result.ingramSearchTerm;
      
      if (searchTerm) {
        const searchInput = document.getElementById("searchText");
        const searchButton = document.getElementById("searchSubmit");
        
        if (searchInput && searchButton) {
          hasRun = true;
          searchInput.value = searchTerm;
          searchButton.click();
          chrome.storage.local.remove(["ingramSearchTerm", "ingramPending"]);
        }
      }
    });
  }

  // Try search on initial load
  performSearch();

  // Listen for retry messages from background script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'retrySearch') {
      performSearch();
    }
  });
})();
