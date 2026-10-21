# UI refinement — 21 October 2026

This is a CSS-only refinement of the completed assessment app. The original delivery record remains in `WORK_LOG.md`; this report describes additional agent work, not applicant manual review.

## Recovery point and scope

- Recorded start: **14:43:48 MYT** (UTC+08:00).
- Clean starting worktree and original main: `b6aabb61dc616f69785831b5a7ced79b806d1978`.
- Dedicated branch: `ui/polish-readability-feedback`.
- No applicable ancestor/project AGENTS.md found. Existing project instructions, components, CSS, scripts and browser configuration were inspected before editing.
- Read the installed React Best Practices, Web Design Guidelines and Taste app-screen guidance; used UI Animation guidance for restrained CSS feedback. No skill was reinstalled or modified, and no dependency/configuration upgrade was made.
- Retained Taste's **Framed sheet** direction, seed **514016143**, with no redraw, new navigation or chart. The screen still answers which orders need attention across branches.

## Changes and reasons

- A quiet neutral order-row hover helps track a row across columns; it does not move the row or imply a clickable action. Hover paint is limited to devices with a fine pointer and hover support.
- Buttons share explicit **160ms** background, border and text-colour transitions. Press feedback and keyboard outlines remain immediate. Primary buttons retain readable contrast when pressed; disabled clear-filters controls no longer resemble active filled buttons.
- Result counts have a small neutral background, filter labels are slightly larger, and nearby spacing is more consistent.
- The table header was already sticky and remains sticky within the existing scroll container. Slightly stronger heading text and scroll padding help orientation.
- On phones, customer name and account use separate lines, clear filters aligns with the right edge, and small filter gaps are reduced. Amounts remain right aligned and unbroken.
- Loading keeps static skeletons and readable text, with a small stationary status dot. Screenshot inspection revealed zero-width metric placeholders on phones; a minimum placeholder width fixes that purely in CSS. There are no looping pulses, financial counter animations or artificial request delays in the app.
- The existing reduced-motion override disables every new transition.

Only `src/styles.css` changes production behaviour. API/types/query/request lifecycle, component semantics, accessible labels, test selectors, existing tests, dependency versions and the lockfile are unchanged. The supplied GET-only API, assessment header, metadata options, global summary/status mapping, currency disclaimer, 300ms search debounce and stale-response guards are preserved.

## Checks actually executed

| Check | Result |
| --- | --- |
| Before-edit Chrome browser suite | **9 passed**, 18.3 seconds. No baseline browser failures. |
| `npm.cmd run typecheck` | Passed. |
| `npm.cmd run lint` | Passed. |
| `npm.cmd test` | **32 passed** across 2 files. |
| `npm.cmd run build` | Passed; rebuilt after the final CSS adjustment. |
| After-edit browser suite | **9 passed**, **18.4 seconds** on the final CSS; an earlier after-edit run also passed in 20.4 seconds. |
| Layout screenshots before/after | Captured and viewed at **1440, 768, 390 and 375px**. No page horizontal overflow or new page errors in the layout probe. |
| Additional Playwright feedback probes | Passed: row hover, immediate press, unchanged row/button geometry, keyboard skip/main/refresh focus, visible 3px outline, sticky header and keyboard PageDown scrolling. |
| Reduced-motion probe | Passed: row and button transition duration is zero; loading text and skeletons remain visible. |
| Phone content checks | Passed at 390/375px with the longest real name in the first 100 API rows (27 characters), then a **111-character, test-only DOM text stress probe**. No saved order data or production response was substituted. Amount and account remain visible. |
| Touch emulation | Passed: a 375px coarse-pointer/touch context does not retain the row hover highlight after tapping. This is browser emulation, not a real-device test. |
| Loading probe | Passed while holding a forwarded real API response; no old rows shown and all metric placeholders have positive width. The hold is test-only. |
| Taste browser inspector | **0 failures, 0 warnings**, 1440/768/390px. Screenshots were also visually inspected. |
| Taste source lint | 0 failures; the existing monospace-ID warning remains, permitted for literal SalesId values by app-screen guidance. |

The existing browser suite covers initial live rows/global statistics, Siti + B20 + Open order, independent filters, clear filters, next/previous and last-page boundaries, empty results, simulated list/metadata failures and retry, slow-response races, keyboard access and responsive layouts. Tests were not weakened, skipped or deleted.

The first additional keyboard probe expected initial Tab order after a preceding mouse test had intentionally focused Refresh. That probe failed because of its setup; it was corrected to start keyboard navigation in a fresh document, then passed. The existing keyboard regression test passed throughout. During CSS review, pressed-state rules were ordered after hover rules to prevent hover from masking press feedback; the final probe verified the actual pressed colour and zero-duration feedback.

Web Interface Guidelines review: `src/styles.css` retains explicit focus outlines, neutral readable status/amount text, explicit transition properties, reduced motion and long-content wrapping. The header stays opaque while sticky. A neutral hover fill follows this refinement's explicit request; no functional or accessibility-label changes were introduced.

## Publication and time

The verified feature branch was fast-forwarded into main and both were pushed without a force push. The UI commit is **`90ab8078b187abc91f6f247efb27970441daf4c9`**. The original recovery point remains reachable in its history; only the subsequent report update is a documentation commit.

Deployment updated only the existing `harrisons-sales-order-monitor` Vercel project, retaining **https://harrisons-sales-order-monitor.vercel.app**. Vercel reported READY on the existing basic build machine, Node 22.x and no deployment protection. No account security settings, hosting plan or paid resources were changed.

Production checks actually executed:

- Anonymous HTTPS: **HTTP 200**.
- Existing complete browser suite against the public URL: **9 passed in 20.1 seconds**. This includes initial loading/rows/global statistics, **Siti + B20 + Open order**, clear filters, next/previous pagination, empty results, retries and stale-response behaviour.
- The additional hover/press/focus/sticky-scroll/reduced-motion/phone-width/touch/loading probes also passed against the public URL with no page errors.
- Downloaded public production CSS and JavaScript and compared both with the tested local production build: **identical SHA-256**.
- CSS `index-Br6zoeal.css`: `1ed55e220f26cfa8923e2b1ad7b9a03c44d27b1390494dd1daedb1735ae0c69f`.
- JavaScript `index-ULa1BEJN.js`: `39a143006b6d7005649ea2cc4ce516bf889e66e5e9d8cc2e6a81f8e24ad668f9`. These JavaScript bytes also match the original delivery, consistent with the CSS-only change.

The prior recorded work was **26 minutes 2 seconds**. Cumulative time is that recorded duration plus this refinement's actual elapsed time; intervening wall-clock time and any unreported applicant work are not invented or counted as known work.

Remaining limits: Chrome browser automation and touch emulation do not replace real-phone, Safari/Firefox/Edge or screen-reader testing. Existing optional filter URL persistence and order details remain deferred. No recruitment form was submitted.

Timing checkpoint before final documentation sync: **2026-10-21 14:57:35 MYT**. Additional measured work: **13m 47s**; recorded cumulative work: **39m 49s**, including setup/inspection, CSS, verification, documentation and deployment. Final documentation commit/push follows this checkpoint. This is within both the approximately 30-minute refinement allowance and cumulative 180-minute assessment limit.
