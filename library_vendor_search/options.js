const DEFAULTS = {
  enableIngram: true,
  enableBrodart: true,
  enableLibraria: true,
  sanitizeSearch: false,
  tabFocus: 'focus'
};

let statusTimer = null;

chrome.storage.sync.get(DEFAULTS, (items) => {
  document.getElementById('enableIngram').checked = items.enableIngram;
  document.getElementById('enableBrodart').checked = items.enableBrodart;
  document.getElementById('enableLibraria').checked = items.enableLibraria;
  document.getElementById('sanitizeSearch').checked = items.sanitizeSearch;

  if (items.tabFocus === 'focus') {
    document.getElementById('focusTab').checked = true;
  } else {
    document.getElementById('backgroundTab').checked = true;
  }
});

function saveOptions() {
  const settings = {
    enableIngram: document.getElementById('enableIngram').checked,
    enableBrodart: document.getElementById('enableBrodart').checked,
    enableLibraria: document.getElementById('enableLibraria').checked,
    sanitizeSearch: document.getElementById('sanitizeSearch').checked,
    tabFocus: document.querySelector('input[name="tabFocus"]:checked').value
  };

  chrome.storage.sync.set(settings, () => {
    const status = document.getElementById('status');
    status.classList.add('visible');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => status.classList.remove('visible'), 1200);

    chrome.runtime.sendMessage({ action: 'updateMenus' });
  });
}

document.getElementById('enableIngram').addEventListener('change', saveOptions);
document.getElementById('enableBrodart').addEventListener('change', saveOptions);
document.getElementById('enableLibraria').addEventListener('change', saveOptions);
document.getElementById('sanitizeSearch').addEventListener('change', saveOptions);
document.querySelectorAll('input[name="tabFocus"]').forEach(radio => {
  radio.addEventListener('change', saveOptions);
});
