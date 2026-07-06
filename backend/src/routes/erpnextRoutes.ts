import { Router } from 'express';
import config from '../config/index.js';
import schemaRegistry from '../config/schemas.js';
import { ERPNextService } from '../services/erpnextService.js';

const router = Router();

// GET current configuration properties
router.get('/config', (req, res) => {
  res.json({
    url: config.url,
    apiKey: config.apiKey,
    hasSecret: !!config.apiSecret,
    connected: config.connected,
  });
});

// POST to update credentials dynamically
router.post('/config', (req, res) => {
  const { url, apiKey, apiSecret } = req.body;
  config.update(url, apiKey, apiSecret);
  console.log(`[ERPNext Config] Dynamic credentials updated. URL: ${config.url}`);
  res.json({ success: true, message: 'Configuration synced to proxy backend.' });
});

// Test Connection Proxy
router.get('/test-connection', async (req, res) => {
  const result = await ERPNextService.testConnection();
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

// GET registered DocType schemas
router.get('/schemas', (req, res) => {
  const list: { [docType: string]: string[] } = {};
  schemaRegistry.getDocTypes().forEach(dt => {
    list[dt] = schemaRegistry.getFieldsArray(dt);
  });
  res.json(list);
});

// POST register a new custom field for a DocType
router.post('/schemas/:docType/fields', (req, res) => {
  const { docType } = req.params;
  const { fieldName } = req.body;
  
  if (!fieldName) {
    res.status(400).json({ success: false, message: 'fieldName is required in body.' });
    return;
  }

  const added = schemaRegistry.registerField(docType, fieldName);
  res.json({
    success: true,
    added,
    docType,
    fields: schemaRegistry.getFieldsArray(docType),
  });
});

// Proxy GET Items
router.get('/items', async (req, res) => {
  try {
    const data = await ERPNextService.getItems();
    res.json(data);
  } catch (error: any) {
    console.error('[Proxy Error] getItems:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Proxy GET Warehouses
router.get('/warehouses', async (req, res) => {
  try {
    const data = await ERPNextService.getWarehouses();
    res.json(data);
  } catch (error: any) {
    console.error('[Proxy Error] getWarehouses:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Proxy GET Suppliers
router.get('/suppliers', async (req, res) => {
  try {
    const data = await ERPNextService.getSuppliers();
    res.json(data);
  } catch (error: any) {
    console.error('[Proxy Error] getSuppliers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Proxy GET Customers
router.get('/customers', async (req, res) => {
  try {
    const data = await ERPNextService.getCustomers();
    res.json(data);
  } catch (error: any) {
    console.error('[Proxy Error] getCustomers:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Proxy POST Purchase Order
router.post('/purchase-orders', async (req, res) => {
  try {
    const data = await ERPNextService.createPurchaseOrder(req.body);
    res.json(data);
  } catch (error: any) {
    console.error('[Proxy Error] createPurchaseOrder:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
