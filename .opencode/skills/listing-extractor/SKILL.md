---
name: listing-extractor
description: Create, modify, test, or review vehicle listing extractors for Mobile.de and AutoScout24 inside the EU Car Import Analyzer browser extension.
compatibility: opencode
metadata:
  project: eu-car-import-analyzer
  domain: vehicle-listings
---

# Vehicle Listing Extractor

## When to use

Use this skill when working on:

- Mobile.de extraction;
- AutoScout24 extraction;
- content scripts;
- vehicle field normalization;
- red-flag detection;
- engine-code detection;
- extraction confidence;
- fixtures or tests created from listing pages.

## Extraction boundary

Only extract data from a marketplace page voluntarily opened by the user.

Do not:

- crawl search results automatically;
- enumerate marketplace listings;
- perform remote scraping;
- circumvent access restrictions;
- bypass CAPTCHA or anti-bot systems;
- continuously monitor pages without explicit user action.

## Extraction priority

Attempt extraction in this order:

1. JSON-LD structured data.
2. Embedded application state or serialized JSON.
3. Semantic attributes and stable field labels.
4. Visible DOM text.
5. Site-specific CSS selectors as a fallback.
6. Manual user entry when certainty is insufficient.

Do not rely exclusively on dynamically generated CSS class names.

## Output contract

Every extracted field must contain:

- normalized value;
- original raw value when useful;
- extraction source;
- confidence level;
- optional warning;
- timestamp.

Use the following confidence levels:

- high;
- medium;
- low;
- unknown.

## Required vehicle fields

Attempt to extract:

- source marketplace;
- listing URL;
- listing identifier;
- title;
- make;
- model;
- variant;
- gross price;
- net price;
- currency;
- first-registration month and year;
- mileage in kilometres;
- power in kW;
- power in CV;
- CO2 emissions in g/km;
- fuel type;
- transmission;
- seller type;
- seller country;
- description;
- optional equipment;
- detected warning phrases;
- explicit engine codes;
- inferred engine candidates.

## Normalization

- Store monetary values as integer minor units where practical.
- Preserve original currency.
- Normalize mileage to kilometres.
- Preserve explicitly provided kW and CV values.
- Do not convert power destructively.
- Store dates in an unambiguous ISO-compatible format.
- Preserve the original text used to produce a warning.

## Engine detection

An engine code found explicitly in the advertisement may be marked as detected.

An engine code derived from model, year, displacement, or power must be marked as inferred.

Never present an inferred engine code as confirmed.

State that the exact engine should be verified through VIN, documentation, manufacturer records, or physical inspection.

## Red flags

Maintain multilingual warning dictionaries separately from extraction logic.

Each red flag should include:

- matched phrase;
- language;
- normalized category;
- severity;
- source text;
- location in the listing when available.

Do not classify a vehicle as damaged solely because a keyword appears in an unrelated context.

## Testing

Prefer sanitized HTML or JSON fixtures.

Each supported marketplace should have tests for:

- a normal listing;
- missing fields;
- gross and net price ambiguity;
- different number formats;
- multilingual descriptions;
- warning phrases;
- inferred versus explicit engine codes;
- changed or absent selectors.

No fixture should contain unnecessary personal seller information.