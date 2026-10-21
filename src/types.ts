// Only the observed API fields used by the app are retained after validation.
export interface SalesOrder {
  SalesId: string
  SalesName: string | null
  CustAccount: string | null
  InventSiteId: string
  CreatedDateTime1: string
  SalesStatus: string
  HAR_TotalSOAmount: number
}

export interface OrderSummary {
  total_orders: number
  filtered_orders: number
  open_orders: number
  invoiced_orders: number
  delivered_orders: number
  cancelled_orders: number
  total_order_value: number
}

export interface OrderPage {
  summary: OrderSummary
  page: number
  pageSize: number
  total: number
  totalPages: number
  data: SalesOrder[]
}

export interface Facet {
  value: string
  count: number
}

export interface ApiMetadata {
  version: string
  readOnly: true
  dataset: { rows: number; primaryKey: string }
  facets: { statuses: Facet[]; sites: Facet[] }
}

export interface OrderQuery {
  q: string
  status: string
  site: string
  page: number
}
