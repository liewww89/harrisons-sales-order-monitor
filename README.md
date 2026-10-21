# Harrisons Sales Order Monitor

A responsive sales order dashboard for the Harrisons Sabah Sdn Bhd IT Executive assessment. **All customers and orders are fictional assessment data.** The app monitors orders across branches; it sends only GET requests to the supplied read-only API.

- Public source: pending publication verification.
- Working app: pending deployment verification.
- Submission answers: [SUBMISSION.md](SUBMISSION.md).

## Run locally

Use Node.js 22.13 or later (tested with 22.23.2) and npm. No database, backend server, environment variables, or account login is needed to run the app.

```powershell
npm.cmd ci
npm.cmd run dev
```

Open `http://127.0.0.1:5173`. On macOS/Linux, use `npm` in place of `npm.cmd`.

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run preview
```

The build output is `dist/`. Preview normally listens at `http://127.0.0.1:4173`.

## Stack and structure

React 19, TypeScript, Vite, plain CSS, native fetch, self-hosted IBM Plex Sans, and individual Phosphor icons. Vitest covers logic/client boundaries; Playwright drives installed Google Chrome for browser integration.

| File | Responsibility |
| --- | --- |
| `src/api.ts` | GET-only client, public fixture key, HTTP/network/timeout errors and runtime response validation |
| `src/types.ts` | Observed metadata, summary, pagination and order fields |
| `src/query.ts` | URLSearchParams, page reset, status groupings and global summary mapping |
| `src/useApiResource.ts` | AbortController, request-generation ownership, loading/error/result snapshots and retry |
| `src/App.tsx` | Controlled filters, 300ms search debounce, pagination and page composition |
| `src/components/` | Overview, responsive semantic order table and feedback states |
| `tests/orders.spec.ts` | Real-API browser checks, with disclosed failure/delay interception |

Metadata and the first page load independently and concurrently. Metadata failure disables only branch/status filters and provides its own retry; order listing and search remain usable. A query change invalidates the displayed snapshot immediately, including during debounce. Cleanup aborts previous requests, an active flag prevents late callbacks, and each snapshot must match the current path and retry generation. Rows, counts and overview values are shown together only for the current completed query. There is no silent fallback dataset or browser persistence of orders.

## API integration and verified contract

Base: `https://hiring.harrisons.my/api/mock/sales-orders`.

- Header: `x-assessment-key: hssb-assessment-mock-2026`.
- `/meta` supplies status and branch/site options. No hardcoded filter lists.
- The list uses `page`, `pageSize=25`, `q`, `status` and `site`, encoded with `URLSearchParams`.
- Search covers SalesId, SalesName, CustAccount, CustomerRef and SalesTaker on the server. Filters combine with search. Status and site values are exact or case insensitive, as documented by metadata.
- API metadata also supports `sort` and `order`; the UI deliberately uses the observed default, SalesId ascending.
- Responses contain `summary`, `page`, `pageSize`, `total`, `totalPages` and `data`. The API uses one empty page (`totalPages=1`) for zero matches.
- Runtime validation rejects invalid required fields, nonnumeric/nonfinite amounts, contradictory totals, duplicate IDs and inconsistent row/pagination counts. Optional customer name/account values have explicit fallbacks.
- Requests time out after 15 seconds. Network, HTTP, JSON and metadata failures have visible retry actions.

| UI field | Actual API field | Display |
| --- | --- | --- |
| Sales ID | `SalesId` | Original identifier |
| Customer | `SalesName`, `CustAccount` | Name with optional account subline |
| Branch / site | `InventSiteId` | Original site code; no invented branch-name mapping |
| Order date | `CreatedDateTime1` | `Intl.DateTimeFormat`, Asia/Kuala_Lumpur (MYT) |
| Status | `SalesStatus` | Original status text |
| Amount | `HAR_TotalSOAmount` | Original decimal value, two decimal places |

**Currency and monetary scale are not specified in the observed metadata/list responses.** The app does not assume MYR, add a currency symbol, or divide values by 100. The UI states that currency is unspecified. The provided fixture key is intentionally public and visible in browser requests; frontend environment variables would not make it secret. Do not put real credentials into this app.

### Overview scope and status groupings

Verified against unfiltered, branch, status, combined and empty results: summary amounts and status counts describe **all 1,200 orders**, not the current page or filtered selection. Only `summary.filtered_orders` changes with filters and equals list `total`. The overview is labelled “All orders · unaffected by filters.” No extra dataset aggregation or full-dataset download is required.

| Metric | Mapping | Observed value |
| --- | --- | --- |
| Total orders | `summary.total_orders` | 1,200 |
| Open / pending | `Open order` → `summary.open_orders` | 420 |
| Completed | `Invoiced` + `Delivered` → their summary counts | 360 + 300 = 660 |
| Cancelled | `Cancelled` → `summary.cancelled_orders` | 120 |
| Total order value | `summary.total_order_value` | 998,244.30, currency unspecified |

Unknown statuses keep their original text with an “Unmapped” label and a warning. Any residual global count is shown as unclassified, rather than assigned to a known group. Metadata currently provides eight site codes: A10, B20, C30, D40, E50, KK01, SDK02 and TWU03. Combined `q=Siti`, `site=B20`, `status=Open order` returned 6 matches during verification.

## Browser and automated verification

Requires installed Google Chrome, as configured by Playwright's `channel: 'chrome'`.

```powershell
npm.cmd run check:contract
npm.cmd run test:e2e
```

`check:contract` requires the dev server running. It runs authenticated fetches inside a real Chrome page at the app origin with normal browser security, checking CORS, metadata, pagination, combined filters and empty results. E2E tests start/reuse the dev server automatically.

To repeat against a public deployment:

```powershell
$env:APP_URL = 'https://YOUR-VERIFIED-APP.vercel.app'
npm.cmd run check:contract
npm.cmd run test:e2e
Remove-Item Env:APP_URL
```

Actual results and their scope are recorded in [docs/VERIFICATION.md](docs/VERIFICATION.md). The initial complete local run passed type checking, lint, production build, **32 unit tests** and **9 browser tests**. Desktop/tablet/mobile screenshots were inspected by Codex. These are agent-executed checks, not a claim that the applicant personally reviewed the application.

The browser tests use the supplied API for successful integration. Two tests intercept responses to simulate list/metadata HTTP 503 errors; one forwards a real API response but delays it to check races. Unit tests use a single observed example record and mocked HTTP boundaries, isolated from production. No replacement production order service exists.

## Deployment

Vercel is configured by `vercel.json`: Vite framework, `npm run build`, output `dist`. No runtime environment variables or paid resources are needed.

1. Import the public GitHub repository into a free Vercel account, or run `npx.cmd --yes vercel@65.0.0 login` and `npx.cmd --yes vercel@65.0.0 --prod` in this directory.
2. Create a new project named `harrisons-sales-order-monitor`; do not replace unrelated projects. Select Node 22.x if a runtime selection is needed.
3. Ensure the production domain is publicly accessible without deployment protection. Verify using a fresh browser session and the commands above.

`.vercel/`, dependencies, generated output, local skill installations and local test artifacts are excluded from Git. Publishing/deployment status and real URLs will be updated after verification.

## AI use and limitations

ChatGPT assisted with planning/prompt preparation, as disclosed in the task brief. Codex implemented the application, inspected the actual API, installed/read the three requested skills, wrote and executed tests, reviewed screenshots, prepared documentation and handled publication/deployment. The user identified the selected model as GPT-6.1 Sol with High reasoning; this is the user's model selection, not an independent runtime attestation. The applicant should review the code and submission answers before submitting the recruitment form.

- Depends on the supplied API's availability, fixture key and CORS policy; never falls back to fake data. Its response headers permit caching for 60 seconds; the UI timestamp is the time a response was received, not a source-data modification time.
- Currency and business meaning of “completed” need confirmation before real use. The assessment mapping groups Delivered and Invoiced as requested.
- Filters/page are kept in memory and reset on reload; shareable query URLs, custom sorting and optional single-order details were deferred.
- Browser automation uses Chrome. Edge, Firefox, Safari, real phones and assistive-technology user testing have not been verified.
- No offline mode, production user authentication or writable order actions are included; the supplied API's read-only operation is intentional.

Time tracking and setup notes: [docs/WORK_LOG.md](docs/WORK_LOG.md).
