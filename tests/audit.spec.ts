import { expect, test, type Page, type APIRequestContext } from '@playwright/test'
import type { OrderPage } from '../src/types'

const API = 'https://hiring.harrisons.my/api/mock/sales-orders'
const headers = { 'x-assessment-key': 'hssb-assessment-mock-2026' }
const enhanced = async (page: Page) => page.getByRole('navigation', { name: 'Workspace', exact: true }).count().then(Boolean)
const ordersView = async (page: Page) => {
  if (await enhanced(page)) await page.getByRole('navigation', { name: 'Workspace', exact: true }).getByRole('link', { name: 'Sales orders', exact: true }).click()
}
const overview = async (page: Page) => {
  if (await enhanced(page)) await page.getByRole('link', { name: 'Overview', exact: true }).click()
}
async function live(request: APIRequestContext, query = '?page=1&pageSize=25'): Promise<OrderPage> {
  const response = await request.get(API + query, { headers })
  expect(response.ok()).toBeTruthy()
  return response.json()
}
async function ready(page: Page) {
  await expect(page.locator('.order-results')).toHaveAttribute('aria-busy', 'false')
  await expect(page.getByRole('button', { name: 'Refresh orders' })).toBeEnabled()
}

// Entirely test-only changed-data scenarios. Production never imports this file.
function changed(template: OrderPage, page = 1, total = 1500, unknown = 0): OrderPage {
  const open = Math.min(total, 500) - unknown
  const invoiced = Math.min(Math.max(total - 500, 0), 450)
  const delivered = Math.min(Math.max(total - 950, 0), 400)
  const cancelled = Math.max(total - 1350, 0)
  return {
    page, pageSize: 25, total, totalPages: Math.max(1, Math.ceil(total / 25)),
    summary: { total_orders: total, filtered_orders: total, open_orders: open, invoiced_orders: invoiced, delivered_orders: delivered, cancelled_orders: cancelled, total_order_value: total * 100 },
    data: Array.from({ length: Math.min(25, Math.max(0, total - (page - 1) * 25)) }, (_, offset) => {
      const index = (page - 1) * 25 + offset
      return { ...template.data[offset % template.data.length], SalesId: `AUDIT-${String(index + 1).padStart(5, '0')}`, SalesStatus: index < unknown ? 'Awaiting approval' : index < 500 ? 'Open order' : index < 950 ? 'Invoiced' : index < 1350 ? 'Delivered' : 'Cancelled', HAR_TotalSOAmount: 100 }
    }),
  }
}

test('live search safely encodes spaces and reserved/unicode characters', async ({ page, request }) => {
  await page.goto('/#orders')
  await ready(page)
  const term = 'Siti & Sons + / 北'
  const expected = await live(request, `?q=${encodeURIComponent(term)}&page=1&pageSize=25`)
  const sent = page.waitForRequest((request) => request.url().startsWith(API + '?') && new URL(request.url()).searchParams.get('q') === term)
  await page.getByLabel('Search orders', { exact: true }).fill(`  ${term}  `)
  expect(new URL((await sent).url()).searchParams.get('q')).toBe(term)
  await expect(page.locator('.result-count')).toHaveText(`${expected.total.toLocaleString('en-MY')} ${expected.total === 1 ? 'order' : 'orders'}`)
  await expect(page.getByRole('alert')).toHaveCount(0)
})

for (const status of [401, 403, 500]) {
  test(`simulated HTTP ${status} never shows fake rows and real retry recovers`, async ({ page }) => {
    await page.route(`${API}?**`, (route) => route.fulfill({ status, body: '{}', headers: { 'access-control-allow-origin': '*' } }))
    await page.goto('/#orders')
    await expect(page.getByRole('heading', { name: 'Orders could not be loaded' })).toBeVisible()
    await expect(page.getByRole('alert')).toContainText(`HTTP ${status}`)
    await expect(page.locator('tbody tr')).toHaveCount(0)
    await page.unroute(`${API}?**`)
    await page.getByRole('button', { name: 'Retry', exact: true }).click()
    await ready(page)
    await expect(page.locator('tbody tr').first()).toBeVisible()
  })
}

for (const [name, body, message] of [
  ['invalid JSON', 'not-json', 'unreadable JSON'],
  ['malformed schema', '{"page":1,"data":[]}', 'invalid summary'],
] as const) {
  test(`simulated ${name} is a safe recoverable error`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.route(`${API}?**`, (route) => route.fulfill({ body, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' } }))
    await page.goto('/#orders')
    await expect(page.getByRole('alert')).toContainText(message)
    await expect(page.locator('tbody tr')).toHaveCount(0)
    await page.unroute(`${API}?**`)
    await page.getByRole('button', { name: 'Retry', exact: true }).click()
    await ready(page)
    await expect(page.locator('tbody tr').first()).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('simulated network failure reports connection guidance and real recovery', async ({ page }) => {
  await page.route(`${API}?**`, (route) => route.abort('failed'))
  await page.goto('/#orders')
  await expect(page.getByRole('alert')).toContainText('Check your connection')
  await expect(page.locator('tbody tr')).toHaveCount(0)
  await page.unroute(`${API}?**`)
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await ready(page)
  await expect(page.locator('tbody tr').first()).toBeVisible()
})

test('real 15-second client timeout remains readable and retry recovers', async ({ page }) => {
  let release: () => void = () => {}
  const gate = new Promise<void>((resolve) => { release = resolve })
  await page.route(`${API}?**`, async (route) => { await gate; await route.abort().catch(() => {}) })
  const began = Date.now()
  await page.goto('/#orders')
  await expect(page.getByRole('status').filter({ hasText: 'Loading orders' })).toBeVisible()
  await expect(page.getByRole('alert')).toContainText('longer than 15 seconds', { timeout: 22_000 })
  expect(Date.now() - began).toBeGreaterThanOrEqual(14_000)
  await expect(page.locator('tbody tr')).toHaveCount(0)
  release()
  await page.unroute(`${API}?**`)
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await ready(page)
  await expect(page.locator('tbody tr').first()).toBeVisible()
})

test('a data-only refresh grows totals to 1500 and pages to 60 without code changes', async ({ page, request }) => {
  const template = await live(request)
  await page.goto('/#orders')
  await ready(page)
  await page.route(`${API}?**`, (route) => route.fulfill({ json: changed(template, Number(new URL(route.request().url()).searchParams.get('page') || 1)), headers: { 'access-control-allow-origin': '*' } }))
  await page.getByRole('button', { name: 'Refresh orders' }).click()
  await expect(page.locator('.result-count')).toHaveText('1,500 orders')
  await expect(page.locator('.page-number')).toHaveText('Page 1 of 60')
  await overview(page)
  for (const [index, value] of ['1,500', '500', '850', '150', '150,000.00'].entries()) await expect(page.locator('.metric dd').nth(index)).toHaveText(value)
  if (await enhanced(page)) {
    await expect(page.locator('[data-segment="open"]')).toHaveAttribute('data-value', '500')
    await expect(page.locator('[data-segment="completed"]')).toHaveAttribute('data-value', '850')
    await expect(page.locator('[data-segment="cancelled"]')).toHaveAttribute('data-value', '150')
    expect(Number(await page.locator('[data-segment="open"]').getAttribute('data-share'))).toBeCloseTo(100 / 3)
  }
  await ordersView(page)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.page-number')).toHaveText('Page 2 of 60')
  await expect(page.locator('tbody tr').first()).toContainText('AUDIT-00026')
})

test('a successful zero-order dataset renders zero summary and a usable empty state', async ({ page, request }) => {
  const template = await live(request)
  await page.route(`${API}?**`, (route) => route.fulfill({ json: changed(template, 1, 0), headers: { 'access-control-allow-origin': '*' } }))
  await page.goto('/#orders')
  await ready(page)
  await expect(page.locator('.page-number')).toHaveText('Page 1 of 1')
  await expect(page.getByRole('heading', { name: 'No matching orders' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeDisabled()
  await overview(page)
  for (const [index, value] of ['0', '0', '0', '0', '0.00'].entries()) await expect(page.locator('.metric dd').nth(index)).toHaveText(value)
  expect(await page.locator('body').innerText()).not.toMatch(/NaN|Infinity/)
  if (await enhanced(page)) await expect(page.locator('.donut-segment')).toHaveCount(0)
})

test('unknown row statuses and residual summary counts stay explicit', async ({ page, request }) => {
  const template = await live(request)
  await page.route(`${API}?**`, (route) => route.fulfill({ json: changed(template, 1, 1500, 5), headers: { 'access-control-allow-origin': '*' } }))
  await page.goto('/#orders')
  await ready(page)
  await expect(page.locator('tbody tr').first()).toContainText('Unmapped: Awaiting approval')
  await overview(page)
  await expect(page.locator('body')).toContainText('unclassified')
  await expect(page.locator('.metric').first()).toContainText('1,500')
  if (await enhanced(page)) await expect(page.locator('[data-segment="unknown"]')).toHaveAttribute('data-value', '5')
})

test('a dataset shrinking on a later page offers recovery to a valid first page', async ({ page, request }) => {
  const template = await live(request)
  let total = 1500
  await page.route(`${API}?**`, (route) => route.fulfill({ json: changed(template, Number(new URL(route.request().url()).searchParams.get('page') || 1), total), headers: { 'access-control-allow-origin': '*' } }))
  await page.goto('/#orders')
  await ready(page)
  await page.getByRole('button', { name: 'Next', exact: true }).click()
  await expect(page.locator('.page-number')).toHaveText('Page 2 of 60')
  total = 20
  await page.getByRole('button', { name: 'Refresh orders' }).click()
  await expect(page.getByRole('heading', { name: 'Orders could not be loaded' })).toBeVisible()
  await page.getByRole('button', { name: 'Return to first page', exact: true }).click()
  await expect(page.locator('.page-number')).toHaveText('Page 1 of 1')
  await expect(page.locator('.result-count')).toHaveText('20 orders')
  await expect(page.locator('tbody tr')).toHaveCount(20)
})

test('long content, large amounts, keyboard focus and real scroll geometry remain usable', async ({ page }) => {
  await page.goto('/#orders')
  await ready(page)
  await page.getByLabel('Search orders', { exact: true }).focus()
  expect(await page.getByLabel('Search orders', { exact: true }).evaluate((node) => getComputedStyle(node).outlineStyle !== 'none' || getComputedStyle(node.parentElement!).outlineStyle !== 'none')).toBeTruthy()
  await page.locator('tbody tr').first().evaluate((row) => {
    row.querySelector('.customer > span')!.textContent = 'LongCustomerName'.repeat(10)
    row.querySelector('.amount')!.textContent = '999,999,999,999.99'
  })
  for (const width of [1440, 768, 390, 375]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy()
    const name = page.locator('tbody tr').first().locator('.customer > span')
    expect(await name.evaluate((node) => node.scrollWidth <= node.clientWidth + 1)).toBeTruthy()
    await page.locator('tbody tr').first().locator('.amount').scrollIntoViewIfNeeded()
    if (width >= 768) {
      const geometry = await page.locator('.table-scroll').evaluate((container) => {
        container.scrollTop = 0
        const header = container.querySelector('thead th')!
        const row = container.querySelector('tbody tr')!
        const before = row.getBoundingClientRect().top
        container.scrollTop = 220
        return { scroll: container.scrollTop, headerDelta: Math.abs(header.getBoundingClientRect().top - container.getBoundingClientRect().top), rowTravel: before - row.getBoundingClientRect().top }
      })
      expect(geometry.scroll).toBe(220)
      expect(geometry.headerDelta).toBeLessThanOrEqual(1)
      expect(geometry.rowTravel).toBeGreaterThan(200)
      await page.locator('.table-scroll').evaluate((node) => { node.scrollTop = 0 })
    }
  }
})
