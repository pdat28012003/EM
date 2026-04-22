# HUONG DAN CAI DAT VOI DOCKER

## TONG QUAN

Docker la cach nhanh nhat va don gian nhat de setup toan bo he thong, bao gom:
- Database container (SQL Server)
- Backend API container (.NET 8)
- Frontend container (React)

## YEU CAU TRUOC KHI CAI DAT

1. **Docker Desktop** da duoc cai dat
2. **Docker Compose** (tu dong cai dat voi Docker Desktop)
3. **Git** de clone project

## BUOC 1: CAI DAT DOCKER

### Windows
1. Download Docker Desktop: https://www.docker.com/products/docker-desktop/
2. Chay installer
3. Restart machine
4. Mo Docker Desktop va cho no khoi dong

### Kiem tra Docker
```bash
# Kiem tra Docker version
docker --version

# Kiem tra Docker Compose
docker-compose --version

# Kiem tra Docker dang chay
docker run hello-world
```

## BUOC 2: CHUAN BI PROJECT

```bash
# Clone project (neu chua co)
git clone <repository-url>
cd EM

# Kiem tra file docker-compose.yml
dir docker-compose.yml
```

## BUOC 3: CAU HINH ENVIRONMENT

### Tao file .env
```bash
# Copy file .env mau neu co
cp .env.example .env

# Hoac tao file .env moi
touch .env
```

### Noi dung file .env:
```env
# BACKEND CONFIGURATION
BACKEND_PORT=5000
DB_SERVER=database
DB_NAME=EnglishCenterDB
DB_USER=sa
DB_PASSWORD=YourStrongPassword123!
JWT_TOKEN=your_super_secret_key_here
ASPNETCORE_ENVIRONMENT=Development
AppSettings__Token=your_super_secret_key_here

# FRONTEND CONFIGURATION
FRONTEND_PORT=3000
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOAD_URL=http://localhost:5000/api/upload/avatar

# DATABASE CONFIGURATION
ACCEPT_EULA=Y
MSSQL_SA_PASSWORD=YourStrongPassword123!
MSSQL_PID=Express
```

## BUOC 4: KIEM TRA DOCKER COMPOSE FILE

File `docker-compose.yml` phai co noi dung sau:
```yaml
version: '3.4'

services:
  database:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: english-center-db
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=YourStrongPassword123!
      - MSSQL_PID=Express
    ports:
      - "1433:1433"
    volumes:
      - sql-data:/var/opt/mssql

  backend:
    image: ${DOCKER_REGISTRY-}englishcenterapi
    build:
      context: ./english-center-management/backend/EnglishCenter.API
      dockerfile: Dockerfile
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - ConnectionStrings__DefaultConnection=Server=database;Database=EnglishCenterDB;User Id=sa;Password=YourStrongPassword123!;Encrypt=True;TrustServerCertificate=True;
      - AppSettings__Token=your_super_secret_key_here
    ports:
      - "5000:8080"
    depends_on:
      - database

  frontend:
    image: ${DOCKER_REGISTRY-}englishcenterfrontend
    build:
      context: ./english-center-management/frontend
      dockerfile: Dockerfile
    environment:
      - REACT_APP_API_URL=http://localhost:5000/api
    ports:
      - "3000:80"
    depends_on:
      - backend

volumes:
  sql-data:
```

## BUOC 5: KIEM TRA DOCKERFILE

### Backend Dockerfile
File: `english-center-management/backend/EnglishCenter.API/Dockerfile`
```dockerfile
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["EnglishCenter.API.csproj", "."]
RUN dotnet restore "./EnglishCenter.API.csproj"
COPY . .
WORKDIR "/src/."
RUN dotnet build "EnglishCenter.API.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "EnglishCenter.API.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "EnglishCenter.API.dll"]
```

### Frontend Dockerfile
File: `english-center-management/frontend/Dockerfile`
```dockerfile
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## BUOC 6: CHAY DOCKER COMPOSE

### Build va chay containers
```bash
# Build va chay tat ca containers
docker-compose up -d

# Hoac build truoc
docker-compose build
docker-compose up -d
```

### Xem logs
```bash
# Xem logs tat ca containers
docker-compose logs

# Xem logs container cu the
docker-compose logs backend
docker-compose logs frontend
docker-compose logs database
```

## BUOC 7: KIEM TRA HE THONG

### Kiem tra containers
```bash
# Xem containers dang chay
docker-compose ps

# Kiem tra container status
docker-compose ps -a
```

### Kiem tra services
```bash
# Test backend API
curl http://localhost:5000/api/dashboard/stats

# Test frontend
# Mo browser: http://localhost:3000
```

### Kiem tra database connection
```bash
# Ket noi database container
docker exec -it english-center-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123!

# Trong SQL shell
SELECT name FROM sys.databases;
GO
EXIT
```

## TROUBLESHOOTING

### 1. Port conflicts
```bash
# Kiem tra port dang dung
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :1433

# Thay doi port trong docker-compose.yml
ports:
  - "3001:80"  # Frontend port 3001
  - "5001:8080"  # Backend port 5001
```

### 2. Build failed
```bash
# Xoa images va build lai
docker-compose down
docker system prune -a
docker-compose build --no-cache
docker-compose up -d
```

### 3. Database connection failed
```bash
# Kiem tra database container logs
docker-compose logs database

# Restart database container
docker-compose restart database

# Kiem tra database connection
docker exec -it english-center-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123!
```

### 4. Frontend cannot connect to backend
```bash
# Kiem tra backend container
docker-compose logs backend

# Kiem tra network
docker network ls
docker network inspect em_default
```

### 5. Container keeps restarting
```bash
# Xem logs de tim nguyen nhan
docker-compose logs <container_name>

# Kiem tra resource usage
docker stats
```

## DOCKER COMMANDS THONG DUNG

### Container Management
```bash
# Xem containers
docker ps
docker ps -a

# Stop containers
docker-compose stop

# Xoa containers
docker-compose down

# Xoa containers + volumes
docker-compose down -v
```

### Image Management
```bash
# Xem images
docker images

# Xoa images
docker image prune

# Build lai image
docker-compose build --no-cache
```

### Volume Management
```bash
# Xem volumes
docker volume ls

# Xoa volumes
docker volume prune
```

## DEVELOPMENT VOI DOCKER

### Hot Reload cho Backend
```bash
# Mount source code volume
volumes:
  - ./english-center-management/backend/EnglishCenter.API:/app
```

### Hot Reload cho Frontend
```bash
# Trong docker-compose.yml cho frontend
environment:
  - CHOKIDAR_USEPOLLING=true
volumes:
  - ./english-center-management/frontend/src:/app/src
```

## PRODUCTION DEPLOYMENT

### Environment Variables cho Production
```env
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Server=database;Database=EnglishCenterDB;User Id=sa;Password=StrongProdPassword123!;Encrypt=True;TrustServerCertificate=True;
AppSettings__Token=production_jwt_token_key_very_long_and_secure
```

### Production Docker Compose
```yaml
version: '3.4'

services:
  database:
    image: mcr.microsoft.com/mssql/server:2022-latest
    container_name: english-center-db-prod
    environment:
      - ACCEPT_EULA=Y
      - MSSQL_SA_PASSWORD=StrongProdPassword123!
      - MSSQL_PID=Express
    volumes:
      - sql-prod-data:/var/opt/mssql
    restart: unless-stopped

  backend:
    image: englishcenterapi:latest
    container_name: english-center-api-prod
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
    restart: unless-stopped

  frontend:
    image: englishcenterfrontend:latest
    container_name: english-center-web-prod
    restart: unless-stopped

volumes:
  sql-prod-data:
```

## MONITORING

### Container Monitoring
```bash
# Xem resource usage
docker stats

# Xem logs real-time
docker-compose logs -f

# Health check
docker-compose ps
```

### Log Management
```bash
# Ghi logs ra file
docker-compose logs > app.log

# Rotate logs
docker-compose logs --tail=1000
```

## BACKUP & RESTORE

### Database Backup
```bash
# Backup database tu container
docker exec english-center-db /opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrongPassword123! -Q "BACKUP DATABASE EnglishCenterDB TO DISK='/var/opt/mssql/backup/EnglishCenterDB.bak'"

# Copy backup ra host
docker cp english-center-db:/var/opt/mssql/backup/EnglishCenterDB.bak ./backup/
```

### Volume Backup
```bash
# Backup volume
docker run --rm -v sql-data:/data -v $(pwd):/backup ubuntu tar cvf /backup/sql-data-backup.tar /data
```

## NEXT STEPS

Sau khi Docker setup xong:
1. Kiem tra tat ca services
2. Test full application flow
3. Cau hinh production environment
4. Setup monitoring va logging

## SUPPORT

Neu gap van de:
1. Kiem tra Docker Desktop dang chay
2. Xem container logs: `docker-compose logs`
3. Kiem tra port conflicts: `netstat -ano`
4. Xoa va build lai: `docker-compose down && docker-compose up -d --build`
