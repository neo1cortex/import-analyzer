import { describe, expect, it } from 'vitest';
import { detectRedFlags } from '../src/analysis/red-flags';
import { detectContradictions } from '../src/analysis/red-flags';
import type { VehicleListing } from '../src/shared/listing';

const listing = (description: string): VehicleListing => ({ marketplace: 'mobile.de', url: 'https://www.mobile.de/x', features: {}, explicitEngineCodes: { value: [], source: 'manual', confidence: 'unknown', extractedAt: '' }, extractionLog: [], description: { value: description, raw: description, source: 'manual', confidence: 'high', extractedAt: '' } });
describe('red flags', () => {
  it('detects explicit multilingual risks and preserves excerpts', () => {
    const flags = detectRedFlags(listing('Verkauf im Kundenauftrag. Austauschmotor verbaut.'));
    expect(flags.map(({ category }) => category)).toEqual(['replaced-powertrain', 'consignment-sale']);
    expect(flags[0]?.excerpt).toContain('Austauschmotor');
  });
  it('does not flag a generic accident denial', () => expect(detectRedFlags(listing('Kein Unfall bekannt.'))).toEqual([]));
  it('detects copied model and cylinder data as contradictions', () => {
    const input = listing('Der BMW 523i mit 6 Zylinder.'); input.make = { value: 'BMW', source: 'manual', confidence: 'high', extractedAt: '' }; input.model = { value: '320', source: 'manual', confidence: 'high', extractedAt: '' }; input.cylinders = { value: 4, source: 'manual', confidence: 'high', extractedAt: '' };
    expect(detectContradictions(input).map(({ category }) => category)).toEqual(['technical-contradiction', 'technical-contradiction']);
  });
});
