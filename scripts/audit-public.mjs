import { chromium, expect } from '@playwright/test'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'

const origin = process.env.APP_URL
if (!origin) throw new Error('APP_URL must be the verified public origin.')
const variant = origin.includes('-enhan.') ? 'enhanced' : 'classic'
const directory = 'artifacts/final-audit'
await mkdir(directory, { recursive: true })
const htmlResponse = await fetch(origin)
assert.equal(htmlResponse.status, 200)
assert.equal(new URL(htmlResponse.url).origin, new URL(origin).origin)
const html = await htmlResponse.text()
const assets = []
for (const [, path] of html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))"/g)) {
  const response = await fetch(new URL(path, origin))
  assert.equal(response.status, 200)
  const publicBytes = Buffer.from(await response.arrayBuffer())
  const testedBytes = await readFile(resolve('dist', path.slice(1)))
  assert.ok(publicBytes.equals(testedBytes), `Public asset differs: ${path}`)
  assets.push({ path, sha256: createHash('sha256').update(testedBytes).digest('hex') })
}
assert.ok(assets.length >= 2)
const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } })
  const errors = { page: [], console: [], failedRequests: [], badResponses: [] }
  page.on('pageerror', (error) => errors.page.push(error.message))
  page.on('console', (message) => { if (message.type() === 'error') errors.console.push(message.text()) })
  page.on('requestfailed', (request) => errors.failedRequests.push({ url: request.url(), failure: request.failure()?.errorText }))
  page.on('response', (response) => { if (response.status() >= 400) errors.badResponses.push({ url: response.url(), status: response.status() }) })
  await page.goto(origin + '/#orders')
  await expect(page.getByRole('button', { name: 'Refresh orders' })).toBeEnabled()
  const observed = await page.evaluate(async () => {
    const base = 'https://hiring.harrisons.my/api/mock/sales-orders'
    const get = async (path) => {
      const response = await fetch(base + path, { method: 'GET', headers: { 'x-assessment-key': 'hssb-assessment-mock-2026' } })
      if (!response.ok) throw new Error(`API HTTP ${response.status}`)
      return { body: await response.json(), cache: response.headers.get('cache-control') }
    }
    const [meta, all, combined] = await Promise.all([get('/meta'), get('?page=1&pageSize=25'), get('?page=1&pageSize=25&q=Siti&site=B20&status=Open%20order')])
    return { meta, all, combined }
  })
  const first = observed.all.body.data[0]
  const row = page.locator('tbody tr').first()
  await expect(row).toContainText(first.SalesId)
  await expect(row.locator('.customer')).toContainText(first.SalesName)
  await expect(row.locator('.branch')).toHaveText(first.InventSiteId)
  await expect(row.locator('.status')).toHaveText(first.SalesStatus)
  await expect(row.locator('.amount')).toHaveText(first.HAR_TotalSOAmount.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  if (variant === 'enhanced') await page.getByRole('link', { name: 'Overview', exact: true }).click()
  const summary = observed.all.body.summary
  const values = [summary.total_orders, summary.open_orders, summary.invoiced_orders + summary.delivered_orders, summary.cancelled_orders]
  for (const [index, value] of values.entries()) await expect(page.locator('.metric dd').nth(index)).toHaveText(value.toLocaleString('en-MY'))
  await expect(page.locator('.metric-value dd')).toHaveText(summary.total_order_value.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 }))
  const fresh = page.waitForResponse((response) => response.url().startsWith('https://hiring.harrisons.my/api/mock/sales-orders?') && response.status() === 200)
  await page.getByRole('button', { name: 'Refresh orders' }).click()
  await fresh
  await expect(page.getByRole('button', { name: 'Refresh orders' })).toBeEnabled()
  for (const view of variant === 'enhanced' ? ['overview', 'orders'] : ['orders']) {
    if (variant === 'enhanced') await page.goto(origin + '/#' + view)
    await expect(page.getByRole('button', { name: 'Refresh orders' })).toBeEnabled()
    for (const width of [1440, 768, 390, 375]) {
      await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 })
      await page.evaluate(async () => { await document.fonts.ready; await Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => {}))) })
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      await page.screenshot({ path: `${directory}/${variant}-${view}-${width}.png`, fullPage: true })
    }
  }
  for (const [kind, entries] of Object.entries(errors)) assert.deepEqual(entries, [], `Unexpected normal-path ${kind}`)
  const result = { origin, variant, checkedAt: new Date().toISOString(), anonymousStatus: 200, assets, summary, combinedMatches: observed.combined.body.total, listCache: observed.all.cache, errors, screenshots: directory }
  await writeFile(`${directory}/${variant}-proof.json`, JSON.stringify(result, null, 2) + '\n')
  console.log(JSON.stringify(result, null, 2))
} finally { await browser.close() }
