// Load saved settings
chrome.storage.sync.get({
  enableIngram: true,
  enableBrodart: true,
  tabFocus: 'focus'
}, (items) => {
  document.getElementById('enableIngram').checked = items.enableIngram;
  document.getElementById('enableBrodart').checked = items.enableBrodart;
  
  if (items.tabFocus === 'focus') {
    document.getElementById('focusTab').checked = true;
  } else {
    document.getElementById('backgroundTab').checked = true;
  }
});

// Save settings when changed
function saveOptions() {
  const settings = {
    enableIngram: document.getElementById('enableIngram').checked,
    enableBrodart: document.getElementById('enableBrodart').checked,
    tabFocus: document.querySelector('input[name="tabFocus"]:checked').value
  };
  
  chrome.storage.sync.set(settings, () => {
    // Show status message
    const status = document.getElementById('status');
    status.textContent = 'Settings saved!';
    setTimeout(() => {
      status.textContent = '';
    }, 2000);
    
    // Notify background script to update menus
    chrome.runtime.sendMessage({ action: 'updateMenus' });
  });
}

// Add event listeners
document.getElementById('enableIngram').addEventListener('change', saveOptions);
document.getElementById('enableBrodart').addEventListener('change', saveOptions);
document.querySelectorAll('input[name="tabFocus"]').forEach(radio => {
  radio.addEventListener('change', saveOptions);
});
