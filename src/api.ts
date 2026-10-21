import type { ApiMetadata, Facet, OrderPage, OrderSummary, SalesOrder } from './types'

export const API_BASE = 'https://hiring.harrisons.my/api/mock/sales-orders'
// This public, fictional fixture key is intentionally visible in the browser.
const ASSESSMENT_KEY = 'hssb-assessment-mock-2026'

export class ApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message)
    this.name = 'ApiError'
  }
}

function invalid(field: string): never {
  throw new ApiError(`The API returned an invalid ${field}. Please retry; if it continues, contact the assessment API owner.`)
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid(field)
  return value as Record<string, unknown>
}

function requiredString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) invalid(field)
  return value
}

function optionalString(value: unknown, field: string): string | null {
  if (value == null || value === '') return null
  if (typeof value !== 'string') invalid(field)
  return value.trim() ? value : null
}

function number(value: unknown, field: string, integer = false): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || (integer && (!Number.isSafeInteger(value) || value < 0))) invalid(field)
  return value
}

function parseOrder(value: unknown): SalesOrder {
  const o = record(value, 'order')
  const date = requiredString(o.CreatedDateTime1, 'order date')
  if (!/^\d{4}-\d{2}-\d{2}T/.test(date) || !Number.isFinite(Date.parse(date))) invalid('order date')
  return {
    SalesId: requiredString(o.SalesId, 'SalesId'),
    SalesName: optionalString(o.SalesName, 'customer name'),
    CustAccount: optionalString(o.CustAccount, 'customer account'),
    InventSiteId: requiredString(o.InventSiteId, 'branch/site'),
    CreatedDateTime1: date,
    SalesStatus: requiredString(o.SalesStatus, 'order status'),
    HAR_TotalSOAmount: number(o.HAR_TotalSOAmount, 'order amount'),
  }
}

export function parseOrderPage(value: unknown): OrderPage {
  const r = record(value, 'list response')
  const s = record(r.summary, 'summary')
  const summary: OrderSummary = {
    total_orders: number(s.total_orders, 'total orders', true),
    filtered_orders: number(s.filtered_orders, 'filtered orders', true),
    open_orders: number(s.open_orders, 'open orders', true),
    invoiced_orders: number(s.invoiced_orders, 'invoiced orders', true),
    delivered_orders: number(s.delivered_orders, 'delivered orders', true),
    cancelled_orders: number(s.cancelled_orders, 'cancelled orders', true),
    total_order_value: number(s.total_order_value, 'total order value'),
  }
  const page = number(r.page, 'page', true)
  const pageSize = number(r.pageSize, 'page size', true)
  const total = number(r.total, 'result total', true)
  const totalPages = number(r.totalPages, 'page count', true)
  if (page < 1 || pageSize < 1 || pageSize > 100 || totalPages !== Math.max(1, Math.ceil(total / pageSize)) || page > totalPages) invalid('pagination')
  if (total !== summary.filtered_orders || total > summary.total_orders) invalid('summary scope')
  const classified = summary.open_orders + summary.invoiced_orders + summary.delivered_orders + summary.cancelled_orders
  if (classified > summary.total_orders) invalid('status totals')
  if (!Array.isArray(r.data)) invalid('order rows')
  const data = r.data.map(parseOrder)
  if (data.length !== Math.min(pageSize, Math.max(0, total - (page - 1) * pageSize))) invalid('row count')
  if (new Set(data.map((o) => o.SalesId)).size !== data.length) invalid('duplicate SalesId')
  return { summary, page, pageSize, total, totalPages, data }
}

function parseFacets(value: unknown, field: string): Facet[] {
  if (!Array.isArray(value) || value.length === 0) invalid(field)
  const facets = value.map((v) => {
    const f = record(v, field)
    return { value: requiredString(f.value, field), count: number(f.count, field, true) }
  })
  if (new Set(facets.map((f) => f.value)).size !== facets.length) invalid(field)
  return facets
}

export function parseMetadata(value: unknown): ApiMetadata {
  const m = record(value, 'metadata')
  const dataset = record(m.dataset, 'dataset metadata')
  const facets = record(m.facets, 'filter options')
  if (m.readOnly !== true || dataset.primaryKey !== 'SalesId') invalid('read-only metadata contract')
  return {
    version: requiredString(m.version, 'API version'),
    readOnly: true,
    dataset: { rows: number(dataset.rows, 'dataset row count', true), primaryKey: 'SalesId' },
    facets: { statuses: parseFacets(facets.statuses, 'statuses'), sites: parseFacets(facets.sites, 'branches') },
  }
}

export async function getJson(path: string, signal: AbortSignal): Promise<unknown> {
  try {
    const response = await fetch(API_BASE + path, {
      method: 'GET',
      headers: { 'x-assessment-key': ASSESSMENT_KEY },
      signal: AbortSignal.any([signal, AbortSignal.timeout(15_000)]),
      credentials: 'omit',
    })
    if (!response.ok) {
      const guidance = response.status === 401 || response.status === 403
        ? 'The assessment API rejected the fixture key.'
        : 'The assessment API could not complete the request.'
      throw new ApiError(`${guidance} HTTP ${response.status}.`, response.status)
    }
    try {
      return await response.json()
    } catch (error) {
      if (error instanceof SyntaxError) throw new ApiError('The API returned unreadable JSON. Please retry.')
      throw error
    }
  } catch (error) {
    if (signal.aborted) throw error
    if (error instanceof ApiError) throw error
    if (error instanceof DOMException && error.name === 'TimeoutError') throw new ApiError('The API took longer than 15 seconds. Please retry.')
    throw new ApiError('Could not reach the assessment API. Check your connection and retry.')
  }
}
