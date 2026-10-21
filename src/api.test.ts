import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, API_BASE, getJson, parseMetadata, parseOrderPage } from './api'

// A single observed fixture record is used only to exercise parser boundaries.
// It is never imported by the production app or substituted on API failure.
const order = {
  SalesId: 'SO-MOCK-00001', SalesName: 'Siti Mart Sdn Bhd', CustAccount: 'C10001',
  InventSiteId: 'B20', SalesStatus: 'Open order', CreatedDateTime1: '2026-09-30T03:07:00.000Z', HAR_TotalSOAmount: 162.35,
}
const response = () => ({
  summary: { total_orders: 1, filtered_orders: 1, open_orders: 1, invoiced_orders: 0, delivered_orders: 0, cancelled_orders: 0, total_order_value: 162.35 },
  page: 1, pageSize: 25, total: 1, totalPages: 1, data: [{ ...order }],
})

afterEach(() => vi.unstubAllGlobals())

describe('API response validation', () => {
  it('accepts the observed contract and preserves decimal units', () => {
    expect(parseOrderPage(response()).data[0].HAR_TotalSOAmount).toBe(162.35)
  })

  it('handles missing optional customer values', () => {
    const r = response()
    Object.assign(r.data[0], { SalesName: null, CustAccount: null })
    expect(parseOrderPage(r).data[0].SalesName).toBeNull()
  })

  it.each([
    ['missing SalesId', { SalesId: undefined }], ['missing site', { InventSiteId: '' }],
    ['invalid date', { CreatedDateTime1: 'yesterday' }], ['missing status', { SalesStatus: null }],
    ['string amount', { HAR_TotalSOAmount: '162.35' }], ['nonfinite amount', { HAR_TotalSOAmount: Infinity }],
  ])('rejects %s', (_name, change) => {
    const r = response()
    Object.assign(r.data[0], change)
    expect(() => parseOrderPage(r)).toThrow(ApiError)
  })

  it('does not hide unknown statuses or zero amounts', () => {
    const r = response()
    Object.assign(r.data[0], { SalesStatus: 'Awaiting approval', HAR_TotalSOAmount: 0 })
    expect(parseOrderPage(r).data[0]).toMatchObject({ SalesStatus: 'Awaiting approval', HAR_TotalSOAmount: 0 })
  })

  it('rejects contradictory summary and pagination', () => {
    const r = response()
    r.summary.filtered_orders = 9
    expect(() => parseOrderPage(r)).toThrow('summary scope')
    expect(() => parseOrderPage({ ...response(), totalPages: 9 })).toThrow('pagination')
  })

  it('rejects missing rows rather than showing incomplete results as complete', () => {
    expect(() => parseOrderPage({ ...response(), data: [] })).toThrow('row count')
  })

  it('accepts an empty API result without a fabricated row', () => {
    const r = response()
    r.summary.filtered_orders = 0
    expect(parseOrderPage({ ...r, total: 0, data: [] }).data).toEqual([])
  })

  it('validates metadata and retains all API-provided options', () => {
    expect(parseMetadata({ version: '1.1.0', readOnly: true, dataset: { rows: 1200, primaryKey: 'SalesId' }, facets: { statuses: [{ value: 'Open order', count: 420 }], sites: [{ value: 'B20', count: 150 }] } }).facets.sites[0].value).toBe('B20')
    expect(() => parseMetadata({ facets: null })).toThrow(ApiError)
  })
})

describe('GET-only client behaviour', () => {
  it('sets the public fixture header, excludes credentials, and uses GET', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"ok":true}'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(getJson('/meta', new AbortController().signal)).resolves.toEqual({ ok: true })
    expect(fetchMock).toHaveBeenCalledWith(`${API_BASE}/meta`, expect.objectContaining({ method: 'GET', credentials: 'omit', headers: { 'x-assessment-key': 'hssb-assessment-mock-2026' }, signal: expect.any(AbortSignal) }))
  })

  it('reports HTTP failures without data substitution', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })))
    await expect(getJson('', new AbortController().signal)).rejects.toThrow('HTTP 503')
  })

  it('explains rejected assessment authentication', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })))
    await expect(getJson('', new AbortController().signal)).rejects.toThrow('fixture key')
  })

  it('reports malformed JSON and network failures', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(new Response('not-json')).mockRejectedValueOnce(new TypeError('Failed to fetch'))
    vi.stubGlobal('fetch', fetchMock)
    await expect(getJson('', new AbortController().signal)).rejects.toThrow('unreadable JSON')
    await expect(getJson('', new AbortController().signal)).rejects.toThrow('Check your connection')
  })

  it('preserves caller cancellation', async () => {
    const controller = new AbortController()
    controller.abort()
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(controller.signal.reason))
    await expect(getJson('', controller.signal)).rejects.toHaveProperty('name', 'AbortError')
  })

  it('reports a timeout with a retry instruction', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('Timed out', 'TimeoutError')))
    await expect(getJson('', new AbortController().signal)).rejects.toThrow('15 seconds')
  })
})
