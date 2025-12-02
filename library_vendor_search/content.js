(function() {
  let hasRun = false;

  function performSearch() {
    if (hasRun) return;
    
    chrome.storage.local.get(["ingramSearchTerm"], (result) => {
      const searchTerm = result.ingramSearchTerm;
      
      if (searchTerm) {
        const searchInput = document.getElementById("searchText");
        const searchButton = document.getElementById("searchSubmit");
        
        if (!searchInput || !searchButton) {
           // Wait for login or correct page load
           return;
        }
        
        hasRun = true;
        searchInput.value = searchTerm;
        searchButton.click();
        
        // Notify background to clear storage
        chrome.runtime.sendMessage({ action: 'searchSuccess', vendor: 'ingram' });
      }
    });
  }

  // Try search on initial load
  performSearch();
})();
