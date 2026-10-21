# Enhanced alternative UI — delivery record

Classic remains the **PRIMARY assessment submission**. Enhanced is an **ALTERNATIVE UI** in the same public repository. This record is written by Codex; it does not claim applicant manual review. The recruitment form has not been submitted.

## Isolation and recovery

- First verified session clock: **21 October 2026, 15:51:55 MYT** (UTC+08:00).
- Original workspace: `D:\ProjectSean\HarrisonsSalesMonitor`; clean at inspection; checked-out branch `ui/polish-readability-feedback`, not `main`.
- Immutable Classic recovery/source SHA: **`3bc82a511901f77638e3ee19af399c0875afb84d`**. At inspection both `main` and `origin/main` pointed here.
- Enhanced worktree: `D:\ProjectSean\HarrisonsSalesMonitor-Enhanced`; branch **`design/enhanced-ui`**, created from that exact SHA.
- No ancestor/project AGENTS.md was found; skill-local guidance was read for the applicable skills. No pre-existing uncommitted work was present or overwritten. No reset, clean, force push, system upgrade or account-security change was used.
- Reference: supplied `D:\ProjectSean\Harrisons-Enhanced-Reference.html`. Its appearance and requested motion take precedence over optional Taste styling opinions. Its generated dataset/script is not part of production source.

## Design and motion

The Overview answers “How are orders distributed across branches?”; Sales orders answers “Which orders match this search and branch/status selection?” The reference supplies the pale blue/lavender ground, navy typography, blue actions, sidebar, five rounded statistic cards, donut/legend, exploration panel and compact preview. Self-hosted Inter replaces Classic's IBM Plex Sans; the React/TypeScript/Vite stack and direct icon imports remain.

| Motion | Actual implementation / how to see it |
| --- | --- |
| Initial card reveal | 300ms, 30ms per-card stagger capped at 120ms. Open Overview. |
| Active navigation | 220ms transformed indicator; vertical on desktop, horizontal on mobile. Switch views. |
| Card/icon feedback | 200ms, 4px lift and restrained icon tilt on fine-pointer hover devices. Hover a statistic. |
| Buttons | 200ms hover; immediate small press scale; 450ms one-shot ready highlight on the refresh control. |
| View transition | 200ms, 4px reveal; navigation and focus do not wait. |
| Donut draw | 550ms Web Animations SVG mask after real summary data arrives. Open Overview or refresh. |
| Donut interaction | Hover, native legend buttons and keyboard-operable SVG segments; Enter/Space or tap to toggle the selected share. Values and percentages are API-derived. |
| Rows | 180ms entrance with stagger capped at 75ms; neutral hover with default cursor, no detail-action implication. |
| Real refresh | Icon rotates only while an order or metadata request is pending. Order errors replace the received timestamp. |

CSS disables animations/transitions under `prefers-reduced-motion`; a JavaScript media-query subscription independently skips/cancels the SVG animation. WAAPI cancellation restores the underlying final SVG. The subscription, hash listener, debounce timer and requests all clean up. Financial values and counts show final API values immediately, without count-up effects. There are no artificial request waits in production, no decorative infinite pulse, no click-blocking overlay and no fake success state.

## Data and behavior

The original API client, runtime validators, types, query helpers, request hook and 32 unit assertions remain unchanged. Requests use only GET to the supplied company API, with its public assessment header. `/meta` supplies every branch/status option; the API performs search, filters and 25-row pagination. Metadata and order failures remain independent with real retry. The 300ms debounce, page reset, abort/generation ownership, 15-second timeout and validation remain intact.

Fresh metadata reports API 1.1.0, 1,200 records, eight sites and four statuses. A fresh `Siti + B20 + Open order` query returned **6** matches. Summary remains global except `filtered_orders`: total 1,200; open 420; completed 660 (360 invoiced + 300 delivered); cancelled 120; total value 998,244.30. The donut uses the same summary, with 35% / 55% / 10%, and includes a neutral unclassified segment if a residual exists. Unmapped row statuses retain their actual text and warnings.

Amounts use the supplied decimal scale and no assumed currency. The preview shows four rows of the active query/page in default SalesId ascending order. It is labelled **Order preview**, with scope/page/order, and does not claim recency. No sort or page-size controls are shown. Hash links support direct entry, reload, back/forward, keyboard and visible mobile navigation. Active order queries survive view switches; **a full reload resets filters/page** (the view remains in the hash).

## Gate A — before changes

- Type checking, ESLint, build and **32 unit tests passed** on the Classic baseline.
- Classic public browser suite: **9 passed, 19.8s**.
- Local baseline browser suite: **9 passed, 17.6s** in the isolated rerun.
- An earlier baseline local run had 8 passes and an artifact-file ENOENT error because two suites were mistakenly run concurrently in the same report directory. It was a test-output collision; the sequential rerun passed all 9 without source changes. Later suites use separate worktrees and/or sequential execution.

## Gate B — final local implementation

- Type checking, ESLint (**0 errors, 0 warnings**), production build and **32 unit tests passed**.
- Complete final local browser suite: **19 passed, 37.3s**. The original 9 test assertions were retained; navigation/setup adapts to the dedicated orders view. Ten focused tests cover live summary/donut/preview, desktop/mobile navigation/history/reload, query preservation, keyboard/touch chart selection, real refresh/error/retry, independent metadata refresh failure, JavaScript/CSS reduced motion, actual executed motion and interruption, sticky geometry, long names and large amounts.
- Browser contract check passed from `http://127.0.0.1:5174` with normal browser security: authentication/CORS, metadata, 25-row pagination, combined filters, summary scope and empty results.
- API-connected screenshot checks passed at **1440, 1024, 768, 390 and 375px** for both views; no horizontal page overflow. Desktop/tablet headers were measured after `scrollTop=220`: header stays within 1px of its container while the body travels over 200px. Phones intentionally use labelled card rows; the desktop header is visually hidden there.
- Tests exercise actual CSS animation events, the executing SVG animation, media preference changes, interrupted animation cancellation, hover transforms and row colour, indicator position, keyboard outlines and touch selection. They do not merely search source for animation classes.
- Success paths use the real company API. Test-only interception simulates failures and holds forwarded real responses. Long-content stress uses temporary browser DOM text; it is never persisted as order data. Browser touch emulation does not claim a physical-phone test.
- Taste browser inspector: **0 failures** for both views at 1440/768/390px. One small-text warning per view remains: secondary metadata/account/date/status labels are 11–12px while primary fields are 13–16px. Screenshot inspection confirmed legibility. `icon-chips` and transient `button-fx` allowances preserve the explicitly supplied reference; the source linter's faint card-shadow warnings have the same documented reason. No random replacement style was drawn.
- React Best Practices, fresh [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md), Taste app-screen and UI Animation instructions were used. No skill/framework reinstallation was needed.

## Gate C — production

Pending separate deployment and production verification. Enhanced is not yet reported complete at this checkpoint.

## Hosting safeguards

- Classic project ID: `prj_2S0f8e83DiQRZDiNzVfjrZDGK1Ht`.
- New Enhanced project: `harrisons-sales-order-monitor-enhanced`, ID `prj_D0JVQW3eKabBr18ZfmwbwGlLAQ3k`; scope `liew1`, Hobby plan.
- Name absence and account ownership were inspected before creation. The Enhanced worktree had no inherited `.vercel` link. It is linked only to the new project, and deployment commands verify its ID/name first.
- Classic has `link: null` / no Git integration, so documentation-only pushes to main do not automatically redeploy it. No Classic hosting setting is changed.
- CLI linking generated an ignored `.env.local` with an OIDC token. It was not printed, is excluded from Git/deployment, and was removed because this app needs no environment variables. Project environment-variable names were checked without exposing values; no order backend or database is introduced.

## Timing and limits

The prior checked-in log records **39m49s** before its final documentation sync; the user's later reported total is **40m33s**. Use the more conservative 40m33s as the prior budget baseline; the 44-second difference is explicitly reported rather than invented as applicant work. This session is measured separately from the first verified clock, including checks, screenshots, documentation and deployment; the final checkpoint will be appended after production verification.

Remaining limits: Chrome and browser touch emulation only; no physical phone, screen reader, Firefox, Safari or Edge validation. Filter/page sharing and reload persistence, custom sorting and order details are intentionally omitted. API caching/availability/CORS remain external dependencies. Received time means browser response receipt, not source-data modification time. Applicant manual review remains necessary.

## Optional English form note

Classic is my primary assessment submission. I also created an optional Enhanced UI with a separate Overview and Sales orders view, responsive navigation and restrained motion. Both versions use the same supplied read-only Harrisons API; Enhanced changes the presentation without introducing another order backend or generated production records. AI assistance and executed verification are documented in the repository.
