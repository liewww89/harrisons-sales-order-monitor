import { useEffect, useState } from 'react'
import { ArrowClockwiseIcon } from '@phosphor-icons/react/dist/icons/ArrowClockwise'
import { MagnifyingGlassIcon } from '@phosphor-icons/react/dist/icons/MagnifyingGlass'
import { CaretLeftIcon } from '@phosphor-icons/react/dist/icons/CaretLeft'
import { CaretRightIcon } from '@phosphor-icons/react/dist/icons/CaretRight'
import { parseMetadata, parseOrderPage } from './api'
import { buildQuery, INITIAL_QUERY, PAGE_SIZE, statusGroup, withFilters } from './query'
import { useApiResource } from './useApiResource'
import { formatCount, formatTime } from './format'
import { Dashboard } from './components/Dashboard'
import { OrderTable } from './components/OrderTable'
import { ErrorNotice, LoadingRows } from './components/Feedback'

export default function App() {
  const [query, setQuery] = useState(INITIAL_QUERY)
  const [search, setSearch] = useState('')
  const meta = useApiResource('/meta', parseMetadata)
  const orders = useApiResource(buildQuery(query), parseOrderPage)
  const searchPending = search.trim() !== query.q

  useEffect(() => {
    if (search.trim() === query.q) return
    const timer = window.setTimeout(() => {
      setQuery((current) => withFilters(current, { q: search.trim() }))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [search, query.q])

  // Clear old rows/counts immediately, including the debounce interval, so a
  // previous response can never appear to be the result of the active controls.
  const loading = orders.loading || searchPending
  const data = loading ? null : orders.data
  const error = searchPending ? null : orders.error
  const hasFilters = Boolean(search || query.site || query.status)
  const unknownStatuses = new Set([
    ...(meta.data?.facets.statuses.map((s) => s.value) ?? []),
    ...(data?.data.map((o) => o.SalesStatus) ?? []),
  ].filter((s) => statusGroup(s) === 'unknown'))

  function clearFilters() {
    setSearch('')
    setQuery(INITIAL_QUERY)
  }

  function retryOrders() {
    // A changing dataset can invalidate a previously valid later page. Keep
    // its filters, but let the user recover instead of retrying that page.
    if (query.page > 1) setQuery((current) => ({ ...current, page: 1 }))
    else orders.retry()
  }

  function changeFilter(field: 'site' | 'status', value: string) {
    setQuery((current) => withFilters(current, { [field]: value, q: search.trim() }))
  }

  const start = data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0
  const end = data ? Math.min(data.page * data.pageSize, data.total) : 0
  const scope = [query.q ? `Search: “${query.q}”` : '', query.site ? `Branch: ${query.site}` : '', query.status ? `Status: ${query.status}` : ''].filter(Boolean).join(' · ')

  return <>
    <a href="#main" className="skip-link">Skip to orders</a>
    <header className="app-header">
      <div className="brand">
        <svg className="brand-mark" viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 5v22M27 5v22M5 16h22" stroke="currentColor" strokeWidth="5" /><path d="M16 5v7m0 8v7" stroke="currentColor" strokeWidth="3" /></svg>
        <div><span className="brand-name" translate="no">Harrisons Sabah</span><span className="brand-subtitle">Sales operations</span></div>
      </div>
      <span className="assessment-label">Fictional assessment data</span>
    </header>

    <main id="main" className="workspace" tabIndex={-1}>
      <div className="page-heading">
        <div><h1>Sales order monitor</h1><p>Order visibility across every branch.</p></div>
        <div className="refresh-group">
          {data && orders.updatedAt ? <span className="updated">Updated {formatTime(orders.updatedAt)} MYT</span> : null}
          <button className="button secondary refresh" aria-label="Refresh orders" onClick={() => { orders.retry(); meta.retry() }} disabled={loading}>
            <ArrowClockwiseIcon size={17} aria-hidden="true" />Refresh orders
          </button>
        </div>
      </div>

      <Dashboard summary={data?.summary ?? null} loading={loading} />

      <section className="orders-section" aria-labelledby="orders-heading">
        <div className="section-heading orders-heading">
          <div className="orders-title"><h2 id="orders-heading">Sales orders</h2><span className="result-count" aria-live="polite" aria-atomic="true">{loading ? 'Loading…' : data ? `${formatCount(data.total)} ${data.total === 1 ? 'order' : 'orders'}` : 'Unavailable'}</span></div>
          <span className="list-setting">{PAGE_SIZE} per page · Sales ID ascending</span>
        </div>

        {meta.error ? <ErrorNotice title="Branch and status filters unavailable" message={`${meta.error} Orders and search remain available.`} retry={meta.retry} /> : null}

        <form className="filters" role="search" aria-label="Filter sales orders" onSubmit={(e) => { e.preventDefault(); setQuery((current) => withFilters(current, { q: search.trim() })) }}>
          <div className="field search-field">
            <label htmlFor="order-search">Search orders</label>
            <div className="search-input"><MagnifyingGlassIcon size={19} aria-hidden="true" /><input id="order-search" name="q" type="search" placeholder="e.g. sales ID, customer or reference…" value={search} onChange={(e) => setSearch(e.target.value)} autoComplete="off" spellCheck={false} aria-describedby="search-hint" /></div>
          </div>
          <div className="field">
            <label htmlFor="branch-filter">Branch / site</label>
            <select id="branch-filter" name="site" value={query.site} onChange={(e) => changeFilter('site', e.target.value)} disabled={!meta.data}>
              <option value="">{meta.loading ? 'Loading branches…' : meta.error ? 'Filters unavailable' : 'All branches'}</option>
              {!meta.data && query.site ? <option value={query.site}>{query.site}</option> : null}
              {meta.data?.facets.sites.map((site) => <option key={site.value} value={site.value}>{site.value}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="status-filter">Order status</label>
            <select id="status-filter" name="status" value={query.status} onChange={(e) => changeFilter('status', e.target.value)} disabled={!meta.data}>
              <option value="">{meta.loading ? 'Loading statuses…' : meta.error ? 'Filters unavailable' : 'All statuses'}</option>
              {!meta.data && query.status ? <option value={query.status}>{query.status}</option> : null}
              {meta.data?.facets.statuses.map((status) => <option key={status.value} value={status.value}>{status.value}</option>)}
            </select>
          </div>
          <button className="button clear" type="button" onClick={clearFilters} disabled={!hasFilters}>Clear filters</button>
          <p id="search-hint" className="search-hint">Search by sales ID, customer, account, reference or salesperson.</p>
        </form>

        {scope ? <p className="active-filters" aria-label="Active filters">{scope}</p> : null}
        {unknownStatuses.size > 0 ? <p className="data-notice" role="status">Unmapped status: {[...unknownStatuses].join(', ')}. These orders are shown with their original status and are not assigned to a known group.</p> : null}

        <div className="order-results" aria-busy={loading}>
          {loading ? <LoadingRows searching={searchPending} />
            : error ? <ErrorNotice title="Orders could not be loaded" message={error} retry={retryOrders} retryLabel={query.page > 1 ? 'Return to first page' : 'Retry'} />
              : data && data.data.length > 0 ? <OrderTable orders={data.data} />
                : data ? <div className="empty-state" role="status"><MagnifyingGlassIcon size={28} aria-hidden="true" /><h3>No matching orders</h3><p>Try another sales ID or customer, or clear the filters to see all orders.</p><button className="button primary" onClick={clearFilters}>Clear filters</button></div> : null}
        </div>

        <div className="pagination">
          <p aria-live="polite" aria-atomic="true">{data ? `Showing ${formatCount(start)}–${formatCount(end)} of ${formatCount(data.total)} orders` : loading ? 'Updating results…' : 'Results unavailable'}</p>
          <nav aria-label="Order pagination">
            <button className="button secondary" disabled={!data || data.page <= 1} onClick={() => setQuery((current) => ({ ...current, page: current.page - 1 }))}><CaretLeftIcon size={16} aria-hidden="true" />Previous</button>
            <span className="page-number">{data ? `Page ${data.page} of ${data.totalPages}` : 'Page —'}</span>
            <button className="button secondary" disabled={!data || data.page >= data.totalPages} onClick={() => setQuery((current) => ({ ...current, page: current.page + 1 }))}>Next<CaretRightIcon size={16} aria-hidden="true" /></button>
          </nav>
        </div>
      </section>

      <footer className="workspace-footer"><span>Read-only assessment · All customer and order data is fictional.</span><span>Amounts shown as supplied. Currency unspecified.</span></footer>
    </main>
  </>
}
