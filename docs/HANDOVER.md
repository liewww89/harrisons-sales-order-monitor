# Applicant handover and interview preparation

## Requirement checklist

- [x] Confirmed project directory, applicable instructions, Node/npm/Git/browser tools.
- [x] Installed only the three requested skills locally and read their relevant instructions.
- [x] Inspected real API metadata/list responses before building the UI.
- [x] Verified browser authentication and CORS directly, without a proxy.
- [x] Implemented the five global overview metrics with an explicit scope and status mapping.
- [x] Implemented required order fields, metadata-driven filters, q search and combined filters.
- [x] Added 300ms debounce, page reset, accurate ranges and disabled pagination boundaries.
- [x] Protected against cancelled and out-of-order requests and mismatched query snapshots.
- [x] Added loading, empty, list-error, metadata-error and retry states.
- [x] Added responsive table/list layouts, labelled controls, focus and keyboard access.
- [x] Completed type checking, lint, production build, unit and browser tests.
- [x] Published a new public GitHub repository and verified anonymous access.
- [x] Public Vercel deployment, anonymous HTTPS, production-origin CORS and all 9 deployed-browser tests.
- [x] Prepared README, five English form answers, verification record and this handover.
- [ ] Applicant personally reviews and submits the assessment form.

## 代码与数据流（中文）

`App.tsx` 保存搜索词、分行、状态和页码。搜索等待 300ms 后提交条件；任何条件改变都会回到第一页。`query.ts` 用 `URLSearchParams` 编码这些条件，`useApiResource.ts` 发起请求并管理加载、失败和重试状态，`api.ts` 只向指定 API 发送带 fixture key 的 GET 请求并校验响应。

成功后，同一份响应交给统计区和订单表格：统计读取全局 `summary`，结果数量和分页读取当前筛选的 `total`，表格读取当前页的 `data`。新条件生效时立即隐藏旧结果，并中止前一个请求；请求代次和 effect 的有效标记共同防止慢响应覆盖新结果。分行与状态选项来自独立加载的 `/meta`。如果 metadata 失败，只停用相关下拉框，搜索和订单请求仍能使用。

金额使用 API 原始小数值，保留两位小数，不假设币种；日期以马来西亚时区显示。手机端通过 CSS 将每行改成紧凑列表，同时保留销售单号、客户、分行、日期、状态和金额。没有数据库，也没有替代订单数据来源。

## Five likely interview questions

1. **Why React/Vite and no separate backend?**

   The assessment supplies a read-only REST API with browser CORS and a public fixture key. A static React/TypeScript app meets the requirement with a small deployment surface; a database or proxy would add unnecessary complexity and conflict with the sole-source constraint.

2. **How do you stop a slow search response from replacing a newer one?**

   Effect cleanup aborts the previous fetch and marks its callback inactive. The resource also tags each result with its request path and retry generation, and renders it only when that key matches the current request. A delayed-response browser test checks the final rows and count after the old request settles.

3. **Why do dashboard values stay unchanged when a branch is selected?**

   Real filtered responses retain global summary counts and value; only filtered_orders changes. The UI labels the overview as all orders and uses list total for the filtered count. Completed is Invoiced plus Delivered, with unknown statuses flagged explicitly.

4. **Is the assessment key secure in the frontend?**

   No frontend variable can hide a key sent by the browser. This key is an intentionally public fictional fixture credential. A real confidential credential would require a different authorised backend design, but this assessment requires the supplied read-only API directly.

5. **What did you test, and what would you improve next?**

   Type checking, lint, a production build, 32 unit tests and 9 browser scenarios cover parsing, query encoding, filters, pagination, errors/retry, races and responsive layout. Success cases use the real API; failures/delays are explicitly simulated. Next steps would be real-device/screen-reader checks, confirmed currency/business rules and optional shareable filters/order details.
