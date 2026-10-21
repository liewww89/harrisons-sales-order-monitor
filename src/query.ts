import type { OrderQuery, OrderSummary } from './types'

export const PAGE_SIZE = 25
export const INITIAL_QUERY: OrderQuery = { q: '', site: '', status: '', page: 1 }

export function buildQuery(query: OrderQuery): string {
  const params = new URLSearchParams({ page: String(query.page), pageSize: String(PAGE_SIZE) })
  if (query.q.trim()) params.set('q', query.q.trim())
  if (query.site) params.set('site', query.site)
  if (query.status) params.set('status', query.status)
  return `?${params.toString()}`
}

export function withFilters(query: OrderQuery, filters: Partial<Pick<OrderQuery, 'q' | 'site' | 'status'>>): OrderQuery {
  return { ...query, ...filters, page: 1 }
}

export type StatusGroup = 'open' | 'completed' | 'cancelled' | 'unknown'

export function statusGroup(status: string): StatusGroup {
  switch (status.trim().toLowerCase()) {
    case 'open order': return 'open'
    case 'invoiced':
    case 'delivered': return 'completed'
    case 'cancelled': return 'cancelled'
    default: return 'unknown'
  }
}

export function dashboardCounts(summary: OrderSummary) {
  const completed = summary.invoiced_orders + summary.delivered_orders
  return {
    total: summary.total_orders,
    open: summary.open_orders,
    completed,
    cancelled: summary.cancelled_orders,
    unknown: summary.total_orders - summary.open_orders - completed - summary.cancelled_orders,
    value: summary.total_order_value,
  }
}
