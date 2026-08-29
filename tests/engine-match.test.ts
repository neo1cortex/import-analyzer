import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { expect, it } from 'vitest';
import { identifyProbableEngine } from '../src/analysis/engine-match';
import { extractMobileListing } from '../src/content/extractor';
import type { VehicleListing } from '../src/shared/listing';

const f = <T>(value: T) => ({ value, source: 'manual' as const, confidence: 'high' as const, extractedAt: '' });
const listing = (values: Partial<VehicleListing>): VehicleListing => ({ marketplace: 'mobile.de', url: '', features: {}, explicitEngineCodes: f([]), extractionLog: [], ...values });

it('matches the supplied Mobile.de payload against the JSON database', async () => {
  const document = new JSDOM(await readFile(new URL('../index_mobile.html', import.meta.url), 'utf8')).window.document;
  const result = identifyProbableEngine(extractMobileListing(document, 'https://www.mobile.de/fixture'));

  expect(result.motor_detectado).toMatchObject({ codigo_motor: 'N20B20A', confianza: 'Alta', puntuacion: 100, confirmado: false });
  expect(result.evaluacion_fiabilidad?.fallos_comunes).not.toHaveLength(0);
});

it('resolves a BMW transition-year tie using exact displacement', () => {
  const result = identifyProbableEngine(listing({ make: f('BMW'), model: f('320i'), variant: f('320i F30'), powerKw: f(135), displacementCc: f(1998), fuel: f('gasoline'), firstRegistration: f({ year: 2015 }) }));

  expect(result.motor_detectado).toMatchObject({ codigo_motor: 'B48B20A', confianza: 'Alta', puntuacion: 100, confirmado: false });
  expect(result.motor_detectado?.motivo_coincidencia.join(' ')).toContain('Desempate por cilindrada exacta');
  expect(result.evaluacion_fiabilidad).toMatchObject({ categoria_fiabilidad: 'Alta', puntuacion_riesgo: 'Bajo' });
});

it('awards power only once when both kW and CV match', () => {
  const result = identifyProbableEngine(listing({ make: f('BMW'), powerKw: f(240), powerCv: f(326), displacementCc: f(2998), fuel: f('petrol'), firstRegistration: f({ year: 2018 }) }));

  expect(result.motor_detectado).toMatchObject({ codigo_motor: 'B58B30A', puntuacion: 60, confianza: 'Baja' });
});

it('scores model and chassis independently', () => {
  const result = identifyProbableEngine(listing({ make: f('Mercedes-Benz'), model: f('C 220'), variant: f('C 220 W205'), modelRange: f('W205'), powerCv: f(170), displacementCc: f(2143), fuel: f('diesel'), firstRegistration: f({ year: 2016 }) }));

  expect(result.motor_detectado).toMatchObject({ codigo_motor: 'OM651 DE22LA', puntuacion: 100, confianza: 'Alta' });
});

it('rejects incompatible primary fields and displacement outside five cc', () => {
  const wrongFuel = identifyProbableEngine(listing({ make: f('BMW'), displacementCc: f(1998), fuel: f('diesel') }));
  const wrongDisplacement = identifyProbableEngine(listing({ make: f('BMW'), displacementCc: f(2004), fuel: f('gasoline') }));

  expect(wrongFuel.motor_detectado).toBeNull();
  expect(wrongDisplacement.motor_detectado).toBeNull();
  expect(wrongDisplacement.confianza).toBe('Baja');
});

it('returns null when primary candidates remain tied after exact-displacement comparison', () => {
  const result = identifyProbableEngine(listing({ make: f('BMW'), model: f('320d'), displacementCc: f(1995), fuel: f('diesel') }));

  expect(result.motor_detectado).toBeNull();
  expect(result.motivo_coincidencia.join(' ')).toContain('Empate no resoluble');
});

it('uses synthetic expanded records only as low-confidence family matches', () => {
  const result = identifyProbableEngine(listing({ make: f('BMW'), powerKw: f(81), displacementCc: f(1395), fuel: f('gasoline'), firstRegistration: f({ year: 2010 }), explicitEngineCodes: f([{ code: 'N43', excerpt: 'Motor N43', source: 'description' as const }]) }));

  expect(result.motor_detectado).toMatchObject({ codigo_motor: 'N43', familia: 'N43', confianza: 'Baja', nivel_identificacion: 'Familia probable' });
  expect(result.evaluacion_fiabilidad).toBeNull();
});
