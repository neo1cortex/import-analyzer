import { readFile } from 'node:fs/promises';
import { JSDOM } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { extractMobileListing } from '../src/content/extractor';

const fixture = async (name: string) => new JSDOM(await readFile(new URL(`./fixtures/${name}`, import.meta.url), 'utf8')).window.document;

describe('Mobile.de extractor', () => {
  it.each(['mobile-de.html', 'mobile-es.html', 'mobile-en.html'])('normalizes multilingual stable labels: %s', async (name) => {
    const listing = extractMobileListing(await fixture(name), 'https://www.mobile.de/test');
    expect(listing.mileageKm?.value).toBeGreaterThan(0);
    expect(listing.fuel?.value).toBeTruthy();
    expect(listing.description?.value).toBeTruthy();
    if (name === 'mobile-de.html') expect(listing.features.characteristics?.value).toEqual(['Klima', 'Navi', 'LED']);
    expect(Object.values(listing.features).flatMap((group) => group.value ?? []).some((extra) => /panorama|c[aá]mara|camera|kamera/i.test(extra))).toBe(true);
  });

  it('normalizes English thousands separators exactly', async () => {
    const listing = extractMobileListing(await fixture('mobile-en.html'), 'https://www.mobile.de/test');
    expect(listing.mileageKm?.value).toBe(120000);
    expect(listing.powerKw?.value).toBe(140);
    expect(listing.firstRegistration?.value).toEqual({ year: 2018 });
  });

  it('extracts the supplied Mobile.de capture without relying on CSS classes', async () => {
    const document = new JSDOM(await readFile(new URL('../index_mobile.html', import.meta.url), 'utf8')).window.document;
    const listing = extractMobileListing(document, 'https://www.mobile.de/fixture');
    expect(listing.title?.value).toBe('BMW 320i Limousine MODERN AUTOMATIK PDC SHADOW LEDER');
    expect(listing.listingId?.value).toBe('42205103023744');
    expect(listing.make?.value).toBe('BMW');
    expect(listing.model?.value).toBe('320');
    expect(listing.variant?.value).toContain('i Limousine');
    expect(listing.mileageKm?.value).toBe(107002);
    expect(listing.powerKw?.value).toBe(135);
    expect(listing.powerCv?.value).toBe(184);
    expect(listing.firstRegistration?.value).toEqual({ month: 6, year: 2012 });
    expect(listing.displacementCc?.value).toBe(1998);
    expect(listing.modelRange?.value).toBe('F30');
    expect(listing.trim?.value).toBe('Modern Line');
    expect(listing.co2Gkm?.value).toBe(149);
    expect(listing.doors?.value).toBe(4);
    expect(listing.cylinders?.value).toBe(4);
    expect(listing.tankLitres?.value).toBe(60);
    expect(listing.features.characteristics?.value).toHaveLength(43);
    expect(Object.keys(listing.features).some((name) => name.startsWith('seller:'))).toBe(true);
    expect(listing.description?.value).toContain('N53B25');
    expect(listing.explicitEngineCodes.value?.map(({ code }) => code)).toContain('N53B25');
    expect(listing.seller?.value?.type).toBe('DEALER');
    expect(listing.seller?.value?.country).toBe('DE');
  });
});
