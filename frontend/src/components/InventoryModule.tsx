import React, { useState } from 'react';
import { Item, Warehouse, StockLedgerEntry, StockEntry } from '../types';
import { 
  Package, 
  Search, 
  Plus, 
  Warehouse as WarehouseIcon, 
  History, 
  FileText, 
  ArrowRight,
  RefreshCw,
  FolderOpen
} from 'lucide-react';

interface InventoryModuleProps {
  items: Item[];
  warehouses: Warehouse[];
  stockLedger: StockLedgerEntry[];
  onAddItem: (item: Item) => void;
  onStockEntry: (entry: StockEntry) => void;
  itemGroups: string[];
}

export const InventoryModule: React.FC<InventoryModuleProps> = ({
  items,
  warehouses,
  stockLedger,
  onAddItem,
  onStockEntry,
  itemGroups,
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'items' | 'warehouses' | 'ledger' | 'entries'>('items');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');

  // Modals / Forms
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isStockEntryOpen, setIsStockEntryOpen] = useState(false);

  // New Item State
  const [newItem, setNewItem] = useState({
    name: '',
    item_name: '',
    sku: '',
    item_group: itemGroups[0] || 'Raw Materials',
    stock_uom: 'Nos',
    valuation_rate: 0,
    standard_selling_rate: 0,
    reorder_level: 0,
    reorder_qty: 0,
    description: '',
  });

  // New Stock Entry State
  const [newEntry, setNewEntry] = useState<Omit<StockEntry, 'name'>>({
    posting_date: new Date().toISOString().split('T')[0],
    purpose: 'Material Receipt',
    from_warehouse: '',
    to_warehouse: 'Raw Materials - SCMS',
    items: [{ item_code: '', qty: 0, uom: 'Nos', valuation_rate: 0 }],
  });

  // Handlers
  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.item_name) return;
    
    onAddItem({
      ...newItem,
      current_stock: 0,
    });

    // Reset Form
    setNewItem({
      name: '',
      item_name: '',
      sku: '',
      item_group: itemGroups[0] || 'Raw Materials',
      stock_uom: 'Nos',
      valuation_rate: 0,
      standard_selling_rate: 0,
      reorder_level: 0,
      reorder_qty: 0,
      description: '',
    });
    setIsAddItemOpen(false);
  };

  const handleStockEntrySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanItems = newEntry.items.filter(i => i.item_code && i.qty > 0);
    if (cleanItems.length === 0) return;

    // Generate simulated name
    const timestamp = Math.floor(Math.random() * 90000) + 10000;
    const name = `STE-2026-${timestamp}`;

    onStockEntry({
      name,
      posting_date: newEntry.posting_date,
      purpose: newEntry.purpose,
      from_warehouse: newEntry.purpose === 'Material Receipt' ? undefined : newEntry.from_warehouse,
      to_warehouse: newEntry.purpose === 'Material Issue' ? undefined : newEntry.to_warehouse,
      items: cleanItems,
    });

    // Reset
    setNewEntry({
      posting_date: new Date().toISOString().split('T')[0],
      purpose: 'Material Receipt',
      from_warehouse: '',
      to_warehouse: 'Raw Materials - SCMS',
      items: [{ item_code: '', qty: 0, uom: 'Nos', valuation_rate: 0 }],
    });
    setIsStockEntryOpen(false);
  };

  // Filter items
  const filteredItems = items.filter(item => {
    const matchesSearch = item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGroup = selectedGroup === 'All' || item.item_group === selectedGroup;
    return matchesSearch && matchesGroup;
  });

  const filterGroups = ['All', ...Array.from(new Set(items.map(i => i.item_group)))];

  return (
    <div className="main-content">
      {/* Module Title */}
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '0.15rem' }}>Inventory Controls</h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Item master records, multi-warehouse stock allocations, ledger logs, and warehouse transfers.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary" onClick={() => setIsStockEntryOpen(true)}>
            <RefreshCw size={16} /> Stock Entry
          </button>
          <button className="btn btn-primary" onClick={() => setIsAddItemOpen(true)}>
            <Plus size={16} /> Add Item
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="tabs-bar" role="tablist">
        <button 
          className={`tab-item ${activeTab === 'items' ? 'active' : ''}`}
          onClick={() => setActiveTab('items')}
          role="tab"
          aria-selected={activeTab === 'items'}
        >
          <Package size={16} /> Items Master
        </button>
        <button 
          className={`tab-item ${activeTab === 'warehouses' ? 'active' : ''}`}
          onClick={() => setActiveTab('warehouses')}
          role="tab"
          aria-selected={activeTab === 'warehouses'}
        >
          <WarehouseIcon size={16} /> Warehouses
        </button>
        <button 
          className={`tab-item ${activeTab === 'ledger' ? 'active' : ''}`}
          onClick={() => setActiveTab('ledger')}
          role="tab"
          aria-selected={activeTab === 'ledger'}
        >
          <History size={16} /> Stock Ledger
        </button>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'items' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* Filter Bar */}
          <div className="flex items-center" style={{ gap: '1rem', flexWrap: 'wrap' }}>
            <div className="flex-1" style={{ position: 'relative', minWidth: '240px' }}>
              <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'hsl(var(--text-subtle))', pointerEvents: 'none' }}>
                <Search size={16} />
              </span>
              <input 
                type="text" 
                placeholder="Search Item Code, Name, or SKU..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: '2.5rem', width: '100%' }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>Group:</span>
              <select value={selectedGroup} onChange={(e) => setSelectedGroup(e.target.value)} style={{ padding: '0.6rem 2rem 0.6rem 0.85rem' }}>
                {filterGroups.map(grp => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Table */}
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Item Code</th>
                  <th>Item Name</th>
                  <th>SKU</th>
                  <th>Group</th>
                  <th>Current Stock</th>
                  <th>UoM</th>
                  <th>Valuation Rate</th>
                  <th>Reorder Level</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.map(item => {
                  const isLowStock = item.current_stock <= item.reorder_level;
                  return (
                    <tr key={item.name}>
                      <td style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{item.name}</td>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.item_name}</div>
                        {item.description && (
                          <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.description}
                          </div>
                        )}
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>{item.sku}</td>
                      <td><span className="badge badge-primary">{item.item_group}</span></td>
                      <td style={{ fontWeight: 600, color: isLowStock ? 'hsl(var(--warning))' : 'inherit' }}>
                        {item.current_stock.toLocaleString()}
                      </td>
                      <td style={{ color: 'hsl(var(--text-muted))' }}>{item.stock_uom}</td>
                      <td>${item.valuation_rate.toFixed(2)}</td>
                      <td>{item.reorder_level.toLocaleString()}</td>
                      <td>
                        {isLowStock ? (
                          <span className="badge badge-warning">Low Stock</span>
                        ) : (
                          <span className="badge badge-success">Good</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div className="empty-state">
                        <Package size={32} className="empty-state-icon" />
                        <div className="empty-state-title">No items found</div>
                        <div className="empty-state-desc">No items matched your query. Click "Add Item" to register a new code.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'warehouses' && (
        <div className="animate-slide-up dashboard-grid">
          {warehouses.map(wh => {
            const usagePercent = Math.min((wh.current_capacity / wh.max_capacity) * 100, 100);
            let barClass = '';
            if (usagePercent > 85) barClass = 'danger';
            else if (usagePercent > 65) barClass = 'warning';

            return (
              <div key={wh.name} className="card">
                <div className="card-header-flex">
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontFamily: 'var(--font-display)' }}>{wh.warehouse_name}</h3>
                    <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-subtle))' }}>{wh.name}</span>
                  </div>
                  <span className={`badge ${
                    wh.type === 'Store' ? 'badge-primary' : wh.type === 'Transit' ? 'badge-warning' : 'badge-info'
                  }`}>
                    {wh.type}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'hsl(var(--text-muted))' }}>Allocation Capacity:</span>
                    <span style={{ fontWeight: 600 }}>{wh.current_capacity.toLocaleString()} / {wh.max_capacity.toLocaleString()}</span>
                  </div>
                  <div className="capacity-meter">
                    <div 
                      className={`capacity-meter-bar ${barClass}`} 
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '0.75rem', color: 'hsl(var(--text-subtle))' }}>
                    {usagePercent.toFixed(1)}% Capacity Used
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'ledger' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>SLE Ref</th>
                  <th>Posting Date</th>
                  <th>Item Code</th>
                  <th>Warehouse</th>
                  <th>Qty Delta</th>
                  <th>Valuation Rate</th>
                  <th>Voucher Type</th>
                  <th>Voucher Ref</th>
                </tr>
              </thead>
              <tbody>
                {stockLedger.map((sle) => (
                  <tr key={sle.name}>
                    <td style={{ fontSize: '0.8rem', color: 'hsl(var(--text-subtle))' }}>{sle.name}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{sle.posting_date}</div>
                      <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-subtle))' }}>{sle.posting_time}</div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{sle.item_code}</td>
                    <td>{sle.warehouse}</td>
                    <td style={{ 
                      fontWeight: 600, 
                      color: sle.actual_qty > 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))' 
                    }}>
                      {sle.actual_qty > 0 ? `+${sle.actual_qty.toLocaleString()}` : sle.actual_qty.toLocaleString()}
                    </td>
                    <td>${sle.valuation_rate.toFixed(2)}</td>
                    <td><span className="badge badge-primary">{sle.voucher_type}</span></td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 500 }}>{sle.voucher_no}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODALS */}

      {/* 1. Add Item Modal */}
      {isAddItemOpen && (
        <div className="modal-overlay">
          <form className="modal-content" onSubmit={handleAddItem}>
            <div className="modal-header">
              <h2 className="modal-title">New Item Registration</h2>
              <button type="button" className="modal-close" onClick={() => setIsAddItemOpen(false)} aria-label="Close modal">×</button>
            </div>

            <div className="flex-col" style={{ display: 'flex', gap: '1rem' }}>
              <div className="layout-split-50-50" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Item Code (ID) *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. ITEM-0006"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Item Name *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="e.g. Copper Clad Board"
                    value={newItem.item_name}
                    onChange={(e) => setNewItem({ ...newItem, item_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="layout-split-50-50" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label>SKU Code</label>
                  <input 
                    type="text" 
                    placeholder="e.g. CP-BD-01"
                    value={newItem.sku}
                    onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Item Group</label>
                  <select 
                    value={newItem.item_group}
                    onChange={(e) => setNewItem({ ...newItem, item_group: e.target.value })}
                  >
                    {itemGroups.map(group => (
                      <option key={group} value={group}>{group}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="layout-split-50-50" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Standard UoM</label>
                  <select 
                    value={newItem.stock_uom}
                    onChange={(e) => setNewItem({ ...newItem, stock_uom: e.target.value })}
                  >
                    <option value="Nos">Nos (Count)</option>
                    <option value="Kg">Kg (Weight)</option>
                    <option value="Box">Box</option>
                    <option value="Meters">Meters</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Valuation Rate ($)</label>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.01" 
                    value={newItem.valuation_rate}
                    onChange={(e) => setNewItem({ ...newItem, valuation_rate: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="layout-split-50-50" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Reorder Trigger Level</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={newItem.reorder_level}
                    onChange={(e) => setNewItem({ ...newItem, reorder_level: parseInt(e.target.value) || 0 })}
                  />
                </div>
                <div className="form-group">
                  <label>Reorder Qty</label>
                  <input 
                    type="number" 
                    min="0" 
                    value={newItem.reorder_qty}
                    onChange={(e) => setNewItem({ ...newItem, reorder_qty: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea 
                  rows={2}
                  placeholder="Material specs or descriptions..."
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-between items-center" style={{ gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid hsl(var(--border))' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsAddItemOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Create Item</button>
            </div>
          </form>
        </div>
      )}

      {/* 2. Stock Entry Modal */}
      {isStockEntryOpen && (
        <div className="modal-overlay">
          <form className="modal-content" style={{ maxWidth: '550px' }} onSubmit={handleStockEntrySubmit}>
            <div className="modal-header">
              <h2 className="modal-title">Create Stock Entry</h2>
              <button type="button" className="modal-close" onClick={() => setIsStockEntryOpen(false)} aria-label="Close modal">×</button>
            </div>

            <div className="flex-col" style={{ display: 'flex', gap: '1rem' }}>
              <div className="layout-split-50-50" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Purpose</label>
                  <select 
                    value={newEntry.purpose}
                    onChange={(e) => setNewEntry({ 
                      ...newEntry, 
                      purpose: e.target.value as any,
                      from_warehouse: e.target.value === 'Material Receipt' ? '' : 'Raw Materials - SCMS',
                      to_warehouse: e.target.value === 'Material Issue' ? '' : 'Finished Goods - SCMS'
                    })}
                  >
                    <option value="Material Receipt">Material Receipt (Inward)</option>
                    <option value="Material Issue">Material Issue (Outward)</option>
                    <option value="Material Transfer">Material Transfer (Move)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Posting Date</label>
                  <input 
                    type="date" 
                    value={newEntry.posting_date}
                    onChange={(e) => setNewEntry({ ...newEntry, posting_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="layout-split-50-50" style={{ gap: '0.75rem' }}>
                {newEntry.purpose !== 'Material Receipt' && (
                  <div className="form-group">
                    <label>Source Warehouse (From)</label>
                    <select 
                      value={newEntry.from_warehouse}
                      onChange={(e) => setNewEntry({ ...newEntry, from_warehouse: e.target.value })}
                    >
                      <option value="">Select Warehouse...</option>
                      {warehouses.map(w => (
                        <option key={w.name} value={w.name}>{w.warehouse_name}</option>
                      ))}
                    </select>
                  </div>
                )}
                {newEntry.purpose !== 'Material Issue' && (
                  <div className="form-group">
                    <label>Target Warehouse (To)</label>
                    <select 
                      value={newEntry.to_warehouse}
                      onChange={(e) => setNewEntry({ ...newEntry, to_warehouse: e.target.value })}
                    >
                      <option value="">Select Warehouse...</option>
                      {warehouses.map(w => (
                        <option key={w.name} value={w.name}>{w.warehouse_name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Item Rows</h4>
                
                {newEntry.items.map((itemRow, index) => (
                  <div key={index} className="flex items-end" style={{ gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <div className="form-group" style={{ flex: 2 }}>
                      <label style={{ fontSize: '0.75rem' }}>Item Code</label>
                      <select 
                        value={itemRow.item_code}
                        onChange={(e) => {
                          const matched = items.find(i => i.name === e.target.value);
                          const updated = [...newEntry.items];
                          updated[index] = {
                            item_code: e.target.value,
                            qty: itemRow.qty,
                            uom: matched?.stock_uom || 'Nos',
                            valuation_rate: matched?.valuation_rate || 0,
                          };
                          setNewEntry({ ...newEntry, items: updated });
                        }}
                      >
                        <option value="">Select Item...</option>
                        {items.map(i => (
                          <option key={i.name} value={i.name}>{i.name} - {i.item_name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem' }}>Qty</label>
                      <input 
                        type="number" 
                        min="1" 
                        value={itemRow.qty}
                        onChange={(e) => {
                          const updated = [...newEntry.items];
                          updated[index].qty = parseInt(e.target.value) || 0;
                          setNewEntry({ ...newEntry, items: updated });
                        }}
                      />
                    </div>

                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={{ fontSize: '0.75rem' }}>Rate ($)</label>
                      <input 
                        type="number" 
                        value={itemRow.valuation_rate}
                        onChange={(e) => {
                          const updated = [...newEntry.items];
                          updated[index].valuation_rate = parseFloat(e.target.value) || 0;
                          setNewEntry({ ...newEntry, items: updated });
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center" style={{ gap: '0.75rem', paddingTop: '0.5rem', borderTop: '1px solid hsl(var(--border))' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsStockEntryOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary">Submit Stock Entry</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
