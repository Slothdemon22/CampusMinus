# Docker Commands for PostgreSQL with pgvector

## Start PostgreSQL Container with pgvector

```bash
docker run -d \
  --name postgres-db \
  -e POSTGRES_PASSWORD=admin123 \
  -e POSTGRES_USER=admin \
  -e POSTGRES_DB=mydb \
  -p 5432:5432 \
  pgvector/pgvector:pg16
```

## If container already exists, remove it first:

```bash
# Stop and remove existing container
docker stop postgres-db
docker rm postgres-db

# Then run the command above
```

## Or use this one-liner to force recreate:

```bash
docker rm -f postgres-db 2>/dev/null; docker run -d --name postgres-db -e POSTGRES_PASSWORD=admin123 -e POSTGRES_USER=admin -e POSTGRES_DB=mydb -p 5432:5432 pgvector/pgvector:pg16
```

## Useful Docker Commands:

```bash
# Check if container is running
docker ps | grep postgres-db

# View container logs
docker logs postgres-db

# Stop container
docker stop postgres-db

# Start existing container
docker start postgres-db

# Connect to database from inside container
docker exec -it postgres-db psql -U admin -d mydb

# Remove container
docker rm postgres-db
```

## Database Connection Details:

- **Host**: localhost
- **Port**: 5432
- **Database**: mydb
- **User**: admin
- **Password**: admin123
- **Connection String**: `postgresql://admin:admin123@localhost:5432/mydb`

