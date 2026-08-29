import { describe, expect, it } from 'vitest';
import { isExtensionMessage } from '../src/shared/messages';

describe('isExtensionMessage', () => {
  it('accepts only known extension messages', () => {
    expect(isExtensionMessage({ type: 'get-last-analysis' })).toBe(true);
    expect(isExtensionMessage({ type: 'listing-ready' })).toBe(false);
    expect(isExtensionMessage({ type: 'listing-ready', listing: { marketplace: 'mobile.de', url: 'https://evil.example/x', features: {}, explicitEngineCodes: {}, extractionLog: [] } })).toBe(false);
    expect(isExtensionMessage({ type: 'listing-ready', listing: { marketplace: 'mobile.de', url: 'https://www.mobile.de/x', features: {}, explicitEngineCodes: {}, extractionLog: [] } })).toBe(true);
    expect(isExtensionMessage({ type: 'unknown' })).toBe(false);
    expect(isExtensionMessage(null)).toBe(false);
  });
});
