# 🚀 Quick Admin Setup - Railway PostgreSQL

## Option 1: Use Railway's Data Tab (Easiest!)

1. Go to **Railway Dashboard**
2. Click on your **PostgreSQL** service
3. Click on the **Data** tab
4. Click **Query** or open the query console
5. Paste this SQL and run it:

```sql
-- Create super admin user
INSERT INTO "User" (
  id,
  email,
  "passwordHash",
  "firstName",
  "lastName",
  "systemRole",
  status,
  "emailVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'umairsame28@gmail.com',
  '$2a$10$rQZJxm5H3KqY7qZJxm5H3eYvXfKQmH8K7VnxLzp4bKzH8vXqHFp5u',
  'Umair',
  'Qasim',
  'SUPER_ADMIN',
  'ACTIVE',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) 
DO UPDATE SET 
  "systemRole" = 'SUPER_ADMIN',
  status = 'ACTIVE',
  "updatedAt" = NOW();
```

6. Verify it worked:

```sql
SELECT id, email, "firstName", "lastName", "systemRole", status
FROM "User"
WHERE email = 'umairsame28@gmail.com';
```

✅ **Done!** You can now login with:
- Email: umairsame28@gmail.com
- Password: umairqasim2

---

## Option 2: Use Railway CLI

If you have Railway CLI installed:

```bash
railway login
railway link
railway run node apps/api/create-railway-admin.js
```

---

## Option 3: Get Public Connection URL

The DATABASE_URL you provided uses `postgres.railway.internal` which only works inside Railway.

To get the **public** URL:

1. In Railway Dashboard → PostgreSQL service
2. Look for your service URL/domain (something like: `your-project-name.up.railway.app`)
3. Or check the **Connect** tab for TCP Proxy settings
4. The public URL format is:
   ```
   postgresql://postgres:wlSsUGTHhAwwrcLqAHloovwiQVFCTyhj@[PROXY-DOMAIN]:5432/railway
   ```

Where `[PROXY-DOMAIN]` might be something like:
- `monorail.proxy.rlwy.net` (common)
- `viaduct.proxy.rlwy.net`
- Or your custom domain

---

## ✅ Login Credentials

Once created:
- **Email:** umairsame28@gmail.com
- **Password:** umairqasim2
- **Role:** SUPER_ADMIN

Navigate to `/admin` in your app to access the admin panel!
