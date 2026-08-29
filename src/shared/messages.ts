import type { ProbableEngineResult } from '../analysis/engine-match';
import type { RedFlag } from '../analysis/red-flags';
import type { VehicleListing } from './listing';

export interface ListingAnalysis { listing: VehicleListing; flags: RedFlag[]; engineAnalysis: ProbableEngineResult; savedAt: string; }
export type ExtensionMessage =
  | { type: 'listing-ready'; listing: VehicleListing }
  | { type: 'get-last-analysis' }
  | { type: 'open-side-panel' };

export function isExtensionMessage(value: unknown): value is ExtensionMessage {
  if (typeof value !== 'object' || value === null || !('type' in value)) return false;
  const type = value.type;
  if (type === 'listing-ready') {
    if (!('listing' in value) || typeof value.listing !== 'object' || value.listing === null) return false;
    const listing = value.listing as Record<string, unknown>;
    return listing.marketplace === 'mobile.de' && typeof listing.url === 'string' && /^https:\/\/(?:[^/]+\.)?mobile\.de\//i.test(listing.url) && listing.url.length <= 2048 && Array.isArray(listing.extractionLog) && listing.extractionLog.length <= 100 && typeof listing.features === 'object' && listing.features !== null && typeof listing.explicitEngineCodes === 'object' && listing.explicitEngineCodes !== null;
  }
  return type === 'get-last-analysis' || type === 'open-side-panel';
}
