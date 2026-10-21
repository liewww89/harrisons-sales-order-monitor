import type { SalesOrder } from '../types'
import { formatAmount, formatDate } from '../format'
import { statusGroup } from '../query'

export function OrderTable({ orders }: { orders: SalesOrder[] }) {
  return <div className="table-scroll" tabIndex={0} role="region" aria-label="Sales orders table, scroll for more orders">
    <table>
      <caption className="sr-only">Sales orders. Amounts are the original API values; currency is not specified. Order dates use Malaysia time.</caption>
      <colgroup><col className="col-id" /><col className="col-customer" /><col className="col-branch" /><col className="col-date" /><col className="col-status" /><col className="col-amount" /></colgroup>
      <thead><tr>
        <th scope="col">Sales ID</th><th scope="col">Customer</th><th scope="col">Branch / site</th>
        <th scope="col">Order date <span className="th-note">MYT</span></th><th scope="col">Status</th><th scope="col" className="amount">Amount</th>
      </tr></thead>
      <tbody>{orders.map((order) => {
        const group = statusGroup(order.SalesStatus)
        return <tr key={order.SalesId}>
          <th scope="row" className="order-id" data-label="Sales ID" translate="no">{order.SalesId}</th>
          <td className="customer" data-label="Customer"><span>{order.SalesName ?? 'Customer name unavailable'}</span>{order.CustAccount ? <small translate="no">{order.CustAccount}</small> : null}</td>
          <td className="branch" data-label="Branch / site" translate="no">{order.InventSiteId}</td>
          <td className="order-date" data-label="Order date (MYT)"><time dateTime={order.CreatedDateTime1}>{formatDate(order.CreatedDateTime1)}</time></td>
          <td className="order-status" data-label="Status"><span className={`status status-${group}`}>{group === 'unknown' ? `Unmapped: ${order.SalesStatus}` : order.SalesStatus}</span></td>
          <td className="amount" data-label="Amount">{formatAmount(order.HAR_TotalSOAmount)}</td>
        </tr>
      })}</tbody>
    </table>
  </div>
}
