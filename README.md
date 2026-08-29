# Import Analyzer

Local-first Brave/Chromium extension that analyzes a Mobile.de listing opened by the user and prepares an import review for Spain. It uses TypeScript, React, Vite, Tailwind, Manifest V3 and pnpm.

## Privacy and security

- Processing happens locally in the content script and service worker.
- It does not crawl, monitor listings continuously, send data to a server, include API keys, or use paid APIs.
- Results are stored locally in IndexedDB by listing URL. `chrome.storage.local` contains only the last listing URL.
- Marketplace content is handled as text. The UI never injects page HTML.
- Host access is restricted to `www.mobile.de` and `suchen.mobile.de`.

## Permissions

- `storage`: remembers the latest local analysis URL.
- `sidePanel`: displays the compact analyzer alongside the user-opened listing.
- Mobile.de host permissions: loads the content script only on supported listing domains.

## Development

Requires Node.js compatible with Vite and pnpm. Do not use npm, npx, yarn or bun.

```bash
pnpm install
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Load in Brave

1. Run `pnpm build`.
2. Open `brave://extensions`.
3. Enable Developer mode.
4. Select **Load unpacked** and choose the generated `dist` directory.
5. Open a Mobile.de vehicle listing, then open Import Analyzer from the toolbar.

## Architecture

See `docs/architecture.md` for the typed model, extraction priorities and module boundaries. `docs/maintenance.md` documents selector diagnostics, update rules and engine-catalog governance.

## Limits

The PDF distinguishes recommendations from items that require official verification. Engine matches are probabilistic and must be checked against VIN/documentation. Price ranges, import tax and legal status are not calculated or asserted by the extension.
