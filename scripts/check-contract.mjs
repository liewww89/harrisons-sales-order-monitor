import { chromium } from '@playwright/test'

// Real browser GETs, from the actual app origin. No proxy and no replacement data.
const origin = process.env.APP_URL || 'http://127.0.0.1:5174'
const browser = await chromium.launch({ channel: 'chrome', headless: true })
try {
  const page = await browser.newPage()
  await page.goto(origin)
  const result = await page.evaluate(async () => {
    const base = 'https://hiring.harrisons.my/api/mock/sales-orders'
    const headers = { 'x-assessment-key': 'hssb-assessment-mock-2026' }
    const get = async (path) => {
      const response = await fetch(base + path, { method: 'GET', headers })
      if (!response.ok) throw new Error(`HTTP ${response.status}`)
      return response.json()
    }
    const [meta, all, combined, empty] = await Promise.all([
      get('/meta'),
      get('?page=1&pageSize=25'),
      get('?page=1&pageSize=25&status=Open%20order&site=B20&q=Siti'),
      get('?q=zzzz-no-match-54321'),
    ])
    const invariant = (value, message) => { if (!value) throw new Error(message) }
    invariant(meta.readOnly && meta.dataset.primaryKey === 'SalesId' && Number.isSafeInteger(meta.dataset.rows) && meta.dataset.rows >= 0, 'Metadata contract changed')
    invariant(all.total === all.summary.total_orders, 'All-orders scope mismatch')
    invariant(all.pageSize === 25 && all.data.length === Math.min(all.pageSize, all.total) && all.totalPages === Math.max(1, Math.ceil(all.total / all.pageSize)), 'Pagination mismatch')
    invariant(combined.total === combined.summary.filtered_orders, 'Filtered total mismatch')
    invariant(combined.data.every((o) => o.InventSiteId === 'B20' && o.SalesStatus === 'Open order'), 'Combined filters failed')
    invariant(combined.summary.total_order_value === all.summary.total_order_value, 'Summary scope changed')
    invariant(empty.total === 0 && empty.data.length === 0, 'Empty result failed')
    return {
      origin: location.origin,
      authenticationAndCors: 'passed in Chromium with normal browser security',
      metadata: meta,
      globalSummary: all.summary,
      pagination: { page: all.page, pageSize: all.pageSize, total: all.total, totalPages: all.totalPages },
      firstOrderFields: Object.keys(all.data[0]),
      firstOrderAmount: all.data[0].HAR_TotalSOAmount,
      combinedFilterMatches: combined.total,
      emptyMatches: empty.total,
      currency: 'Not specified by metadata or list response; do not assume MYR or cents.',
    }
  })
  console.log(JSON.stringify(result, null, 2))
} finally {
  await browser.close()
}
