# BusLocator System Architecture & Project Summary

BusLocator is a high-grade, decentralized **Campus Transit Intelligence and Real-Time Tracking** application designed to manage shuttle routing, bus capacity, driver telemetry, student assignments, and financial transactions.

---

## 🚀 Technology Stack & Services Directory

The platform uses a modern microservices architecture where services are decoupled, utilizing independent databases, stateless/stateful token validation, and a centralized state-driven frontend.

| Service Name | Port | Primary Language | Framework / Tools | Primary Database | Key Responsibilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`auth_service`** | `8000` | Python 3.14 | FastAPI, Alembic | PostgreSQL (`buslocator_auth` @ `5435`) | Admin, Driver, and Student Authentication; Session Tokens (JWT); **Student Fee Management & Payments** |
| **`transport_service`** | `8001` | Python 3.14 | FastAPI | PostgreSQL (`transport_db` @ `5433`) | Route configuration, Stops coordinates, Bus assignment, Student & Driver schedules |
| **`tracking_service`** | `8002` | Python 3.14 | FastAPI | SQLite / In-Memory Cache | Live telemetry, WebSocket-based speed/position broadcasts, ETA analytics |
| **`frontend_dashboard`** | `5173` | TypeScript | Vite + React + TailwindCSS | LocalStorage (Zustand Rehydration) | Vercel-style Slate/Sapphire Blue dashboard interface, real-time map displays, administration ledgers |

---

## 🛠️ Microservice Isolation & Load Distribution

Unlike traditional monolithic projects, BusLocator runs multiple separate local processes, scaling load horizontally across dedicated ports:
1. **Decentralized Services**: Each backend service (`auth`, `transport`, `tracking`) operates on its own dedicated Python interpreter process with independent ASGI reload loops.
2. **Database Isolation**: Financial and user details (`auth_service`) are kept completely isolated from physical transit tracking assets (`transport_service`). 
3. **Stateless JWT Verification**: The token is signed by the `auth_service` (stateful check against DB), but validated **statelessly** by the `transport_service` and `tracking_service` via shared secret decryption. This minimizes database query overhead during real-time GPS tracking.

---

## 💰 Student Fee Management Module (INR Implementation)

The latest feature phase introduced a professional, administrative billing dashboard configured in Indian Rupees (**INR ₹**):
* **Dual Installments**: Each student has a billing record defining Installment 1 and Installment 2 details (Amounts, Due Dates, Statuses, and Payment Dates).
* **Dynamic Overdue status**: The backend determines if unpaid installments are overdue by checking deadlines dynamically against UTC timestamps.
* **Global Configuration**: Admins can configure defaults and push them to all unassigned student fee records in one click.
* **Mock Payment Gateways**: Students can trigger transaction simulations to mark installments as `Paid`, auto-logging the timestamp and updating balances.
* **Currency Formatting**: Frontend amounts are formatted using the Indian English numbering convention (`en-IN`) for clear readouts (e.g. `₹12,00,000`).

---

## 📁 Workspace Folder and File Structure

Below is the directory mapping of the active components of the system:

```text
buslocator/
├── auth_service/                     # Port 8000 - Authentication & Fee Services
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth.py               # Login, registration, and refresh token endpoints
│   │   │   ├── dependencies.py       # Authentication check and role-based permissions
│   │   │   └── payment.py            # Fee queries, global config pushes, student payments
│   │   ├── core/
│   │   │   ├── config.py             # Settings (DATABASE_URL, JWT secret keys)
│   │   │   ├── database.py           # SQLAlchemy engine initialization
│   │   │   └── security.py           # JWT encryption and bcrypt password hashing
│   │   ├── models/
│   │   │   ├── user.py               # Base user DB table configuration
│   │   │   ├── student.py            # Student profiles table
│   │   │   ├── student_fee.py        # Student transport fees table
│   │   │   └── driver.py             # Driver profiles table
│   │   └── main.py                   # App startup entry point and CORS setup
│   └── seed_admin.py                 # Seeds default admin user (admin@buslocator.com)
│
├── transport_service/                # Port 8001 - Shuttle Assets & Assignments
│   ├── app/
│   │   ├── api/v1/
│   │   │   ├── routes.py             # Routes management endpoint
│   │   │   ├── stops.py              # Designated stops coordinates
│   │   │   ├── buses.py              # Fleet registration
│   │   │   └── assignments.py        # Student/Driver allocation
│   │   ├── core/
│   │   │   └── security.py           # Stateless JWT decryption
│   │   └── main.py                   # Router imports and CORS middleware
│
├── tracking_service/                 # Port 8002 - Real-Time GPS Tracking
│   └── app/
│       ├── api/                      # GPS telemetry updates
│       └── main.py                   # WebSocket handlers for live vehicle locations
│
├── frontend_dashboard/               # Port 5173 - React SaaS Interface
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Sidebar.tsx       # Sidebar containing Sapphire Blue nav links
│   │   │       └── Navbar.tsx        # Top navigation with user actions
│   │   ├── features/
│   │   │   ├── admin/
│   │   │       ├── AdminDashboard.tsx# Quick admin overview stats
│   │   │       ├── StudentsView.tsx  # Student listings and route linking
│   │   │       └── AdminFeePanel.tsx # Global config controls & student fee ledger
│   │   │   ├── payment/
│   │   │       └── FeeDashboard.tsx  # Student billing statement & pay simulation
│   │   ├── router/
│   │   │   ├── guards/
│   │   │   │   └── AdminGuard.tsx    # Session-validity route guards
│   │   │   └── index.tsx             # React-Router-DOM routes definition
│   │   ├── services/api/
│   │   │   ├── axios.ts              # Global Axios clients with token response interceptors
│   │   │   └── paymentApi.ts         # Query actions linking components to auth_service
│   │   ├── store/
│   │   │   └── authStore.ts          # Zustand authentication store
│   │   ├── App.tsx                   # Top-level React Router provider mapping
│   │   └── main.tsx                  # React DOM render and QueryClient provider wrapper
│   ├── tailwind.config.js            # Sapphire Blue brand styling configurations
│   └── package.json                  # Frontend script utilities and dependencies
│
└── project_summary.md                # Project Architecture Documentation (This File)
```

---

---

## 🧠 In-Depth Developer Guide (For Future LLM & Agents)

To maintain and extend this repository without needing to re-analyze from scratch, pay close attention to the following design patterns, architectural choices, and caveats:

### 1. Database Boundaries & Transactions
- **Dual PostgreSQL Instances**:
  - `auth_service` connects to the `buslocator_auth` DB on port `5435`.
  - `transport_service` connects to the `transport_db` DB on port `5433`.
- **Database Joins Constraint**: Since these services run on different databases, **never** attempt to write SQL joins across tables like `students` (in `auth_service`) and `assignments` (in `transport_service`). Instead, pass IDs (like `student_id` or `route_id`) statelessly through HTTP headers/payloads, and resolve details manually via service APIs.

### 2. Stateful vs. Stateless Token Verification
- **Stateful Verification (`auth_service`)**:
  - Validates tokens using `get_current_user` in [dependencies.py](file:///home/dharmesh/Desktop/buslocator/auth_service/app/api/dependencies.py).
  - Decodes the JWT, extracts the user `sub` (ID), and queries the database via `user_repository.get_by_id(db, user_id)` to ensure the user is still active in the database.
- **Stateless Verification (`transport_service`)**:
  - Validates tokens using `get_current_user` in [security.py](file:///home/dharmesh/Desktop/buslocator/transport_service/app/core/security.py).
  - Decodes the JWT and immediately trusts the values in the payload (such as `sub` and `role`) without making database queries, minimizing network latency during high-frequency transit updates.

### 3. Session Expiration & Refresh Token Interceptor
- **Token Lifespans**:
  - Access Token: Expires in 30 minutes (`ACCESS_TOKEN_EXPIRE_MINUTES`).
  - Refresh Token: Persists in database and cookie storage for 7 days (`REFRESH_TOKEN_EXPIRE_DAYS`).
- **Axios Response Interceptor** in [axios.ts](file:///home/dharmesh/Desktop/buslocator/frontend_dashboard/src/services/api/axios.ts):
  1. Any API request that encounters a `401 Unauthorized` triggers the interceptor.
  2. The interceptor queues all incoming pending requests.
  3. It fires a POST request to `http://localhost:8000/auth/refresh-token` sending the stored `refresh_token`.
  4. If the refresh request succeeds, it updates the store with the new access token and replays the queued requests.
  5. If the refresh fails (refresh token expired/revoked), it triggers `setLogout()`, which clears the Zustand store and causes the client router guards (`AdminGuard`, `StudentGuard`) to instantly redirect the user to the login screen.

### 4. CORS Credentials & Starlette Middlewares
- Backend CORS uses `allow_credentials=True`.
- In Starlette/FastAPI, wildcard origins `allow_origins=["*"]` cannot be used when `allow_credentials` is `True`. 
- Instead, Starlette dynamically checks the incoming request's `Origin` header and mirrors it in the `Access-Control-Allow-Origin` response header, preventing cross-origin browser blocking.

### 5. Client Router Redirection Caveat (Crucial Gotcha!)
- **HMR Route Caching**: React Router DOM cache structures can become stale. If a developer registers a new route (such as `/admin/fees`) and clicks it, the browser might match it to the wildcard fallback (`*`) and redirect the user back to the login page (`/auth/admin`) because the updated route is not yet rehydrated in the browser tab's active JavaScript memory.
- **Remedy**: Always instruct users to perform a **hard reload (`Ctrl + F5` or `Cmd + Shift + R`)** to clear cached assets and load the updated router bundle.

---

## ⚡ Setup & Verification Execution
Verification can be completed inside `frontend_dashboard` to test standard React module dependencies:
```bash
# Verify type checks and production builds
npm run build
```
The build process processes all TypeScript routes, stylesheets, and assets, outputting zero warnings or bundle compilation errors.

