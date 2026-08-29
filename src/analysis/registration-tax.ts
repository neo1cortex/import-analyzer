export interface RegistrationTaxBand {
  rate: 0 | 4.75 | 9.75 | 14.75;
  colorClass: string;
}

export function getRegistrationTaxBand(co2Gkm: number): RegistrationTaxBand {
  if (co2Gkm <= 120) return { rate: 0, colorClass: 'text-blue-700' };
  if (co2Gkm <= 159) return { rate: 4.75, colorClass: 'text-green-700' };
  if (co2Gkm <= 199) return { rate: 9.75, colorClass: 'text-orange-700' };
  return { rate: 14.75, colorClass: 'text-red-700' };
}
