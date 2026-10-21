import type { SalesOrder } from "../types";
import { formatAmount, formatDate } from "../format";
import { statusGroup } from "../query";

export function OrderTable({
  orders,
  preview = false,
}: {
  orders: SalesOrder[];
  preview?: boolean;
}) {
  return (
    <div
      className={`table-scroll${preview ? " preview-scroll" : ""}`}
      tabIndex={0}
      role="region"
      aria-label="Sales orders table, scroll for more orders"
    >
      <table>
        <caption className="sr-only">
          Sales orders. Amounts are the original API values; currency is not
          specified. Order dates use Malaysia time.
        </caption>
        <colgroup>
          <col className="col-id" />
          <col className="col-customer" />
          <col className="col-branch" />
          <col className="col-date" />
          <col className="col-status" />
          <col className="col-amount" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">Sales ID</th>
            <th scope="col">Customer</th>
            <th scope="col">Branch / site</th>
            <th scope="col">
              Order date <span className="th-note">MYT</span>
            </th>
            <th scope="col">Status</th>
            <th scope="col" className="amount">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order, index) => {
            const group = statusGroup(order.SalesStatus);
            return (
              <tr
                key={order.SalesId}
                style={{ animationDelay: `${Math.min(index, 5) * 15}ms` }}
              >
                <th
                  scope="row"
                  className="order-id"
                  data-label="Sales ID"
                  translate="no"
                >
                  {order.SalesId}
                </th>
                <td className="customer" data-label="Customer">
                  <span>{order.SalesName ?? "Customer name unavailable"}</span>
                  {order.CustAccount ? (
                    <small translate="no">{order.CustAccount}</small>
                  ) : null}
                </td>
                <td
                  className="branch"
                  data-label="Branch / site"
                  translate="no"
                >
                  {order.InventSiteId}
                </td>
                <td className="order-date" data-label="Order date (MYT)">
                  <time dateTime={order.CreatedDateTime1}>
                    {formatDate(order.CreatedDateTime1)}
                  </time>
                </td>
                <td className="order-status" data-label="Status">
                  <span
                    className={`status status-${group} ${order.SalesStatus.trim().toLowerCase() === "invoiced" ? "status-invoiced" : ""}`}
                  >
                    {group === "unknown"
                      ? `Unmapped: ${order.SalesStatus}`
                      : order.SalesStatus}
                  </span>
                </td>
                <td className="amount" data-label="Amount">
                  {formatAmount(order.HAR_TotalSOAmount)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
