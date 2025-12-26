# Database Setup & Management

## Quick Start (Docker)

### Start PostgreSQL
```bash
docker-compose up -d
```

### Stop PostgreSQL
```bash
docker-compose down
```

### Stop and Remove Data
```bash
docker-compose down -v
```

## Database Connection

**Connection String:**
```
postgresql://fanhouse:fanhouse_dev_password@localhost:5432/fanhouse_db
```

**Credentials:**
- Host: `localhost`
- Port: `5432`
- Database: `fanhouse_db`
- Username: `fanhouse`
- Password: `fanhouse_dev_password`

## Useful Commands

### Check if PostgreSQL is running
```bash
docker ps | grep fanhouse
```

### View logs
```bash
docker logs fanhouse-postgres
```

### Access PostgreSQL CLI
```bash
docker exec -it fanhouse-postgres psql -U fanhouse -d fanhouse_db
```

### List tables
```bash
docker exec fanhouse-postgres psql -U fanhouse -d fanhouse_db -c "\dt"
```

### View users table
```bash
docker exec fanhouse-postgres psql -U fanhouse -d fanhouse_db -c "SELECT * FROM users;"
```

### Reset database (careful!)
```bash
docker-compose down -v
docker-compose up -d
npm run db:init
```

## NPM Scripts

```bash
npm run db:init          # Initialize database schema
npm run db:create-admin  # Create admin user
```

## Creating an Admin User

```bash
npm run db:create-admin admin@example.com SecurePassword123
```

## Backup & Restore

### Backup
```bash
docker exec fanhouse-postgres pg_dump -U fanhouse fanhouse_db > backup.sql
```

### Restore
```bash
cat backup.sql | docker exec -i fanhouse-postgres psql -U fanhouse -d fanhouse_db
```

## Troubleshooting

### Port 5432 already in use
Another PostgreSQL instance is running. Either:
1. Stop the other instance
2. Change the port in `docker-compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Use 5433 instead
   ```
   And update `.env.local`:
   ```
   DATABASE_URL=postgresql://fanhouse:fanhouse_dev_password@localhost:5433/fanhouse_db
   ```

### Connection refused
- Make sure Docker Desktop is running
- Check if container is up: `docker ps | grep fanhouse`
- Restart container: `docker-compose restart`

### Can't connect after restart
Wait a few seconds for PostgreSQL to fully start:
```bash
docker exec fanhouse-postgres pg_isready -U fanhouse
```

## Production Notes

For production, use:
- Cloud SQL (GCP) or RDS (AWS)
- Strong passwords
- SSL connections
- Automated backups
- Read replicas for scaling

