import type { OrderSummary } from "../types";
import { dashboardCounts } from "../query";
import { formatAmount, formatCount } from "../format";
import { FilesIcon } from "@phosphor-icons/react/dist/icons/Files";
import { ClockIcon } from "@phosphor-icons/react/dist/icons/Clock";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/icons/CheckCircle";
import { XCircleIcon } from "@phosphor-icons/react/dist/icons/XCircle";
import { CoinsIcon } from "@phosphor-icons/react/dist/icons/Coins";

interface Props {
  summary: OrderSummary | null;
  loading: boolean;
}

export function Dashboard({ summary, loading }: Props) {
  const counts = summary ? dashboardCounts(summary) : null;
  const metrics = [
    {
      label: "Total orders",
      value: counts?.total,
      note: "Across all branches",
      className: "metric-total",
      Icon: FilesIcon,
    },
    {
      label: "Open / pending",
      value: counts?.open,
      note: "Open order",
      className: "metric-open",
      Icon: ClockIcon,
    },
    {
      label: "Completed",
      value: counts?.completed,
      note: "Invoiced + delivered",
      className: "metric-completed",
      Icon: CheckCircleIcon,
    },
    {
      label: "Cancelled",
      value: counts?.cancelled,
      note: "Cancelled orders",
      className: "metric-cancelled",
      Icon: XCircleIcon,
    },
    {
      label: "Total order value",
      value: counts?.value,
      note: "Currency unspecified",
      className: "metric-value",
      Icon: CoinsIcon,
    },
  ];

  return (
    <section
      className="overview"
      aria-labelledby="overview-heading"
      aria-busy={loading}
    >
      <div className="section-heading overview-heading">
        <h2 id="overview-heading" className="sr-only">
          Order overview
        </h2>
        <span>All orders · unaffected by filters</span>
      </div>
      <dl className="metrics">
        {metrics.map((metric, index) => (
          <div
            className={`card metric ${metric.className}`}
            key={metric.label}
            style={{ animationDelay: `${index * 30}ms` }}
          >
            <span className="metric-icon">
              <metric.Icon size={21} aria-hidden="true" />
            </span>
            <dt>{metric.label}</dt>
            <dd>
              {loading ? (
                <span
                  className="skeleton metric-skeleton"
                  aria-label="Loading"
                />
              ) : metric.value === undefined ? (
                <span className="unavailable">—</span>
              ) : metric.className === "metric-value" ? (
                formatAmount(metric.value)
              ) : (
                formatCount(metric.value)
              )}
            </dd>
            <span className="metric-note">{metric.note}</span>
          </div>
        ))}
      </dl>
      {counts && counts.unknown > 0 ? (
        <p className="data-notice" role="status">
          {formatCount(counts.unknown)} orders have an unclassified status and
          are included in the total only.
        </p>
      ) : null}
    </section>
  );
}
