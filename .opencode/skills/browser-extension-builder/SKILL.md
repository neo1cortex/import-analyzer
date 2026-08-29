---
name: browser-extension-builder
description: Build, modify, debug, or review the EU Car Import Analyzer browser extension for Brave and Chrome using Manifest V3, React, TypeScript, Vite, Tailwind CSS, lucide-react, and pnpm.
compatibility: opencode
metadata:
  project: eu-car-import-analyzer
  platform: brave-chrome
---

# Browser Extension Builder

## When to use

Use this skill whenever the user asks to:

- create or modify the browser extension;
- configure Manifest V3;
- work on the popup, side panel, service worker, or content scripts;
- install or update frontend dependencies;
- build, test, debug, or refactor the extension;
- add local persistence;
- prepare the unpacked extension for Brave or Chrome.

## Mandatory stack

- Package manager: pnpm only.
- Never execute npm, npx, yarn, or bun.
- React with TypeScript.
- Vite as bundler.
- Tailwind CSS.
- lucide-react for icons.
- Manifest V3.
- chrome.storage.local for preferences.
- IndexedDB for saved analyses and larger structured records.

## MVP architecture

The MVP must run locally as a browser extension.

Do not introduce:

- FastAPI;
- SQLAlchemy;
- a remote database;
- server-side scraping;
- Playwright;
- stealth plugins;
- proxies;
- CAPTCHA handling;
- paid APIs.

A backend may only be added when the user explicitly starts the backend phase.

## Browser compatibility

The extension must work in Brave and Chromium-based Chrome.

Do not use Brave-specific APIs unless:

1. the user explicitly requests them; and
2. a Chromium-compatible fallback exists.

## Permissions

Use the minimum Manifest V3 permissions necessary.

Prefer:

- activeTab;
- scripting;
- storage;
- sidePanel, only if the chosen UI requires it.

Do not request broad host access unless it is necessary.

Restrict host permissions to the supported marketplace domains.

Explain every permission added to manifest.json.

## Development workflow

Before modifying code:

1. Inspect the existing repository.
2. Read package.json, pnpm-workspace.yaml, manifest files, and TypeScript configuration.
3. Identify the current implementation phase.
4. Describe the affected files briefly.
5. Modify only files needed for the requested task.

After modifying code:

1. Run the appropriate pnpm typecheck command.
2. Run the appropriate pnpm test command when available.
3. Run the production build.
4. Fix errors introduced by the changes.
5. Report the commands executed.
6. List modified files.
7. Explain unresolved warnings.

Never claim that the build works unless the build command completed successfully.

## Code quality

- Enable strict TypeScript.
- Avoid any unless there is a documented reason.
- Keep extraction, calculation, storage, and UI logic separate.
- Validate untrusted data crossing browser contexts.
- Use typed messages between content scripts, service workers, and UI.
- Avoid excessively large React components.
- Add tests for business-critical logic.

## Security

Treat marketplace page content as untrusted input.

Never:

- execute code obtained from the page;
- insert untrusted HTML using dangerouslySetInnerHTML;
- log personal information unnecessarily;
- include secrets or API keys in the extension;
- load remotely hosted executable code;
- bypass anti-bot controls.

## Scope control

Implement one phase at a time.

Do not continue into a later phase unless requested.

When requirements are ambiguous, prefer the simplest local implementation that preserves future extensibility.