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
import { getStoredConfig } from './services/erpnextApi';
import { Dashboard } from './components/Dashboard';
import { InventoryModule } from './components/InventoryModule';
import { BuyingModule } from './components/BuyingModule';
import { SellingModule } from './components/SellingModule';
import { IntegrationConsole } from './components/IntegrationConsole';

// Icons for navigation
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
  const [items, setItems] = useState<Item[]>(initialItems);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [salesOrders, setSalesOrders] = useState<SalesOrder[]>(initialSalesOrders);
  const [stockLedger, setStockLedger] = useState<StockLedgerEntry[]>(initialStockLedger);
  const [config, setConfig] = useState<ERPNextConfig>(getStoredConfig());

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
  const handleAddItem = (newItem: Item) => {
    setItems(prev => [...prev, newItem]);
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
  const handleCreatePurchaseOrder = (order: PurchaseOrder) => {
    setPurchaseOrders(prev => [order, ...prev]);
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
    setItems(prev => {
      const merged = [...prev];
      syncedItems.forEach(si => {
        const idx = merged.findIndex(i => i.name === si.name);
        if (idx > -1) {
          merged[idx] = { ...merged[idx], ...si };
        } else {
          merged.push(si);
        }
      });
      return merged;
    });
  };

  const handleSyncWarehouses = (syncedWarehouses: Warehouse[]) => {
    setWarehouses(prev => {
      const merged = [...prev];
      syncedWarehouses.forEach(sw => {
        const idx = merged.findIndex(w => w.name === sw.name);
        if (idx > -1) {
          merged[idx] = { ...merged[idx], ...sw };
        } else {
          merged.push(sw);
        }
      });
      return merged;
    });
  };

  return (
    <div className="app-container">
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Workflow size={18} color="hsl(var(--primary))" />
            <span>SCM Suite</span>
          </div>
        </div>

        <ul className="sidebar-menu">
          <li>
            <div 
              className={`menu-item ${activeModule === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveModule('dashboard')}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </div>
          </li>
          <li>
            <div 
              className={`menu-item ${activeModule === 'inventory' ? 'active' : ''}`}
              onClick={() => setActiveModule('inventory')}
            >
              <Package size={16} />
              <span>Stock Control</span>
            </div>
          </li>
          <li>
            <div 
              className={`menu-item ${activeModule === 'buying' ? 'active' : ''}`}
              onClick={() => setActiveModule('buying')}
            >
              <ShoppingCart size={16} />
              <span>Procurement</span>
            </div>
          </li>
          <li>
            <div 
              className={`menu-item ${activeModule === 'selling' ? 'active' : ''}`}
              onClick={() => setActiveModule('selling')}
            >
              <Truck size={16} />
              <span>Sales Fulfillment</span>
            </div>
          </li>
          <li>
            <div 
              className={`menu-item ${activeModule === 'integration' ? 'active' : ''}`}
              onClick={() => setActiveModule('integration')}
            >
              <Server size={16} />
              <span>ERPNext Sync</span>
            </div>
          </li>
        </ul>

        {/* SIDEBAR FOOTER (Theme & Status) */}
        <div className="sidebar-footer">
          {/* Connection Status Indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <div className={`pulse-indicator ${config.connected ? '' : 'danger'}`} />
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
          >
            {theme === 'dark' ? (
              <>
                <Sun size={13} /> <span>Light UI Shell</span>
              </>
            ) : (
              <>
                <Moon size={13} /> <span>Dark UI Shell</span>
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
