// Shared between the background script and the options popup: both need the
// same answer to "is this a usable BiblioCommons address, and which one?".
// Loaded as a classic script in each runtime (see manifest background.scripts,
// the importScripts call in background.js, and options.html), so these are
// plain globals rather than module exports.
//
// Keep this the ONLY definition. The popup uses it to decide what hint to show;
// background.js uses it to decide whether the menu item exists at all and to
// build the URL. Two copies would be free to drift, and this one is what keeps
// the extension from opening a host the user didn't mean.

const BIBLIOCOMMONS_DOMAIN = "bibliocommons.com";

// The catalog source is per-library, so its host comes from a user-typed
// setting. Librarians will paste whatever is in their address bar, so accept a
// bare subdomain, a host, or a full URL — but resolve to a single lowercase
// label and refuse anything else. The extension then only ever builds
// `https://<label>.bibliocommons.com/...`, so a typo (or a pasted link to
// somewhere else entirely) can't turn the menu item into an open redirect.
// Returns "" for anything unusable, which is what marks the source
// unconfigured.
function normalizeBiblioCommonsInstance(raw) {
  let host = String(raw ?? '').trim().toLowerCase();
  if (!host) return '';

  host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // scheme
  host = host.split('/')[0].split('?')[0].split('#')[0]; // path / query / fragment
  host = host.split('@').pop();                          // userinfo

  // Strip a port, but only a real one: splitting blindly on ':' would turn
  // "javascript:alert(1)" into the plausible-looking instance "javascript".
  const [name, port, ...extra] = host.split(':');
  if (extra.length || (port !== undefined && !/^\d+$/.test(port))) return '';
  host = name;
  if (!host) return '';

  if (host.endsWith(`.${BIBLIOCOMMONS_DOMAIN}`)) {
    // Keep the label nearest the domain, so a stray "www." prefix still works.
    host = host.slice(0, -(BIBLIOCOMMONS_DOMAIN.length + 1)).split('.').filter(Boolean).pop() ?? '';
  } else if (host.includes('.')) {
    return ''; // some other domain — don't guess at what they meant
  }

  return /^[a-z0-9-]+$/.test(host) ? host : '';
}
