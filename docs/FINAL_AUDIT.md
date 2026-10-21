# Final requirements audit — 21 October 2026

Classic is the **PRIMARY assessment submission**. Enhanced is an **OPTIONAL alternative**. This is an agent-executed audit, not an attestation of applicant personal effort/review or zero bugs. The recruitment form is not submitted.

## State, recovery and scope

- Audit first verified clock: **16:50:16 MYT**, 21 October 2026 (UTC+08:00).
- Original Classic directory `D:\ProjectSean\HarrisonsSalesMonitor` is clean on `ui/polish-readability-feedback` at `3bc82a511901f77638e3ee19af399c0875afb84d`. It was not switched or edited. The existing main worktree is `D:\ProjectSean\HarrisonsSalesMonitor-Docs`; **Classic main recovery is `bbcf9bccc5c6068e0efc87590549a524e4c09437`**. Its application/package/config source was identical to the original Classic directory at inspection. The main worktree is used for Classic fixes and checks.
- Enhanced worktree `D:\ProjectSean\HarrisonsSalesMonitor-Enhanced`, branch `design/enhanced-ui`, clean recovery **`bd56ceac54f49ec65f547e214f6c470fff44ef57`**.
- Both remotes are `https://github.com/liewww89/harrisons-sales-order-monitor.git`. No applicable ancestor/project AGENTS.md found. Existing source, scripts, tests, README, submission notes and verification/handover records were inspected. Installed React Best Practices, Web Interface Guidelines and existing motion guidance were used; no skill or dependency was upgraded. Main worktree dependencies were installed from its unchanged lockfile with `npm ci`.
- Classic project **`prj_2S0f8e83DiQRZDiNzVfjrZDGK1Ht`** owns `harrisons-sales-order-monitor.vercel.app`. Enhanced project **`prj_D0JVQW3eKabBr18ZfmwbwGlLAQ3k`** owns `harrisons-sales-order-monitor-enhan.vercel.app`. Both were inspected as separate Node 22.x projects, without Git integration (`link: null`). Project environment-variable names were inspected without printing values.
- No reset, clean, force push, branch switch in the wrong worktree, cross-version application merge, account-security change, paid upgrade or recruitment submission is used.

## Requirements matrix — both versions

| Requirement | Classic evidence | Enhanced evidence | Executed verification | Classic / Enhanced |
| --- | --- | --- | --- | --- |
| Five dashboard figures | `Dashboard` + `dashboardCounts` | Same API-derived mapping | Fresh list/summary comparison; changed 1,500 and zero datasets | Pass / Pass |
| SalesId, customer, site, date, status, amount | Semantic `OrderTable`; phone labels | Table/card rows and order preview | Fresh first rows/amounts; required fields at narrow widths | Pass / Pass |
| Search and combined filters | Controlled state, URLSearchParams, metadata facets | Same query/resource logic, retained across views | Live customer search, special/reserved/unicode input, independent and combined filters, clear/reset | Pass / Pass |
| API pagination and data-size changes | API totals/pages; valid-range buttons | Same | Page/last boundaries; 1,500→60 pages; 20-row shrink recovery | Pass / Pass after fix |
| Loading, empty and errors | Independent list/metadata states, retry | Same plus data-ready entrances | Slow/old response, HTTP 401/403/500/503, network, actual timeout, invalid JSON/schema, empty/zero | Pass / Pass |
| Responsive and keyboard interface | Labels, skip link, focus, scroll/table/card layouts | Same plus visible mobile navigation and textual chart legend | 1440/768/390/375px, long names/large amounts, focus and actual sticky-scroll geometry | Pass / Pass |
| Public delivery/source/docs | Primary URL/main/README/SUBMISSION | Separate optional URL/branch/README/motion record | Anonymous HTTP/source branches/screenshots; production API/browser checks | Pass / Pass |
| Enhanced navigation and motion | Not applicable | Hash views, ready-only cards, cancellable SVG, reduced motion | Direct links/reload/back, slow initial response, replay, keyboard/touch, cancellation/failure fallback | Not applicable / Pass |
| Physical phones / other engines / screen reader users | No attestation | No attestation | Chrome automation and touch emulation only | Not tested / Not tested |

This matrix combines current executed baseline/targeted results. Final complete-suite/build/deployment results are recorded below when completed.

## Fresh real API observations

Authenticated requests used **GET only**, with `x-assessment-key: hssb-assessment-mock-2026`, to the supplied base `https://hiring.harrisons.my/api/mock/sales-orders`. No write request or alternative order source was used.

- `/meta`: API 1.1.0, readOnly true, allowed GET/OPTIONS; `SalesId` primary key; numeric `dataset.rows`; facet entries have string `value` and numeric `count`. Current observed dataset is **1,200**, eight sites (A10/B20/C30/D40/E50/KK01/SDK02/TWU03), and Cancelled/Delivered/Invoiced/Open order statuses. These are observations, not application constants.
- List: numeric page/pageSize/total/totalPages; `summary.total_orders`, `filtered_orders`, `open_orders`, `invoiced_orders`, `delivered_orders`, `cancelled_orders`, `total_order_value`; `data` rows preserve original IDs, customer/account strings, site/status strings, ISO date and numeric amount. First observed row: SO-MOCK-00001, Siti Mart Sdn Bhd, B20, `2026-09-30T03:07:00Z`, Open order, **162.35**. The single-order endpoint returned the same identifier/status/amount.
- Current unfiltered observations: **1,200** total, **48** pages at 25, **420** open, **360** invoiced + **300** delivered = **660** completed, **120** cancelled, value **998,244.30**.
- Fresh `q=Siti&site=B20&status=Open order`: **6** matches. Its summary totals/value remain global; only `filtered_orders` changes. An unmatched search returns total 0, data [], totalPages 1, while global summary remains unchanged.
- A real `page=9999&pageSize=25` GET returned HTTP 200 with page 9999, totalPages 48 and empty data. The server does not clamp a now-invalid requested page. This corroborates the shrinking-dataset edge case.
- Metadata/list responses advertise **`Cache-Control: public, max-age=60`**; observed Age was 0 on this sample. Single-order response advertises `public, must-revalidate, max-age=0`. Cache headers do not guarantee immediately fresh source data.
- Production source inspection found a single native-fetch order client using the company URL and GET/header. There is no generated dataset, fallback backend, polling or WebSocket. Monetary values retain the original decimal scale; currency remains unspecified.

## Confirmed defect and smallest fix

**Trigger:** load a valid larger dataset, navigate to page 2, then refresh after it shrinks to 20 records. The server-shaped response retains requested page 2 but now reports one total page and zero rows.

**Before:** runtime pagination validation correctly refuses the inconsistent displayed range, but Retry repeats page 2; pagination is disabled without valid data and Clear filters is disabled if no filter is active. Both deployed baselines reproduced the missing recovery action in browser interception tests.

**After:** only later-page order errors label their recovery button **Return to first page**. It preserves current filters and requests page 1. Page-1 errors keep ordinary Retry; metadata retry is unchanged. Classic changes only `App.tsx` and an optional `retryLabel` in `Feedback.tsx`; Enhanced applies the same small correction to its order view and preview. No API client, validator, query encoding, data source, design or approved motion changed.

The new browser test verifies 1,500 records / 60 pages, page 2, shrink to 20, explicit recovery, then page 1 of 1 with 20 actual simulated rows. This is a **test-only data-change simulation**, not a modification of the company dataset.

The read-only contract QA script also removes its old 1,200/48 assumptions and validates numeric dataset size and pagination arithmetic. Production already derives these dynamically; no production total/page constant was found.

## Current checks and test disclosure

- Baseline rerun: both versions passed type checking, lint, **32 unit tests each** and production build. Original deployed Classic browser suite **9 passed (20.0s)**; deployed Enhanced browser suite **22 passed (53.0s)**.
- Both deployed baselines failed the newly added shrink-recovery scenario before the fix; this was the confirmed defect, not hidden by the old passing suites.
- After the minimal fix, new targeted audit cases passed locally: **12 each**, then the added long-content/sticky/focus check passed **1 each**. Original assertions were not deleted, skipped or relaxed.
- `tests/audit.spec.ts` is an identical, test-only cross-version suite. Successful integration uses fresh real API responses. Interception is explicitly limited to HTTP/network/timeout/invalid responses and internally consistent changed-data cases. The 1,500-order response has 500 open, 450 invoiced, 400 delivered, 150 cancelled and value 150,000.00 (100 per record); 25-row pages and unique synthetic IDs are generated only inside tests. Zero and unknown-status residual cases are also test-only.
- The actual client timeout was exercised by holding the browser route until its **15-second AbortSignal timeout** fired; a retry then used the real API. No test changes the production timeout or introduces a production wait.
- Existing tests continue to cover debounce, stale-response ownership, page resets/last boundaries, independent metadata failure/retry and Enhanced motion. Additional checks measure sticky header/container position after a 220px real scroll and stress customer names/amount text without persisting probe text as orders.

Final local validation after the application fix:

| Check | Classic main | Enhanced |
| --- | --- | --- |
| Type checking | Pass | Pass |
| ESLint | Pass, 0 findings | Pass, 0 findings |
| Unit tests | **32 passed** | **32 passed** |
| Production build | Pass | Pass |
| Complete browser suite | **22 passed, 51.1s**, origin `http://127.0.0.1:5175` | **35 passed, about 1.3m**, origin `http://127.0.0.1:5174` |
| Browser API contract/auth/CORS | Pass | Pass |

The Classic test origin explicitly uses `APP_URL=http://127.0.0.1:5175` so it targets the actual main worktree server, not the old unchanged directory/server. Enhanced uses its existing 5174 server. No required assertions were removed or skipped. Both existing original suites and all added audit scenarios ran in each complete suite. Production fix verification follows deployment; no further application change is planned.

## Freshness, limitations and submission guidance

Both apps fetch metadata and a first list page at load, fetch orders when query/page changes, and issue real refetches on Refresh/Retry. **An idle page can retain its previous response until another fetch occurs.** Upstream 60-second caching may still return the same payload. The displayed time means response receipt, not source modification. No polling, sockets or fake freshness promise was added.

The 1,500-order data-only test demonstrates that totals, status counts, value, pagination and Enhanced chart adapt without a code edit/redeployment. A future dataset shrink can now be recovered using Return to first page. Global overview summary remains distinct from filtered count. Currency/scale and the assessment's completed-status grouping remain subject to API/business documentation.

Submit Classic: **https://harrisons-sales-order-monitor.vercel.app/**. Source: **https://github.com/liewww89/harrisons-sales-order-monitor** (`main`). Enhanced is optional: **https://harrisons-sales-order-monitor-enhan.vercel.app/**, source branch `design/enhanced-ui`.

Read `SUBMISSION.md` for the five English form answers, `docs/HANDOVER.md` for the Chinese data-flow explanation/interview preparation, this current audit for verification, and the corresponding README for run/API notes. Review the answers personally before pasting; AI assistance is substantial and disclosed. Historical logs remain historical; no personal review/time is inferred from them. No form is submitted.

Not tested: physical phones, Safari/Firefox/Edge execution, screen-reader user testing, API SLA or independent security/billing certification. Chrome viewport/touch simulation does not replace those. No zero-bug guarantee is made.

Prior **78m27s** is a historical reported agent-work total. This audit is measured separately from 16:50:16 MYT; unknown applicant manual time is not invented.
