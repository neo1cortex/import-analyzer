# Maintenance

## Field extraction log

`VehicleListing.extractionLog` contains only field keys that could not be extracted, such as `missing:mileageKm`. It deliberately excludes seller text, addresses, phone numbers and other personal data. Use it to decide which selector needs a regression fixture; do not transmit it automatically.

## Selector updates

1. Save a sanitized fixture with no unnecessary seller data.
2. Add a failing test reproducing the changed DOM.
3. Prefer JSON-LD, embedded state, `data-testid`, semantic elements and aliases, in that order.
4. Do not add generated CSS classes as selectors.
5. Run `pnpm lint`, `pnpm typecheck`, `pnpm test` and `pnpm build`.

## Engine catalogue updates

Update `src/engines/catalog.ts` as a reviewed data change: increase `engineCatalogVersion`, keep compatible vehicle constraints, cite a public source, add the review date, and test inference confidence. An inferred engine remains unconfirmed until VIN, manufacturer documentation or physical inspection verifies it.

## Known TODOs

- Add multiple verified engine records before treating the catalogue as broad coverage.
- Add a user-controlled manual field editor when extraction confidence is low.
- Verify legal/import requirements against official Spanish sources at the time of import; this extension does not provide legal or tax advice.
