import fetch from 'node-fetch';
import config from '../config/index.js';
import schemaRegistry from '../config/schemas.js';

export class ERPNextService {
  public static async testConnection(): Promise<{ success: boolean; message: string; username?: string }> {
    if (!config.url || !config.apiKey || !config.apiSecret) {
      return { success: false, message: 'Missing API credentials.' };
    }

    try {
      const response = await fetch(`${config.url}/api/method/frappe.auth.get_logged_user`, {
        method: 'GET',
        headers: config.getHeaders(),
      });

      if (response.ok) {
        const data: any = await response.json();
        config.connected = true;
        return {
          success: true,
          message: 'Connected successfully to ERPNext!',
          username: data.message || 'Administrator',
        };
      } else {
        const errText = await response.text();
        config.connected = false;
        return {
          success: false,
          message: `HTTP Error ${response.status}: ${errText || response.statusText}`,
        };
      }
    } catch (error: any) {
      config.connected = false;
      return {
        success: false,
        message: `Network error connecting to ERPNext: ${error.message || error}`,
      };
    }
  }

  public static async getItems(): Promise<any> {
    const fields = schemaRegistry.getFields('Item');
    const target = `${config.url}/api/resource/Item?fields=${fields}&limit=50`;
    
    const response = await fetch(target, { headers: config.getHeaders() });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ERPNext returned ${response.status}: ${text}`);
    }
    return response.json();
  }

  public static async getWarehouses(): Promise<any> {
    const fields = schemaRegistry.getFields('Warehouse');
    const target = `${config.url}/api/resource/Warehouse?fields=${fields}&filters=[["is_group", "=", 0]]`;

    const response = await fetch(target, { headers: config.getHeaders() });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ERPNext returned ${response.status}: ${text}`);
    }
    return response.json();
  }

  public static async getSuppliers(): Promise<any> {
    const fields = schemaRegistry.getFields('Supplier');
    const target = `${config.url}/api/resource/Supplier?fields=${fields}`;

    const response = await fetch(target, { headers: config.getHeaders() });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ERPNext returned ${response.status}: ${text}`);
    }
    return response.json();
  }

  public static async getCustomers(): Promise<any> {
    const fields = schemaRegistry.getFields('Customer');
    const target = `${config.url}/api/resource/Customer?fields=${fields}`;

    const response = await fetch(target, { headers: config.getHeaders() });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ERPNext returned ${response.status}: ${text}`);
    }
    return response.json();
  }

  public static async createPurchaseOrder(payload: any): Promise<any> {
    const target = `${config.url}/api/resource/Purchase Order`;

    const response = await fetch(target, {
      method: 'POST',
      headers: config.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ERPNext returned ${response.status}: ${text}`);
    }
    return response.json();
  }

  public static async getPurchaseOrders(): Promise<any> {
    const fields = schemaRegistry.getFields('Purchase Order');
    const target = `${config.url}/api/resource/Purchase Order?fields=${fields}&limit=50`;

    const response = await fetch(target, { headers: config.getHeaders() });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ERPNext returned ${response.status}: ${text}`);
    }
    return response.json();
  }

  public static async createSupplier(payload: any): Promise<any> {
    const target = `${config.url}/api/resource/Supplier`;

    const response = await fetch(target, {
      method: 'POST',
      headers: config.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ERPNext returned ${response.status}: ${text}`);
    }
    return response.json();
  }

  public static async createItem(payload: any): Promise<any> {
    const target = `${config.url}/api/resource/Item`;

    const response = await fetch(target, {
      method: 'POST',
      headers: config.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ERPNext returned ${response.status}: ${text}`);
    }
    return response.json();
  }
}
