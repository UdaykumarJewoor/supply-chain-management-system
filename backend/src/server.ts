import express from 'express';
import cors from 'cors';
import config from './config/index.js';
import erpnextRoutes from './routes/erpnextRoutes.js';
import customRoutes from './routes/customRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Mount routers
app.use('/api/erpnext', erpnextRoutes);
app.use('/api/custom', customRoutes);

// Root path diagnostic route
app.get('/', (req, res) => {
  res.json({
    message: 'SCMS Modular Backend Service API',
    endpoints: {
      erpnext_proxy: '/api/erpnext/*',
      custom_extension: '/api/custom/*',
    },
    version: '1.0.0',
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`  SCMS Modular Backend Server Listening on Port ${PORT}`);
  console.log(`  Target ERPNext Host: ${config.url}`);
  console.log(`  - Proxy API Routes: http://localhost:${PORT}/api/erpnext`);
  console.log(`  - Custom API Routes: http://localhost:${PORT}/api/custom`);
  console.log(`=================================================`);
});
