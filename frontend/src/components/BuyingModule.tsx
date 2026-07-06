import React, { useState } from 'react';
import { Supplier, PurchaseOrder, Item, PurchaseOrderItem } from '../types';
import { 
  Users, 
  ShoppingCart, 
  Plus, 
  Trash2, 
  Eye, 
  CheckCircle, 
  ArrowRight,
  TrendingDown
} from 'lucide-react';

interface BuyingModuleProps {
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  items: Item[];
  onCreatePurchaseOrder: (order: PurchaseOrder) => void;
  onSubmitPurchaseOrder: (name: string) => void;
  onReceiveGoods: (name: string, warehouseName: string) => void;
}

export const BuyingModule: React.FC<BuyingModuleProps> = ({
  suppliers,
  purchaseOrders,
  items,
  onCreatePurchaseOrder,
  onSubmitPurchaseOrder,
  onReceiveGoods,
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [isCreatePoOpen, setIsCreatePoOpen] = useState(false);
  const [selectedPo, setSelectedPo] = useState<PurchaseOrder | null>(null);
  const [targetWarehouse, setTargetWarehouse] = useState('Raw Materials - SCMS');

  // Form states for new PO
  const [newPo, setNewPo] = useState({
    supplier: '',
    schedule_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    items: [] as PurchaseOrderItem[],
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

    const existingRowIdx = newPo.items.findIndex(i => i.item_code === itemRow.item_code);
    if (existingRowIdx > -1) {
      const updated = [...newPo.items];
      updated[existingRowIdx].qty += itemRow.qty;
      updated[existingRowIdx].amount = updated[existingRowIdx].qty * updated[existingRowIdx].rate;
      setNewPo({ ...newPo, items: updated });
    } else {
      setNewPo({
        ...newPo,
        items: [
          ...newPo.items,
          {
            item_code: itemRow.item_code,
            item_name: matchedItem.item_name,
            qty: itemRow.qty,
            received_qty: 0,
            rate: itemRow.rate || matchedItem.valuation_rate,
            amount: itemRow.qty * (itemRow.rate || matchedItem.valuation_rate),
            uom: matchedItem.stock_uom,
          }
        ]
      });
    }

    // Reset row form
    setItemRow({ item_code: '', qty: 1, rate: 0 });
  };

  const handleRemoveRow = (idx: number) => {
    const updated = newPo.items.filter((_, i) => i !== idx);
    setNewPo({ ...newPo, items: updated });
  };

  const handleSubmitPO = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPo.supplier || newPo.items.length === 0) return;

    const grand_total = newPo.items.reduce((sum, item) => sum + item.amount, 0);
    const total_qty = newPo.items.reduce((sum, item) => sum + item.qty, 0);
    const orderName = `PO-2026-${Math.floor(Math.random() * 9000) + 1000}`;

    onCreatePurchaseOrder({
      name: orderName,
      supplier: newPo.supplier,
      transaction_date: new Date().toISOString().split('T')[0],
      schedule_date: newPo.schedule_date,
      status: 'Draft',
      items: newPo.items,
      grand_total,
      total_qty,
    });

    // Reset
    setNewPo({
      supplier: '',
      schedule_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: [],
    });
    setIsCreatePoOpen(false);
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div className="flex justify-between items-center" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '0.15rem' }}>Procurement & Buying</h1>
          <p style={{ color: 'hsl(var(--text-muted))' }}>Manage material sourcing, register vendors, and control purchase cycles from request to receipt.</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-primary" onClick={() => setIsCreatePoOpen(true)}>
            <Plus size={16} /> Create PO
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
          <ShoppingCart size={16} /> Purchase Orders
        </button>
        <button 
          className={`tab-item ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
          role="tab"
          aria-selected={activeTab === 'suppliers'}
        >
          <Users size={16} /> Supplier Master
        </button>
      </div>

      {/* CONTENT */}
      {activeTab === 'orders' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>PO Name</th>
                  <th>Posting Date</th>
                  <th>Supplier</th>
                  <th>Line Items</th>
                  <th>Total Qty</th>
                  <th>Grand Total</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.map((po) => (
                  <tr key={po.name}>
                    <td style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{po.name}</td>
                    <td>{po.transaction_date}</td>
                    <td style={{ fontWeight: 500 }}>{po.supplier}</td>
                    <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))' }}>
                      {po.items.map(i => `${i.item_code} (${i.qty})`).join(', ')}
                    </td>
                    <td>{po.total_qty.toLocaleString()}</td>
                    <td style={{ fontWeight: 600 }}>${po.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                    <td>
                      <span className={`badge ${
                        po.status === 'Received' ? 'badge-success' : po.status === 'Submitted' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button className="btn btn-secondary" style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem' }} onClick={() => setSelectedPo(po)}>
                        <Eye size={14} /> View
                      </button>
                    </td>
                  </tr>
                ))}
                {purchaseOrders.length === 0 && (
                  <tr>
                    <td colSpan={8}>
                      <div className="empty-state">
                        <ShoppingCart size={32} className="empty-state-icon" />
                        <div className="empty-state-title">No purchase orders</div>
                        <div className="empty-state-desc">Create a purchase order to start tracking procurement.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'suppliers' && (
        <div className="animate-slide-up" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Vendor Name</th>
                  <th>Vendor Group</th>
                  <th>Status</th>
                  <th>Contact Email</th>
                  <th>Contact Phone</th>
                  <th>Office Address</th>
                </tr>
              </thead>
              <tbody>
                {suppliers.map((supplier) => (
                  <tr key={supplier.name}>
                    <td style={{ fontWeight: 600 }}>{supplier.name}</td>
                    <td><span className="badge badge-primary">{supplier.supplier_group}</span></td>
                    <td>
                      <span className={`badge ${supplier.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                        {supplier.status}
                      </span>
                    </td>
                    <td>{supplier.contact_email || '—'}</td>
                    <td>{supplier.contact_phone || '—'}</td>
                    <td style={{ fontSize: '0.85rem', color: 'hsl(var(--text-muted))', maxWidth: '200px' }} className="truncate">{supplier.address || '—'}</td>
                  </tr>
                ))}
                {suppliers.length === 0 && (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">
                        <Users size={32} className="empty-state-icon" />
                        <div className="empty-state-title">No suppliers registered</div>
                        <div className="empty-state-desc">Suppliers will appear here once added.</div>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW PO MODAL */}
      {selectedPo && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">{selectedPo.name} — Order Sheet</h2>
              <button className="modal-close" onClick={() => setSelectedPo(null)} aria-label="Close modal">×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="layout-split-50-50" style={{ backgroundColor: 'hsl(var(--bg-sidebar))', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid hsl(var(--border))' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-subtle))' }}>Vendor / Supplier</div>
                  <div style={{ fontWeight: 600 }}>{selectedPo.supplier}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-subtle))' }}>Required Delivery Date</div>
                  <div style={{ fontWeight: 600 }}>{selectedPo.schedule_date || 'Not specified'}</div>
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
                        <th>Received</th>
                        <th>Rate</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPo.items.map((row, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 500 }}>
                            <div>{row.item_code}</div>
                            <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-muted))' }}>{row.item_name}</div>
                          </td>
                          <td>{row.qty} {row.uom}</td>
                          <td style={{ fontWeight: 600, color: row.received_qty === row.qty ? 'hsl(var(--success))' : 'inherit' }}>
                            {row.received_qty}
                          </td>
                          <td>${row.rate.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${row.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'right', fontWeight: 700 }}>Grand Total:</td>
                        <td style={{ textAlign: 'right', fontWeight: 800, color: 'hsl(var(--primary))' }}>
                          ${selectedPo.grand_total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Receive Goods actions */}
              {selectedPo.status === 'Submitted' && (
                <div style={{ borderTop: '1px solid hsl(var(--border))', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h4 style={{ fontSize: '0.9rem' }}>Receive Goods Receipt (GRN)</h4>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <select value={targetWarehouse} onChange={(e) => setTargetWarehouse(e.target.value)}>
                        <option value="Raw Materials - SCMS">Raw Materials - SCMS</option>
                        <option value="Quality Inspection - SCMS">Quality Inspection - SCMS</option>
                        <option value="Finished Goods - SCMS">Finished Goods - SCMS</option>
                      </select>
                    </div>
                    <button 
                      type="button" 
                      className="btn btn-success"
                      onClick={() => {
                        onReceiveGoods(selectedPo.name, targetWarehouse);
                        setSelectedPo(null);
                      }}
                    >
                      <CheckCircle size={16} /> Receive into Store
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center" style={{ gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid hsl(var(--border))' }}>
              <button className="btn btn-secondary" onClick={() => setSelectedPo(null)}>Close</button>
              {selectedPo.status === 'Draft' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    onSubmitPurchaseOrder(selectedPo.name);
                    setSelectedPo(null);
                  }}
                >
                  Submit Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CREATE PO MODAL */}
      {isCreatePoOpen && (
        <div className="modal-overlay">
          <form className="modal-content" style={{ maxWidth: '650px' }} onSubmit={handleSubmitPO}>
            <div className="modal-header">
              <h2 className="modal-title">New Purchase Order</h2>
              <button type="button" className="modal-close" onClick={() => setIsCreatePoOpen(false)} aria-label="Close modal">×</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="layout-split-50-50" style={{ gap: '0.75rem' }}>
                <div className="form-group">
                  <label>Supplier / Vendor *</label>
                  <select 
                    required
                    value={newPo.supplier} 
                    onChange={(e) => setNewPo({ ...newPo, supplier: e.target.value })}
                  >
                    <option value="">Select Supplier...</option>
                    {suppliers.map(s => (
                      <option key={s.name} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Required Delivery Date</label>
                  <input 
                    type="date" 
                    value={newPo.schedule_date}
                    onChange={(e) => setNewPo({ ...newPo, schedule_date: e.target.value })}
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
                          rate: matched?.valuation_rate || 0 
                        });
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
                      onChange={(e) => setItemRow({ ...itemRow, qty: parseInt(e.target.value) || 0 })}
                    />
                  </div>

                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem' }}>Rate ($)</label>
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
                        <th>Rate</th>
                        <th>Amount</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {newPo.items.map((row, idx) => (
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
                      {newPo.items.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: 'hsl(var(--text-muted))' }}>No items added yet. Add items above to draft PO.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center" style={{ gap: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid hsl(var(--border))' }}>
              <button type="button" className="btn btn-secondary" onClick={() => setIsCreatePoOpen(false)}>Cancel</button>
              <button type="submit" className="btn btn-primary" disabled={newPo.items.length === 0}>Create Draft PO</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
