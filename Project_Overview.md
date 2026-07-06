# 🚀 SCM Suite -- Backend Developer Onboarding Guide

## 1. Project Overview

**What it is:** A Supply Chain Management (SCM) console that clones ERPNext's inventory, procurement, and sales fulfillment workflows. It is a React frontend backed by an Express proxy server.

**Business Problem:** Companies using ERPNext need a lightweight, customizable, glassmorphic UI on top of ERPNext's REST API without modifying the ERPNext instance itself. This project provides an offline-capable SCM dashboard that optionally syncs with a live ERPNext backend.

> **Purpose**
>
> This guide helps a new backend developer quickly understand the Supply
> Chain Management (SCM) project, its architecture, request flow,
> ERPNext integration, and where to start contributing.

------------------------------------------------------------------------

# Table of Contents

1.  Project Overview
2.  System Architecture
3.  End-to-End Request Flow
4.  Backend Architecture
5.  API Overview
6.  ERPNext Integration
7.  Core Business Logic
8.  Important Files
9.  Recommended Learning Path
10. Developer Cheat Sheet

------------------------------------------------------------------------

# 1. Project Overview

## What is this project?

The SCM Suite is a **Supply Chain Management application** built on top
of **ERPNext**.

Instead of directly customizing ERPNext, the project introduces a custom
React frontend and an Express backend that acts as a secure proxy
between the UI and ERPNext.

### Business Goal

-   Modern UI over ERPNext
-   Secure API communication
-   Extend ERPNext without modifying its core
-   Support offline demo mode using mock data

------------------------------------------------------------------------

# 2. System Architecture

``` text
Browser (React)
      │
      ▼
Express Backend (API Proxy)
      │
      ▼
ERPNext REST API
      │
      ▼
MariaDB
```

### Responsibilities

  Layer     Responsibility
  --------- --------------------------------
  React     User Interface
  Express   Authentication, Routing, Proxy
  ERPNext   Business Processes
  MariaDB   Persistent Data

------------------------------------------------------------------------

# 3. End-to-End Request Flow

``` text
User Action
    │
    ▼
React Component
    │
    ▼
Frontend API Service
    │
    ▼
Express Route
    │
    ▼
ERPNext Service
    │
    ▼
ERPNext REST API
    │
    ▼
Database
    │
    ▼
JSON Response
    │
    ▼
React UI Update
```

### Key Takeaways

-   Frontend never communicates directly with ERPNext.
-   Express handles authentication and proxying.
-   ERPNext remains the source of truth.

------------------------------------------------------------------------

# 4. Backend Architecture

## Entry Point

**server.ts**

Responsibilities:

-   Creates Express application
-   Enables CORS
-   Registers middleware
-   Mounts API routes
-   Starts server

### Folder Overview

``` text
src/
 ├── server.ts
 ├── config/
 ├── routes/
 └── services/
```

  Folder     Purpose
  ---------- --------------------------------
  config     Environment and authentication
  routes     API endpoints
  services   ERPNext communication

------------------------------------------------------------------------

# 5. API Overview

  Endpoint                            Purpose
  ----------------------------------- -----------------------
  GET /api/erpnext/items              Fetch Items
  GET /api/erpnext/warehouses         Fetch Warehouses
  GET /api/erpnext/suppliers          Fetch Suppliers
  GET /api/erpnext/customers          Fetch Customers
  POST /api/erpnext/purchase-orders   Create Purchase Order
  GET /api/custom/health              Health Check
  GET/POST /api/custom/annotations    Local annotations

------------------------------------------------------------------------

# 6. ERPNext Integration

## Authentication

Uses:

    Authorization: token API_KEY:API_SECRET

Credentials are stored in the backend configuration.

### Integration Flow

``` text
Frontend
   │
   ▼
Express Proxy
   │
Adds Authentication Header
   │
   ▼
ERPNext REST API
```

------------------------------------------------------------------------

# 7. Core Business Logic

Main business logic includes:

-   Inventory synchronization
-   Purchase Order creation
-   Goods Receipt
-   Shipment processing
-   Warehouse stock updates
-   Stock Ledger calculations
-   Offline fallback using mock data

------------------------------------------------------------------------

# 8. Important Files

## Read in this order

  --------------------------------------------------------------------------------------
  Priority                          File                              Why
  --------------------------------- --------------------------------- ------------------
  ⭐⭐⭐⭐⭐                        server.ts                         Backend entry
                                                                      point

  ⭐⭐⭐⭐⭐                        erpnextRoutes.ts                  Main API routes

  ⭐⭐⭐⭐                          erpnextService.ts                 ERPNext
                                                                      communication

  ⭐⭐⭐⭐                          config/index.ts                   Authentication &
                                                                      configuration

  ⭐⭐⭐                            customRoutes.ts                   Custom APIs

  ⭐⭐⭐                            frontend/services/erpnextApi.ts   Frontend-backend
                                                                      communication

  ⭐⭐⭐                            App.tsx                           Business logic &
                                                                      state
  --------------------------------------------------------------------------------------

------------------------------------------------------------------------

# 9. Learning Path

``` text
README
   ↓
server.ts
   ↓
Routes
   ↓
Services
   ↓
ERPNext Integration
   ↓
Business Logic
   ↓
Frontend API Layer
```

------------------------------------------------------------------------

# 10. Developer Cheat Sheet

## Run Project

``` bash
npm install
npm run dev
```

## Useful Debugging

``` bash
curl http://localhost:5000/api/custom/health

curl http://localhost:5000/api/erpnext/test-connection
```

## Common Mistakes

-   Calling ERPNext directly from frontend
-   Hardcoding API credentials
-   Skipping error handling
-   Forgetting to sync configuration
-   Bypassing the service layer

------------------------------------------------------------------------

# Final Summary

As a backend developer, focus on understanding:

1.  How requests move through the system.
2.  How Express proxies requests to ERPNext.
3.  Where business logic resides.
4.  How authentication is handled.
5.  How new APIs are added.

Once these concepts are clear, you can confidently extend the project
without affecting existing functionality.
