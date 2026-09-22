# 🚀 Create Super Admin on Railway - Step by Step

## Step 1: Get Your Railway DATABASE_URL

1. Go to [Railway Dashboard](https://railway.app)
2. Open your NexaCRM project
3. Click on your **PostgreSQL** service
4. Go to the **Variables** tab or **Connect** tab
5. Copy the **DATABASE_URL** (it looks like this):
   ```
   postgresql://postgres:xxxxx@xxxxx.railway.app:5432/railway
   ```

## Step 2: Run the Admin Creation Script

Open PowerShell in your project directory and run:

```powershell
$env:DATABASE_URL="YOUR_RAILWAY_DATABASE_URL_HERE"
node apps/api/create-railway-admin.js
```

**Example:**
```powershell
$env:DATABASE_URL="postgresql://postgres:abc123@monorail.proxy.rlwy.net:12345/railway"
node apps/api/create-railway-admin.js
```

## What This Will Do

✅ Connect to your Railway PostgreSQL database
✅ Check if user `umairsame28@gmail.com` exists
✅ If exists: Promote to SUPER_ADMIN
✅ If not exists: Create new SUPER_ADMIN account
✅ Set credentials:
   - Email: umairsame28@gmail.com
   - Password: umairqasim2

## Step 3: Login to Your Admin Panel

After the script completes:

1. Go to your deployed frontend URL (e.g., https://yourapp.up.railway.app)
2. Login with:
   - **Email:** umairsame28@gmail.com
   - **Password:** umairqasim2
3. You should see "Super Admin" section in the sidebar
4. Navigate to `/admin` to access the admin panel

---

## Alternative: Update .env File (For Local Development)

If you want to work with Railway database locally:

1. Edit `apps/api/.env`
2. Replace the DATABASE_URL line with your Railway URL:
   ```env
   DATABASE_URL="postgresql://postgres:xxxxx@xxxxx.railway.app:5432/railway"
   ```
3. Run:
   ```bash
   node apps/api/create-railway-admin.js
   ```

---

## Troubleshooting

### "Authentication failed" Error
- Double-check your DATABASE_URL is correct
- Make sure there are no extra spaces or quotes

### "Table does not exist" Error
- Run migrations first:
  ```bash
  cd apps/api
  npx prisma migrate deploy
  ```

### Script Files Location
- `apps/api/create-railway-admin.js` - Main script
- `apps/api/create-admin.js` - Alternative script (same functionality)

---

## Security Note

⚠️ **Important:** After creating the admin account:
1. Never commit the actual DATABASE_URL to git
2. Keep your admin credentials secure
3. Consider changing the password after first login
4. The DATABASE_URL should only be in Railway environment variables and your local .env (which is gitignored)
