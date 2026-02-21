# Admin Dashboard Setup Guide

This guide explains how to create a system Admin account and access the Admin Dashboard.

## Overview

The Admin Dashboard allows you to:
- View all tenants/companies in the system
- Monitor system-wide statistics (total tenants, users, active/inactive users)
- View detailed information about each tenant
- View and manage all users across all tenants
- Toggle user active/inactive status across all companies

## Creating a System Admin Account

### Option 1: Using pgAdmin (Manual Database Entry)

1. **Open pgAdmin** and connect to your PostgreSQL database

2. **Navigate to your database** → Schemas → public → Tables → users

3. **Right-click on `users` table** → View/Edit Data → All Rows

4. **Insert a new row** with the following values:
   ```sql
   INSERT INTO users (
       first_name, 
       last_name, 
       email, 
       hashed_password, 
       role, 
       is_active, 
       auth_provider,
       related_to_company
   ) VALUES (
       'System',
       'Admin',
       'admin@example.com',
       '$2b$12$YOUR_HASHED_PASSWORD_HERE',  -- See password hashing section below
       'Admin',
       true,
       'manual',
       NULL  -- Admins are not tied to any company
   );
   ```

### Generating Password Hash

To generate a password hash for the Admin:

1. **Using Python** (recommended):
   ```python
   from passlib.context import CryptContext
   
   pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
   password = "your_secure_password_here"
   hashed = pwd_context.hash(password)
   print(hashed)
   ```

2. **Using the Backend API** (alternative):
   - Create a temporary endpoint or use Python shell with your backend dependencies
   - Import the hash_password function from `backend/routers/auth_utils.py`
   ```python
   from backend.routers.auth_utils import hash_password
   print(hash_password("your_secure_password"))
   ```

### Option 2: Using SQL Query Directly

Run this SQL query in pgAdmin's Query Tool:

```sql
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
    'admin@sarisari.com',
    '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TuKFjjg6crK8Xr2wLjXj8Lw9R4tC',  -- Default: "admin123"
    'Admin',
    true,
    'manual',
    NULL,
    NOW()
);
```

**⚠️ Security Note:** The hashed password above corresponds to "admin123". Make sure to change it immediately after first login in production!

## Running the Database Migration

Before using the Admin features, run the database migration:

```bash
# Navigate to your project root
cd C:\GitHub\CRM-Sari-Sari

# Activate your virtual environment
.\dv_venv_311\Scripts\activate

# Run the migration
alembic upgrade head
```

## Accessing the Admin Dashboard

1. **Start your backend server:**
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. **Start your frontend development server:**
   ```bash
   cd frontend
   npm run dev
   ```

3. **Login:**
   - Go to `http://localhost:5173/login`
   - Enter your Admin credentials
   - You will be automatically redirected to `/super-admin/dashboard`

## Admin Dashboard Features

### 1. Statistics Overview
View system-wide metrics:
- **Total Tenants**: Number of companies registered
- **Total Users**: All users across all companies
- **Active Users**: Currently active users
- **Inactive Users**: Deactivated users

### 2. Tenants List
View all tenants in a table format with:
- Company name and logo
- Company contact information
- User count (active/total)
- Subscription status and plan type
- Created date
- Quick view action button

### 3. Tenant Details Modal
Click "View" on any tenant to see:
- **Company Information**: Full details including address, currency, tax rate, territories count
- **Subscription Details**: Plan type, status, start/end dates
- **Users List**: All users in that company with:
  - Full name and email
  - Role
  - Last login date
  - Active/Inactive status toggle button

### 4. User Management
- **Toggle User Status**: Activate or deactivate any user across all tenants
- Changes are reflected immediately
- Users cannot modify other Admin accounts

## API Endpoints

The Admin has access to these protected endpoints:

- `GET /api/admin/stats` - Get system-wide statistics
- `GET /api/admin/tenants` - Get all tenants with user counts
- `GET /api/admin/tenants/{tenant_id}` - Get detailed tenant information
- `PATCH /api/admin/users/{user_id}/toggle-status` - Toggle user active status

All endpoints require Admin authentication via HTTP-only cookies.

## Security Considerations

1. **Admin accounts should never be linked to a company** (`related_to_company` must be NULL)
2. **Limit Admin accounts** - Only create as many as necessary
3. **Use strong passwords** - Minimum 8 characters, include numbers and special characters
4. **Monitor Admin access** - Keep logs of Admin actions
5. **Regular password rotation** - Change Admin passwords periodically
6. **Admins cannot be deactivated** by themselves or other admins

## Troubleshooting

### Cannot access Admin Dashboard
- Verify the user's role is exactly "Admin" (case-sensitive)
- Check if `is_active` is set to `true`
- Clear browser cookies and login again

### Password doesn't work
- Ensure the password was hashed using bcrypt
- The hash should start with `$2b$`
- Try resetting the password hash in the database

### Migration fails
- Check if there are any pending migrations: `alembic current`
- Ensure database connection is working
- Check for any conflicting role values in existing users

## Example Admin Workflow

1. **Login** with Admin credentials
2. **View Dashboard** - See overall system statistics
3. **Search for a tenant** - Use the search bar to find specific companies
4. **View tenant details** - Click "View" to see full company information
5. **Manage users** - Toggle user status as needed
6. **Monitor subscriptions** - Check which tenants have active subscriptions

## File Structure

```
backend/
├── models/
│   └── auth.py                 # UserRole enum with Admin
├── routers/
│   └── admin.py               # Admin endpoints
└── main.py                    # Router registration

frontend/
├── src/
│   ├── components/
│   │   └── SuperAdminPanel.jsx    # Admin layout
│   ├── pages/
│   │   └── SuperAdminDashboard.jsx # Main dashboard
│   ├── hooks/
│   │   └── protectedRoute.jsx     # Updated with Admin routing
│   └── App.jsx                    # Route definitions

alembic/
└── versions/
    └── 202602211500_add_super_admin_role.py  # Migration file
```

## Support

For issues or questions:
1. Check the browser console for errors
2. Check the backend logs for API errors
3. Verify database connection and migration status
4. Ensure all environment variables are properly set
