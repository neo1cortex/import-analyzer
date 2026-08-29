export function cleanText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function parseNumber(value: string): number | undefined {
  const token = value.match(/-?\d[\d.,\s]*/)?.[0]?.trim();
  if (!token) return undefined;
  const compact = token.replace(/\s/g, '');
  const separators = [...compact.matchAll(/[.,]/g)];
  const lastSeparator = separators.at(-1)?.index;
  const decimal = lastSeparator !== undefined && compact.length - lastSeparator - 1 !== 3;
  const normalized = decimal
    ? `${compact.slice(0, lastSeparator).replace(/[.,]/g, '')}.${compact.slice(lastSeparator + 1)}`
    : compact.replace(/[.,]/g, '');
  const number = Number(normalized);
  return Number.isFinite(number) ? number : undefined;
}

export function parseInteger(value: string): number | undefined {
  const number = parseNumber(value);
  return number === undefined ? undefined : Math.round(number);
}

export function parseFirstInteger(value: string): number | undefined {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : undefined;
}

export function normalizeFuel(value: string): string {
  const lower = value.toLocaleLowerCase();
  if (/electric|eléctric|elektr/.test(lower)) return 'electric';
  if (/plug.?in|enchufable/.test(lower)) return 'plug-in-hybrid';
  if (/hybrid|híbrido/.test(lower)) return 'hybrid';
  if (/diesel/.test(lower)) return 'diesel';
  if (/benzin|gasolina|petrol/.test(lower)) return 'gasoline';
  if (/lpg|autogas|glp/.test(lower)) return 'lpg';
  return cleanText(value).toLocaleLowerCase();
}

export function parsePrice(value: string): { amountMinor: number; currency: string } | undefined {
  const amount = parseNumber(value);
  if (amount === undefined) return undefined;
  const currency = /(?:€|eur)/i.test(value) ? 'EUR' : /(?:\$|usd)/i.test(value) ? 'USD' : undefined;
  return currency ? { amountMinor: Math.round(amount * 100), currency } : undefined;
}

export function parseRegistration(value: string): { year: number; month?: number } | undefined {
  const match = value.match(/(?:^|\D)(0?[1-9]|1[0-2])[/. -](19\d{2}|20\d{2})(?:\D|$)|(?:^|\D)(19\d{2}|20\d{2})(?:\D|$)/);
  if (!match) return undefined;
  return match[3] ? { year: Number(match[3]) } : { month: Number(match[1]), year: Number(match[2]) };
}
