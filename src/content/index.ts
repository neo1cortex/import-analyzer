import { extractMobileListing } from './extractor';

if (location.hostname.endsWith('mobile.de')) {
  const send = () => chrome.runtime.sendMessage({ type: 'listing-ready', listing: extractMobileListing(document, location.href) }).catch(() => undefined);
  if (document.querySelector('[data-testid="vip-technical-data-box"]')) send();
  else {
    const timer = setTimeout(() => observer.disconnect(), 5000);
    const observer = new MutationObserver(() => { if (document.querySelector('[data-testid="vip-technical-data-box"]')) { clearTimeout(timer); observer.disconnect(); send(); } });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }
}

export { extractMobileListing } from './extractor';
