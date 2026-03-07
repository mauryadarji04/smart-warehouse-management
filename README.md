# 📦 Smart Warehouse & Inventory Optimization System

A full-stack warehouse management system with automated reordering, demand forecasting, and analytics.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, Recharts |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT + RBAC |
| Automation | node-cron |

## Project Phases

| Phase | Feature | Status |
|-------|---------|--------|
| 0 | Setup & Architecture | ✅ Done |
| 1 | Core Inventory (CRUD, stock-in/out, alerts) | 🔜 Next |
| 2 | Suppliers & Purchase Orders | ⏳ Upcoming |
| 3 | EOQ Auto Reorder Logic | ⏳ Upcoming |
| 4 | Demand Forecasting (Moving Avg) | ⏳ Upcoming |
| 5 | Expiry & Batch Tracking | ⏳ Upcoming |
| 6 | Analytics Dashboard | ⏳ Upcoming |
| 7 | Auth, Roles & Security | ⏳ Upcoming |
| 8 | Deployment | ⏳ Upcoming |

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### Setup

```bash
# 1. Clone and install
git clone <repo-url>
cd smart-warehouse
npm install

# 2. Configure backend env
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET

# 3. Database setup
npm run db:generate
npm run db:migrate
npm run db:seed

# 4. Run in dev (from root)
npm run dev          # starts both frontend + backend
npm run dev:backend  # backend only (port 5000)
npm run dev:frontend # frontend only (port 3000)
```

## Folder Structure

```
smart-warehouse/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Route handlers
│   │   ├── services/       # Business logic
│   │   ├── routes/         # Express routers
│   │   ├── cron/           # Scheduled jobs
│   │   ├── middleware/     # Auth, error handling
│   │   └── utils/          # Helpers, Prisma client
│   └── prisma/
│       ├── schema.prisma   # DB schema (all phases)
│       └── seed.ts         # Dev seed data
├── frontend/
│   ├── app/                # Next.js App Router
│   ├── components/         # Reusable UI components
│   └── lib/                # API client, types, utils
└── README.md
```

## Resume Highlights

- ✅ EOQ-based automated inventory reordering
- ✅ Moving average demand forecasting
- ✅ Cron-driven automation (reorder, expiry, forecast)
- ✅ JWT auth with role-based access control
- ✅ Real-time low-stock & expiry alerting
