# 🚌 BusLocator: Campus Transit Intelligence & Real-Time Tracking

**BusLocator** is a high-grade, decentralized **Campus Transit Intelligence and Real-Time Tracking** application. Designed to manage school/campus shuttle routing, bus capacity, driver telemetry, student assignments, and financial transactions, BusLocator operates on a modern microservices architecture built for scale, performance, and reliability.

---

## 🚀 System Architecture & Services Directory

The platform is structured as a collection of decoupled, highly-isolated microservices. Each service operates in its own environment with dedicated databases and distinct functional responsibilities.

```
buslocator/
├── auth_service/         # Port 8000 (FastAPI + PostgreSQL) - Identity & Fee Management
├── transport_service/    # Port 8001 (FastAPI + PostgreSQL) - Fleet & Schedule Configurations
├── tracking_service/     # Port 8002 (FastAPI + WebSocket)  - Real-Time Telemetry & Updates
└── frontend_dashboard/   # Port 5173 (React + TypeScript)   - Slate/Sapphire Blue Admin Portal
```

| Service | Port | Tech Stack | Primary Database | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **`auth_service`** | `8000` | Python 3.14 + FastAPI | PostgreSQL (`buslocator_auth`) | Admin, Driver, and Student Authentication; Session Tokens (JWT); **Student Fee Management & Payments** |
| **`transport_service`** | `8001` | Python 3.14 + FastAPI | PostgreSQL (`transport_db`) | Route configuration, Stops coordinates, Bus assignment, Student & Driver schedules |
| **`tracking_service`** | `8002` | Python 3.14 + FastAPI | SQLite / In-Memory Cache | Live telemetry, WebSocket-based speed/position broadcasts, ETA analytics |
| **`frontend_dashboard`** | `5173` | React + TypeScript + Vite | LocalStorage (Zustand) | Vercel-style Slate/Sapphire Blue dashboard interface, real-time map displays, administration ledgers |

---

## ✨ Key Features

### 📡 Real-Time GPS Tracking & Live Telemetry
* High-frequency location updates transmitted from vehicles over stable WebSocket connections (`tracking_service`).
* Dynamic map dashboard in the React frontend showing live vehicle positions, current speed, and calculated Estimated Time of Arrival (ETA).

### 🔒 Secure Session Security & Token Validation
* **Dual-layer Token Validation**:
  * **Stateful Validation** in `auth_service` checks user active status against the database on every sensitive request.
  * **Stateless Validation** in `transport_service` and `tracking_service` decrypts JWT claims in-memory using shared secrets to minimize database queries during high-throughput GPS requests.
* **Token Rotation**: 30-minute access tokens with 7-day secure refresh tokens and automatic request queueing on `401 Unauthorized` responses in the frontend client.

### 💰 Student Fee & Billing Management (INR ₹)
* Fully functional billing ledger formatted using the Indian English numbering convention (`en-IN`) (e.g. `₹12,00,000`).
* Support for installment structures (Installment 1 & 2) tracking payment dates, due dates, and statuses.
* **Overdue Analytics**: Backend automatically flags unpaid installments based on dynamic UTC deadlines.
* Interactive payment simulation panel allowing users/students to trigger mock transactions.

### 🏢 Microservice Isolation & Security
* **Isolated Databases**: User authentication and billing details are completely separate from routing and schedule tables, preventing cross-domain DB lockups or data contamination.
* **CORS Credentials Configuration**: Configured Starlette CORS middleware to dynamically echo incoming origins for verified credentials compatibility, avoiding generic wildcard blocking.

---

## 🛠️ Developer & Architectural Notes

* **No Cross-Database Joins**: Since `auth_service` and `transport_service` write to separate databases (ports `5435` and `5433` respectively), database-level SQL joins between tables (e.g., joining user records with transit schedules) are not allowed. Inter-service queries are handled statelessly via REST endpoints.
* **Token Verification Secret**: Ensure the backend services share the same `JWT_SECRET_KEY` config for stateless decryption validation to succeed in downstream services.
* **Client HMR Router Guard Caching**: When adding new dashboard routes in `frontend_dashboard`, the hot-module-replacement caching might trigger wildcard route falls. Perform a **hard reload (`Ctrl + F5` or `Cmd + Shift + R`)** to refresh route guards.

---

## 🏁 Quick Start & Setup

### Prerequisites
* Python 3.14+
* Node.js 18+ & npm
* PostgreSQL (Running instances for `buslocator_auth` and `transport_db`)

### 1. Database Seeding & Setup
Configure your database credentials in the respective service `.env` or configurations. Seed the administrator credentials using the scripts in `auth_service`:
```bash
cd auth_service
python seed_admin.py
```

### 2. Run Backend Services
Launch each FastAPI app using Uvicorn or your preferred ASGI runner:
```bash
# In auth_service/ directory
uvicorn app.main:app --port 8000 --reload

# In transport_service/ directory
uvicorn app.main:app --port 8001 --reload

# In tracking_service/ directory
uvicorn app.main:app --port 8002 --reload
```

### 3. Run Frontend Dashboard
Navigate to the frontend folder, install dependencies, and launch the Vite development server:
```bash
cd frontend_dashboard
npm install
npm run dev
```

Open `http://localhost:5173` in your browser to access the BusLocator dashboard.
