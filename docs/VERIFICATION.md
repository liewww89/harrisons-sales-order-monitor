# Verification record

Date: 21 October 2026 (MYT, UTC+08:00). All checks below were executed by Codex unless explicitly marked pending. No applicant manual review is claimed.

## Executed local checks

| Command/check | Actual result |
| --- | --- |
| Node/npm/Git | 22.23.2 / 10.9.8 / 2.51.0.windows.1 |
| `npm.cmd install` | Initial peer-resolver crash; resolved by compatible dependency selections. Subsequent install succeeded; 0 reported vulnerabilities. |
| `npm.cmd run check:contract` | Passed in installed Google Chrome from `http://127.0.0.1:5173`, normal browser security, direct authenticated cross-origin fetches. |
| `npm.cmd run typecheck` | Passed. |
| `npm.cmd run lint` | Passed. |
| `npm.cmd run build` | Passed; static Vite output created in `dist/`. |
| `npm.cmd test` | 2 files, 32 tests passed. |
| `npm.cmd run test:e2e` | 9 tests passed in 18.2 seconds on the initial full local run. |
| Taste source lint | 0 failures, 1 warning for monospace IDs. Allowed by the app-screen rules for literal order identifiers. |
| Taste browser inspector, 1440/768/390px | 0 failures, 0 warnings. |
| Codex screenshot inspection | Viewed desktop, tablet and mobile fold screenshots. Table alignment, visible status text, compact global overview and mobile field preservation checked. |
| Responsive browser assertions | No page horizontal overflow at 1440, 1024, 768, 390 and 375px. Required row fields visible at every width. |
| Keyboard/reduced motion | Skip link and main focus tested; labelled controls and reduced-motion CSS present; browser set to reduced motion. |

After review fixes, the local build, lint and type checking passed again, all 32 unit tests passed, and all 9 browser tests passed again in 22.8 seconds. “Passed” describes the actual checked conditions, not certification for every device, browser or assistive technology.

## API observations

- API version 1.1.0; readOnly=true; allowed methods GET/OPTIONS.
- 1,200 fictional orders; primary key SalesId.
- All-orders summary: total 1,200; open 420; invoiced 360; delivered 300; cancelled 120; value 998244.3.
- Status/site/combined/empty terminal requests confirmed that only filtered_orders changes in the summary.
- Browser combined q=Siti, site=B20, status=Open order: 6 matches; empty search: 0 matches; unfiltered page size 25: 48 pages.
- Authentication header x-assessment-key accepted from the browser. CORS allowed the local app origin and custom header.
- Exact customer/site/date/amount mappings are documented in README. No currency/scale contract was supplied in the observed responses.
- Production client issues GET only. No write request was sent to the assessment API.

## Browser test coverage

1. Initial rows, global dashboard, facet option counts and pagination match live API.
2. Search debounces intermediate input and keeps global statistics global.
3. Branch and status independently, then combined with search; clear filters.
4. Page 2 data/range, reset for search/branch/status, last-page boundary and previous page.
5. Empty state, zero result range, disabled boundaries and clear filters.
6. Simulated list HTTP 503, no substitute rows, then real-API retry.
7. Simulated metadata HTTP 503, dependent controls disabled, independent retry.
8. A delayed real response cannot overwrite newer search state/rows/counts.
9. Keyboard access, five viewport widths, visible required row fields and reduced-motion setting.

Simulations are limited to tests. The race interception forwards a real API response and delays it; failure interceptions return HTTP 503 with no order records. Test-only unit examples and mocks never enter the production bundle.

## Interface guideline review

Reviewed App, Dashboard, OrderTable, Feedback and styles against the current [Vercel Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md). Labels, button semantics, skip link, async live regions, focus outlines, Intl formatting, long-name wrapping, status text and reduced motion are implemented. Review added an explicit accessible name to the mobile refresh control and disabled translation of the brand. Sentence case follows the task/Taste app-screen style; optional URL persistence was consciously deferred.

- `src/App.tsx:68` — fixed: explicit accessible name for refresh at mobile icon size.
- `src/App.tsx:58` — fixed: brand translation disabled.
- `src/styles.css:107` — allowed: monospace is limited to literal sales-order identifiers, as permitted by the Taste app-screen reference.

## Public delivery

- GitHub: https://github.com/liewww89/harrisons-sales-order-monitor — created and pushed; repository page and raw App.tsx both returned anonymous HTTP 200. GitHub API confirms private=false.
- Vercel: https://harrisons-sales-order-monitor.vercel.app — new project deployed on Hobby/basic resources. Anonymous HTTPS returned HTTP 200 at the production host, without login or a protection bypass.
- Removed inherited SSO protection only from this newly created assessment project; existing account/team defaults and unrelated projects were preserved. Pinned the project and package to Node 22.x for reproducibility.
- Final Node-22 production deployment: READY, production target, basic 2-core / 8GB build machine, no deployment protection. Node-22 build/type checking completed successfully.
- `APP_URL=https://harrisons-sales-order-monitor.vercel.app npm run check:contract`: passed from the production origin in real Chrome with normal browser security; authentication, CORS, metadata, global summary, combined filters and empty results verified.
- `APP_URL=https://harrisons-sales-order-monitor.vercel.app npm run test:e2e`: all 9 browser tests passed in 21.9 seconds. The same real-API comparisons, main interactions, simulated failures/retries, response-race and layout checks executed on the public app.
- Final anonymous production request after browser tests: HTTP 200; expected page title; no login redirect.
- Source and deployed runtime match. The final documentation-only commit records these results and does not change the deployed application bundle.
- Downloaded the public production JavaScript and compared SHA-256 with the tested local production output: identical (`index-9UPEWfEU.js`, SHA-256 `39a143006b6d7005649ea2cc4ce516bf889e66e5e9d8cc2e6a81f8e24ad668f9`).

## Not verified

Applicant's personal review; actual phones; Safari, Firefox or Edge execution; screen-reader user testing; production API SLA, billing or security audit. None is represented as completed.

## Subsequent UI refinement — 21 October 2026

The original delivery results and bundle hash above are historical. The CSS-only refinement has its own recovery point, before/after checks, production verification and time record in [UI_POLISH.md](UI_POLISH.md). Existing automated tests and the API contract are preserved; no applicant manual review is claimed.
