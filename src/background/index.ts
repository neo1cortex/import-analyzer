import { isExtensionMessage } from '../shared/messages';
import { identifyProbableEngine } from '../analysis/engine-match';
import { detectContradictions, detectRedFlags } from '../analysis/red-flags';
import { getAnalysis, saveAnalysis } from './storage';

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => undefined);

chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
  if (!isExtensionMessage(message)) return;
  if (message.type === 'listing-ready') {
    const analysis = { listing: message.listing, flags: [...detectRedFlags(message.listing), ...detectContradictions(message.listing)], engineAnalysis: identifyProbableEngine(message.listing), savedAt: new Date().toISOString() };
    void saveAnalysis(analysis).then(() => chrome.storage.local.set({ lastListingUrl: message.listing.url, lastAnalysisUpdated: Date.now() })).then(() => sendResponse({ ok: true })).catch(() => sendResponse({ ok: false }));
    return true;
  }
  if (message.type === 'get-last-analysis') {
    void chrome.storage.local.get('lastListingUrl').then(({ lastListingUrl }) => typeof lastListingUrl === 'string' ? getAnalysis(lastListingUrl) : undefined).then(sendResponse).catch(() => sendResponse(undefined));
    return true;
  }
});
