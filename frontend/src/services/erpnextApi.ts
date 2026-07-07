import { ERPNextConfig, Item, Warehouse, Supplier, Customer, PurchaseOrder } from '../types';

const CONFIG_KEY = 'scms_erpnext_config';
const BACKEND_URL = 'http://localhost:5000';

export const getStoredConfig = (): ERPNextConfig => {
  const stored = localStorage.getItem(CONFIG_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // Ignore
    }
  }
  return {
    url: '',
    apiKey: '',
    apiSecret: '',
    connected: false,
  };
};

export const saveConfig = (config: ERPNextConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

// Sync config variables to Express backend
const syncConfigToBackend = async (config: ERPNextConfig): Promise<void> => {
  try {
    await fetch(`${BACKEND_URL}/api/erpnext/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: config.url,
        apiKey: config.apiKey,
        apiSecret: config.apiSecret,
      }),
    });
  } catch (error) {
    console.error('Failed to sync config with Express backend:', error);
  }
};

export const testERPNextConnection = async (config: ERPNextConfig): Promise<{ success: boolean; message: string; username?: string }> => {
  if (!config.url || !config.apiKey || !config.apiSecret) {
    return { success: false, message: 'Missing API connection credentials.' };
  }

  try {
    // 1. Sync credentials to backend
    await syncConfigToBackend(config);

    // 2. Call test-connection on Express proxy
    const response = await fetch(`${BACKEND_URL}/api/erpnext/test-connection`, {
      method: 'GET',
    });

    if (response.ok) {
      const data: any = await response.json();
      return {
        success: true,
        message: 'Connected successfully via Backend Proxy!',
        username: data.username || 'Administrator',
      };
    } else {
      const err = await response.json().catch(() => ({ message: 'HTTP Error ' + response.status }));
      return {
        success: false,
        message: err.message || `HTTP Error ${response.status}`,
      };
    }
  } catch (error: any) {
    console.error('ERPNext Connection Error:', error);
    return {
      success: false,
      message: `Failed to connect. Proxy server offline: ${error.message || error}.`,
    };
  }
};

// Fetch Items from ERPNext via proxy
export const fetchERPNextItems = async (config: ERPNextConfig): Promise<Item[]> => {
  if (!config.connected) return [];
  
  // Update backend config first
  await syncConfigToBackend(config);

  const response = await fetch(`${BACKEND_URL}/api/erpnext/items`);

  if (!response.ok) {
    throw new Error(`Failed to fetch items from proxy: ${response.statusText}`);
  }

  const data: any = await response.json();
  const rawItems = data.data || [];

  return rawItems.map((ri: any) => ({
    name: ri.name,
    item_name: ri.item_name || ri.name,
    sku: ri.name,
    item_group: ri.item_group || 'Products',
    stock_uom: ri.stock_uom || 'Nos',
    valuation_rate: ri.valuation_rate || 0,
    standard_selling_rate: ri.standard_selling_rate || (ri.valuation_rate ? ri.valuation_rate * 1.5 : 15.0),
    current_stock: 0,
    reorder_level: ri.safety_stock || 0,
    reorder_qty: ri.min_order_qty || 0,
    description: ri.description || '',
    ...ri,
  }));
};

// Fetch Warehouses via proxy
export const fetchERPNextWarehouses = async (config: ERPNextConfig): Promise<Warehouse[]> => {
  if (!config.connected) return [];
  
  await syncConfigToBackend(config);

  const response = await fetch(`${BACKEND_URL}/api/erpnext/warehouses`);

  if (!response.ok) {
    throw new Error(`Failed to fetch warehouses from proxy: ${response.statusText}`);
  }

  const data: any = await response.json();
  const rawWarehouses = data.data || [];

  return rawWarehouses.map((rw: any) => ({
    name: rw.name,
    warehouse_name: rw.warehouse_name || rw.name,
    parent_warehouse: rw.parent_warehouse,
    type: 'Store',
    current_capacity: 0,
    max_capacity: 5000,
    ...rw,
  }));
};

// Fetch Suppliers via proxy
export const fetchERPNextSuppliers = async (config: ERPNextConfig): Promise<Supplier[]> => {
  if (!config.connected) return [];
  
  await syncConfigToBackend(config);

  const response = await fetch(`${BACKEND_URL}/api/erpnext/suppliers`);

  if (!response.ok) {
    throw new Error(`Failed to fetch suppliers from proxy: ${response.statusText}`);
  }

  const data: any = await response.json();
  return (data.data || []).map((rs: any) => ({
    name: rs.name,
    supplier_group: rs.supplier_group || 'Local',
    status: rs.disabled ? 'Inactive' : 'Active',
    contact_email: rs.email_id || '',
    contact_phone: rs.phone || '',
    ...rs,
  }));
};

// Fetch Customers via proxy
export const fetchERPNextCustomers = async (config: ERPNextConfig): Promise<Customer[]> => {
  if (!config.connected) return [];
  
  await syncConfigToBackend(config);

  const response = await fetch(`${BACKEND_URL}/api/erpnext/customers`);

  if (!response.ok) {
    throw new Error(`Failed to fetch customers from proxy: ${response.statusText}`);
  }

  const data: any = await response.json();
  return (data.data || []).map((rc: any) => ({
    name: rc.name,
    customer_group: rc.customer_group || 'Individual',
    status: rc.disabled ? 'Inactive' : 'Active',
    email: rc.email_id || '',
    phone: rc.mobile_no || '',
    ...rc,
  }));
};

// Post Purchase Order via proxy
export const createERPNextPurchaseOrder = async (config: ERPNextConfig, order: any, defaultWarehouse?: string): Promise<any> => {
  if (!config.connected) return null;
  
  await syncConfigToBackend(config);

  const payload = {
    supplier: order.supplier,
    transaction_date: order.transaction_date,
    schedule_date: order.schedule_date || order.transaction_date,
    set_warehouse: defaultWarehouse,
    items: order.items.map((item: any) => ({
      item_code: item.item_code,
      qty: item.qty,
      rate: item.rate,
      uom: item.uom,
      warehouse: defaultWarehouse,
    })),
  };

  const response = await fetch(`${BACKEND_URL}/api/erpnext/purchase-orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ERPNext Purchase Order Creation Failed: ${err}`);
  }

  const data: any = await response.json();
  return data.data;
};

// Fetch Purchase Orders from ERPNext via proxy
export const fetchERPNextPurchaseOrders = async (config: ERPNextConfig): Promise<PurchaseOrder[]> => {
  if (!config.connected) return [];
  
  await syncConfigToBackend(config);

  const response = await fetch(`${BACKEND_URL}/api/erpnext/purchase-orders`);

  if (!response.ok) {
    throw new Error(`Failed to fetch purchase orders from proxy: ${response.statusText}`);
  }

  const data: any = await response.json();
  const rawOrders = data.data || [];

  return rawOrders.map((po: any) => ({
    name: po.name,
    supplier: po.supplier,
    transaction_date: po.transaction_date,
    schedule_date: po.schedule_date,
    status: po.status || 'Draft',
    items: [], // Details can be loaded dynamically if needed
    grand_total: po.grand_total || 0,
    total_qty: po.total_qty || 0,
    ...po,
  }));
};

// Post a new Supplier to ERPNext via proxy
export const createERPNextSupplier = async (config: ERPNextConfig, supplier: any): Promise<any> => {
  if (!config.connected) return null;
  
  await syncConfigToBackend(config);

  const payload = {
    supplier_name: supplier.name,
    supplier_group: supplier.supplier_group || 'All Supplier Groups',
  };

  const response = await fetch(`${BACKEND_URL}/api/erpnext/suppliers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ERPNext Supplier Creation Failed: ${err}`);
  }

  const data: any = await response.json();
  return data.data;
};

// Post a new Item to ERPNext via proxy
export const createERPNextItem = async (config: ERPNextConfig, item: any): Promise<any> => {
  if (!config.connected) return null;
  
  await syncConfigToBackend(config);

  const payload = {
    item_code: item.name,
    item_name: item.item_name,
    item_group: item.item_group || 'All Item Groups',
    stock_uom: item.stock_uom || 'Nos',
    valuation_rate: item.valuation_rate || 0,
    description: item.description || '',
  };

  const response = await fetch(`${BACKEND_URL}/api/erpnext/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ERPNext Item Creation Failed: ${err}`);
  }

  const data: any = await response.json();
  return data.data;
};

// Fetch list of active Item Groups from ERPNext via proxy
export const fetchERPNextItemGroups = async (config: ERPNextConfig): Promise<string[]> => {
  if (!config.connected) return ['Raw Materials', 'Finished Goods', 'Hardware & Fasteners', 'Electronics', 'Sub-Assemblies'];

  await syncConfigToBackend(config);

  const response = await fetch(`${BACKEND_URL}/api/erpnext/item-groups`);

  if (!response.ok) {
    throw new Error(`Failed to fetch item groups from proxy: ${response.statusText}`);
  }

  const data: any = await response.json();
  const rawGroups = data.data || [];
  return rawGroups.map((ig: any) => ig.name);
};

