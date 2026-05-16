(function() {
  let hasRun = false;

  function performSearch() {
    if (hasRun) return;

    chrome.storage.local.get(["librariaSearchTerm"], (result) => {
      const searchTerm = result.librariaSearchTerm;
      if (!searchTerm) return;

      const searchInput = document.getElementById("search");
      const searchButton = document.querySelector('button.action.search[type="submit"]');

      // If inputs aren't present, user is likely on a login screen.
      // Keep the pending term in storage; we'll retry on the next page load.
      if (!searchInput || !searchButton) {
        console.log("Library Vendor Search: Waiting for Libraria login or navigation...");
        return;
      }

      hasRun = true;

      searchInput.focus();
      searchInput.value = searchTerm;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      searchInput.dispatchEvent(new Event('change', { bubbles: true }));

      let attempts = 0;
      const maxAttempts = 10;

      const clickInterval = setInterval(() => {
        attempts++;

        if (searchInput.value === searchTerm) {
          searchButton.click();
          clearInterval(clickInterval);
          chrome.runtime.sendMessage({ action: 'searchSuccess', vendor: 'libraria' });
        } else {
          searchInput.value = searchTerm;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (attempts >= maxAttempts) {
          clearInterval(clickInterval);
          console.warn("Library Vendor Search: Timed out waiting to click Libraria search button.");
        }
      }, 100);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performSearch);
  } else {
    performSearch();
  }

  // Also watch for SPA-style navigation / late-rendered search bar
  const observer = new MutationObserver(() => {
    if (!hasRun && document.getElementById("search")) {
      performSearch();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
