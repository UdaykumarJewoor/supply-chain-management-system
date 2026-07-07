import React, { useState } from 'react';
import { Customer, SalesOrder, Item, SalesOrderItem } from '../types';
import { 
  Users, 
  FileText, 
  Plus, 
  Trash2, 
  Eye, 
  CheckSquare, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface SellingModuleProps {
  customers: Customer[];
  salesOrders: SalesOrder[];
  items: Item[];
  onCreateSalesOrder: (order: SalesOrder) => void;
  onSubmitSalesOrder: (name: string) => void;
  onShipGoods: (name: string, warehouseName: string) => void;
}

export const SellingModule: React.FC<SellingModuleProps> = ({
  customers,
  salesOrders,
  items,
  onCreateSalesOrder,
  onSubmitSalesOrder,
  onShipGoods,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'customers'>('orders');
  const [isCreateSoOpen, setIsCreateSoOpen] = useState(false);
  const [selectedSo, setSelectedSo] = useState<SalesOrder | null>(null);
  const [sourceWarehouse, setSourceWarehouse] = useState('Raw Materials - SCMS');

  // Form states for new SO
  const [newSo, setNewSo] = useState({
    customer: '',
    delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    items: [] as SalesOrderItem[],
  });

  const [itemRow, setItemRow] = useState({
    item_code: '',
    qty: 1,
    rate: 0,
  });

  const handleAddRow = () => {
    if (!itemRow.item_code || itemRow.qty <= 0) return;
    
    const matchedItem = items.find(i => i.name === itemRow.item_code);
    if (!matchedItem) return;

    const existingRowIdx = newSo.items.findIndex(i => i.item_code === itemRow.item_code);
    if (existingRowIdx > -1) {
      const updated = [...newSo.items];
      updated[existingRowIdx].qty += itemRow.qty;
      updated[existingRowIdx].amount = updated[existingRowIdx].qty * updated[existingRowIdx].rate;
      setNewSo({ ...newSo, items: updated });
    } else {
      setNewSo({
        ...newSo,
        items: [
          ...newSo.items,
          {
            item_code: itemRow.item_code,
            item_name: matchedItem.item_name,
            qty: itemRow.qty,
            delivered_qty: 0,
            rate: itemRow.rate || matchedItem.standard_selling_rate,
            amount: itemRow.qty * (itemRow.rate || matchedItem.standard_selling_rate),
            uom: matchedItem.stock_uom,
          }
        ]
      });
    }

    // Reset row form
    setItemRow({ item_code: '', qty: 1, rate: 0 });
  };

  const handleRemoveRow = (idx: number) => {
    const updated = newSo.items.filter((_, i) => i !== idx);
    setNewSo({ ...newSo, items: updated });
  };

  const handleSubmitSO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSo.customer || newSo.items.length === 0) return;

    const grand_total = newSo.items.reduce((sum, item) => sum + item.amount, 0);
    const total_qty = newSo.items.reduce((sum, item) => sum + item.qty, 0);
    const orderName = `SO-2026-${Math.floor(Math.random() * 9000) + 1000}`;

    onCreateSalesOrder({
      name: orderName,
      customer: newSo.customer,
      transaction_date: new Date().toISOString().split('T')[0],
      delivery_date: newSo.delivery_date,
      status: 'Draft',
      items: newSo.items,
      grand_total,
      total_qty,
    });

    // Reset
    setNewSo({
      customer: '',
      delivery_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [],
    });
    setIsCreateSoOpen(false);
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '0.15rem' }}>Sales & Order Fulfillment</h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Control customer orders, verify available stock allocations, and process outward delivery shipments.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={() => setIsCreateSoOpen(true)}>
            <Plus size={16} /> Create SO
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar" role="tablist">
        <button 
          className={`tab-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          role="tab"
          aria-selected={activeTab === 'orders'}
        >
          <FileText size={16} /> Sales Orders
        </button>
        <button 
          className={`tab-item ${activeTab === 'customers' ? 'active' : ''}`}
          onClick={() => setActiveTab('customers')}
          role="tab"
          aria-selected={activeTab === 'customers'}
        >
          <Users size={16} /> Customer Directory
        </button>
      </div>

      {/* TABS CONTENT */}
      {activeTab === 'orders' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>SO Name</th>
                  <th>Order Date</th>
                  <th>Customer</th>
                  <th>Line Items</th>
                  <th>Total Qty</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salesOrders.map((so) => (
                  <tr key={so.name}>
                    <td style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{so.name}</td>
                    <td>{so.transaction_date}</td>
                    <td style={{ fontWeight: 500 }}>{so.customer}</td>
                    <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                      {so.items.map(i => `${i.item_code} (${i.qty})`).join(', ')}
                    </td>
                    <td>{so.total_qty.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>${so.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`badge ${
                        so.status === 'Shipped' ? 'badge-success' : so.status === 'Submitted' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {so.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setSelectedSo(so)}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {salesOrders.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <FileText size={32} className="empty-state-icon" />
                        <div className="empty-state-title">No sales orders</div>
                        <div className="empty-state-desc">Create a sales order to start tracking fulfillment.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'customers' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Customer Group</th>
                  <th>Status</th>
                  <th>Contact Email</th>
                  <th>Contact Phone</th>
                  <th>Delivery Address</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.name}>
                    <td style={{ fontWeight: 600 }}>{customer.name}</td>
                    <td><span className="badge badge-primary">{customer.customer_group}</span></td>
                    <td>
                      <span className={`badge ${customer.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {customer.status}
                      </span>
                    </td>
                    <td>{customer.email || '—'}</td>
                    <td>{customer.phone || '—'}</td>
                    <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', maxWidth: '200px' }} className="truncate">{customer.address || '—'}</td>
                  </tr>
                ))}
                {customers.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <Users size={32} className="empty-state-icon" />
                        <div className="empty-state-title">No customers registered</div>
                        <div className="empty-state-desc">Customers will appear here once added.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW SO MODAL */}
      {selectedSo && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedSo.name} — Sales Sheet</h2>
              <button className="modal-close" onClick={() => setSelectedSo(null)} aria-label="Close modal">×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="layout-split-50-50" style={{ backgroundColor: 'hsl(var(--bg-sidebar))', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border))' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-subtle))' }}>Customer</div>
                  <div style={{ fontWeight: 600 }}>{selectedSo.customer}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-subtle))' }}>Delivery Due Date</div>
                  <div style={{ fontWeight: 600 }}>{selectedSo.delivery_date || 'Not specified'}</div>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Ordered Items</h4>
                <div className="table-container">
                  <table style={{ minWidth: 'auto' }}>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Shipped</th>
                        <th>Price</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedSo.items.map((row, idx) => {
                        // Check if enough stock exists in selected warehouse
                        const matchedItem = items.find(i => i.name === row.item_code);
                        const stockText = matchedItem ? `(Stock: ${matchedItem.current_stock})` : '';
                        return (
                          <tr key={idx}>
                            <td style={{ fontWeight: 500 }}>
                              <div>{row.item_code}</div>
                              <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>
                                {row.item_name} <span style={{ fontWeight: 600, color: 'hsl(var(--warning))' }}>{stockText}</span>
                              </div>
                            </td>
                            <td>{row.qty} {row.uom}</td>
                            <td style={{ fontWeight: 600, color: row.delivered_qty === row.qty ? 'hsl(var(--success))' : 'inherit' }}>
                              {row.delivered_qty}
                            </td>
                            <td>${row.rate.toFixed(2)}</td>
                            <td style={{ textAlign: 'right', fontWeight: 600 }}>${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                          </tr>
                        );
                      })}
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>Grand Total:</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'hsl(var(--primary))' }}>
                          ${selectedSo.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ship Goods/Create Delivery Note */}
              {selectedSo.status === 'Submitted' && (
                <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem' }}>Fulfillment Shipments (Delivery Note)</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <select value={sourceWarehouse} onChange={(e) => setSourceWarehouse(e.target.value)}>
                        <option value="Raw Materials - SCMS">Raw Materials - SCMS</option>
                        <option value="Finished Goods - SCMS">Finished Goods - SCMS</option>
                        <option value="Quality Inspection - SCMS">Quality Inspection - SCMS</option>
                      </select>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-primary"
                      onClick={() => {
                        onShipGoods(selectedSo.name, sourceWarehouse);
                        setSelectedSo(null);
                      }}
                    >
                      <ArrowRight size={16} /> Dispatch Shipment
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center" style={{ gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid hsl(var(--border))' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedSo(null)}>Close</button>
              {selectedSo.status === 'Draft' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    onSubmitSalesOrder(selectedSo.name);
                    setSelectedSo(null);
                  }}
                >
                  Submit Sales Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE SO MODAL */}
      {isCreateSoOpen && (
        <div className="modal-overlay">
          <form className="modal-content" style={{ maxWidth: '650px' }} onSubmit={handleSubmitSO}>
            <div className="modal-header">
              <h2 className="modal-title">New Sales Order</h2>
              <button type="button" className="modal-close" onClick={() => setIsCreateSoOpen(false)} aria-label="Close modal">×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="layout-split-50-50" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Customer *</label>
                  <select 
                    required
                    value={newSo.customer} 
                    onChange={(e) => setNewSo({ ...newSo, customer: e.target.value })}
                  >
                    <option value="">Select Customer...</option>
                    {customers.map(c => (
                      <option key={c.name} value={c.name}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Delivery Due Date</label>
                  <input 
                    type="date" 
                    value={newSo.delivery_date}
                    onChange={(e) => setNewSo({ ...newSo, delivery_date: e.target.value })}
                  />
                </div>
              </div>

              {/* Add row controller */}
              <div style={{ border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius-md)', padding: '0.75rem', backgroundColor: 'hsl(var(--bg-sidebar))' }}>
                <h4 style={{ fontSize: '0.85rem', marginBottom: '0.5rem', color: 'hsl(var(--text-muted))' }}>Add Item Row</h4>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'flex-end' }}>
                  <div className="form-group" style={{ flex: 2 }}>
                    <label style={{ fontSize: '0.75rem' }}>Item</label>
                    <select 
                      value={itemRow.item_code}
                      onChange={(e) => {
                        const matched = items.find(i => i.name === e.target.value);
                        setItemRow({ 
                          ...itemRow, 
                          item_code: e.target.value,
                          rate: matched?.standard_selling_rate || 0 
                        });
                      }}
                    >
                      <option value="">Select Item...</option>
                      {items.map(i => (
                        <option key={i.name} value={i.name}>{i.name} - {i.item_name} (Stock: {i.current_stock})</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem' }}>Qty</label>
                    <input 
                      type="number" 
                      min="1" 
                      value={itemRow.qty}
                      onChange={(e) => setItemRow({ ...itemRow, qty: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem' }}>Price ($)</label>
                    <input 
                      type="number" 
                      min="0"
                      step="0.01"
                      value={itemRow.rate}
                      onChange={(e) => setItemRow({ ...itemRow, rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>

                  <button type="button" className="btn btn-secondary" style={{ padding: '0.6rem' }} onClick={handleAddRow}>
                    Add
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div style={{ marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>Line Items</h4>
                <div className="table-container" style={{ maxHeight: '180px' }}>
                  <table>
                    <thead>
                      <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Amount</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newSo.items.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 500 }}>{row.item_code} - {row.item_name}</td>
                          <td>{row.qty} {row.uom}</td>
                          <td>${row.rate.toFixed(2)}</td>
                          <td style={{ fontWeight: 600 }}>${row.amount.toLocaleString()}</td>
                          <td style={{ textAlign: 'right' }}>
                            <button type="button" className="btn btn-secondary" style={{ padding: '0.3rem', color: 'hsl(var(--danger))' }} onClick={() => handleRemoveRow(idx)}>
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {newSo.items.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: 'hsl(var(--text-muted))' }}>No items added yet. Add items above to draft SO.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center" style={{ gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid hsl(var(--border))' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreateSoOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={newSo.items.length === 0}>Create Draft SO</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
