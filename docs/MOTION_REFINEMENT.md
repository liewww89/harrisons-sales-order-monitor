# Enhanced motion refinement — 21 October 2026

Focused refinement of the existing Enhanced UI. Classic remains the PRIMARY submission and is untouched in this session. Codex performed implementation and checks; applicant personal review is not claimed. No hiring form is submitted.

## Baseline and reproduced cause

- First verified clock: **16:30:01 MYT**, 21 October 2026 (UTC+08:00).
- Workspace `D:\ProjectSean\HarrisonsSalesMonitor-Enhanced`, branch `design/enhanced-ui`, remote `https://github.com/liewww89/harrisons-sales-order-monitor.git`.
- Clean recovery commit: **`1af872babcb457a0df4cfdd8f0fd07555dc5e6c9`**. No unrelated/uncommitted work existed at inspection. No applicable ancestor/project AGENTS.md found.
- Existing Enhanced Vercel linkage was inspected: **`prj_D0JVQW3eKabBr18ZfmwbwGlLAQ3k`**, project `harrisons-sales-order-monitor-enhanced`, scope `liew1`, Node 22.x. Public alias is `harrisons-sales-order-monitor-enhan.vercel.app`. Classic project/source/main are not deployment targets.
- Installed UI Animation instructions and the supplied HTML reference were read. No skill, dependency or animation library was added/upgraded.
- Baseline type checking, lint and **32 unit tests passed**; existing **19 browser tests passed in 38.9s**.
- `scripts/probe-motion-baseline.mjs` forwarded a real company API response but held its delivery for a disclosed slow-network reproduction. All **5 card-enter events fired while skeletons were displayed**. After the hold, there were **0 active card animations**; releasing the response displayed correct values but produced **no additional card entrance**. This confirms the suspected loading/entrance mismatch in the deployed baseline, not just a source-code inference. Evidence is in ignored `artifacts/motion-refinement/baseline.json`.

## Before / after / why

| Before | After | Reason |
| --- | --- | --- |
| All metric cards animate at mount, even with skeletons | `metric-ready` applies only when a real summary is present and loading is false | Loading stays visible; the entrance begins with actual values. Stable card nodes/classes do not restart on hover, focus or unrelated rerenders. |
| 300ms, 7px card entrance; 30ms stagger | **560ms, 16px**, 45ms stagger capped at **180ms** | Clearly visible reference-inspired arrival. Minimum value height preserves layout. Opacity starts at 0.6 and ends at 1; accurate financial values are never counted up. |
| 200ms view / 220ms indicator | **300ms** view / **300ms** indicator | More legible orientation without delaying navigation or keyboard focus. Returning to Overview remounts the view and replays cards once. |
| 550ms donut; passive effect could reveal the complete ring before its first animation frame | **900ms** draw started in a small layout effect before paint | Natural start/intermediate/final draw is visible after real summary availability, without a full-ring flash. |
| 4px lift / 6-degree icon tilt | **6px lift**, soft shadow, **8-degree** tilt | Restores controlled fine-pointer hover feedback. No columns or layout dimensions animate. |
| Ready highlight whenever refresh becomes enabled, including after failures | One-shot **650ms hover sheen** | Visual polish is tied to hover, without implying request success. Pending icon still follows real order/metadata requests only. Press scale remains immediate. |
| 3px explore arrow / 180ms row entrance | **6px arrow**, **240ms row entrance**; legend dot/highlight transitions | Clearer directional and row feedback. Stagger remains bounded, rows retain default cursor. |
| Unhandled Web Animations failure; development StrictMode not enabled | Guard/catch animation startup and preserve underlying final SVG; enable React **StrictMode** | A missing/failed animation engine cannot crash the interface. Development effect replay verifies cancellation ownership. |

Motion review decision: **Approve**, subject to the executed verification below. The longer card/donut durations are explicitly requested, occasional data/view arrivals; they do not block input. Navigation/hover retarget with CSS transitions. Bounded entrances, guarded/cancellable SVG instances, final readable base styles and existing media-query cleanup handle interruption. No new production timers, requestAnimationFrame loop, minimum network wait, perpetual decorative pulse or layout-property transition was added. Natural-frame sampling and waits exist only in QA scripts/tests. CSS and JavaScript independently respect reduced motion, including a preference change during playback. Amounts stay accurate immediately.

## Correctness preserved

`src/api.ts`, `src/types.ts`, `src/query.ts`, `src/useApiResource.ts`, package manifest/lockfile and existing unit tests are unchanged. The company API remains the sole production order source; GET/header authentication, metadata options, API-derived summary/chart, 300ms debounce, page resets, query preservation, timeout, validation, abort/stale ownership, errors/empty states/retry and currency disclaimer remain intact. No prototype dataset/local filtering/simulated refresh is copied.

## Checks

- Final local type checking, lint, **32 unit tests**, production build and browser contract/authentication/CORS checks passed.
- Final local browser suite: **22 passed, 46.3s**, with the original 19 tests retained. The hover assertion updates from the old -4px target to the new -6px target; it is not removed or relaxed.
- Three added tests cover a held real initial response followed by natural rAF observations, stable layout, final amounts, controlled replay, preference change during playback, development StrictMode/single active SVG ownership and an intentionally unavailable animation engine. The existing suite covers rapid navigation/cancellation, refresh failure/retry, metadata failures, search/combined filters, pagination, empty/race states, chart keyboard/touch and measured sticky geometry.
- The first expanded test run had **21 passes / 1 failure**: its first sample assumed the animation had already started, but the observation could precede effect startup. The final test checks peak >90, real intermediate frames, monotonic progression after the peak and final 0; it still requires data-time card entrance and immediately accurate amounts. The pre-paint layout effect also removes the observed full-ring-first frame. The affected three tests passed, then the complete 22-test suite passed.
- `scripts/check-motion-interactions.mjs` passed locally: repeated attempts on a pending disabled Refresh generate only one real order request; 375px coarse-pointer taps leave no stuck card hover or button sheen.
- Natural playback evidence uses **no pause/currentTime/seek/scrub**. `scripts/record-natural-motion.mjs` records real-browser video, wall-clock screenshots and rAF samples with real API data. Screenshot labels are requested offsets; JSON records actual capture completion times, including browser screenshot overhead.

## Production verification

- Only the existing Enhanced project was deployed, after checking its exact ID/name and public aliases. Application commit **`4b6fcd54d73f7f3442d33caa4eae0e39afa436cc`** on `design/enhanced-ui`.
- Deployment **`dpl_4Mt2pgLa8FnecMM8UjJYQnVHJ4cA`** reached READY at the existing public URL: **https://harrisons-sales-order-monitor-enhan.vercel.app/#overview**. Node 22.x, basic plan-default build machine, public access without login. No security setting, hosting plan or paid add-on was changed.
- Complete production browser suite: **22 passed, 43.5s**. Production browser contract/authentication/CORS checks passed, including the live combined query (6 matches). Repeated-pending-refresh and coarse-pointer probes also passed from the production origin.
- Anonymous HTTPS **200**. `scripts/verify-deployment.mjs` confirmed public assets are byte-for-byte identical to the tested build:
  - `index-DmdVGXxx.js`: SHA-256 `b2ff0200e2038ae95e9d3c48b114bddf2ef4821f202d172427cf9451be81a245`.
  - `index-SEFgrFnm.css`: SHA-256 `da892f9d7face2d0ad05497e7e08916826adcd60e467fc0cf66098233345d905`.
- Both views were checked at **1440, 768, 390 and 375px**. Browser tests include no page overflow, all required fields, keyboard/mobile navigation and sticky headers measured after real container scrolling. Additional production screenshots are in ignored `artifacts/motion-refinement/layouts/`.
- [Natural production video](motion/enhanced-motion.webm), [timed frames and actual rAF samples](motion/natural-motion-proof.json). Frames: [first capture](motion/natural-0ms.png), [180ms target](motion/natural-180ms.png), [450ms target](motion/natural-450ms.png), [1050ms target](motion/natural-1050ms.png). Codex inspected the actual natural-playback frames. The first screenshot request completed at 321ms and the last at 1113ms relative to the capture trigger; these are reported honestly rather than claiming exact 0ms screenshots. rAF samples include the genuine start (`opacity=0.6`, translateY=16px, donut offset=100), intermediate values and the final state, with the monetary value always `998,244.30`. Video shows initial load, card hover, refresh-button sheen, view/indicator transitions, replay and legend highlight. No animation was manually scrubbed for this evidence. Page errors: **0**.
- Classic smoke checks passed **2 original real-API browser tests in 5.7s**: initial rows/summary/metadata and search/independent/combined filters/clear. Anonymous HTTP 200 and original JS/CSS hashes remain unchanged. Its original workspace is clean, main remains **`bbcf9bccc5c6068e0efc87590549a524e4c09437`**. No main commit, merge, Classic deployment or Classic hosting change occurred in this session.

Earlier timings in `ENHANCED.md` describe the original delivery, not this refinement. Later commits add this verification record and production media only; no application code changes follow the tested/deployed commit.

## Time and remaining limits

Previous final reported cumulative agent work is **65m15s**. The checked-in original-delivery checkpoint was 64m08s before the documented final publication/source checks; the previous final clock was 16:16:37 MYT, accounting for the following 67 seconds. This session is measured separately from 16:30:01. Unknown applicant work is not invented.

Remaining limits: Chrome desktop automation and browser touch emulation, without physical-phone, other-browser or screen-reader user testing. Network/API caching and availability remain external dependencies. The natural capture observes sampled browser frames, not a guaranteed display refresh rate or a claim of zero bugs.

## Final measured checkpoint

- **2026-10-21 16:42:38 MYT**: this session **12m 37s** from 16:30:01, including baseline/reproduction, implementation, local and production verification, deployment, video/frames and documentation.
- Recorded cumulative agent work: **77m 52s**, adding this measured session to the prior final 65m15s. Final documentation/media commit, push and public-link check follow this checkpoint. The 180-minute cumulative budget is respected; no unreported applicant time is inferred.

