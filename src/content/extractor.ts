import type { Confidence, ExplicitEngineCode, ExtractedField, ExtractionSource, Seller, VehicleListing } from '../shared/listing';
import { cleanText, normalizeFuel, parseFirstInteger, parseInteger, parsePrice, parseRegistration } from '../shared/normalization';
import { fieldAliases, stableSelectors, technicalTestIds } from './selectors';

type FieldName = keyof typeof fieldAliases;
interface ResolvedValue { raw: string; source: ExtractionSource; confidence: Confidence; }
const timestamp = () => new Date().toISOString();
const field = <T>(value: T | undefined, raw: string | undefined, source: ExtractionSource, confidence: Confidence, warning?: string): ExtractedField<T> | undefined => value === undefined ? undefined : { value, raw, source, confidence, extractedAt: timestamp(), warning };
const text = (element: Element | null | undefined) => element ? cleanText(element.textContent ?? '') : '';
const first = (document: Document, selectors: readonly string[]) => selectors.map((selector) => document.querySelector(selector)).find(Boolean);

function embeddedString(document: Document, key: string): string | undefined {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [new RegExp(`"${escapedKey}"\\s*:\\s*"([^"]{1,1000})"`), new RegExp(`\\\\"${escapedKey}\\\\"\\s*:\\s*\\\\"((?:(?!\\\\").){1,1000})\\\\"`)];
  for (const script of document.scripts) for (const pattern of patterns) {
    const match = pattern.exec(script.textContent ?? '');
    if (match?.[1]) return cleanText(match[1].replace(/\\u([0-9a-f]{4})/gi, (_, code: string) => String.fromCharCode(Number.parseInt(code, 16))).replace(/\\"/g, '"'));
  }
  return undefined;
}

function embeddedNumber(document: Document, key: string): string | undefined {
  const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  for (const script of document.scripts) {
    const match = new RegExp(`(?:"|\\\\")${escapedKey}(?:"|\\\\")\\s*:\\s*(\\d{1,20})`).exec(script.textContent ?? '');
    if (match?.[1]) return match[1];
  }
  return undefined;
}

function structuredTitle(document: Document): string | undefined {
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) try {
    const parsed: unknown = JSON.parse(script.textContent ?? '');
    const nodes = Array.isArray(parsed) ? parsed : [parsed];
    const vehicle = nodes.find((node) => typeof node === 'object' && node !== null && '@type' in node && /^(car|vehicle|product)$/i.test(String((node as Record<string, unknown>)['@type'])));
    if (vehicle && typeof (vehicle as Record<string, unknown>).name === 'string') return cleanText((vehicle as Record<string, string>).name);
  } catch { /* Ignore malformed page-owned data. */ }
  return undefined;
}

function technicalValues(document: Document): Map<FieldName, ResolvedValue> {
  const values = new Map<FieldName, ResolvedValue>();
  for (const [name, testId] of Object.entries(technicalTestIds) as [FieldName, string][]) {
    const label = document.querySelector(`[data-testid="${testId}"]`);
    const raw = text(label?.nextElementSibling);
    if (raw) values.set(name, { raw, source: 'data-testid', confidence: 'high' });
  }
  for (const technical of stableSelectors.technical.flatMap((selector) => [...document.querySelectorAll(selector)])) for (const label of technical.querySelectorAll('dt, th')) {
    const normalizedLabel = text(label).toLocaleLowerCase();
    const name = (Object.entries(fieldAliases) as [FieldName, readonly string[]][]).find(([, aliases]) => aliases.some((alias) => normalizedLabel.includes(alias)))?.[0];
    const raw = text(label.nextElementSibling);
    if (name && raw && !values.has(name)) values.set(name, { raw, source: 'label-fallback', confidence: 'medium' });
  }
  return values;
}

function descriptionText(element: Element | null | undefined): string {
  if (!element) return '';
  const parts: string[] = [];
  const visit = (node: Node) => {
    if (node.nodeType === node.TEXT_NODE) parts.push(node.textContent ?? '');
    else if (node.nodeType === node.ELEMENT_NODE) { const elementNode = node as Element; if (/^(BR|HR|P|DIV|LI|H[1-6])$/.test(elementNode.tagName)) parts.push('\n'); for (const child of elementNode.childNodes) visit(child); if (/^(P|DIV|LI|H[1-6])$/.test(elementNode.tagName)) parts.push('\n'); }
  };
  visit(element);
  return parts.join('').replace(/[ \t]+/g, ' ').replace(/\n\s*\n+/g, '\n').trim();
}

function unique(items: string[]): string[] { return [...new Set(items.map(cleanText).filter((item) => item.length > 1 && item.length < 120))]; }
function featureGroups(document: Document, description: string): Record<string, ExtractedField<string[]>> {
  const groups: Record<string, ExtractedField<string[]>> = {};
  const listItems = [...document.querySelectorAll('[data-testid="vip-features-list"] > li')].map(text);
  const fallbackText = listItems.length ? [] : text(first(document, stableSelectors.features)).replace(/^(características|merkmale|features)\s*/i, '').replace(/mostrar más|mehr anzeigen|show more/gi, '').split(/[,;•]/);
  const listed = unique([...listItems, ...fallbackText]);
  if (listed.length) groups.characteristics = { value: listed, raw: listed.join(' | '), source: 'data-testid', confidence: 'high', extractedAt: timestamp() };
  const heading = /^(sonderausstattung|ausstattung|außenausstattung|aussenausstattung|innenausstattung|equipment|optional equipment|equipamiento|características)\s*:?(.*)$/i;
  let current: string | undefined; const descriptionGroups: Record<string, string[]> = {};
  for (const line of description.split('\n').map(cleanText).filter(Boolean)) {
    const match = heading.exec(line);
    if (match) { current = cleanText(match[1]).toLocaleLowerCase(); descriptionGroups[current] ??= []; if (match[2]) descriptionGroups[current].push(...match[2].split(/[,;•]/)); continue; }
    if (current && !/^[\p{L}\s]{2,30}:$/u.test(line)) descriptionGroups[current].push(...line.split(/[,;•]/));
    else if (/^[\p{L}\s]{2,30}:$/u.test(line)) current = undefined;
  }
  for (const [name, values] of Object.entries(descriptionGroups)) {
    const normalized = unique(values);
    if (normalized.length) groups[`seller:${name}`] = { value: normalized, raw: values.join(' | '), source: 'semantic-dom', confidence: 'medium', extractedAt: timestamp() };
  }
  return groups;
}

function explicitCodes(title: string, description: string): ExtractedField<ExplicitEngineCode[]> {
  const candidates: ExplicitEngineCode[] = [];
  for (const [source, value] of [['title', title], ['description', description]] as const) for (const match of value.matchAll(/\b(?=[A-Z0-9]{4,12}\b)(?=[A-Z0-9]*\d)(?=[A-Z0-9]*[A-Z])[A-Z]{1,4}\d{2}[A-Z0-9]{1,6}\b/g)) {
    const code = match[0]; if (/^(EURO|E10|CO2)/.test(code)) continue;
    const index = match.index ?? 0; candidates.push({ code, source, excerpt: cleanText(value.slice(Math.max(0, index - 50), index + code.length + 60)) });
  }
  return { value: [...new Map(candidates.map((candidate) => [candidate.code, candidate])).values()], raw: candidates.map(({ code }) => code).join(', '), source: 'semantic-dom', confidence: candidates.length ? 'medium' : 'unknown', extractedAt: timestamp() };
}

function sellerData(document: Document): ExtractedField<Seller> | undefined {
  const name = text(first(document, stableSelectors.seller));
  const type = embeddedString(document, 'enumType');
  const country = embeddedString(document, 'country');
  return name || type || country ? field({ name: name || undefined, type, country }, [name, type, country].filter(Boolean).join(' | '), type || country ? 'embedded-json' : 'data-testid', type || country ? 'high' : 'medium') : undefined;
}

export function extractMobileListing(document: Document, url: string): VehicleListing {
  const values = technicalValues(document); const log: string[] = [];
  const shortTitle = text(first(document, stableSelectors.title));
  const embeddedTitle = embeddedString(document, 'title');
  const titleText = embeddedTitle || structuredTitle(document) || shortTitle || cleanText(document.querySelector('meta[property="og:title"]')?.getAttribute('content') ?? document.title);
  const titleSource: ExtractionSource = embeddedTitle ? 'embedded-json' : shortTitle ? 'data-testid' : 'semantic-dom';
  const embeddedMake = embeddedString(document, 'makeKey'); const embeddedModel = embeddedString(document, 'modelKey');
  const make = embeddedMake || shortTitle.split(/\s+/)[0]; const model = embeddedModel || shortTitle.split(/\s+/).slice(make?.includes(' ') ? 2 : 1).join(' ');
  const variant = embeddedString(document, 'subTitle') || (titleText.startsWith(`${make} ${model}`) ? cleanText(titleText.slice(`${make} ${model}`.length)) : undefined);
  const descriptionElement = first(document, stableSelectors.description); const description = descriptionText(descriptionElement);
  const priceRaw = text(document.querySelector('[data-testid="vip-price-label"]')) || text(document.querySelector('[data-testid="main-price-area"]'));
  const raw = (name: FieldName) => values.get(name)?.raw; const numeric = (name: FieldName) => { const found = values.get(name); return field(parseInteger(found?.raw ?? ''), found?.raw, found?.source ?? 'label-fallback', found?.confidence ?? 'unknown'); };
  const power = raw('power') ?? text(document.querySelector('[data-testid="vip-key-features-list-item-power"]'));
  const embeddedId = embeddedNumber(document, 'id');
  const listingId = embeddedId || url.match(/(\d{8,})/)?.[1] || document.documentElement.innerHTML.match(/(?:id=|\/)(\d{8,})(?:\.|&|\/)/)?.[1];
  const required = ['listingId', 'title', 'make', 'model', 'grossPrice', 'mileageKm', 'powerKw', 'fuel', 'transmission', 'firstRegistration', 'description', 'features', 'seller'] as const;

  const result: VehicleListing = {
    marketplace: 'mobile.de', url,
    listingId: field(listingId, listingId, embeddedId ? 'embedded-json' : 'semantic-dom', embeddedId ? 'high' : listingId ? 'medium' : 'unknown'),
    title: field(titleText || undefined, titleText, titleSource, embeddedTitle ? 'high' : 'medium'), make: field(make || undefined, make, embeddedMake ? 'embedded-json' : titleSource, embeddedMake ? 'high' : 'medium'), model: field(model || undefined, model, embeddedModel ? 'embedded-json' : titleSource, embeddedModel ? 'high' : 'medium'), variant: field(variant, variant, embeddedString(document, 'subTitle') ? 'embedded-json' : titleSource, variant ? 'medium' : 'unknown'),
    grossPrice: field(parsePrice(priceRaw), priceRaw, 'data-testid', priceRaw ? 'high' : 'unknown'), mileageKm: numeric('mileageKm'),
    powerKw: field(parseInteger(power.match(/\d[\d.,]*\s*kW/i)?.[0] ?? ''), power, values.has('power') ? 'data-testid' : 'semantic-dom', power ? 'high' : 'unknown'), powerCv: field(parseInteger(power.match(/\d[\d.,]*\s*(PS|CV)/i)?.[0] ?? ''), power, values.has('power') ? 'data-testid' : 'semantic-dom', power ? 'high' : 'unknown'),
    fuel: field(raw('fuel') ? normalizeFuel(raw('fuel')!) : undefined, raw('fuel'), values.get('fuel')?.source ?? 'label-fallback', values.get('fuel')?.confidence ?? 'unknown'), transmission: field(raw('transmission'), raw('transmission'), values.get('transmission')?.source ?? 'label-fallback', values.get('transmission')?.confidence ?? 'unknown'), firstRegistration: field(parseRegistration(raw('firstRegistration') ?? ''), raw('firstRegistration'), values.get('firstRegistration')?.source ?? 'label-fallback', values.get('firstRegistration')?.confidence ?? 'unknown'),
    owners: numeric('owners'), modelRange: field(raw('modelRange'), raw('modelRange'), values.get('modelRange')?.source ?? 'label-fallback', values.get('modelRange')?.confidence ?? 'unknown'), trim: field(raw('trim'), raw('trim'), values.get('trim')?.source ?? 'label-fallback', values.get('trim')?.confidence ?? 'unknown'), displacementCc: numeric('displacementCc'), co2Gkm: numeric('co2Gkm'), doors: field(parseFirstInteger(raw('doors') ?? ''), raw('doors'), values.get('doors')?.source ?? 'label-fallback', values.get('doors')?.confidence ?? 'unknown'), emissionClass: field(raw('emissionClass'), raw('emissionClass'), values.get('emissionClass')?.source ?? 'label-fallback', values.get('emissionClass')?.confidence ?? 'unknown'), cylinders: numeric('cylinders'), tankLitres: numeric('tankLitres'),
    features: featureGroups(document, description), description: field(description || undefined, description, 'data-testid', description ? 'high' : 'unknown'), seller: sellerData(document), explicitEngineCodes: explicitCodes(titleText, description), extractionLog: log,
  };
  const present: Record<typeof required[number], boolean> = { listingId: !!result.listingId?.value, title: !!result.title?.value, make: !!result.make?.value, model: !!result.model?.value, grossPrice: !!result.grossPrice?.value, mileageKm: result.mileageKm?.value !== undefined, powerKw: result.powerKw?.value !== undefined, fuel: !!result.fuel?.value, transmission: !!result.transmission?.value, firstRegistration: !!result.firstRegistration?.value, description: !!result.description?.value, features: Object.values(result.features).some((group) => group.value?.length), seller: !!result.seller?.value };
  for (const name of required) if (!present[name]) log.push(`missing:${name}`);
  return result;
}
