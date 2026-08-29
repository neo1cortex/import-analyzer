# Import Analyzer architecture

## Scope and privacy

Import Analyzer is a local-first Manifest V3 extension for listings manually opened by the user on `mobile.de`. It does not crawl listings, send listing data to a server, use remote executable code, or include API keys. Page data is treated as untrusted input and is rendered as text only.

## Extension flow

1. The content script waits for a bounded period for listing content and observes only while the user opens the analyzer.
2. It extracts a `VehicleListing` using JSON-LD first, embedded state second, stable `data-testid` attributes third, semantic DOM fourth, and translated labels last.
3. The service worker validates typed messages, runs local analysis, and persists a record keyed by listing URL and identifier in IndexedDB.
4. The side panel is the primary interface. The popup opens the side panel and provides a concise status fallback.
5. The UI displays missing values explicitly, never assumes that a missing field is false, and generates the AI prompt and local PDF on demand.

## Source contract

Every extracted value is represented by:

```ts
type Confidence = 'high' | 'medium' | 'low' | 'unknown';
type Source = 'json-ld' | 'embedded-json' | 'data-testid' | 'semantic-dom' | 'label-fallback' | 'inferred' | 'manual';

interface ExtractedField<T> {
  value?: T;
  raw?: string;
  source: Source;
  confidence: Confidence;
  warning?: string;
  extractedAt: string;
}
```

`VehicleListing` contains identity, prices in integer minor currency units, technical data, grouped features, seller and rating, and the original description. Dates are ISO-compatible (`YYYY-MM` when only month/year exists), distance is kilometres, CO2 is g/km, and kW/CV retain separately stated values.

## Modules

- `src/shared`: types, message schemas, normalization, selector registry and field extraction log.
- `src/content`: bounded page readiness and Mobile.de extraction only.
- `src/analysis`: independent multilingual red-flag rules, contradiction checks, compact summary and engine matching.
- `src/engines`: versioned local European engine knowledge records with sources and review dates.
- `src/background`: message routing, side-panel activation and IndexedDB persistence.
- `src/ui`: React side-panel and popup, accessible states, prompt and PDF actions.
- `tests/fixtures`: sanitized Mobile.de HTML fixtures for ES, DE and EN.

## Resilience and maintenance

Selectors, translated aliases and normalizers are centralized. Extraction diagnostics record absent fields and failed selector paths locally, without seller personal data. Selector updates require adding a fixture regression test. Engine records are independently versioned and must include source URLs and a review date; inferred matches remain explicitly unconfirmed and require VIN or documentation verification.

## Planned validation

Unit tests cover normalization, each extraction priority, multilingual descriptions, risk rules, contradictions and engine confidence. An integration test uses the supplied `index_mobile.html`. `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build` are run after implementation phases.
