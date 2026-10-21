import type { OrderSummary } from '../types'
import { dashboardCounts } from '../query'
import { formatAmount, formatCount } from '../format'

interface Props { summary: OrderSummary | null; loading: boolean }

export function Dashboard({ summary, loading }: Props) {
  const counts = summary ? dashboardCounts(summary) : null
  const metrics = [
    { label: 'Total orders', value: counts?.total, note: 'Across all branches', className: '' },
    { label: 'Open / pending', value: counts?.open, note: 'Open order', className: 'metric-open' },
    { label: 'Completed', value: counts?.completed, note: 'Invoiced + delivered', className: '' },
    { label: 'Cancelled', value: counts?.cancelled, note: 'Cancelled orders', className: '' },
    { label: 'Total order value', value: counts?.value, note: 'Currency not specified by API', className: 'metric-value' },
  ]

  return <section className="overview" aria-labelledby="overview-heading" aria-busy={loading}>
    <div className="section-heading overview-heading">
      <h2 id="overview-heading">Order overview</h2>
      <span>All orders · unaffected by filters</span>
    </div>
    <dl className="metrics">
      {metrics.map((metric) => <div className={`metric ${metric.className}`} key={metric.label}>
        <dt>{metric.label}</dt>
        <dd>
          {loading ? <span className="skeleton metric-skeleton" aria-label="Loading" />
            : metric.value === undefined ? <span className="unavailable">—</span>
              : metric.className === 'metric-value' ? formatAmount(metric.value) : formatCount(metric.value)}
        </dd>
        <span className="metric-note">{metric.note}</span>
      </div>)}
    </dl>
    {counts && counts.unknown > 0 ? <p className="data-notice" role="status">{formatCount(counts.unknown)} orders have an unclassified status and are included in the total only.</p> : null}
  </section>
}
