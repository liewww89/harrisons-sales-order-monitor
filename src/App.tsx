import { useEffect, useRef, useState } from "react";
import { ArrowClockwiseIcon } from "@phosphor-icons/react/dist/icons/ArrowClockwise";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/icons/MagnifyingGlass";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/icons/CaretLeft";
import { CaretRightIcon } from "@phosphor-icons/react/dist/icons/CaretRight";
import { parseMetadata, parseOrderPage } from "./api";
import {
  buildQuery,
  INITIAL_QUERY,
  PAGE_SIZE,
  statusGroup,
  withFilters,
} from "./query";
import { useApiResource } from "./useApiResource";
import { formatCount, formatTime } from "./format";
import { Dashboard } from "./components/Dashboard";
import { OrderTable } from "./components/OrderTable";
import { ErrorNotice, LoadingRows } from "./components/Feedback";
import { Navigation } from "./components/Navigation";
import { currentView } from "./navigation";
import { Distribution } from "./components/Distribution";
import { FilesIcon } from "@phosphor-icons/react/dist/icons/Files";
import { InfoIcon } from "@phosphor-icons/react/dist/icons/Info";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/icons/ArrowRight";

export default function App() {
  const [view, setView] = useState(currentView);
  const heading = useRef<HTMLHeadingElement>(null);
  const previousView = useRef(view);
  const [query, setQuery] = useState(INITIAL_QUERY);
  const [search, setSearch] = useState("");
  const meta = useApiResource("/meta", parseMetadata);
  const orders = useApiResource(buildQuery(query), parseOrderPage);
  const searchPending = search.trim() !== query.q;

  useEffect(() => {
    const navigate = () => setView(currentView());
    window.addEventListener("hashchange", navigate);
    return () => window.removeEventListener("hashchange", navigate);
  }, []);

  useEffect(() => {
    document.title = `${view === "overview" ? "Overview" : "Sales orders"} · Harrisons Enhanced`;
    if (previousView.current !== view)
      heading.current?.focus({ preventScroll: true });
    previousView.current = view;
  }, [view]);

  useEffect(() => {
    if (search.trim() === query.q) return;
    const timer = window.setTimeout(() => {
      setQuery((current) => withFilters(current, { q: search.trim() }));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, query.q]);

  // Clear old rows/counts immediately, including the debounce interval, so a
  // previous response can never appear to be the result of the active controls.
  const loading = orders.loading || searchPending;
  const data = loading ? null : orders.data;
  const error = searchPending ? null : orders.error;
  const hasFilters = Boolean(search || query.site || query.status);
  const unknownStatuses = new Set(
    [
      ...(meta.data?.facets.statuses.map((s) => s.value) ?? []),
      ...(data?.data.map((o) => o.SalesStatus) ?? []),
    ].filter((s) => statusGroup(s) === "unknown"),
  );

  function clearFilters() {
    setSearch("");
    setQuery(INITIAL_QUERY);
  }

  function retryOrders() {
    // A changing dataset can invalidate a previously valid later page. Keep
    // its filters, but let the user recover instead of retrying that page.
    if (query.page > 1) setQuery((current) => ({ ...current, page: 1 }));
    else orders.retry();
  }

  function changeFilter(field: "site" | "status", value: string) {
    setQuery((current) =>
      withFilters(current, { [field]: value, q: search.trim() }),
    );
  }

  const start =
    data && data.total > 0 ? (data.page - 1) * data.pageSize + 1 : 0;
  const end = data ? Math.min(data.page * data.pageSize, data.total) : 0;
  const scope = [
    query.q ? `Search: “${query.q}”` : "",
    query.site ? `Branch: ${query.site}` : "",
    query.status ? `Status: ${query.status}` : "",
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <div className="app-shell">
      <a
        href="#main"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to orders
      </a>
      <Navigation view={view} />
      <main id="main" className="workspace" tabIndex={-1}>
        <div className="breadcrumb">
          <span>
            Sales operations <span aria-hidden="true">/</span>{" "}
            <strong>{view === "overview" ? "Overview" : "Sales orders"}</strong>
          </span>
          <span>Fictional assessment data</span>
        </div>
        <div className="page-heading">
          <div>
            <h1 ref={heading} tabIndex={-1}>
              {view === "overview" ? "Overview" : "Sales orders"}
            </h1>
            <p>
              {view === "overview"
                ? "A snapshot of orders across every branch."
                : "Search and review orders across every branch."}
            </p>
          </div>
          <div className="refresh-group">
            <span className="updated" role="status">
              {orders.loading
                ? "Fetching orders…"
                : error
                  ? "Order update failed"
                  : data && orders.updatedAt
                    ? `Received ${formatTime(orders.updatedAt)} MYT`
                    : ""}
              {meta.error ? (
                <span className="metadata-warning">Filters unavailable</span>
              ) : null}
            </span>
            <button
              className="button primary refresh"
              aria-label="Refresh orders"
              aria-busy={orders.loading || meta.loading}
              onClick={() => {
                orders.retry();
                meta.retry();
              }}
              disabled={loading || meta.loading}
            >
              <span
                className={
                  orders.loading || meta.loading
                    ? "refresh-icon is-pending"
                    : "refresh-icon"
                }
              >
                <ArrowClockwiseIcon size={19} aria-hidden="true" />
              </span>
              Refresh orders
            </button>
          </div>
        </div>
        <div className="view-content" key={view}>
          {view === "overview" ? (
            <>
              <Dashboard summary={data?.summary ?? null} loading={loading} />
              <div className="overview-panels">
                {data ? (
                  <Distribution summary={data.summary} />
                ) : (
                  <section
                    className="card distribution"
                    aria-labelledby="distribution-heading"
                  >
                    <h2 id="distribution-heading">Order distribution</h2>
                    <p className="chart-unavailable" role="status">
                      {loading
                        ? "Loading summary…"
                        : "Summary unavailable. Retry the order request below."}
                    </p>
                  </section>
                )}
                <section
                  className="card explore"
                  aria-labelledby="explore-heading"
                >
                  <h2 id="explore-heading">Explore sales operations</h2>
                  <a className="explore-link" href="#orders">
                    <span className="explore-icon">
                      <FilesIcon size={27} aria-hidden="true" />
                    </span>
                    <span>
                      <strong>Sales orders</strong>
                      <small>Search, filter and review individual orders</small>
                    </span>
                    <ArrowRightIcon size={22} aria-hidden="true" />
                  </a>
                  <div className="info-note">
                    <InfoIcon size={26} aria-hidden="true" />
                    <p>
                      Completed includes Invoiced and Delivered.
                      <br />
                      Overview totals are unaffected by filters.
                    </p>
                  </div>
                </section>
              </div>
              <section
                className="card preview-section"
                aria-labelledby="preview-heading"
              >
                <div className="section-heading">
                  <div>
                    <h2 id="preview-heading">Order preview</h2>
                    <p>
                      {scope || "All orders"} · page {query.page} · Sales ID
                      ascending
                    </p>
                  </div>
                  <a className="text-link" href="#orders">
                    View sales orders
                    <ArrowRightIcon size={17} aria-hidden="true" />
                  </a>
                </div>
                <div className="order-results" aria-busy={loading}>
                  {loading ? (
                    <LoadingRows searching={searchPending} />
                  ) : error ? (
                    <ErrorNotice
                      title="Orders could not be loaded"
                      message={error}
                      retry={retryOrders}
                      retryLabel={query.page > 1 ? "Return to first page" : "Retry"}
                    />
                  ) : data?.data.length ? (
                    <OrderTable orders={data.data.slice(0, 4)} preview />
                  ) : (
                    <div className="empty-state">
                      <h3>No matching orders</h3>
                      <p>Your active filters have no matches.</p>
                      <button
                        className="button secondary"
                        onClick={clearFilters}
                      >
                        Clear filters
                      </button>
                    </div>
                  )}
                </div>
                {meta.error ? (
                  <ErrorNotice
                    title="Branch and status filters unavailable"
                    message={`${meta.error} Orders and search remain available.`}
                    retry={meta.retry}
                  />
                ) : null}
              </section>
            </>
          ) : (
            <>
              <section
                className="orders-section card"
                aria-labelledby="orders-heading"
              >
                <div className="section-heading orders-heading">
                  <div className="orders-title">
                    <h2 id="orders-heading" className="sr-only">
                      Sales order results
                    </h2>
                    <span
                      className="result-count"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {loading
                        ? "Loading…"
                        : data
                          ? `${formatCount(data.total)} ${data.total === 1 ? "order" : "orders"}`
                          : "Unavailable"}
                    </span>
                  </div>
                  <span className="list-setting">
                    {PAGE_SIZE} per page · Sales ID ascending
                  </span>
                </div>

                {meta.error ? (
                  <ErrorNotice
                    title="Branch and status filters unavailable"
                    message={`${meta.error} Orders and search remain available.`}
                    retry={meta.retry}
                  />
                ) : null}

                <form
                  className="filters"
                  role="search"
                  aria-label="Filter sales orders"
                  onSubmit={(e) => {
                    e.preventDefault();
                    setQuery((current) =>
                      withFilters(current, { q: search.trim() }),
                    );
                  }}
                >
                  <div className="field search-field">
                    <label htmlFor="order-search">Search orders</label>
                    <div className="search-input">
                      <MagnifyingGlassIcon size={19} aria-hidden="true" />
                      <input
                        id="order-search"
                        name="q"
                        type="search"
                        placeholder="e.g. sales ID, customer or reference…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        autoComplete="off"
                        spellCheck={false}
                        aria-describedby="search-hint"
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label htmlFor="branch-filter">Branch / site</label>
                    <select
                      id="branch-filter"
                      name="site"
                      value={query.site}
                      onChange={(e) => changeFilter("site", e.target.value)}
                      disabled={!meta.data}
                    >
                      <option value="">
                        {meta.loading
                          ? "Loading branches…"
                          : meta.error
                            ? "Filters unavailable"
                            : "All branches"}
                      </option>
                      {!meta.data && query.site ? (
                        <option value={query.site}>{query.site}</option>
                      ) : null}
                      {meta.data?.facets.sites.map((site) => (
                        <option key={site.value} value={site.value}>
                          {site.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="field">
                    <label htmlFor="status-filter">Order status</label>
                    <select
                      id="status-filter"
                      name="status"
                      value={query.status}
                      onChange={(e) => changeFilter("status", e.target.value)}
                      disabled={!meta.data}
                    >
                      <option value="">
                        {meta.loading
                          ? "Loading statuses…"
                          : meta.error
                            ? "Filters unavailable"
                            : "All statuses"}
                      </option>
                      {!meta.data && query.status ? (
                        <option value={query.status}>{query.status}</option>
                      ) : null}
                      {meta.data?.facets.statuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.value}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    className="button clear"
                    type="button"
                    onClick={clearFilters}
                    disabled={!hasFilters}
                  >
                    Clear filters
                  </button>
                  <p id="search-hint" className="search-hint">
                    Search by sales ID, customer, account, reference or
                    salesperson.
                  </p>
                </form>

                {scope ? (
                  <p className="active-filters" aria-label="Active filters">
                    {scope}
                  </p>
                ) : null}
                {unknownStatuses.size > 0 ? (
                  <p className="data-notice" role="status">
                    Unmapped status: {[...unknownStatuses].join(", ")}. These
                    orders are shown with their original status and are not
                    assigned to a known group.
                  </p>
                ) : null}

                <div className="order-results" aria-busy={loading}>
                  {loading ? (
                    <LoadingRows searching={searchPending} />
                  ) : error ? (
                    <ErrorNotice
                      title="Orders could not be loaded"
                      message={error}
                      retry={retryOrders}
                      retryLabel={query.page > 1 ? "Return to first page" : "Retry"}
                    />
                  ) : data && data.data.length > 0 ? (
                    <OrderTable orders={data.data} />
                  ) : data ? (
                    <div className="empty-state" role="status">
                      <MagnifyingGlassIcon size={28} aria-hidden="true" />
                      <h3>No matching orders</h3>
                      <p>
                        Try another sales ID or customer, or clear the filters
                        to see all orders.
                      </p>
                      <button className="button primary" onClick={clearFilters}>
                        Clear filters
                      </button>
                    </div>
                  ) : null}
                </div>

                <div className="pagination">
                  <p aria-live="polite" aria-atomic="true">
                    {data
                      ? `Showing ${formatCount(start)}–${formatCount(end)} of ${formatCount(data.total)} orders`
                      : loading
                        ? "Updating results…"
                        : "Results unavailable"}
                  </p>
                  <nav aria-label="Order pagination">
                    <button
                      className="button secondary"
                      disabled={!data || data.page <= 1}
                      onClick={() =>
                        setQuery((current) => ({
                          ...current,
                          page: current.page - 1,
                        }))
                      }
                    >
                      <CaretLeftIcon size={16} aria-hidden="true" />
                      Previous
                    </button>
                    <span className="page-number">
                      {data
                        ? `Page ${data.page} of ${data.totalPages}`
                        : "Page —"}
                    </span>
                    <button
                      className="button secondary"
                      disabled={!data || data.page >= data.totalPages}
                      onClick={() =>
                        setQuery((current) => ({
                          ...current,
                          page: current.page + 1,
                        }))
                      }
                    >
                      Next
                      <CaretRightIcon size={16} aria-hidden="true" />
                    </button>
                  </nav>
                </div>
              </section>
              <p className="summary-scope">
                All orders · unaffected by filters
                <span>
                  Overview totals are global; the order count above matches your
                  filters.
                </span>
              </p>
            </>
          )}
          {unknownStatuses.size > 0 && view === "overview" ? (
            <p className="data-notice" role="status">
              Unmapped status: {[...unknownStatuses].join(", ")}. Original
              status retained; not assigned to a known group.
            </p>
          ) : null}
        </div>
        <footer className="workspace-footer">
          <span>
            Read-only assessment · All customer and order data is fictional.
          </span>
          <span>Amounts shown as supplied. Currency unspecified.</span>
        </footer>
      </main>
    </div>
  );
}
