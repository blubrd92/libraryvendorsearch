const DEFAULTS = {
  enableIngram: true,
  enableBrodart: true,
  enableLibraria: true,
  enableWorldcat: false,
  enableCatalog: false,
  catalogInstance: '',
  sanitizeSearch: true,
  enableSearchAll: false,
  tabFocus: 'focus'
};

let statusTimer = null;

browser.storage.sync.get(DEFAULTS).then((items) => {
  document.getElementById('enableIngram').checked = items.enableIngram;
  document.getElementById('enableBrodart').checked = items.enableBrodart;
  document.getElementById('enableLibraria').checked = items.enableLibraria;
  document.getElementById('enableWorldcat').checked = items.enableWorldcat;
  document.getElementById('enableCatalog').checked = items.enableCatalog;
  document.getElementById('catalogInstance').value = items.catalogInstance;
  renderCatalogHint();
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
    enableWorldcat: document.getElementById('enableWorldcat').checked,
    enableCatalog: document.getElementById('enableCatalog').checked,
    catalogInstance: document.getElementById('catalogInstance').value.trim(),
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
document.getElementById('enableWorldcat').addEventListener('change', saveOptions);
document.getElementById('enableCatalog').addEventListener('change', () => { renderCatalogHint(); saveOptions(); });
document.getElementById('sanitizeSearch').addEventListener('change', saveOptions);
document.getElementById('enableSearchAll').addEventListener('change', saveOptions);
document.querySelectorAll('input[name="tabFocus"]').forEach(radio => {
  radio.addEventListener('change', saveOptions);
});

// The hint doubles as the only feedback that a pasted address was understood:
// normalizeBiblioCommonsInstance (in catalog.js, the same function
// background.js uses to decide whether the menu item exists) turns a full
// pasted URL into the one label we build from.
function renderCatalogHint() {
  const enabled = document.getElementById('enableCatalog').checked;
  const raw = document.getElementById('catalogInstance').value.trim();
  const instance = normalizeBiblioCommonsInstance(raw);
  const hint = document.getElementById('catalogHint');

  hint.classList.remove('warn');
  if (!raw) {
    hint.textContent = enabled
      ? 'Enter your catalog address to show this in the menu.'
      : 'Paste your catalog address, e.g. yourlibrary.bibliocommons.com';
    if (enabled) hint.classList.add('warn');
    return;
  }
  if (!instance) {
    hint.textContent = "That doesn't look like a BiblioCommons address.";
    hint.classList.add('warn');
    return;
  }
  hint.textContent = `Searches ${instance}.bibliocommons.com`;
}

// Debounced: storage.sync has a per-minute write quota, so don't save on every
// keystroke. Waiting for blur alone would lose the value when the popup closes.
let catalogTimer = null;
document.getElementById('catalogInstance').addEventListener('input', () => {
  renderCatalogHint();
  clearTimeout(catalogTimer);
  catalogTimer = setTimeout(saveOptions, 400);
});

// On blur, replace whatever was pasted with the label we actually use.
document.getElementById('catalogInstance').addEventListener('change', (e) => {
  const instance = normalizeBiblioCommonsInstance(e.target.value);
  if (instance) e.target.value = instance;
  renderCatalogHint();
  clearTimeout(catalogTimer);
  saveOptions();
});
