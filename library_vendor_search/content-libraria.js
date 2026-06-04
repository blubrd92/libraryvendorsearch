(function() {
  let hasRun = false;

  // Try several common search-box shapes rather than depending on one exact id,
  // so a markup change on Libraria doesn't silently break the fill.
  function findSearchInput() {
    return document.querySelector(
      'input#search, input[type="search"], input[name="q"], input[name="search"], ' +
      'input[placeholder*="search" i], input[aria-label*="search" i]'
    );
  }

  function submitSearch(input) {
    // 1) Prefer an explicit submit button if one is present.
    const button = document.querySelector(
      'button.action.search[type="submit"], button[type="submit"][title*="search" i], ' +
      'button[aria-label*="search" i], #search_mini_form button[type="submit"]'
    );
    if (button) {
      button.click();
      return;
    }
    // 2) Otherwise submit the enclosing form, if any.
    if (input.form) {
      input.form.submit();
      return;
    }
    // 3) Otherwise simulate pressing Enter in the field (SPA-style search bars).
    const opts = { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true };
    input.dispatchEvent(new KeyboardEvent('keydown', opts));
    input.dispatchEvent(new KeyboardEvent('keyup', opts));
  }

  function performSearch() {
    if (hasRun) return;

    browser.storage.local.get(["librariaSearchTerm"]).then((result) => {
      const searchTerm = result.librariaSearchTerm;
      if (!searchTerm) return;

      // The background script opens Libraria's results URL directly (the term is
      // already in the query string). If we've landed on a results page, the
      // search already ran — just clear the pending term and stop.
      if (location.pathname.includes('/catalogsearch/result')) {
        hasRun = true;
        browser.runtime.sendMessage({ action: 'searchSuccess', vendor: 'libraria' });
        return;
      }

      // Otherwise we were probably bounced to a login page and then landed on a
      // page that has the search box (e.g. the home page after signing in). Fill
      // and submit it. If there's no box yet, keep waiting; the observer retries.
      const searchInput = findSearchInput();
      if (!searchInput) {
        console.log("Library Vendor Search: Libraria search box not found yet; waiting...");
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
          submitSearch(searchInput);
          clearInterval(clickInterval);
          browser.runtime.sendMessage({ action: 'searchSuccess', vendor: 'libraria' });
        } else {
          searchInput.value = searchTerm;
          searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        }

        if (attempts >= maxAttempts) {
          clearInterval(clickInterval);
          console.warn("Library Vendor Search: Timed out waiting to submit Libraria search.");
        }
      }, 100);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', performSearch);
  } else {
    performSearch();
  }

  // Also watch for SPA-style navigation / late-rendered search bar.
  const observer = new MutationObserver(() => {
    if (!hasRun && findSearchInput()) {
      performSearch();
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
