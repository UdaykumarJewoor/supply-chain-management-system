import React from 'react';
import { Item, PurchaseOrder, SalesOrder, Warehouse } from '../types';
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  AlertTriangle, 
  ArrowRight,
  TrendingUp,
  ClipboardList
} from 'lucide-react';

interface DashboardProps {
  items: Item[];
  purchaseOrders: PurchaseOrder[];
  salesOrders: SalesOrder[];
  warehouses: Warehouse[];
  onNavigate: (module: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  items, 
  purchaseOrders, 
  salesOrders, 
  warehouses,
  onNavigate 
}) => {
  // Calculations
  const totalStockValuation = items.reduce((sum, item) => sum + (item.current_stock * item.valuation_rate), 0);
  const lowStockItems = items.filter(item => item.current_stock <= item.reorder_level);
  const pendingPOs = purchaseOrders.filter(po => po.status === 'Submitted' || po.status === 'Draft');
  const pendingDeliveries = salesOrders.filter(so => so.status === 'Submitted');

  // Supplier metrics
  const topSuppliers = [
    { name: 'Apex Metal Works', onTimeRate: '98.5%', qualityScore: '99.1%' },
    { name: 'LithiumTech Solutions', onTimeRate: '92.0%', qualityScore: '98.7%' },
    { name: 'Precision Fasteners Ltd', onTimeRate: '100.0%', qualityScore: '99.9%' }
  ];

  return (
    <div className="main-content">
      {/* Header section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid hsl(var(--border))', paddingBottom: '1.25rem', marginBottom: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, letterSpacing: '-0.03em', marginBottom: '0.25rem' }}>SCM Command Center</h1>
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.9rem' }}>Real-time valuation metrics, procurement logs, and shipping tracking.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', backgroundColor: 'hsl(var(--bg-card))', border: '1px solid hsl(var(--border))', padding: '0.4rem 0.8rem', borderRadius: '6px' }}>
          <div className="pulse-indicator"></div>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--success))' }}>SYNCED WITH ERPNEXT</span>
        </div>
      </div>

      {/* Critical Alert Bar */}
      {lowStockItems.length > 0 && (
        <div 
          style={{ 
            backgroundColor: 'hsl(var(--warning-bg))',
            border: '1px solid hsl(var(--warning-border))',
            borderRadius: 'var(--radius-md)',
            padding: '0.85rem 1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle color="hsl(var(--warning))" size={18} />
            <div style={{ fontSize: '0.875rem' }}>
              <span style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>Safety Stock Breach:</span>{' '}
              <span style={{ color: 'hsl(var(--text-muted))' }}>
                {lowStockItems.length} items have fallen below their required reorder levels.
              </span>
            </div>
          </div>
          <button className="btn btn-secondary" style={{ padding: '0.3rem 0.65rem', fontSize: '0.775rem' }} onClick={() => onNavigate('inventory')}>
            View Items
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        {/* KPI 1 */}
        <div className="card" onClick={() => onNavigate('inventory')} style={{ cursor: 'pointer' }}>
          <div className="card-header-flex">
            <span className="card-title">Stock Valuation</span>
            <TrendingUp color="hsl(var(--primary))" size={16} />
          </div>
          <div>
            <div className="card-value">${totalStockValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="card-subtitle">Across {warehouses.length} physical stores</div>
          </div>
        </div>

        {/* KPI 2 */}
        <div className="card" onClick={() => onNavigate('inventory')} style={{ cursor: 'pointer' }}>
          <div className="card-header-flex">
            <span className="card-title">Low Stock Alerts</span>
            <AlertTriangle color={lowStockItems.length > 0 ? 'hsl(var(--warning))' : 'hsl(var(--text-subtle))'} size={16} />
          </div>
          <div>
            <div className="card-value" style={{ color: lowStockItems.length > 0 ? 'hsl(var(--warning))' : 'inherit' }}>
              {lowStockItems.length}
            </div>
            <div className="card-subtitle">SKUs requiring replenishment</div>
          </div>
        </div>

        {/* KPI 3 */}
        <div className="card" onClick={() => onNavigate('buying')} style={{ cursor: 'pointer' }}>
          <div className="card-header-flex">
            <span className="card-title">Procurement Orders</span>
            <ShoppingCart color="hsl(var(--success))" size={16} />
          </div>
          <div>
            <div className="card-value">{pendingPOs.length}</div>
            <div className="card-subtitle">Active Purchase Orders</div>
          </div>
        </div>

        {/* KPI 4 */}
        <div className="card" onClick={() => onNavigate('selling')} style={{ cursor: 'pointer' }}>
          <div className="card-header-flex">
            <span className="card-title">Fulfillment Orders</span>
            <Truck color="hsl(var(--info))" size={16} />
          </div>
          <div>
            <div className="card-value">{pendingDeliveries.length}</div>
            <div className="card-subtitle">Orders awaiting shipment</div>
          </div>
        </div>
      </div>

      {/* Charts & Map Sections */}
      <div className="layout-split-60-40">
        
        {/* Logistics SVG Node Pipeline */}
        <div className="card" style={{ gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.15rem' }}>Logistics Route Pipeline</h3>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Operational path tracing inventory transfers from suppliers to consumers.</p>
          </div>

          <div style={{ 
            backgroundColor: 'hsl(var(--bg-sidebar))', 
            border: '1px solid hsl(var(--border))', 
            borderRadius: 'var(--radius-md)', 
            padding: '1.25rem',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <svg viewBox="0 0 800 150" style={{ width: '100%', height: 'auto', overflow: 'visible' }}>
              {/* Path gradients */}
              <defs>
                <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" />
                  <stop offset="50%" stopColor="hsl(var(--info))" />
                  <stop offset="100%" stopColor="hsl(var(--success))" />
                </linearGradient>
              </defs>

              {/* Underlying path line */}
              <line x1="80" y1="75" x2="720" y2="75" stroke="hsl(var(--border))" strokeWidth="4" strokeLinecap="round" />
              
              {/* Active animated flow line */}
              <line 
                x1="80" y1="75" 
                x2="720" y2="75" 
                stroke="url(#flowGrad)" 
                strokeWidth="4" 
                strokeLinecap="round" 
                strokeDasharray="8 6" 
                style={{ animation: 'flowDash 25s linear infinite' }} 
              />

              {/* Node 1: Sourcing */}
              <g transform="translate(80, 75)" className="pipeline-node">
                <circle r="18" fill="hsl(var(--bg-card))" stroke="hsl(var(--primary))" strokeWidth="2" />
                <foreignObject x="-10" y="-10" width="20" height="20">
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'hsl(var(--primary))' }}>
                    <ShoppingCart size={12} />
                  </div>
                </foreignObject>
                <text x="0" y="32" textAnchor="middle" fill="hsl(var(--text-main))" fontSize="10" fontWeight="600">Sourcing</text>
              </g>

              {/* Node 2: Inspection */}
              <g transform="translate(240, 75)" className="pipeline-node">
                <circle r="18" fill="hsl(var(--bg-card))" stroke="hsl(var(--info))" strokeWidth="2" />
                <foreignObject x="-10" y="-10" width="20" height="20">
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'hsl(var(--info))' }}>
                    <ClipboardList size={12} />
                  </div>
                </foreignObject>
                <text x="0" y="32" textAnchor="middle" fill="hsl(var(--text-main))" fontSize="10" fontWeight="600">QA Check</text>
              </g>

              {/* Node 3: Warehouse */}
              <g transform="translate(400, 75)" className="pipeline-node">
                <circle r="22" fill="hsl(var(--bg-card))" stroke="hsl(var(--primary))" strokeWidth="3" />
                <foreignObject x="-11" y="-11" width="22" height="22">
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'hsl(var(--primary))' }}>
                    <Package size={13} />
                  </div>
                </foreignObject>
                <text x="0" y="36" textAnchor="middle" fill="hsl(var(--text-main))" fontSize="10" fontWeight="700">Central Store</text>
              </g>

              {/* Node 4: Transit */}
              <g transform="translate(560, 75)" className="pipeline-node">
                <circle r="18" fill="hsl(var(--bg-card))" stroke="hsl(var(--warning))" strokeWidth="2" />
                <foreignObject x="-10" y="-10" width="20" height="20">
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'hsl(var(--warning))' }}>
                    <Truck size={12} />
                  </div>
                </foreignObject>
                <text x="0" y="32" textAnchor="middle" fill="hsl(var(--text-main))" fontSize="10" fontWeight="600">Transit</text>
              </g>

              {/* Node 5: Customer */}
              <g transform="translate(720, 75)" className="pipeline-node">
                <circle r="18" fill="hsl(var(--bg-card))" stroke="hsl(var(--border))" strokeWidth="2" />
                <foreignObject x="-10" y="-10" width="20" height="20">
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: 'hsl(var(--text-subtle))' }}>
                    <ArrowRight size={12} />
                  </div>
                </foreignObject>
                <text x="0" y="32" textAnchor="middle" fill="hsl(var(--text-main))" fontSize="10" fontWeight="600">Delivery</text>
              </g>
            </svg>
            <style>{`
              @keyframes flowDash {
                to { stroke-dashoffset: -200; }
              }
              .pipeline-node { transition: transform 0.2s ease-out; }
              .pipeline-node:hover { transform: scale(1.05); }
            `}</style>
          </div>
        </div>

        {/* Supplier Scoreboard */}
        <div className="card" style={{ gap: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.15rem' }}>Supplier Logistics Scorecard</h3>
            <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Vendor metrics evaluating delivery schedules and pass ratios.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, justifyContent: 'center' }}>
            {topSuppliers.map((supplier, idx) => (
              <div 
                key={idx}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  padding: '0.65rem 0.85rem',
                  backgroundColor: 'hsl(var(--bg-sidebar))',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid hsl(var(--border))'
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{supplier.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'hsl(var(--text-subtle))' }}>Verified Partner</div>
                </div>
                <div style={{ display: 'flex', gap: '1.25rem', textAlign: 'right' }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--primary))' }}>{supplier.onTimeRate}</div>
                    <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-subtle))' }}>On-Time</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'hsl(var(--success))' }}>{supplier.qualityScore}</div>
                    <div style={{ fontSize: '0.65rem', color: 'hsl(var(--text-subtle))' }}>QA Pass</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Order Lists Table Grid */}
      <div className="layout-split-50-50">
        
        {/* Incoming Shipments */}
        <div className="card" style={{ gap: '1rem' }}>
          <div className="card-header-flex">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Incoming Materials (PO)</h3>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Materials status from procurement orders.</p>
            </div>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.775rem' }} onClick={() => onNavigate('buying')}>
              View POs
            </button>
          </div>

          <div className="table-container" style={{ maxHeight: '200px' }}>
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Supplier</th>
                  <th>Quantity</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {purchaseOrders.slice(0, 4).map((po) => (
                  <tr key={po.name}>
                    <td style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{po.name}</td>
                    <td>{po.supplier}</td>
                    <td>{po.total_qty} units</td>
                    <td>
                      <span className={`badge ${
                        po.status === 'Received' ? 'badge-success' : po.status === 'Submitted' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {po.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Outgoing Shipments */}
        <div className="card" style={{ gap: '1rem' }}>
          <div className="card-header-flex">
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600 }}>Outgoing Shipments (SO)</h3>
              <p style={{ color: 'hsl(var(--text-muted))', fontSize: '0.8rem' }}>Dispatch status for sales fulfillment.</p>
            </div>
            <button className="btn btn-secondary" style={{ padding: '0.35rem 0.7rem', fontSize: '0.775rem' }} onClick={() => onNavigate('selling')}>
              View Sales
            </button>
          </div>

          <div className="table-container" style={{ maxHeight: '200px' }}>
            <table>
              <thead>
                <tr>
                  <th>Sales Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {salesOrders.slice(0, 4).map((so) => (
                  <tr key={so.name}>
                    <td style={{ fontWeight: 600, color: 'hsl(var(--primary))' }}>{so.name}</td>
                    <td>{so.customer}</td>
                    <td>${so.grand_total.toLocaleString()}</td>
                    <td>
                      <span className={`badge ${
                        so.status === 'Shipped' ? 'badge-success' : so.status === 'Submitted' ? 'badge-info' : 'badge-warning'
                      }`}>
                        {so.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
