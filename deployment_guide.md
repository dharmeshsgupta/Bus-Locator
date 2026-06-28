# 🚌 BusLocator Deployment Guide

This guide details three primary methods to deploy the **BusLocator** system:
1. **Docker Compose (Unified Orchestration)** - *Recommended for staging/testing & single-server setups.*
2. **Process Managers / Manual Process Execution (PM2/Systemd)** - *For traditional bare-metal/VM configurations.*
3. **Cloud-Native Deployment (Vercel + Render/GCP Cloud Run + Managed DB)** - *For scaling production environments.*

---

## 🛠️ Configuration & Secrets Management

Before launching any deployment, ensure your configuration variables are properly set. Do **not** use default secrets in production.

### Core Variables to Change:
* **`JWT_SECRET_KEY`**: A highly secure random string used to sign session cookies and JWTs. Must be identical across backend services (`auth_service`, `transport_service`, `tracking_service`) to support stateless verification.
* **`DATABASE_URL`**: Point to your production PostgreSQL servers.
* **`REDIS_URL`**: Used by the telemetry engine in the tracking service.

---

## 🐳 Method 1: Docker Compose Deployment (Recommended)

We have configured a root-level [docker-compose.yml](file:///home/dharmesh/Desktop/buslocator/docker-compose.yml) and service-level Dockerfiles. This method spins up the three microservices, three isolated databases, a Redis cache, and the Nginx-hosted React frontend.

### Steps:
1. **Verify your Root Directory** contains:
   * [docker-compose.yml](file:///home/dharmesh/Desktop/buslocator/docker-compose.yml)
   * The subfolders: `auth_service/`, `transport_service/`, `tracking_service/`, `frontend_dashboard/`.

2. **Boot the stack**:
   ```bash
   docker compose up -d --build
   ```

3. **Verify running containers**:
   ```bash
   docker compose ps
   ```

4. **Seed the Administrator User**:
   Since database tables will auto-create on startup via SQLAlchemy/Alembic migrations, seed the initial administrator:
   ```bash
   docker compose exec auth_service python seed_admin.py
   ```

5. **Access the application**:
   * Frontend Web App: `http://localhost:80` (or your server's domain/IP)
   * Auth API: `http://localhost:8000`
   * Transport API: `http://localhost:8001`
   * Tracking API: `http://localhost:8002`

---

## 💻 Method 2: Process Managers (PM2 / Systemd)

If you are deploying directly onto a Linux VM (e.g., Ubuntu server on AWS EC2, DigitalOcean Droplet) without Docker:

### Prerequisites:
* PostgreSQL instances listening on ports `5433` (`transport_db`) and `5435` (`buslocator_auth`).
* Node.js & Python 3.14+ installed.
* Process manager: **PM2** (`npm install -g pm2`).

### Setup & Run Steps:

#### 1. Databases Setup
Create the PostgreSQL databases manually on your database engine:
* `buslocator_auth`
* `transport_db`
* `tracking_db` (or configure the tracking service to run sqlite locally)

#### 2. Backend Microservices
Run the following for **each service** (`auth_service`, `transport_service`, `tracking_service`):
```bash
cd <service_directory>
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
# Run migrations (if Alembic is configured) or tables will auto-create on start.
```

Define startup scripts using PM2. Create an `ecosystem.config.js` in the root:
```javascript
module.exports = {
  apps: [
    {
      name: "auth-service",
      cwd: "./auth_service",
      script: "venv/bin/uvicorn",
      args: "app.main:app --port 8000 --host 0.0.0.0",
      env: {
        DATABASE_URL: "postgresql+asyncpg://user:pass@localhost:5435/buslocator_auth",
        JWT_SECRET_KEY: "prod_jwt_secret",
      }
    },
    {
      name: "transport-service",
      cwd: "./transport_service",
      script: "venv/bin/uvicorn",
      args: "app.main:app --port 8001 --host 0.0.0.0",
      env: {
        DATABASE_URL: "postgresql+asyncpg://user:pass@localhost:5433/transport_db",
        JWT_SECRET_KEY: "prod_jwt_secret",
        AUTH_SERVICE_URL: "http://localhost:8000"
      }
    },
    {
      name: "tracking-service",
      cwd: "./tracking_service",
      script: "venv/bin/uvicorn",
      args: "app.main:app --port 8002 --host 0.0.0.0",
      env: {
        DATABASE_URL: "postgresql+asyncpg://user:pass@localhost:5434/tracking_db",
        REDIS_URL: "redis://localhost:6379/0",
        JWT_SECRET_KEY: "prod_jwt_secret"
      }
    }
  ]
}
```
Run with PM2:
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### 3. Frontend Dashboard
Build the production static assets for your web dashboard:
```bash
cd frontend_dashboard
npm install
# Set production environment variables
export VITE_AUTH_API_URL="https://api.yourdomain.com/auth"
export VITE_TRANSPORT_API_URL="https://api.yourdomain.com/transport"
export VITE_TRACKING_API_URL="https://api.yourdomain.com/tracking"
npm run build
```
Serve the resulting `dist/` directory using **Nginx**:
```nginx
server {
    listen 80;
    server_name dashboard.yourdomain.com;

    location / {
        root /home/dharmesh/Desktop/buslocator/frontend_dashboard/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## ☁️ Method 3: Cloud-Native Deployment (Production-Scale)

For serverless scaling, high-availability, and zero server maintenance overhead:

### 1. Databases (Managed Databases)
* **PostgreSQL**: Deploy a managed Postgres instance using **Supabase**, **Neon DB**, **AWS RDS**, or **GCP Cloud SQL**.
* **Redis**: Deploy a serverless Redis database using **Upstash** or **Redis Labs** to handle the high-throughput WebSocket telemetry storage.

### 2. Backend APIs (Containerized Serverless)
Deploy your FastAPI containers to serverless platforms:
* **GCP Cloud Run** / **AWS App Runner** / **Render (Web Service)**:
  * Deploy each service from your GitHub repository.
  * Point GCP/Render to build utilizing the subfolder Dockerfiles (`auth_service/Dockerfile`, etc.).
  * Ensure you define environment variables (JWT secrets, Database URLs) in the platform's Environment Settings dashboard.

> [!WARNING]
> Since the `tracking_service` handles persistent, real-time WebSocket connections, ensure that your deployment platform does not prematurely terminate connections or enforce aggressive request timeout limits (like standard AWS API Gateway limits). Platforms like Render or GCP Cloud Run support WebSockets natively if configured correctly.

### 3. Frontend SPA Hosting (Static Edge CDN)
Deploy the React frontend using:
* **Vercel** / **Netlify** / **Cloudflare Pages**:
  * Import your `frontend_dashboard` subfolder.
  * Set the **Build Command** to `npm run build`.
  * Set the **Output Directory** to `dist`.
  * Add the following Build Environment Variables:
    * `VITE_AUTH_API_URL`
    * `VITE_TRANSPORT_API_URL`
    * `VITE_TRACKING_API_URL`
  * Add routing fallback configurations (e.g. `vercel.json` rewrite configuration for Single Page Applications):
    ```json
    {
      "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
    }
    ```
