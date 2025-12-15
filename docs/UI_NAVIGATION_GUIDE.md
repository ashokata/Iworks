# FieldSmartPro UI Navigation Guide

This guide shows where all features are located in the web application UI.

---

## 🗺️ Main Navigation (Sidebar)

The sidebar navigation includes the following items:

| Menu Item | Route | Icon | Description |
|-----------|-------|------|-------------|
| **Dashboard** | `/dashboard` | 🏠 | Main dashboard overview |
| **AI Chat** | `/chat` | 💬 | AI assistant chat interface |
| **Jobs** | `/jobs` | 💼 | Job management and tracking |
| **Schedule** | `/schedule` | 📅 | Scheduling calendar view |
| **Dispatch** | `/dispatch` | 📅 | Dispatch board |
| **Customers** | `/customers` | 👥 | Customer management |
| **Technicians** | `/technicians` | 👤 | Technician profiles |
| **Employees** | `/employees` | 👥 | Employee management |
| **Pricebook** | `/pricebook` | 📖 | **NEW** - Pricebook catalog browser |
| **Invoices** | `/invoices` | 📄 | Invoice management |
| **Reports** | `/reports` | 📊 | Reports and analytics |
| **Permissions** | `/settings/permissions` | 🛡️ | **NEW** - Permission & role management |
| **Settings** | `/settings` | ⚙️ | Application settings |

---

## 📖 Pricebook Features

### Main Pricebook Page
**Route:** `/pricebook`

**Features:**
- Browse available industry pricebooks (HVAC, Plumbing, Electrical, etc.)
- Search and filter industries
- View industry descriptions
- Import pricebook to tenant catalog
- See which industries are already imported

**Access:** Click "Pricebook" in the sidebar

### Industry Detail Page
**Route:** `/pricebook/[slug]` (e.g., `/pricebook/hvac`)

**Features:**
- View all categories in the industry
- Browse services within categories
- See service details (pricing, materials, descriptions)
- Hierarchical category navigation
- Import specific categories or entire industry

**Access:** Click on any industry card from the main pricebook page

---

## 🛡️ Permission Management

### Permissions Page
**Route:** `/settings/permissions`

**Features:**
- View all available permissions (40+ permissions)
- Manage role permissions
- Assign/remove permissions from roles
- View which employees have which roles
- Bulk permission operations

**Access:** Click "Permissions" in the sidebar

**Permission Categories:**
- Customers (VIEW, CREATE, EDIT, DELETE, etc.)
- Jobs (VIEW, CREATE, EDIT, ASSIGN, etc.)
- Invoices (VIEW, CREATE, SEND, etc.)
- Employees (VIEW, CREATE, EDIT, etc.)
- Reports (VIEW, EXPORT, etc.)
- Settings (VIEW, EDIT, etc.)
- And more...

---

## 👥 Employee Role Management

### Assign Roles to Employees
**Location:** Employee detail page or Permissions page

**Features:**
- Assign multiple roles to an employee
- Remove roles from employees
- Replace all roles at once
- View role permissions
- Check if employee has specific permission

**Access:**
- Via `/employees/[id]` - Employee detail page
- Via `/settings/permissions` - Permission management page

---

## 🔍 Quick Access URLs

### Direct Links

**Pricebook:**
- Main: `http://localhost:3000/pricebook`
- HVAC: `http://localhost:3000/pricebook/hvac`
- Plumbing: `http://localhost:3000/pricebook/plumbing`
- Electrical: `http://localhost:3000/pricebook/electrical`

**Permissions:**
- Main: `http://localhost:3000/settings/permissions`

**Customers (with new features):**
- Main: `http://localhost:3000/customers`
- Verified Tab: `http://localhost:3000/customers` (click "Verified" tab)
- Unverified Tab: `http://localhost:3000/customers` (click "Unverified" tab)

---

## 📱 Mobile Navigation

On mobile devices, the sidebar is accessible via:
- **Hamburger menu** (☰) in the top-left corner
- Tap to open/close the navigation drawer

---

## 🎯 Feature Locations Summary

| Feature | Location | Route |
|---------|----------|-------|
| **Browse Pricebooks** | Sidebar → Pricebook | `/pricebook` |
| **View Industry Details** | Pricebook → Click Industry | `/pricebook/[slug]` |
| **Import Pricebook** | Pricebook → Industry → Import Button | `/pricebook/[slug]` |
| **Manage Permissions** | Sidebar → Permissions | `/settings/permissions` |
| **Assign Employee Roles** | Employees → Employee Detail | `/employees/[id]` |
| **View Unverified Customers** | Customers → Unverified Tab | `/customers` (Unverified tab) |
| **Verify Customers** | Customers → Unverified Tab → Verify Button | `/customers` |

---

## 🚀 Getting Started

1. **Start the web app:**
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Access the app:**
   - Open: `http://localhost:3000`
   - Login with your credentials

3. **Navigate to Pricebook:**
   - Click "Pricebook" in the left sidebar
   - Browse available industries
   - Click an industry to see categories and services

4. **Manage Permissions:**
   - Click "Permissions" in the left sidebar
   - View all permissions
   - Manage role permissions
   - Assign roles to employees

---

## 📝 Notes

- **Pricebook** is a read-only catalog browser - use it to explore and import industry templates
- **Permissions** page allows full CRUD operations on roles and permissions
- **Unverified Customers** tab shows customers created via VAPI voice calls
- All new features are fully integrated with the existing navigation system

---

## 🔗 Related Documentation

- [Pricebook Implementation Status](./PRICEBOOK_IMPLEMENTATION_STATUS.md)
- [API Implementation Guide](./PRICEBOOK_API_IMPLEMENTATION.md)
- [Local Development Setup](./LOCAL_DEVELOPMENT_SETUP.md)

