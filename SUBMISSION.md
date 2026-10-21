# Assessment submission answers

These answers describe Classic, the PRIMARY submission. Review them and the application before pasting into the recruitment form. Current verification is in docs/FINAL_AUDIT.md; the form has not been submitted.

## Question 1 — Architecture and API integration

I used React, TypeScript and Vite with plain CSS to build a responsive Sales Order Monitor. The app is a static frontend without a database or separate order backend. API access, response types, query/status logic, request lifecycle and presentation are separated into small files; this keeps the implementation proportionate to the assessment.

The only production order source is the supplied Harrisons assessment API. A typed native-fetch client sends GET requests with the public x-assessment-key fixture header. Metadata and the first order page load concurrently. Branch and status options come from /meta. Search, combined filters and pagination are performed by the API using URLSearchParams, q, site, status, page and pageSize=25. The default ordering is SalesId ascending, verified against metadata and responses.

I inspected actual metadata and list responses before building the UI and verified authenticated cross-origin requests from a real browser. Runtime parsing validates the required identity, site, date, status and numeric amount fields, summary totals, pagination and row counts. Missing optional customer values have clear fallbacks. HTTP, network, timeout, JSON and metadata failures are reported with retry actions; no replacement data is silently displayed. Metadata failure leaves order search available and disables only dependent filters.

Search has a 300ms debounce, and query/filter changes reset to page 1. AbortController cancels superseded requests, an effect-ownership guard prevents late updates, and displayed snapshots must match the active request path and retry generation. Rows, result counts and overview statistics are hidden while a changed query is pending, so old results are not presented under new controls.

The API summary is dataset-wide (1,200 fictional orders observed at the audit), except filtered_orders, which tracks the current filtered total. The overview is explicitly labelled as global. Open order maps to open/pending; Invoiced plus Delivered maps to completed; Cancelled maps to cancelled. Unexpected statuses retain their original text and are flagged as unmapped; residual global counts are shown as unclassified. The observed totals are 1,200 overall, 420 open, 660 completed and 120 cancelled, with a total order value of 998,244.30. The API does not specify currency or monetary scale, so amounts remain in their original decimal units without an assumed currency symbol or cents conversion.

The table displays SalesId, SalesName/CustAccount, InventSiteId, CreatedDateTime1, SalesStatus and HAR_TotalSOAmount. Dates are formatted in Malaysia time using Intl; amounts are right aligned with tabular digits and two decimals. Mobile layouts preserve the same fields. Controls have labels, visible keyboard focus, semantic elements, loading/empty/error states and reduced-motion support. The interface explicitly identifies the data as fictional.

## Question 2 — AI tools, verification, and testing

ChatGPT assisted with planning and prompt preparation. Codex provided substantial implementation assistance: environment and skill setup, API contract inspection, application and test code, responsive CSS, debugging, screenshot review, documentation, source publication and deployment work. I selected GPT-6.1 Sol with High reasoning in Codex, as stated in my task instructions; I am not claiming an independent runtime verification of the model. I will review and understand the delivered code and answers before submitting them.

Codex explicitly installed and read the requested React Best Practices, Web Design Guidelines and Taste Skill locally. Only relevant React/Vite recommendations were applied. The design uses Taste's app-screen workflow with restrained surfaces, visible status text and a readable table; the assessment requirements take priority over optional design rules.

Verification used actual metadata and API responses, including global versus filtered summary scope, combined filters, eight branch codes and four statuses. Chrome authenticated fetches from the application origin confirmed CORS with normal browser security. The API key is a public fixture credential visible in the frontend, not a secret protected by environment variables.

The local checks passed: TypeScript type checking, ESLint, production build, 32 Vitest unit tests and 22 Playwright browser tests. Unit checks cover URL encoding, filter page reset, status grouping including unknown values, summary mapping, runtime validation, GET/header behaviour, HTTP/auth/network/JSON errors, timeout and cancellation. Browser checks compare displayed rows and dashboard values with live API responses, exercise search and independent/combined filters, pagination and boundaries, page resets, empty results/clear filters, retry, metadata failure, and delayed-response races. Keyboard access and 1440/1024/768/390/375px layouts were checked; Codex viewed desktop, tablet and mobile screenshots.

Successful integration tests use the supplied API. HTTP 401/403/500/503, network/timeout and invalid responses are deliberately simulated by browser interception, and the race test delays a real forwarded response. Test-only changed datasets verify growth to 1,500 orders / 60 pages, zero orders, unknown statuses and recovery when a later page becomes invalid after a shrink. No code edit is needed for a valid data-only update. Unit mocks and one observed sample record are test-only; they are not a production fallback. The delayed-response test was strengthened to wait for the older response to settle before checking final state. A JSON-error handler was refined to preserve timeout/cancellation errors. No system software was upgraded.

The public GitHub page and raw source were verified without login. The Vercel app returned anonymous HTTPS 200 without deployment protection. The contract/authentication/CORS check passed from the production origin, and all 22 current browser tests passed against the deployed app in 48.8 seconds. Current commands, outcomes, live-versus-simulated cases and remaining limits are recorded in docs/FINAL_AUDIT.md; earlier records remain in docs/VERIFICATION.md. Automated browser checks and agent screenshot inspection do not replace my final review, real-device testing or assistive-technology testing. I have not asked Codex to submit the recruitment form.

## Question 3 — Source code: public Git repository URL

https://github.com/liewww89/harrisons-sales-order-monitor

Verified public: the repository page and raw application source are accessible without login.

## Question 4 — Working web app URL

https://harrisons-sales-order-monitor.vercel.app

Verified anonymous HTTPS response: HTTP 200 without login; production-origin API/CORS check and all 22 current deployed-browser tests passed. Details are in docs/FINAL_AUDIT.md.

## Question 5 — Known limitations

The application depends on the supplied assessment API, its public fixture key and its CORS policy. Failures remain visible with retry actions; there is no offline dataset or substitute backend. The API advertises a 60-second cache lifetime, and the displayed update time indicates response receipt rather than a source record's modification time.

The API does not specify currency or amount scale. Original decimal amounts are displayed without assuming MYR or dividing by 100. Delivered and Invoiced are grouped as completed for this assessment; real business rules should confirm this interpretation. Unexpected statuses are flagged rather than guessed.

Filters and pagination are in memory and reset on reload. Optional single-order detail, shareable filter URLs and custom sorting were deferred to prioritise required functionality, testing and delivery. There is no decorative chart, export, authentication system or order editor. Read-only order access is an intentional API constraint, not an unfinished editing feature.

Automated browser coverage is Chrome at desktop and mobile viewport sizes. Firefox, Safari, Edge, actual mobile devices and screen-reader user testing were not performed. The applicant's final code and submission review remains necessary. Public source and application access have been verified, as recorded in Questions 3 and 4. The app was deployed through the Vercel CLI; later source changes need a CLI redeployment unless Git integration is separately connected.
