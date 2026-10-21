import { describe, expect, it } from 'vitest'
import { buildQuery, dashboardCounts, INITIAL_QUERY, statusGroup, withFilters } from './query'

describe('query and status logic', () => {
  it('encodes combined filters without treating reserved characters as parameters', () => {
    const value = 'Siti & Sons + / 北'
    const params = new URLSearchParams(buildQuery({ page: 3, q: `  ${value}  `, site: 'B20', status: 'Open order' }))
    expect(Object.fromEntries(params)).toEqual({ page: '3', pageSize: '25', q: value, site: 'B20', status: 'Open order' })
  })

  it('omits empty filters', () => {
    expect(buildQuery({ ...INITIAL_QUERY, q: '   ' })).toBe('?page=1&pageSize=25')
  })

  it.each([{ q: 'Siti' }, { site: 'B20' }, { status: 'Cancelled' }])('resets pagination when applying %j', (change) => {
    const previous = { q: '', site: 'A10', status: '', page: 4 }
    const result = withFilters(previous, change)
    expect(result).toEqual({ ...previous, ...change, page: 1 })
    expect(previous.page).toBe(4)
  })

  it.each([
    ['Open order', 'open'], ['Invoiced', 'completed'], ['Delivered', 'completed'],
    ['Cancelled', 'cancelled'], [' delivered ', 'completed'], ['Awaiting approval', 'unknown'],
  ])('maps observed or unknown status %s to %s', (status, expected) => {
    expect(statusGroup(status)).toBe(expected)
  })

  it('uses dataset-wide summary values rather than filtered or page counts', () => {
    expect(dashboardCounts({ total_orders: 1200, filtered_orders: 6, open_orders: 420, invoiced_orders: 360, delivered_orders: 300, cancelled_orders: 120, total_order_value: 998244.3 }))
      .toEqual({ total: 1200, open: 420, completed: 660, cancelled: 120, unknown: 0, value: 998244.3 })
  })

  it('keeps unexpected status totals explicit', () => {
    expect(dashboardCounts({ total_orders: 10, filtered_orders: 10, open_orders: 1, invoiced_orders: 2, delivered_orders: 3, cancelled_orders: 1, total_order_value: 0 }).unknown).toBe(3)
  })
})
