# pgAdmin Setup - Database Management in Browser

## ✅ pgAdmin is Now Running!

You can now manage your PostgreSQL database through a web browser.

## Access pgAdmin

1. **Open your browser** and go to:

   ```
   http://localhost:5050
   ```

2. **Login with:**
   - **Email:** `admin@fanhouse.com`
   - **Password:** `admin`

## Connect to Your Database

After logging into pgAdmin:

1. **Right-click on "Servers"** in the left sidebar
2. **Select "Register" → "Server"**

3. **In the "General" tab:**

   - **Name:** `FanHouse Database` (or any name you prefer)

4. **In the "Connection" tab:**

   - **Host name/address:** `postgres` (this is the Docker service name)
   - **Port:** `5432`
   - **Maintenance database:** `fanhouse_db`
   - **Username:** `fanhouse`
   - **Password:** `fanhouse_dev_password`
   - ✅ **Check "Save password"** (optional, for convenience)

5. **Click "Save"**

## What You Can Do

Once connected, you can:

- ✅ Browse tables (like `users`)
- ✅ View and edit data
- ✅ Run SQL queries
- ✅ Create/modify tables
- ✅ Export/import data
- ✅ View database statistics

## Quick SQL Queries

You can run SQL directly in pgAdmin:

### View all users

```sql
SELECT id, email, role, creator_status, created_at
FROM users;
```

### Count users by role

```sql
SELECT role, COUNT(*) as count
FROM users
GROUP BY role;
```

### Create an admin user (if needed)

```sql
UPDATE users
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

## Troubleshooting

### Can't connect to pgAdmin?

- Make sure the container is running: `docker ps | grep pgadmin`
- Check if port 5050 is available
- Try restarting: `docker-compose restart pgadmin`

### Can't connect to database in pgAdmin?

- Make sure PostgreSQL container is running: `docker ps | grep postgres`
- Use `postgres` as hostname (not `localhost`) - this is the Docker service name
- Verify credentials match `.env.local`

### pgAdmin won't start?

- Check logs: `docker logs fanhouse-pgadmin`
- Remove and recreate: `docker-compose down pgadmin && docker-compose up -d pgadmin`

## Stop/Start pgAdmin

```bash
# Stop
docker-compose stop pgadmin

# Start
docker-compose start pgadmin

# Restart
docker-compose restart pgadmin
```

## Remove pgAdmin (if needed)

```bash
docker-compose stop pgadmin
docker-compose rm pgadmin
```

Then remove the pgadmin service from `docker-compose.yml` if you don't want it anymore.

---

**Note:** Port 5432 is the database connection port (not HTTP), so you can't access it directly in a browser. That's why we use pgAdmin on port 5050 to provide a web interface! 🎉
