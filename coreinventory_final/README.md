# 🏭 CoreInventory v2.0 — Enterprise Stock Management

> A full-stack, production-ready inventory management system built with React + Express + SQLite.  
> Role-based access control · Email OTP auth · Multi-warehouse · Real-time analytics · Hackathon Edition 🏆

---

## 🚀 Quick Start

### 1. Backend Setup

```bash
cd backend
npm install
# Copy and edit environment variables:
cp .env.example .env
# Then open .env and set your SMTP credentials for email OTP
node --experimental-sqlite db/seed.js   # seed demo data
npm run dev                             # start on port 5000
```

### 2. Frontend Setup

```bash
# from project root
npm install
npm run dev   # starts on port 5173
```

Open http://localhost:5173 to see the app.

---

## 📧 Email OTP Setup (Password Reset)

To enable real email OTP delivery:

1. Go to your **Gmail account** → Settings → Security → **2-Step Verification** (enable it)
2. Then go to **App Passwords** → generate one for "Mail"
3. Copy the 16-character password (no spaces)
4. Open `backend/.env` and set:

```env
SMTP_USER=your.email@gmail.com
SMTP_PASS=abcdabcdabcdabcd    # your 16-char App Password
EMAIL_FROM=CoreInventory <noreply@coreinventory.com>
```

5. Restart the backend server. You'll see `📧 Email (SMTP) CONNECTED` in the console.

> **Without SMTP configured:** In dev mode, the OTP will be returned in the API response and shown as a toast notification so you can still test the full reset flow.

---

## 👤 User Roles & Access

| Role              | Dashboard        | Products | Receipts | Deliveries | Transfers | Warehouses | Users | Admin Panel |
|-------------------|-----------------|----------|----------|------------|-----------|------------|-------|-------------|
| **Administrator** | Full Dashboard   | ✅ Full  | ✅ Full  | ✅ Full    | ✅ Full   | ✅ Full    | ✅    | ✅          |
| **Manager**       | Manager Dashboard| ✅ Full  | ✅ Full  | ✅ Full    | ✅ Full   | ✅ Full    | ❌    | ❌          |
| **Staff**         | Staff Dashboard  | ✅ View  | ✅ Create| ✅ Create  | ✅ Create | ❌         | ❌    | ❌          |

### Demo Credentials

| Role          | Email                       | Password    |
|---------------|-----------------------------|-------------|
| Administrator | admin@coreinventory.com     | admin123    |
| Manager       | manager@coreinventory.com   | manager123  |
| Staff         | staff@coreinventory.com     | staff123    |

---

## 🏗️ Architecture

```
coreinventory_final/
├── backend/                    Express.js REST API
│   ├── db/
│   │   ├── database.js         SQLite with node:sqlite (Node 22+)
│   │   └── seed.js             Demo data seeder
│   ├── middleware/
│   │   └── auth.js             JWT auth + RBAC middleware
│   ├── routes/
│   │   ├── auth.js             Login, signup, OTP password reset
│   │   ├── users.js            User management (admin only)
│   │   ├── products.js         Product CRUD
│   │   ├── warehouses.js       Warehouse management
│   │   ├── receipts.js         Stock receipt operations
│   │   ├── deliveries.js       Delivery operations
│   │   ├── transfers.js        Inter-warehouse transfers
│   │   ├── adjustments.js      Stock adjustments
│   │   ├── movements.js        Movement history
│   │   └── dashboard.js        Analytics dashboard
│   └── utils/
│       ├── email.js            Nodemailer OTP email sender
│       └── helpers.js          Utility functions
│
├── src/                        React 18 frontend
│   ├── pages/
│   │   ├── Landing.jsx         🆕 Landing page with role selection
│   │   ├── Auth.jsx            🆕 Login + Signup + OTP flow
│   │   ├── Dashboard.jsx       Admin analytics dashboard
│   │   ├── ManagerDashboard.jsx🆕 Manager-specific dashboard
│   │   ├── StaffDashboard.jsx  🆕 Staff operational dashboard
│   │   ├── AdminPanel.jsx      🆕 User management (admin only)
│   │   ├── Products.jsx        Product management
│   │   ├── Operations.jsx      Receipts, Deliveries, Transfers
│   │   └── Settings.jsx        Warehouses, Adjustments, Profile
│   ├── components/
│   │   ├── Sidebar.jsx         🆕 Role-aware navigation sidebar
│   │   └── UI.jsx              Shared UI components + icons
│   ├── store/
│   │   └── index.js            React state management
│   └── api.js                  API client layer
```

---

## 🌐 API Endpoints

### Authentication
```
POST   /api/auth/signup         Create account
POST   /api/auth/login          Login
GET    /api/auth/me             Get current user
PUT    /api/auth/profile        Update profile
PUT    /api/auth/password       Change password
POST   /api/auth/otp/send       Send OTP to email
POST   /api/auth/otp/verify     Verify OTP → get reset token
POST   /api/auth/otp/reset      Reset password with token
```

### Users (Admin only)
```
GET    /api/users               List all users
POST   /api/users               Create user with any role
GET    /api/users/:id           Get single user
PUT    /api/users/:id           Update user role/status
DELETE /api/users/:id           Deactivate user
```

### Inventory
```
GET/POST        /api/products
GET/PUT/DELETE  /api/products/:id
GET/POST        /api/warehouses
GET/POST        /api/receipts
GET/POST        /api/deliveries
GET/POST        /api/transfers
GET/POST        /api/adjustments
GET             /api/movements
GET             /api/dashboard
```

---

## 🚀 Deployment

### Backend (Railway / Render / Fly.io)
```bash
cd backend
# Set environment variables in your hosting platform's dashboard
# Ensure NODE_ENV=production
# App runs with: npm start
```

### Frontend (Vercel / Netlify)
```bash
# Set VITE_API_URL=https://your-backend-domain.com/api
npm run build
# Deploy the dist/ folder
```

---

## ⚙️ Tech Stack

| Layer     | Technology                |
|-----------|---------------------------|
| Frontend  | React 18, Vite, Recharts  |
| Backend   | Express.js, JWT, bcryptjs |
| Database  | SQLite (node:sqlite)      |
| Email     | Nodemailer (Gmail/SMTP)   |
| Auth      | JWT + OTP email reset     |
| Styling   | Custom CSS (dark/light)   |

---

## 🏆 Features

- ✅ **Landing Page** — Beautiful role-selection home page
- ✅ **3 Role Dashboards** — Admin, Manager, Staff — each with unique views
- ✅ **Admin Panel** — Full CRUD user management with role assignment
- ✅ **Email OTP** — Real email password reset (configurable SMTP)
- ✅ **Multi-warehouse** — Track stock across multiple locations
- ✅ **Operations** — Receipts, deliveries, transfers with status workflows
- ✅ **Adjustments** — Manual stock correction with reason tracking
- ✅ **Movement History** — Full audit log of all stock changes
- ✅ **Analytics** — Charts, KPIs, trends by category/warehouse
- ✅ **Dark/Light Mode** — Toggle in sidebar
- ✅ **Mobile Responsive** — Collapsible sidebar for mobile

---

Built with ❤️ for Hackathon 2025
