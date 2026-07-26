# AWS Route 53 Console Clone

A high-fidelity, production-quality clone of the AWS Route 53 management console. This application recreates the exact user experience, styling, navigation, and workflows of AWS Route 53 for managing Hosted Zones and DNS record sets, powered by a FastAPI backend and SQLite database.

> [!NOTE]
> This is a simulation clone. It does **not** make actual DNS updates on the live internet or connect to AWS Route 53 APIs. All data is persisted locally in SQLite.

---

## Tech Stack

### Frontend
- **Framework**: Next.js 15 (App Router, Client & Server Components)
- **Language**: TypeScript
- **Styling**: Tailwind CSS (AWS charcoal-slate visual aesthetic)
- **Icons**: Lucide React
- **Forms & Validation**: React Hook Form, Zod
- **Toasts**: React Hot Toast
- **HTTP Client**: Axios

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **ORM**: SQLAlchemy
- **Validation**: Pydantic v2
- **Database**: SQLite
- **Auth**: Mock JWT tokens

---

## Features

- 🔐 **Mock Authentication**: Login with default credentials (`admin@example.com` / `password123`) to acquire a mock JWT, stored and verified across all protected API routes.
- 📊 **Interactive Dashboard**: Summary statistic cards showing Hosted Zone and Record counts, and a table listing recently modified hosted zones.
- 🌐 **Hosted Zones CRUD**:
  - Create zones (Public or Private) with duplicate name checking.
  - Automatic seeding of NS and SOA apex records on zone creation.
  - Search zones by domain and description.
  - Filter zones by type (Public/Private).
  - Modify description/type or delete zones with a confirmation modal (cascading deletes records).
- 📝 **DNS Records CRUD**:
  - Full CRUD operations for DNS records inside their respective Hosted Zone.
  - Supported types: `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA`, `SOA`.
  - DNS name validation checking (subdomains must match parent hosted zone).
  - TTL validation (must be positive integer).
  - Disallows deleting apex NS and SOA records.
- 📥 **BIND Zone File Import**: Parse standard BIND files (.zone, .txt) and import records automatically.
- 📤 **BIND & JSON Export**: Download records from any hosted zone as a standard BIND format file or raw JSON.

---

## Folder Structure

```text
route53-clone/
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py         # Mock authentication endpoint & validation dependency
│   │   │   ├── dashboard.py    # Dashboard stats aggregation
│   │   │   ├── records.py      # DNS Record CRUD, BIND import/export
│   │   │   └── zones.py        # Hosted Zone CRUD
│   │   ├── crud.py             # SQLAlchemy CRUD queries & default seeds
│   │   ├── database.py         # SQLite connection setup
│   │   ├── main.py             # FastAPI entrypoint, CORS configuration
│   │   ├── models.py           # SQLAlchemy tables schema
│   │   └── schemas.py          # Pydantic request/response schemas
│   ├── requirements.txt        # Backend dependencies
│   └── verify_backend.py       # Integration tests python script
└── frontend/
    ├── src/
    │   ├── app/
    │   │   ├── dashboard/
    │   │   │   ├── zones/
    │   │   │   │   ├── [id]/
    │   │   │   │   │   └── page.tsx  # DNS records list & actions page
    │   │   │   │   └── page.tsx      # Hosted zones table list & side panel
    │   │   │   ├── layout.tsx        # Console layout (header/sidebar) with auth guards
    │   │   │   └── page.tsx          # Dashboard page
    │   │   ├── login/
    │   │   │   └── page.tsx          # AWS console style sign-in
    │   │   ├── error.tsx             # Global error boundary page
    │   │   ├── globals.css           # Global Tailwind and AWS styles
    │   │   ├── layout.tsx            # Auth provider and toast provider wrappers
    │   │   ├── not-found.tsx         # Console 404 page
    │   │   └── page.tsx              # Root index router redirect
    │   ├── components/
    │   │   ├── Breadcrumbs.tsx       # AWS-like path breadcrumbs
    │   │   ├── Header.tsx            # AWS black console header nav
    │   │   └── Sidebar.tsx           # Route53 sidebar navigation
    │   ├── hooks/
    │   │   └── useAuth.ts            # Authentication React Context and state hook
    │   ├── services/
    │   │   └── api.ts                # Axios instance with request/response interceptors
    │   └── types/
    │       └── index.ts              # TypeScript type interfaces
    ├── package.json                  # Frontend dependencies
    └── tsconfig.json                 # TypeScript compiler configuration
```

---

## Setup Instructions

### Prerequisites
- Python 3.12+
- Node.js 18+ and npm

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install Python packages:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the integration test suite:
   ```bash
   python verify_backend.py
   ```
4. Start the FastAPI development server:
   ```bash
   uvicorn app.main:app --reload --port 8080
   ```
   The backend API will run at `http://localhost:8080`. Interactive docs are available at `http://localhost:8080/docs`.

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd ../frontend
   ```
2. Install Node dependencies:
   ```bash
   npm install
   ```
3. Start the Next.js development server:
   ```bash
   npm run dev
   ```
   The frontend console application will be available at `http://localhost:3000`.

---

## Environment Variables

### Frontend (`frontend/.env.local` or environment)
- `NEXT_PUBLIC_API_URL`: The URL of the FastAPI backend. Default: `http://localhost:8080`.

---

## API Documentation

### Auth
- `POST /login`: Receives `{ email, password }`. Verifies credentials and returns `{ access_token, token_type, email }`.

### Hosted Zones
- `GET /zones`: Lists hosted zones (supports pagination, search query, type filtering).
- `GET /zones/{id}`: Gets details of a specific hosted zone.
- `POST /zones`: Creates a new zone.
- `PUT /zones/{id}`: Modifies description and type.
- `DELETE /zones/{id}`: Deletes zone and all associated records.

### DNS Records
- `GET /zones/{id}/records`: Lists all DNS records for a zone (supports pagination, type filtering, search).
- `GET /records/{id}`: Gets a specific DNS record.
- `POST /records`: Creates a new DNS record.
- `PUT /records/{id}`: Modifies an existing DNS record.
- `DELETE /records/{id}`: Deletes a record.

### BIND helper / Import / Export
- `POST /zones/{id}/import-bind`: Uploads and parses BIND file.
- `GET /zones/{id}/export-bind`: Returns zones in BIND format.
- `GET /zones/{id}/export-json`: Returns zones in raw JSON format.

---

## Deployment Steps

### Backend (Render)
1. Commit the code and push to GitHub.
2. Log in to [Render](https://render.com) and create a new **Web Service**.
3. Connect your repository and select root folder as `backend`.
4. Set Build Command: `pip install -r requirements.txt`.
5. Set Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.
6. Add environment variable if needed. Note: SQLite is local to the service, meaning database resets on service restart. For persistent Render deploys, attach a persistent disk.

### Frontend (Vercel)
1. Log in to [Vercel](https://vercel.com) and click **Add New Project**.
2. Connect your repo and set the Root Directory to `frontend`.
3. Set Framework Preset to **Next.js**.
4. Set environment variable `NEXT_PUBLIC_API_URL` to your backend Render URL.
5. Click **Deploy**. Vercel will build and serve your app.
