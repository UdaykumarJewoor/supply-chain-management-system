# SCM Suite — Supply Chain Management System (ERPNext & React Clone)

SCM Suite is a premium, interactive Supply Chain Management (SCM) console built with **React, TypeScript, and Express**. It clones the workflow structure and design philosophy of ERPNext's inventory, procurement, and sales fulfillment modules.

---

## 🏗️ Architecture & Database Integration

This application is built as a split **Frontend/Backend** system designed to run alongside and integrate directly with your Dockerized ERPNext environment.

```
                  ┌──────────────────────────────────────────────┐
                  │                 BROWSER CLIENT               │
                  │   ┌──────────────────────────────────────┐   │
                  │   │        React Frontend App            │   │
                  │   │        (Port 5173 - Vite)            │   │
                  │   └──────────────────┬───────────────────┘   │
                  └──────────────────────┼───────────────────────┘
                                         │ Local HTTP Requests
                                         ▼ (Bypasses Browser CORS)
                  ┌──────────────────────────────────────────────┐
                  │                 PROXY SERVER                 │
                  │   ┌──────────────────────────────────────┐   │
                  │   │        Express Backend API           │   │
                  │   │        (Port 5000 - Node)            │   │
                  │   └──────────────────┬───────────────────┘   │
                  └──────────────────────┼───────────────────────┘
                                         │ Secure Proxy Request + API Token
                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        YOUR DOCKER CONTAINER                           │
│   ┌──────────────────────────────────┐ ┌───────────────────────────┐   │
│   │       ERPNext App Server         │ │      MariaDB Database     │   │
│   │   (frappe_docker-backend-1)      │ │  (Relational Storage DB)  │   │
│   │         (Port 8000)              │ │                           │   │
│   └─────────────────┬────────────────┘ └─────────────▲─────────────┘   │
│                     └────────────────────────────────┘                 │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. The React Frontend Clone (`frontend/`)
A responsive, glassmorphic Single Page Application (SPA) designed to display stock valuation charts, active warehouse metrics, purchasing modules, and shipping workflows.

### 2. The Express Backend Proxy (`backend/`)
A lightweight Express proxy server that handles API requests from the frontend client. 
* **Database & MariaDB**: This node project **does not run its own MariaDB instance**. Instead, it acts as a gateway that routes request headers to your **actual running ERPNext instance in Docker**, which reads/writes data directly into its **MariaDB** database.
* **CORS Resolution**: Solves CORS blocks dynamically. The browser sends local requests to `http://localhost:5000`, and the Node.js backend handles direct server-to-server HTTP API calls to the ERPNext server on port `8000`.
* **API Token Protection**: Your API Key and API Secret are read securely from the backend's `.env` configuration rather than being exposed in the browser's local storage.
* **Offline Mock Engine**: When the ERPNext server is offline or disconnected, the application seamlessly runs on a premium in-memory simulation engine populated with rich mock datasets.

---

## ⚡ Main Features

* **Operations Dashboard**: Features real-time stock valuation metrics, safety levels check alerts, and an interactive **SVG Logistics Pipeline Diagram** displaying stock flow paths (Suppliers ➔ Inspection ➔ Warehouse ➔ Transit ➔ Customer).
* **Inventory Master (Stock)**: Registered catalog list displaying item groups, SKU, standard UoM, reorder limits, and individual warehouse capacities (meters). Includes Stock Entry creation for material receipts and internal warehouse transfers.
* **Procurement (Buying)**: Tracks Purchase Orders (Draft ➔ Submitted ➔ Received). Creating a Goods Receipt Note (GRN) automatically updates corresponding stock ledgers and warehouse capacities.
* **Fulfillment (Selling)**: Process Sales Orders and outgoing Delivery Notes (DN) to dispatch shipments (automatically deducting stock after checking warehouse availability).
* **Custom Backend APIs**: Modular layout separating ERPNext routing and custom controllers (`backend/src/routes/customRoutes.ts`), ready to expand with custom analytics, annotations, or local databases.

---

## 🚀 How to Configure & Run

You can run the project either directly from the **root workspace directory** (using script shortcuts) or by navigating into the individual subdirectories.

### 1. Configure the ERPNext Environment
Before running the servers, open [backend/.env](file:///c:/Projects/SCMS/backend/.env) and enter your credentials:
```env
PORT=5000
ERPNEXT_URL=http://localhost:8000
ERPNEXT_API_KEY=your_erpnext_api_key
ERPNEXT_API_SECRET=your_erpnext_api_secret
```

---

### Option A: Running from the Root Workspace Directory (Recommended)

You can run all commands directly from the root `C:\Projects\SCMS` folder:

1. **Start the Frontend Client** (Vite on port 5173):
   ```bash
   npm run dev
   ```
2. **Start the Backend Proxy** (Express on port 5000 in a separate terminal):
   ```bash
   npm run dev:backend
   ```
3. **Helper Commands**:
   * Install all packages: `npm run install:all`
   * Build all packages: `npm run build:all`

---

### Option B: Running from Individual Subfolders

If you prefer to run inside the subdirectories:

1. **Start the Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
2. **Start the Frontend Client**:
   ```bash
   cd frontend
   npm run dev
   ```
3. Open your browser and navigate to `http://localhost:5173`.

