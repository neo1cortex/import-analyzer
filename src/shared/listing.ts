export type Confidence = 'high' | 'medium' | 'low' | 'unknown';
export type ExtractionSource = 'json-ld' | 'embedded-json' | 'data-testid' | 'semantic-dom' | 'label-fallback' | 'inferred' | 'manual';

export interface ExtractedField<T> {
  value?: T;
  raw?: string;
  source: ExtractionSource;
  confidence: Confidence;
  warning?: string;
  extractedAt: string;
}

export interface Price { amountMinor: number; currency: string; }
export interface FirstRegistration { year: number; month?: number; }
export interface Seller { name?: string; type?: string; country?: string; address?: string; rating?: number; reviewCount?: number; }
export interface ExplicitEngineCode { code: string; excerpt: string; source: 'title' | 'description'; }
export interface VehicleListing {
  marketplace: 'mobile.de';
  url: string;
  listingId?: ExtractedField<string>;
  title?: ExtractedField<string>;
  make?: ExtractedField<string>;
  model?: ExtractedField<string>;
  variant?: ExtractedField<string>;
  modelRange?: ExtractedField<string>;
  trim?: ExtractedField<string>;
  grossPrice?: ExtractedField<Price>;
  netPrice?: ExtractedField<Price>;
  mileageKm?: ExtractedField<number>;
  powerKw?: ExtractedField<number>;
  powerCv?: ExtractedField<number>;
  fuel?: ExtractedField<string>;
  transmission?: ExtractedField<string>;
  firstRegistration?: ExtractedField<FirstRegistration>;
  owners?: ExtractedField<number>;
  displacementCc?: ExtractedField<number>;
  co2Gkm?: ExtractedField<number>;
  doors?: ExtractedField<number>;
  emissionClass?: ExtractedField<string>;
  cylinders?: ExtractedField<number>;
  tankLitres?: ExtractedField<number>;
  features: Record<string, ExtractedField<string[]>>;
  description?: ExtractedField<string>;
  seller?: ExtractedField<Seller>;
  explicitEngineCodes: ExtractedField<ExplicitEngineCode[]>;
  extractionLog: string[];
}
