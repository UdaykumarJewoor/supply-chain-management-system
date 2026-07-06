import React, { useState } from 'react';
import { ERPNextConfig, Item, Warehouse, Supplier, Customer } from '../types';
import { 
  testERPNextConnection,
  fetchERPNextItems,
  fetchERPNextWarehouses,
  fetchERPNextSuppliers,
  fetchERPNextCustomers,
  saveConfig
} from '../services/erpnextApi';
import { 
  Server, 
  Key, 
  CheckCircle, 
  XCircle, 
  RefreshCw, 
  Terminal, 
  Download,
  AlertCircle
} from 'lucide-react';

interface IntegrationConsoleProps {
  config: ERPNextConfig;
  onUpdateConfig: (config: ERPNextConfig) => void;
  onSyncItems: (items: Item[]) => void;
  onSyncWarehouses: (warehouses: Warehouse[]) => void;
  onSyncSuppliers: (suppliers: Supplier[]) => void;
  onSyncCustomers: (customers: Customer[]) => void;
}

export const IntegrationConsole: React.FC<IntegrationConsoleProps> = ({
  config,
  onUpdateConfig,
  onSyncItems,
  onSyncWarehouses,
  onSyncSuppliers,
  onSyncCustomers,
}) => {
  const [url, setUrl] = useState(config.url || 'http://localhost:8000');
  const [apiKey, setApiKey] = useState(config.apiKey || '');
  const [apiSecret, setApiSecret] = useState(config.apiSecret || '');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string; username?: string } | null>(null);
  
  // Sync loading status
  const [syncing, setSyncing] = useState<{ [key: string]: boolean }>({
    items: false,
    warehouses: false,
    suppliers: false,
    customers: false,
  });

  // Log terminal outputs
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] System: Local Supply Chain Management shell active.`,
    `[${new Date().toLocaleTimeString()}] System: Ready for ERPNext synchronization config.`,
  ]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setTestResult(null);
    addLog(`Testing connection to ERPNext URL: ${url}...`);

    const tempConfig: ERPNextConfig = { url, apiKey, apiSecret, connected: false };
    const res = await testERPNextConnection(tempConfig);
    
    setTesting(false);
    setTestResult(res);

    if (res.success) {
      const updatedConfig = { ...tempConfig, connected: true };
      onUpdateConfig(updatedConfig);
      saveConfig(updatedConfig);
      addLog(`Connected successfully. Logged in as: ${res.username}. Credentials saved.`);
    } else {
      const updatedConfig = { ...tempConfig, connected: false };
      onUpdateConfig(updatedConfig);
      saveConfig(updatedConfig);
      addLog(`Connection Failed: ${res.message}`);
    }
  };

  const handleDisconnect = () => {
    const disconnected = { url: '', apiKey: '', apiSecret: '', connected: false };
    setUrl('http://localhost:8000');
    setApiKey('');
    setApiSecret('');
    setTestResult(null);
    onUpdateConfig(disconnected);
    saveConfig(disconnected);
    addLog(`Credentials cleared. Integration offline.`);
  };

  const handleSync = async (type: 'items' | 'warehouses' | 'suppliers' | 'customers') => {
    if (!config.connected) {
      addLog(`Sync error: Please verify and establish connection to ERPNext first.`);
      return;
    }

    setSyncing(prev => ({ ...prev, [type]: true }));
    addLog(`Requesting REST endpoint: /api/resource/${type === 'items' ? 'Item' : type === 'warehouses' ? 'Warehouse' : type === 'suppliers' ? 'Supplier' : 'Customer'}...`);

    try {
      if (type === 'items') {
        const items = await fetchERPNextItems(config);
        onSyncItems(items);
        addLog(`Pulled ${items.length} active Item master records from ERPNext.`);
      } else if (type === 'warehouses') {
        const warehouses = await fetchERPNextWarehouses(config);
        onSyncWarehouses(warehouses);
        addLog(`Pulled ${warehouses.length} active Warehouse structures from ERPNext.`);
      } else if (type === 'suppliers') {
        const suppliers = await fetchERPNextSuppliers(config);
        onSyncSuppliers(suppliers);
        addLog(`Pulled ${suppliers.length} Supplier profiles from ERPNext.`);
      } else if (type === 'customers') {
        const customers = await fetchERPNextCustomers(config);
        onSyncCustomers(customers);
        addLog(`Pulled ${customers.length} Customer accounts from ERPNext.`);
      }
    } catch (err: any) {
      console.error(err);
      addLog(`Sync failed for ${type}: ${err.message || err}`);
    } finally {
      setSyncing(prev => ({ ...prev, [type]: false }));
    }
  };

  return (
    <div className="main-content">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: '2rem', fontFamily: 'var(--font-display)', marginBottom: '0.25rem' }}>ERPNext Integration</h1>
        <p style={{ color: 'hsl(var(--text-muted))' }}>Connect and synchronize stock items, suppliers, customers, and warehouses directly with Frappe REST APIs.</p>
      </div>

      <div className="layout-split-60-40">
        
        {/* Connection Setup Form */}
        <div className="card" style={{ gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Server color="hsl(var(--primary))" size={20} />
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>API Credentials</h3>
          </div>

          <form onSubmit={handleTestConnection} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="form-group">
              <label>ERPNext Base URL</label>
              <input 
                type="url" 
                required
                disabled={config.connected}
                placeholder="http://localhost:8000"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
              <span style={{ fontSize: '0.75rem', color: 'hsl(var(--text-subtle))' }}>The address where your Frappe/ERPNext docker container or host site is listening.</span>
            </div>

            <div className="layout-split-50-50" style={{ gap: '0.75rem' }}>
              <div className="form-group">
                <label>API Key</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="text" 
                    required
                    disabled={config.connected}
                    placeholder="Enter API Key"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>API Secret</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type="password" 
                    required
                    disabled={config.connected}
                    placeholder="Enter API Secret"
                    value={apiSecret}
                    onChange={(e) => setApiSecret(e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
            </div>

            {testResult && (
              <div style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.5rem',
                fontSize: '0.85rem',
                backgroundColor: testResult.success ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                border: testResult.success ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                color: testResult.success ? 'hsl(var(--success))' : 'hsl(var(--danger))'
              }}>
                {testResult.success ? <CheckCircle size={18} /> : <XCircle size={18} />}
                <span>{testResult.message}</span>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              {!config.connected ? (
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={testing}>
                  {testing ? <RefreshCw className="spin" size={16} /> : 'Test & Connect'}
                </button>
              ) : (
                <button type="button" className="btn btn-danger" style={{ flex: 1 }} onClick={handleDisconnect}>
                  Disconnect Integration
                </button>
              )}
            </div>
          </form>

          <style>{`
            .spin {
              animation: spin 1.2s linear infinite;
            }
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>

        {/* Sync Controls Panel */}
        <div className="card" style={{ gap: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download color="hsl(var(--info))" size={20} />
            <h3 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)' }}>Data Synchronizer</h3>
          </div>

          {!config.connected && (
            <div style={{ 
              padding: '1rem', 
              backgroundColor: 'hsl(var(--bg-sidebar))', 
              borderRadius: 'var(--radius-md)',
              border: '1px solid hsl(var(--border))',
              display: 'flex',
              gap: '0.75rem',
              alignItems: 'flex-start'
            }}>
              <AlertCircle color="hsl(var(--warning))" size={20} style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.825rem', color: 'hsl(var(--text-muted))' }}>
                <span style={{ fontWeight: 600, color: 'hsl(var(--text-main))' }}>Offline Mode Active</span>
                <br />You are running on high-fidelity simulation mock data. Connect an ERPNext server to sync live ERP assets.
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Sync Items */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid hsl(var(--border))' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Items Master</div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-subtle))' }}>Download catalog parameters</div>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                disabled={!config.connected || syncing.items}
                onClick={() => handleSync('items')}
              >
                {syncing.items ? <RefreshCw className="spin" size={12} /> : 'Sync'}
              </button>
            </div>

            {/* Sync Warehouses */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid hsl(var(--border))' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Warehouses</div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-subtle))' }}>Pull warehouse records</div>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                disabled={!config.connected || syncing.warehouses}
                onClick={() => handleSync('warehouses')}
              >
                {syncing.warehouses ? <RefreshCw className="spin" size={12} /> : 'Sync'}
              </button>
            </div>

            {/* Sync Suppliers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0', borderBottom: '1px solid hsl(var(--border))' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Suppliers</div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-subtle))' }}>Pull vendors list</div>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                disabled={!config.connected || syncing.suppliers}
                onClick={() => handleSync('suppliers')}
              >
                {syncing.suppliers ? <RefreshCw className="spin" size={12} /> : 'Sync'}
              </button>
            </div>

            {/* Sync Customers */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.65rem 0' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>Customers</div>
                <div style={{ fontSize: '0.75rem', color: 'hsl(var(--text-subtle))' }}>Pull buyers records</div>
              </div>
              <button 
                className="btn btn-secondary" 
                style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                disabled={!config.connected || syncing.customers}
                onClick={() => handleSync('customers')}
              >
                {syncing.customers ? <RefreshCw className="spin" size={12} /> : 'Sync'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Connection Log Terminal Output */}
      <div className="card" style={{ gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Terminal color="hsl(var(--primary))" size={18} />
          <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-display)' }}>Integration Debug Console</h3>
        </div>
        <div style={{ 
          backgroundColor: 'black', 
          fontFamily: 'monospace', 
          fontSize: '0.8rem', 
          color: '#39ff14', 
          padding: '1rem', 
          borderRadius: 'var(--radius-md)', 
          maxHeight: '160px', 
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.25rem'
        }}>
          {logs.map((log, idx) => (
            <div key={idx}>{log}</div>
          ))}
        </div>
      </div>
    </div>
  );
};
