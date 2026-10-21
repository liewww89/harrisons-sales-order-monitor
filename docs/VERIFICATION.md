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

The final test run after review fixes will be recorded below. “Passed” describes the actual checked conditions, not certification for every device, browser or assistive technology.

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

## Public delivery

- GitHub publication and anonymous access: pending.
- Vercel production deployment, anonymous HTTPS and production-origin CORS: pending.
- Browser interactions against deployment: pending.

## Not verified

Applicant's personal review; actual phones; Safari, Firefox or Edge execution; screen-reader user testing; production API SLA, billing or security audit. None is represented as completed.
