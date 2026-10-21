import { useLayoutEffect, useId, useRef, useState } from "react";
import type { OrderSummary } from "../types";
import { dashboardCounts } from "../query";
import { formatCount } from "../format";
import { useReducedMotion } from "../useReducedMotion";

export function Distribution({ summary }: { summary: OrderSummary }) {
  const counts = dashboardCounts(summary);
  const segments = [
    {
      id: "open",
      name: "Open / pending",
      value: counts.open,
      color: "#6c7df3",
    },
    {
      id: "completed",
      name: "Completed",
      value: counts.completed,
      color: "#7fd9ab",
    },
    {
      id: "cancelled",
      name: "Cancelled",
      value: counts.cancelled,
      color: "#f77f7b",
    },
    ...(counts.unknown
      ? [
          {
            id: "unknown",
            name: "Unclassified",
            value: counts.unknown,
            color: "#8b91a8",
          },
        ]
      : []),
  ];
  const [selected, setSelected] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const [focused, setFocused] = useState<string | null>(null);
  const active = hovered ?? focused ?? selected;
  const highlighted = segments.find((s) => s.id === active);
  const maskId = useId();
  const reveal = useRef<SVGCircleElement>(null);
  const reducedMotion = useReducedMotion();

  useLayoutEffect(() => {
    if (
      reducedMotion ||
      !reveal.current ||
      typeof reveal.current.animate !== "function"
    )
      return;
    // The underlying SVG is always in its final state. Cancelling on unmount or
    // a live preference change therefore cannot leave an invisible chart.
    try {
      const animation = reveal.current.animate(
        [{ strokeDashoffset: "100" }, { strokeDashoffset: "0" }],
        { duration: 900, easing: "cubic-bezier(0.25, 0.7, 0.3, 1)" },
      );
      return () => animation.cancel();
    } catch {
      // Animation support/failure must never hide the final chart or crash UI.
      return;
    }
  }, [
    reducedMotion,
    summary.total_orders,
    summary.open_orders,
    summary.invoiced_orders,
    summary.delivered_orders,
    summary.cancelled_orders,
  ]);

  function toggle(id: string) {
    setSelected((old) => (old === id ? null : id));
  }
  let offset = 0;

  return (
    <section
      className="card distribution"
      aria-labelledby="distribution-heading"
    >
      <h2 id="distribution-heading">Order distribution</h2>
      <div className="distribution-content">
        <div className="donut" data-active={active ?? ""}>
          <svg viewBox="0 0 200 200" aria-label="Global order distribution">
            <defs>
              <mask id={maskId}>
                <circle
                  ref={reveal}
                  cx="100"
                  cy="100"
                  r="76"
                  pathLength="100"
                  fill="none"
                  stroke="white"
                  strokeWidth="46"
                  strokeDasharray="100 100"
                  strokeDashoffset="0"
                  transform="rotate(-90 100 100)"
                />
              </mask>
            </defs>
            <circle
              cx="100"
              cy="100"
              r="76"
              fill="none"
              stroke="#eceffd"
              strokeWidth="27"
            />
            <g mask={`url(#${maskId})`}>
              {segments.map((segment) => {
                const share = counts.total
                  ? (segment.value / counts.total) * 100
                  : 0;
                const start = offset;
                offset += share;
                if (!share) return null;
                return (
                  <circle
                    key={segment.id}
                    className="donut-segment"
                    data-segment={segment.id}
                    data-value={segment.value}
                    data-share={share}
                    data-highlighted={active === segment.id}
                    data-muted={Boolean(active && active !== segment.id)}
                    cx="100"
                    cy="100"
                    r="76"
                    pathLength="100"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="27"
                    strokeDasharray={`${Math.max(0, share - 0.8)} ${100 - Math.max(0, share - 0.8)}`}
                    strokeDashoffset={-start}
                    transform="rotate(-90 100 100)"
                    role="button"
                    tabIndex={0}
                    aria-label={`${segment.name}: ${formatCount(segment.value)} orders, ${Math.round(share)}%`}
                    aria-pressed={selected === segment.id}
                    onClick={() => toggle(segment.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggle(segment.id);
                      }
                    }}
                    onFocus={() => setFocused(segment.id)}
                    onBlur={() => setFocused(null)}
                    onPointerEnter={(event) => {
                      if (
                        event.pointerType === "mouse" &&
                        window.matchMedia("(hover: hover)").matches
                      )
                        setHovered(segment.id);
                    }}
                    onPointerLeave={() => setHovered(null)}
                  />
                );
              })}
            </g>
          </svg>
          <div className="donut-center" aria-hidden="true">
            <strong>{formatCount(highlighted?.value ?? counts.total)}</strong>
            <span>{highlighted?.name ?? "orders"}</span>
          </div>
        </div>
        <div className="distribution-legend" aria-label="Distribution legend">
          {segments.map((segment) => (
            <button
              key={segment.id}
              className="legend-item"
              aria-pressed={selected === segment.id}
              data-highlighted={active === segment.id}
              onClick={() => toggle(segment.id)}
              onFocus={() => setFocused(segment.id)}
              onBlur={() => setFocused(null)}
              onPointerEnter={(event) => {
                if (
                  event.pointerType === "mouse" &&
                  window.matchMedia("(hover: hover)").matches
                )
                  setHovered(segment.id);
              }}
              onPointerLeave={() => setHovered(null)}
            >
              <span
                className="legend-dot"
                style={{ backgroundColor: segment.color }}
                aria-hidden="true"
              />
              <span>{segment.name}</span>
              <strong>{formatCount(segment.value)}</strong>
              <span className="legend-percent">
                {counts.total
                  ? Math.round((segment.value / counts.total) * 100)
                  : 0}
                %
              </span>
            </button>
          ))}
        </div>
      </div>
      <p className="chart-hint">
        Select a segment or legend to highlight its share.
      </p>
    </section>
  );
}
