import type { VehicleListing } from '../shared/listing';

export type Severity = 'high' | 'medium' | 'low';
export interface RedFlag { category: string; severity: Severity; language: 'de' | 'es' | 'en'; phrase: string; excerpt: string; location: 'description' | 'technical-data'; confidence: 'explicit' | 'indication'; }

const rules: Array<Omit<RedFlag, 'excerpt' | 'location'> & { pattern: RegExp }> = [
  { category: 'accident-or-damage', severity: 'high', language: 'de', phrase: 'Unfall', confidence: 'explicit', pattern: /\b(unfallwagen|unfallschaden|beschädigt)\b/i },
  { category: 'accident-or-damage', severity: 'high', language: 'es', phrase: 'accidente', confidence: 'explicit', pattern: /\b(accidentado|daños? por accidente|siniestro)\b/i },
  { category: 'accident-or-damage', severity: 'high', language: 'en', phrase: 'accident', confidence: 'explicit', pattern: /\b(accident damage|accident[- ]damaged|salvage)\b/i },
  { category: 'replaced-powertrain', severity: 'medium', language: 'de', phrase: 'Austauschmotor', confidence: 'explicit', pattern: /\b(austauschmotor|austauschgetriebe)\b/i },
  { category: 'replaced-powertrain', severity: 'medium', language: 'es', phrase: 'motor sustituido', confidence: 'explicit', pattern: /\b(motor|caja de cambios) sustitu(id[oa]|ida)\b/i },
  { category: 'replaced-powertrain', severity: 'medium', language: 'en', phrase: 'replacement engine', confidence: 'explicit', pattern: /\b(replacement engine|gearbox replaced)\b/i },
  { category: 'missing-history', severity: 'medium', language: 'de', phrase: 'kein Scheckheft', confidence: 'explicit', pattern: /\b(kein scheckheft|ohne serviceheft)\b/i },
  { category: 'missing-history', severity: 'medium', language: 'es', phrase: 'sin historial', confidence: 'explicit', pattern: /\b(sin historial|sin libro de mantenimiento)\b/i },
  { category: 'missing-history', severity: 'medium', language: 'en', phrase: 'no service history', confidence: 'explicit', pattern: /\b(no service history|without service book)\b/i },
  { category: 'consignment-sale', severity: 'low', language: 'de', phrase: 'im Kundenauftrag', confidence: 'explicit', pattern: /\b(im kundenauftrag|vermittlung)\b/i },
  { category: 'consignment-sale', severity: 'low', language: 'es', phrase: 'por encargo', confidence: 'explicit', pattern: /\b(venta por encargo|por cuenta del cliente)\b/i },
  { category: 'consignment-sale', severity: 'low', language: 'en', phrase: 'on behalf', confidence: 'explicit', pattern: /\b(on behalf of (the )?customer|consignment sale)\b/i },
  { category: 'liability-exclusion', severity: 'medium', language: 'de', phrase: 'unter Ausschluss', confidence: 'explicit', pattern: /\b(unter ausschluss.*gewährleistung|ohne gewährleistung)\b/i },
  { category: 'export-risk', severity: 'low', language: 'de', phrase: 'nur Export', confidence: 'explicit', pattern: /\b(nur export|export bevorzugt)\b/i },
];

function excerpt(text: string, index: number, length: number): string { return text.slice(Math.max(0, index - 70), index + length + 90).replace(/\s+/g, ' ').trim(); }

export function detectRedFlags(listing: VehicleListing): RedFlag[] {
  const description = listing.description?.value ?? '';
  return rules.flatMap((rule) => {
    const match = rule.pattern.exec(description);
    return match ? [{ category: rule.category, severity: rule.severity, language: rule.language, phrase: match[0], excerpt: excerpt(description, match.index, match[0].length), location: 'description' as const, confidence: rule.confidence }] : [];
  });
}

export function detectContradictions(listing: VehicleListing): RedFlag[] {
  const description = listing.description?.value ?? '';
  const flags: RedFlag[] = [];
  if (listing.transmission?.value && /manual|manuell|manual/i.test(listing.transmission.value) && /automatik|automatic/i.test(description)) flags.push({ category: 'technical-contradiction', severity: 'medium', language: 'en', phrase: 'transmission mismatch', excerpt: 'The description mentions an automatic transmission while the technical sheet states manual.', location: 'technical-data', confidence: 'indication' });
  const descriptionCylinders = description.match(/\b([3-8])\s*(?:zylinder|cilindros?|cylinders?)\b/i)?.[1];
  if (descriptionCylinders && listing.cylinders?.value !== undefined && Number(descriptionCylinders) !== listing.cylinders.value) flags.push({ category: 'technical-contradiction', severity: 'high', language: 'de', phrase: `${descriptionCylinders} Zylinder`, excerpt: `La descripción afirma ${descriptionCylinders} cilindros, pero la ficha técnica indica ${listing.cylinders.value}. Puede ser texto copiado; verificar VIN.`, location: 'technical-data', confidence: 'explicit' });
  const descriptionModel = description.match(/\bBMW\s+(\d{3}[a-z]?)\b/i)?.[1];
  if (descriptionModel && listing.model?.value && !canonicalModel(descriptionModel).startsWith(canonicalModel(listing.model.value))) flags.push({ category: 'technical-contradiction', severity: 'high', language: 'de', phrase: `BMW ${descriptionModel}`, excerpt: `La descripción menciona BMW ${descriptionModel}, mientras la ficha anuncia ${listing.make?.value ?? ''} ${listing.model.value}. Verificar documentación y VIN.`, location: 'description', confidence: 'explicit' });
  return flags;
}

function canonicalModel(value: string): string { return value.toLocaleLowerCase().replace(/[^a-z0-9]/g, ''); }
