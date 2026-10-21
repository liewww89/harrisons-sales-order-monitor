import { chromium, expect } from '@playwright/test'
import assert from 'node:assert/strict'

const origin = process.env.APP_URL || 'http://127.0.0.1:5174'
const API = 'https://hiring.harrisons.my/api/mock/sales-orders'
const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage()
  await page.goto(`${origin}/#overview`)
  await expect(page.getByRole('button', { name: 'Refresh orders' })).toBeEnabled()
  let release
  const gate = new Promise((resolve) => { release = resolve })
  let requests = 0
  await page.route(`${API}?**`, async (route) => {
    requests++
    const response = await route.fetch()
    await gate
    await route.fulfill({ response })
  })
  const refresh = page.getByRole('button', { name: 'Refresh orders' })
  await refresh.click()
  await expect(refresh).toBeDisabled()
  await refresh.evaluate((button) => { button.click(); button.click(); button.click() })
  await expect.poll(() => requests).toBe(1)
  release()
  await expect(refresh).toBeEnabled()
  await expect(page.locator('.metric-value dd')).toHaveText('998,244.30')
  assert.equal(requests, 1)
  const phoneContext = await browser.newContext({ viewport: { width: 375, height: 812 }, hasTouch: true, isMobile: true })
  try {
    const phone = await phoneContext.newPage()
    await phone.goto(origin)
    const metric = phone.locator('.metric').first()
    await expect(metric).toHaveCSS('transform', 'none')
    await metric.tap()
    await phone.getByRole('heading', { level: 1 }).tap()
    await expect(metric).toHaveCSS('transform', 'none')
    const phoneRefresh = phone.getByRole('button', { name: 'Refresh orders' })
    await phoneRefresh.tap()
    await expect(phoneRefresh).toBeEnabled()
    assert.equal(await phoneRefresh.evaluate((node) => getComputedStyle(node, '::after').animationName), 'none')
  } finally { await phoneContext.close() }
  console.log(JSON.stringify({ origin, repeatedPendingRefresh: 'one request, duplicate activation ignored', coarsePointer: 'no stuck metric hover or button sheen' }))
} finally { await browser.close() }
