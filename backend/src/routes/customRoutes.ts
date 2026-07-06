import { Router } from 'express';

const router = Router();

// Local In-Memory DB for custom local annotations (e.g. PO Comments/Notes)
const poAnnotations: { [poId: string]: string[] } = {
  'PO-2026-00001': ['Standard steel materials inspected at delivery.', 'Vendor offered 5% freight discount.'],
  'PO-2026-00002': ['Batteries in-transit from Korea. Shipment tracked via DHL.'],
};

// Health Check
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    service: 'SCMS Custom Extensions API',
  });
});

// Custom Report: Local Stock Valuation Analysis
router.get('/reports/valuation-analysis', (req, res) => {
  // Returns custom report layout configurations or calculations
  res.json({
    report_title: 'Local SCM Financial & Valuation Summary',
    compiled_at: new Date(),
    indicators: {
      risk_items_count: 2,
      critical_shortage: true,
      last_audit_date: '2026-06-30',
    },
    local_warehouse_allocations: [
      { warehouse: 'Raw Materials - SCMS', factor: 1.15, audit_status: 'Passed' },
      { warehouse: 'Finished Goods - SCMS', factor: 1.00, audit_status: 'Pending' },
      { warehouse: 'Transit Hub - SCMS', factor: 0.90, audit_status: 'Passed' },
    ],
  });
});

// Custom PO Annotations: GET
router.get('/annotations/:poId', (req, res) => {
  const { poId } = req.params;
  res.json({
    poId,
    annotations: poAnnotations[poId] || [],
  });
});

// Custom PO Annotations: POST
router.post('/annotations/:poId', (req, res) => {
  const { poId } = req.params;
  const { note } = req.body;

  if (!note) {
    res.status(400).json({ success: false, message: 'Note text is required.' });
    return;
  }

  if (!poAnnotations[poId]) {
    poAnnotations[poId] = [];
  }

  poAnnotations[poId].push(note);
  console.log(`[Custom API] Note added to ${poId}: "${note}"`);
  
  res.json({
    success: true,
    poId,
    annotations: poAnnotations[poId],
  });
});

export default router;
