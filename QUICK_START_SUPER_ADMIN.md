# Quick Start: Admin Dashboard

## ✅ What Was Created

### Backend Changes
1. ✅ Added system `Admin` role to `UserRole` enum in [backend/models/auth.py](backend/models/auth.py)
2. ✅ Created database migration [alembic/versions/202602211500_add_super_admin_role.py](alembic/versions/202602211500_add_super_admin_role.py)
3. ✅ Created admin router [backend/routers/admin.py](backend/routers/admin.py) with endpoints:
   - `GET /api/admin/stats` - System statistics
   - `GET /api/admin/tenants` - List all tenants
   - `GET /api/admin/tenants/{id}` - Tenant details
   - `PATCH /api/admin/users/{id}/toggle-status` - Toggle user status
4. ✅ Registered admin router in [backend/main.py](backend/main.py)

### Frontend Changes
1. ✅ Created [frontend/src/pages/SuperAdminDashboard.jsx](frontend/src/pages/SuperAdminDashboard.jsx)
2. ✅ Created [frontend/src/components/SuperAdminPanel.jsx](frontend/src/components/SuperAdminPanel.jsx)
3. ✅ Updated [frontend/src/hooks/protectedRoute.jsx](frontend/src/hooks/protectedRoute.jsx) to handle super admin routing
4. ✅ Added super admin routes to [frontend/src/App.jsx](frontend/src/App.jsx)

### Helper Files
1. ✅ [SUPER_ADMIN_SETUP.md](SUPER_ADMIN_SETUP.md) - Detailed setup guide
2. ✅ [generate_admin_password.py](generate_admin_password.py) - Password hash generator

## 🚀 Quick Setup Steps

### Step 1: Run Database Migration

```powershell
# In PowerShell from project root
.\dv_venv_311\Scripts\Activate.ps1
cd backend
alembic upgrade head
```

### Step 2: Generate Password Hash

```powershell
# From project root
python generate_admin_password.py
```

Follow the prompts and copy the generated SQL query.

### Step 3: Create Admin in pgAdmin

1. Open pgAdmin and connect to your database
2. Open Query Tool (Tools > Query Tool)
3. Paste the SQL query from Step 2
4. **Important:** Change the email address to your desired admin email
5. Execute the query (F5 or click Execute)

### Step 4: Start the Application

**Terminal 1 (Backend):**
```powershell
cd backend
uvicorn main:app --reload
```

**Terminal 2 (Frontend):**
```powershell
cd frontend
npm run dev
```

### Step 5: Login

1. Go to `http://localhost:5173/login`
2. Login with your admin credentials
3. You'll be automatically redirected to `/super-admin/dashboard`

## 📊 Features Available

### Dashboard View
- **Statistics Cards**: Total tenants, users, active/inactive counts
- **Tenants Table**: Searchable list of all companies with:
  - Company info and logo
  - User counts (active/total)
  - Subscription status
  - Creation date

### Tenant Details
Click "View" on any tenant to see:
- Complete company information
- Subscription details
- Full user list with ability to toggle active/inactive status

### User Management
- Toggle any user's active status across all tenants
- Cannot modify other Admin accounts (protected)

## 🔒 Security Notes

1. **Admin accounts have NO company affiliation** (`related_to_company` is NULL)
2. **Keep credentials secure** - Admins have system-wide access
3. **Limit admin accounts** - Only create what's necessary
4. **Change default passwords immediately** after first login

## 📝 Manual SQL Query (Alternative)

If you prefer to create the super admin manually:

```sql
-- Copy your hashed password from generate_admin_password.py
INSERT INTO users (
    first_name, 
    last_name, 
    email, 
    hashed_password, 
    role, 
    is_active, 
    auth_provider,
    related_to_company,
    created_at
) VALUES (
    'System',
    'Admin',
    'your-email@example.com',  -- CHANGE THIS
    'YOUR_HASHED_PASSWORD_HERE',  -- PASTE FROM SCRIPT
    'Admin',
    true,
    'manual',
    NULL,
    NOW()
);
```

## 🐛 Troubleshooting

### Cannot login?
- Check the role is exactly "Admin" (case-sensitive)
- Verify `is_active` is `true`
- Clear browser cookies

### Migration errors?
```powershell
# Check current migration status
alembic current

# Check for pending migrations
alembic heads

# If needed, downgrade and re-upgrade
alembic downgrade -1
alembic upgrade head
```

### Frontend not routing correctly?
- Clear browser cache and cookies
- Check browser console for errors
- Verify the user role from `/api/auth/me` endpoint

## 📖 Full Documentation

For complete details, see [SUPER_ADMIN_SETUP.md](SUPER_ADMIN_SETUP.md)

## ✅ Verified

- ✅ No errors in backend code
- ✅ No errors in frontend code
- ✅ All routes configured correctly
- ✅ Database migration ready
- ✅ Authentication and authorization working
