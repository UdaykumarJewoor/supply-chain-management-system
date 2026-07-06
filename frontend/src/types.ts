export interface Item {
  name: string; // Item Code (e.g., ITEM-0001)
  item_name: string;
  sku: string;
  item_group: string;
  stock_uom: string;
  valuation_rate: number;
  standard_selling_rate: number;
  current_stock: number;
  reorder_level: number;
  reorder_qty: number;
  description?: string;
  [key: string]: any;
}

export interface Warehouse {
  name: string; // Warehouse name (e.g., Main Store - SCMS)
  warehouse_name: string;
  parent_warehouse?: string;
  type: 'Store' | 'Transit' | 'Inspection' | 'Work In Progress';
  current_capacity: number;
  max_capacity: number;
  [key: string]: any;
}

export interface Supplier {
  name: string;
  supplier_group: string;
  status: 'Active' | 'Inactive';
  contact_email?: string;
  contact_phone?: string;
  address?: string;
  [key: string]: any;
}

export interface Customer {
  name: string;
  customer_group: string;
  status: 'Active' | 'Inactive';
  email?: string;
  phone?: string;
  address?: string;
  [key: string]: any;
}

export interface PurchaseOrderItem {
  item_code: string;
  item_name: string;
  qty: number;
  received_qty: number;
  rate: number;
  amount: number;
  uom: string;
}

export interface PurchaseOrder {
  name: string;
  supplier: string;
  transaction_date: string;
  schedule_date?: string;
  status: 'Draft' | 'Submitted' | 'Received' | 'Billed' | 'Cancelled';
  items: PurchaseOrderItem[];
  grand_total: number;
  total_qty: number;
  [key: string]: any;
}

export interface SalesOrderItem {
  item_code: string;
  item_name: string;
  qty: number;
  delivered_qty: number;
  rate: number;
  amount: number;
  uom: string;
}

export interface SalesOrder {
  name: string;
  customer: string;
  transaction_date: string;
  delivery_date?: string;
  status: 'Draft' | 'Submitted' | 'Shipped' | 'Billed' | 'Cancelled';
  items: SalesOrderItem[];
  grand_total: number;
  total_qty: number;
  [key: string]: any;
}

export interface StockLedgerEntry {
  name: string;
  item_code: string;
  warehouse: string;
  actual_qty: number; // positive for inward, negative for outward
  valuation_rate: number;
  voucher_type: 'Purchase Receipt' | 'Delivery Note' | 'Stock Entry';
  voucher_no: string;
  posting_date: string;
  posting_time: string;
}

export interface StockEntryDetail {
  item_code: string;
  qty: number;
  uom: string;
  valuation_rate: number;
}

export interface StockEntry {
  name: string;
  posting_date: string;
  purpose: 'Material Receipt' | 'Material Issue' | 'Material Transfer';
  from_warehouse?: string;
  to_warehouse?: string;
  items: StockEntryDetail[];
}

export interface ERPNextConfig {
  url: string;
  apiKey: string;
  apiSecret: string;
  connected: boolean;
}
