# Latchlab

An independently implemented, dcrypt.fun-inspired five-vault puzzle playground. Original Latchlab branding, a responsive three-panel interface, a Three.js vault, and a complete playable practice mode.

## Run locally

Requires Node.js 22+.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

## What works

- Five vaults with 3–7 staged number, cipher, binary, and logic puzzles.
- Manual answers, a deterministic Lab bot, and bring-your-own-key OpenAI / OpenRouter model calls.
- Animated unlocking, swipe / keyboard navigation, stage inspection, activity logs, pause/resume, replay, and confirmed progress reset.
- Device-local progress, strict progress validation, and non-farmable practice scoring.
- Responsive mobile layout, keyboard controls, reduced-motion support, a functional fallback without WebGL, and accessible dialogs.
- Optional browser WebMCP tools for inspecting progress and selecting a vault.

## Deployment

Push to `main` to run the GitHub Actions workflow. In GitHub repository Settings → Pages, select GitHub Actions as the build source. The workflow tests, builds, and deploys `dist/`. Asset paths are relative, so the same build works under the repository subpath, on a custom domain, or with any static host.

You can also import the repository into Vercel or Netlify: build `npm run build`, output directory `dist`. Hash routes require no server rewrite configuration. There are no required environment variables.

WebMCP registration is feature-detected. Native WebMCP execution was unavailable in this environment.

## AI keys

Keys are entered by the visitor, kept only in the live page, and sent directly to the selected provider over HTTPS. They are never persisted or bundled. Only the prompt is sent; generated answers are checked locally. Provider charges, rate limits, browser CORS policies, and model access apply. Provider failure and cancellation paths are covered with mocked requests; live billed API requests are not part of automated verification.

The Lab bot is an algorithmic solver, not an LLM. “Your AI” makes real provider requests when supplied a valid key. No provider requests occur in Lab bot or manual mode.

## Scope and launch boundary

This release is a working **practice game**, not a money-handling platform. Points have no cash value. Progress and answer validation are local and are not resistant to cheating. There is no shared leaderboard, token, wallet authentication, token gating, time-locked cryptography, fee collector, on-chain treasury, or SOL payout service. No contract or custodial private key is included.

A real-rewards deployment needs an operator-owned token and funded vault, server-side authoritative challenge validation and replay protection, wallet-signature verification, rate limiting, durable accounting, and reviewed payout contracts/services. Do not attach real prizes to this client-side scoring system.

The reference site's branding, proprietary backend, and deployed assets are not bundled. The project is not affiliated with dcrypt.fun.

## Verification

`npm test` covers challenge correctness, invalid progress, and scoring. `npm run test:e2e` runs browser checks against the dev server (start `npm run dev` first). Install the browser once with `npx playwright install chromium`.
