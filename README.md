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
                  │   │        (Port 5000 - Node/TSX)        │   │
                  │   └──────────────────┬───────────────────┘   │
                  └──────────────────────┼───────────────────────┘
                                         │ Secure Proxy Request + API Token
                                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        YOUR DOCKER CONTAINER                           │
│   ┌──────────────────────────────────┐ ┌───────────────────────────┐   │
│   │       ERPNext App Server         │ │      MariaDB Database     │   │
│   │   (frappe_docker-backend-1)      │ │  (Relational Storage DB)  │   │
│   │         (Port 8081)              │ │                           │   │
│   └─────────────────┬────────────────┘ └─────────────▲─────────────┘   │
│                     └────────────────────────────────┘                 │
└────────────────────────────────────────────────────────────────────────┘
```

### 1. The React Frontend Clone (`frontend/`)
A responsive, high-end SaaS Single Page Application (SPA) designed to display stock valuation metrics, active warehouse structures, procurement modules, and shipping workflows.
* **Persistent Offline Cache**: When disconnected from ERPNext, the application operates on an in-memory simulation engine. Any changes (items created, stock entries, purchase orders, new suppliers) are preserved in browser **`localStorage`** and persist across refreshes.

### 2. The Express Backend Proxy (`backend/`)
A lightweight Express proxy server running on `tsx` (TypeScript Execute) that routes request headers to your active ERPNext instance in Docker.
* **Database & MariaDB**: This node project **does not run its own database**. Instead, it acts as a secure proxy that writes/reads directly to your running **ERPNext MariaDB** instance.
* **CORS Resolution**: Solves browser CORS restrictions by proxying API calls to `http://localhost:5000` through to your ERPNext host.
* **API Token Protection**: Securely attaches `Authorization` keys read from the backend's `.env` configuration.

---

## ⚡ Main Features

* **Operations Dashboard**: Features real-time stock valuation metrics, safety levels check alerts, and an interactive **SVG Logistics Pipeline Diagram** displaying stock flow paths (Suppliers ➔ Inspection ➔ Warehouse ➔ Transit ➔ Customer).
* **Inventory Master (Stock)**: Registered catalog list displaying item groups, SKU, standard UoM, reorder limits, and individual warehouse capacities. Includes Stock Entry creation for material receipts and internal warehouse transfers.
* **Procurement (Buying)**: Tracks Purchase Orders (Draft ➔ Submitted ➔ Received). 
  * **Supplier Creation**: Create and register new suppliers directly in the SCM Suite console and save them into ERPNext's MariaDB.
  * **Synced PO Creation**: Posting a Purchase Order validates the links, checks target warehouse constraints, and writes the PO to your live ERPNext database.
  * **Goods Receipt**: Creating a Goods Receipt Note (GRN) automatically updates corresponding stock ledgers and warehouse capacities.
* **Fulfillment (Selling)**: Process Sales Orders and outgoing Delivery Notes (DN) to dispatch shipments (automatically deducting stock after checking warehouse availability).
* **Dynamic DocType Customizations**: Includes a backend **Schema Registry** ([backend/src/config/schemas.ts](file:///c:/Projects/SCMS/backend/src/config/schemas.ts)) that manages the queried fields for each ERPNext DocType. Customize and query custom fields at runtime without restructuring the backend codebase.

---

## 🚀 How to Configure & Run

You can run the project either directly from the **root workspace directory** (using script shortcuts) or by navigating into the individual subdirectories.

### 1. Configure the ERPNext Environment
Before running the servers, open [backend/.env](file:///c:/Projects/SCMS/backend/.env) and enter your credentials:
```env
PORT=5000
ERPNEXT_URL=http://localhost:8081
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
