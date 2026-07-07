import { useState, useEffect } from 'react';
import './App.css';
import { Item, Warehouse, Supplier, Customer, PurchaseOrder, SalesOrder, StockLedgerEntry, StockEntry, ERPNextConfig } from './types';
import { 
  initialItems, 
  initialWarehouses, 
  initialSuppliers, 
  initialCustomers, 
  initialPurchaseOrders, 
  initialSalesOrders, 
  initialStockLedger 
} from './services/mockData';
import { getStoredConfig, createERPNextPurchaseOrder, fetchERPNextPurchaseOrders, createERPNextSupplier, createERPNextItem, fetchERPNextItemGroups } from './services/erpnextApi';
import { Dashboard } from './components/Dashboard';
import { InventoryModule } from './components/InventoryModule';
import { BuyingModule } from './components/BuyingModule';
import { SellingModule } from './components/SellingModule';
import { IntegrationConsole } from './components/IntegrationConsole';

import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Truck, 
  Server, 
  Sun, 
  Moon,
  Workflow
} from 'lucide-react';

function App() {
  // Navigation
  const [activeModule, setActiveModule] = useState<string>('dashboard');
  
  // Theme Toggle
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Master State
  const [items, setItems] = useState<Item[]>(() => {
    const local = localStorage.getItem('scms_items');
    return local ? JSON.parse(local) : initialItems;
  });
  const [warehouses, setWarehouses] = useState<Warehouse[]>(() => {
    const local = localStorage.getItem('scms_warehouses');
    return local ? JSON.parse(local) : initialWarehouses;
  });
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const local = localStorage.getItem('scms_suppliers');
    return local ? JSON.parse(local) : initialSuppliers;
  });
  const [customers, setCustomers] = useState<Customer[]>(() => {
    const local = localStorage.getItem('scms_customers');
    return local ? JSON.parse(local) : initialCustomers;
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(() => {
    const local = localStorage.getItem('scms_purchase_orders');
    return local ? JSON.parse(local) : initialPurchaseOrders;
  });
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(() => {
    const local = localStorage.getItem('scms_sales_orders');
    return local ? JSON.parse(local) : initialSalesOrders;
  });
  const [stockLedger, setStockLedger] = useState<StockLedgerEntry[]>(() => {
    const local = localStorage.getItem('scms_stock_ledger');
    return local ? JSON.parse(local) : initialStockLedger;
  });
  const [itemGroups, setItemGroups] = useState<string[]>(() => {
    const local = localStorage.getItem('scms_item_groups');
    return local ? JSON.parse(local) : ['Raw Materials', 'Finished Goods', 'Hardware & Fasteners', 'Electronics', 'Sub-Assemblies'];
  });
  const [config, setConfig] = useState<ERPNextConfig>(getStoredConfig());

  // Persist mock state changes to localStorage
  useEffect(() => {
    localStorage.setItem('scms_items', JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    localStorage.setItem('scms_warehouses', JSON.stringify(warehouses));
  }, [warehouses]);

  useEffect(() => {
    localStorage.setItem('scms_suppliers', JSON.stringify(suppliers));
  }, [suppliers]);

  useEffect(() => {
    localStorage.setItem('scms_customers', JSON.stringify(customers));
  }, [customers]);

  useEffect(() => {
    localStorage.setItem('scms_purchase_orders', JSON.stringify(purchaseOrders));
  }, [purchaseOrders]);

  useEffect(() => {
    localStorage.setItem('scms_sales_orders', JSON.stringify(salesOrders));
  }, [salesOrders]);

  useEffect(() => {
    localStorage.setItem('scms_stock_ledger', JSON.stringify(stockLedger));
  }, [stockLedger]);

  useEffect(() => {
    localStorage.setItem('scms_item_groups', JSON.stringify(itemGroups));
  }, [itemGroups]);

  // Load Purchase Orders from ERPNext when connected
  useEffect(() => {
    if (config.connected) {
      const syncPOs = async () => {
        try {
          const orders = await fetchERPNextPurchaseOrders(config);
          if (orders && orders.length > 0) {
            setPurchaseOrders(orders);
          }
        } catch (e) {
          console.error("Failed to load POs from ERPNext:", e);
        }
      };
      syncPOs();
    }
  }, [config.connected]);

  // Load Item Groups from ERPNext when connected
  useEffect(() => {
    if (config.connected) {
      const syncItemGroups = async () => {
        try {
          const groups = await fetchERPNextItemGroups(config);
          if (groups && groups.length > 0) {
            setItemGroups(groups);
          }
        } catch (e) {
          console.error("Failed to load item groups from ERPNext:", e);
        }
      };
      syncItemGroups();
    }
  }, [config.connected]);

  // Calculate current stock levels from ledger at initialization and when ledger changes
  useEffect(() => {
    const updatedItems = items.map(item => {
      const itemSles = stockLedger.filter(sle => sle.item_code === item.name);
      const current_stock = itemSles.reduce((total, sle) => total + sle.actual_qty, 0);
      return { ...item, current_stock };
    });

    const hasChanged = updatedItems.some((ui, index) => ui.current_stock !== items[index]?.current_stock);
    if (hasChanged || items.length !== updatedItems.length) {
      setItems(updatedItems);
    }
  }, [stockLedger]);

  // Recalculate warehouse capacities when ledger changes
  useEffect(() => {
    const updatedWarehouses = warehouses.map(wh => {
      const whSles = stockLedger.filter(sle => sle.warehouse === wh.name);
      const current_capacity = whSles.reduce((total, sle) => total + sle.actual_qty, 0);
      return { 
        ...wh, 
        current_capacity: Math.max(0, current_capacity) 
      };
    });

    const hasChanged = updatedWarehouses.some((uw, index) => uw.current_capacity !== warehouses[index]?.current_capacity);
    if (hasChanged || warehouses.length !== updatedWarehouses.length) {
      setWarehouses(updatedWarehouses);
    }
  }, [stockLedger]);

  // Toggle Theme Class on Document body
  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  // TRANSACTION ACTIONS

  // Add a new item Master record
  const handleAddItem = async (newItem: Item) => {
    if (config.connected) {
      try {
        console.log("Creating Item in ERPNext...");
        const result = await createERPNextItem(config, newItem);
        if (result) {
          const created = {
            ...newItem,
            name: result.name || newItem.name,
            sku: result.name || newItem.sku,
          };
          setItems(prev => [...prev, created]);
          alert(`Item "${created.name}" created successfully in ERPNext (MariaDB)!`);
        }
      } catch (e: any) {
        console.error(e);
        alert(`Failed to save Item to ERPNext: ${e.message || e}`);
      }
    } else {
      setItems(prev => [...prev, newItem]);
    }
  };

  // Process manual/voucher Stock Entry
  const handleStockEntry = (entry: StockEntry) => {
    const newSles: StockLedgerEntry[] = [];
    const timestampStr = new Date().toLocaleTimeString();

    entry.items.forEach((item) => {
      const uniqueId = `SLE-${Math.floor(Math.random() * 90000) + 10000}`;

      // Inward (Receipt) or Transfer To target warehouse
      if (entry.to_warehouse) {
        newSles.push({
          name: `${uniqueId}-A`,
          item_code: item.item_code,
          warehouse: entry.to_warehouse,
          actual_qty: item.qty,
          valuation_rate: item.valuation_rate,
          voucher_type: 'Stock Entry',
          voucher_no: entry.name,
          posting_date: entry.posting_date,
          posting_time: timestampStr,
        });
      }

      // Outward (Issue) or Transfer From source warehouse
      if (entry.from_warehouse) {
        newSles.push({
          name: `${uniqueId}-B`,
          item_code: item.item_code,
          warehouse: entry.from_warehouse,
          actual_qty: -item.qty,
          valuation_rate: item.valuation_rate,
          voucher_type: 'Stock Entry',
          voucher_no: entry.name,
          posting_date: entry.posting_date,
          posting_time: timestampStr,
        });
      }
    });

    setStockLedger(prev => [ ...newSles, ...prev ]);
  };

  // Buying actions
  const handleCreatePurchaseOrder = async (order: PurchaseOrder) => {
    if (config.connected) {
      try {
        console.log("Pushing Purchase Order to ERPNext...");
        const result = await createERPNextPurchaseOrder(config, order, warehouses[0]?.name);
        if (result) {
          const updatedOrder = { ...order, name: result.name || order.name };
          setPurchaseOrders(prev => [updatedOrder, ...prev]);
          alert(`Purchase Order ${updatedOrder.name} created and saved in ERPNext (MariaDB)!`);
        }
      } catch (e: any) {
        console.error(e);
        alert(`Failed to save PO to ERPNext: ${e.message || e}. Saving locally instead.`);
        setPurchaseOrders(prev => [order, ...prev]);
      }
    } else {
      setPurchaseOrders(prev => [order, ...prev]);
    }
  };

  const handleAddSupplier = async (supplier: Supplier) => {
    if (config.connected) {
      try {
        console.log("Creating Supplier in ERPNext...");
        const result = await createERPNextSupplier(config, supplier);
        if (result) {
          const created = {
            name: result.name || supplier.name,
            supplier_group: result.supplier_group || supplier.supplier_group,
            status: 'Active' as const,
            contact_email: supplier.contact_email || '',
            contact_phone: supplier.contact_phone || '',
            address: supplier.address || '',
          };
          setSuppliers(prev => [...prev, created]);
          alert(`Supplier "${created.name}" created successfully in ERPNext (MariaDB)!`);
        }
      } catch (e: any) {
        console.error(e);
        alert(`Failed to save Supplier to ERPNext: ${e.message || e}`);
      }
    } else {
      setSuppliers(prev => [...prev, { ...supplier, status: 'Active' }]);
    }
  };

  const handleSubmitPurchaseOrder = (name: string) => {
    setPurchaseOrders(prev => prev.map(po => 
      po.name === name ? { ...po, status: 'Submitted' } : po
    ));
  };

  const handleReceiveGoods = (poName: string, warehouseName: string) => {
    const order = purchaseOrders.find(po => po.name === poName);
    if (!order) return;

    const timestampStr = new Date().toLocaleTimeString();
    const dateStr = new Date().toISOString().split('T')[0];

    const newSles: StockLedgerEntry[] = order.items.map((item, idx) => ({
      name: `SLE-GRN-${Math.floor(Math.random() * 90000) + 10000}-${idx}`,
      item_code: item.item_code,
      warehouse: warehouseName,
      actual_qty: item.qty,
      valuation_rate: item.rate,
      voucher_type: 'Purchase Receipt',
      voucher_no: poName,
      posting_date: dateStr,
      posting_time: timestampStr,
    }));

    setStockLedger(prev => [...newSles, ...prev]);

    setPurchaseOrders(prev => prev.map(po => {
      if (po.name === poName) {
        return {
          ...po,
          status: 'Received',
          items: po.items.map(item => ({ ...item, received_qty: item.qty }))
        };
      }
      return po;
    }));
  };

  // Selling actions
  const handleCreateSalesOrder = (order: SalesOrder) => {
    setSalesOrders(prev => [order, ...prev]);
  };

  const handleSubmitSalesOrder = (name: string) => {
    setSalesOrders(prev => prev.map(so => 
      so.name === name ? { ...so, status: 'Submitted' } : so
    ));
  };

  const handleShipGoods = (soName: string, warehouseName: string) => {
    const order = salesOrders.find(so => so.name === soName);
    if (!order) return;

    for (const item of order.items) {
      const currentStockInWh = stockLedger
        .filter(sle => sle.item_code === item.item_code && sle.warehouse === warehouseName)
        .reduce((sum, sle) => sum + sle.actual_qty, 0);

      if (currentStockInWh < item.qty) {
        alert(`Insufficient Stock! Target warehouse ${warehouseName} only has ${currentStockInWh} units of ${item.item_code}. Need ${item.qty}. Please run stock receipt first.`);
        return;
      }
    }

    const timestampStr = new Date().toLocaleTimeString();
    const dateStr = new Date().toISOString().split('T')[0];

    const newSles: StockLedgerEntry[] = order.items.map((item, idx) => ({
      name: `SLE-DN-${Math.floor(Math.random() * 90000) + 10000}-${idx}`,
      item_code: item.item_code,
      warehouse: warehouseName,
      actual_qty: -item.qty,
      valuation_rate: items.find(i => i.name === item.item_code)?.valuation_rate || 0,
      voucher_type: 'Delivery Note',
      voucher_no: soName,
      posting_date: dateStr,
      posting_time: timestampStr,
    }));

    setStockLedger(prev => [...newSles, ...prev]);

    setSalesOrders(prev => prev.map(so => {
      if (so.name === soName) {
        return {
          ...so,
          status: 'Shipped',
          items: so.items.map(item => ({ ...item, delivered_qty: item.qty }))
        };
      }
      return so;
    }));
  };

  const handleSyncItems = (syncedItems: Item[]) => {
    setItems(syncedItems);
  };

  const handleSyncWarehouses = (syncedWarehouses: Warehouse[]) => {
    setWarehouses(syncedWarehouses);
  };

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar" role="navigation" aria-label="Main navigation">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Workflow size={20} color="hsl(var(--primary))" />
            <span>SCM Suite</span>
          </div>
        </div>

        <ul className="sidebar-menu" role="menubar">
          <li role="none">
            <div 
              className={`menu-item ${activeModule === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveModule('dashboard')}
              role="menuitem"
              aria-current={activeModule === 'dashboard' ? 'page' : undefined}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveModule('dashboard')}
            >
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </div>
          </li>
          <li role="none">
            <div 
              className={`menu-item ${activeModule === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveModule('inventory')}
              role="menuitem"
              aria-current={activeModule === 'inventory' ? 'page' : undefined}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveModule('inventory')}
            >
              <Package size={18} />
              <span>Stock Control</span>
            </div>
          </li>
          <li role="none">
            <div 
              className={`menu-item ${activeModule === 'buying' ? 'active' : ''}`}
              onClick={() => setActiveModule('buying')}
              role="menuitem"
              aria-current={activeModule === 'buying' ? 'page' : undefined}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveModule('buying')}
            >
              <ShoppingCart size={18} />
              <span>Procurement</span>
            </div>
          </li>
          <li role="none">
            <div 
              className={`menu-item ${activeModule === 'selling' ? 'active' : ''}`}
              onClick={() => setActiveModule('selling')}
              role="menuitem"
              aria-current={activeModule === 'selling' ? 'page' : undefined}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveModule('selling')}
            >
              <Truck size={18} />
              <span>Sales Fulfillment</span>
            </div>
          </li>
          <li role="none">
            <div 
              className={`menu-item ${activeModule === 'integration' ? 'active' : ''}`}
              onClick={() => setActiveModule('integration')}
              role="menuitem"
              aria-current={activeModule === 'integration' ? 'page' : undefined}
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActiveModule('integration')}
            >
              <Server size={18} />
              <span>ERPNext Sync</span>
            </div>
          </li>
        </ul>

        {/* SIDEBAR FOOTER (Theme & Status) */}
        <div className="sidebar-footer">
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`pulse-indicator ${config.connected ? '' : 'danger'}`} role="status" aria-label={config.connected ? 'Connected' : 'Disconnected'} />
            <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', fontWeight: 600 }}>
              {config.connected ? 'ERPNext Linked' : 'Offline / Mock Engine'}
            </span>
          </div>

          {/* Theme switcher */}
          <button 
            type="button" 
            className="btn btn-secondary" 
            style={{ width: '100%', justifyContent: 'flex-start', padding: '0.45rem 0.65rem', fontSize: '0.775rem' }}
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          >
            {theme === 'dark' ? (
              <>
                <Sun size={14} /> <span>Light UI Shell</span>
              </>
            ) : (
              <>
                <Moon size={14} /> <span>Dark UI Shell</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* MAIN MODULE ROUTER */}
      <main style={{ flex: 1 }}>
        {activeModule === 'dashboard' && (
          <Dashboard 
            items={items}
            purchaseOrders={purchaseOrders}
            salesOrders={salesOrders}
            warehouses={warehouses}
            onNavigate={(mod) => setActiveModule(mod)}
          />
        )}
        {activeModule === 'inventory' && (
          <InventoryModule 
            items={items}
            warehouses={warehouses}
            stockLedger={stockLedger}
            onAddItem={handleAddItem}
            onStockEntry={handleStockEntry}
            itemGroups={itemGroups}
          />
        )}
        {activeModule === 'buying' && (
          <BuyingModule 
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
            items={items}
            onCreatePurchaseOrder={handleCreatePurchaseOrder}
            onSubmitPurchaseOrder={handleSubmitPurchaseOrder}
            onReceiveGoods={handleReceiveGoods}
            onAddSupplier={handleAddSupplier}
          />
        )}
        {activeModule === 'selling' && (
          <SellingModule 
            customers={customers}
            salesOrders={salesOrders}
            items={items}
            onCreateSalesOrder={handleCreateSalesOrder}
            onSubmitSalesOrder={handleSubmitSalesOrder}
            onShipGoods={handleShipGoods}
          />
        )}
        {activeModule === 'integration' && (
          <IntegrationConsole 
            config={config}
            onUpdateConfig={setConfig}
            onSyncItems={handleSyncItems}
            onSyncWarehouses={handleSyncWarehouses}
            onSyncSuppliers={setSuppliers}
            onSyncCustomers={setCustomers}
          />
        )}
      </main>
    </div>
  );
}

export default App;
