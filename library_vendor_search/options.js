const DEFAULTS = {
  enableIngram: true,
  enableBrodart: true,
  enableLibraria: true,
  sanitizeSearch: true,
  enableSearchAll: false,
  tabFocus: 'focus'
};

let statusTimer = null;

browser.storage.sync.get(DEFAULTS).then((items) => {
  document.getElementById('enableIngram').checked = items.enableIngram;
  document.getElementById('enableBrodart').checked = items.enableBrodart;
  document.getElementById('enableLibraria').checked = items.enableLibraria;
  document.getElementById('sanitizeSearch').checked = items.sanitizeSearch;
  document.getElementById('enableSearchAll').checked = items.enableSearchAll;

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
    enableSearchAll: document.getElementById('enableSearchAll').checked,
    tabFocus: document.querySelector('input[name="tabFocus"]:checked').value
  };

  browser.storage.sync.set(settings).then(() => {
    const status = document.getElementById('status');
    status.classList.add('visible');
    clearTimeout(statusTimer);
    statusTimer = setTimeout(() => status.classList.remove('visible'), 1200);

    browser.runtime.sendMessage({ action: 'updateMenus' });
  });
}

document.getElementById('enableIngram').addEventListener('change', saveOptions);
document.getElementById('enableBrodart').addEventListener('change', saveOptions);
document.getElementById('enableLibraria').addEventListener('change', saveOptions);
document.getElementById('sanitizeSearch').addEventListener('change', saveOptions);
document.getElementById('enableSearchAll').addEventListener('change', saveOptions);
document.querySelectorAll('input[name="tabFocus"]').forEach(radio => {
  radio.addEventListener('change', saveOptions);
});
