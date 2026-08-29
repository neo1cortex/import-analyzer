import { expect, it } from 'vitest';
import { getRegistrationTaxBand } from '../src/analysis/registration-tax';

it.each([
  [120, 0, 'text-blue-700'],
  [121, 4.75, 'text-green-700'],
  [159, 4.75, 'text-green-700'],
  [160, 9.75, 'text-orange-700'],
  [199, 9.75, 'text-orange-700'],
  [200, 14.75, 'text-red-700'],
  [201, 14.75, 'text-red-700'],
] as const)('maps %i g/km to its registration-tax band', (co2, rate, colorClass) => {
  expect(getRegistrationTaxBand(co2)).toEqual({ rate, colorClass });
});
