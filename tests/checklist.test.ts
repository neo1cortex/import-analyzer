import { expect, it } from 'vitest';
import { buildVehicleChecklist } from '../src/analysis/checklist';
import { identifyProbableEngine } from '../src/analysis/engine-match';
import type { ListingAnalysis } from '../src/shared/messages';
import type { VehicleListing } from '../src/shared/listing';

const f = <T>(value: T) => ({ value, source: 'manual' as const, confidence: 'high' as const, extractedAt: '' });
const listing = (values: Partial<VehicleListing>): VehicleListing => ({ marketplace: 'mobile.de', url: 'https://www.mobile.de/test', features: {}, explicitEngineCodes: f([]), extractionLog: [], ...values });
const analyze = (vehicle: VehicleListing): ListingAnalysis => ({ listing: vehicle, flags: [], engineAnalysis: identifyProbableEngine(vehicle), savedAt: '' });

it('adds documented checks, costs and sources for the inferred engine family', () => {
  const vehicle = listing({
    listingId: f('123'),
    title: f('BMW de prueba'),
    make: f('BMW'),
    powerKw: f(81),
    powerCv: f(110),
    displacementCc: f(1395),
    fuel: f('gasoline'),
    firstRegistration: f({ year: 2010 }),
    explicitEngineCodes: f([{ code: 'N43', excerpt: 'Motor N43', source: 'description' as const }]),
    features: { confort: f(['Techo panorámico']) },
  });
  const checklist = buildVehicleChecklist(analyze(vehicle));
  const engineSection = checklist.sections.find(({ title }) => title.includes('Motor probable'));

  expect(checklist.engineSummary).toContain('N43');
  expect(engineSection?.items).toEqual(expect.arrayContaining([
    expect.objectContaining({ title: 'Inyectores/HPFP/NOx', cost: expect.stringContaining('700-4.000 EUR') }),
    expect.objectContaining({ title: 'Cadena/guias', priority: 'Crítica' }),
  ]));
  expect(checklist.sections.flatMap(({ items }) => items).some(({ detail }) => detail?.includes('Techo panorámico'))).toBe(true);
  expect(checklist.sources).not.toHaveLength(0);
});

it('personalizes generic checks for diesel and automatic transmission', () => {
  const vehicle = listing({ fuel: f('diesel'), transmission: f('Automatik'), mileageKm: f(180000) });
  const checklist = buildVehicleChecklist(analyze(vehicle));
  const items = checklist.sections.flatMap(({ items }) => items);

  expect(items).toEqual(expect.arrayContaining([
    expect.objectContaining({ title: 'Sistema diésel y emisiones' }),
    expect.objectContaining({ title: 'Transmisión y embrague', detail: expect.stringContaining('inserción D/R') }),
    expect.objectContaining({ title: 'Historial verificable', detail: expect.stringContaining('180.000 km') }),
  ]));
});
