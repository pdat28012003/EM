# HUONG DAN CAI DAT DATABASE

## TONG QUAN

He thong ho tro 2 loai database:
- **SQL Server 2022** (khuyen khich cho Windows)
- **PostgreSQL** (cross-platform, open-source)

## CHON DATABASE PHU HOP

| Tiêu chí | SQL Server | PostgreSQL |
|----------|------------|------------|
| Platform | Windows | Windows/Mac/Linux |
| Cost | Express mien phi | Hoan toan mien phi |
| Performance | Rât tot | Rât tot |
| Tools | SSMS (Windows) | pgAdmin (cross-platform) |
| Integration | .NET native | Ho tro tot |

## OPTION 1: SQL SERVER SETUP

### Buoc 1: Download va Cai dat
1. Download SQL Server 2022 Express: https://www.microsoft.com/en-us/sql-server/sql-server-downloads
2. Chon "Express" edition (mien phi)
3. Download va chay installer

### Buoc 2: Cai dat Configuration
Trong qua trinh cai dat:
- Chon "Basic" installation
- Chon "Database Engine Services"
- Set "Windows Authentication" hoac "Mixed Mode"
- Dat password cho "sa" user (neu chon Mixed Mode)

### Buoc 3: Kiem tra Installation
```bash
# Kiem tra SQL Server service
Get-Service -Name *SQL*

# Kiem tra version
sqlcmd -S localhost -E -Q "SELECT @@VERSION"
```

### Buoc 4: Tao Database
**Cach 1: Dung SQL Server Management Studio (SSMS)**
1. Mo SSMS
2. Connect toi server
3. Right-click "Databases" -> "New Database"
4. Ten: "EnglishCenterDB"
5. Click "OK"

**Cach 2: Dung command line**
```bash
# Tao database bang sqlcmd
sqlcmd -S localhost -E -Q "CREATE DATABASE EnglishCenterDB"
```

### Buoc 5: Cau hinh Connection String
Trong `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=EnglishCenterDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

Neu dung "sa" user:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=EnglishCenterDB;User Id=sa;Password=YourPassword123;Encrypt=True;TrustServerCertificate=True;"
  }
}
```

## OPTION 2: POSTGRESQL SETUP

### Buoc 1: Download va Cai dat
1. Download PostgreSQL: https://www.postgresql.org/download/windows/
2. Chon version moi nhat (15+)
3. Chay installer

### Buoc 2: Cai dat Configuration
Trong qua trinh cai dat:
- Port: 5432 (default)
- Superuser: postgres
- Dat password cho postgres user
- Chon "pgAdmin" de cai dat management tool

### Buoc 3: Kiem tra Installation
```bash
# Kiem tra PostgreSQL service
Get-Service postgresql*

# Kiem tra version
psql --version

# Ket noi test
psql -U postgres -h localhost
```

### Buoc 4: Tao Database
**Cach 1: Dung pgAdmin**
1. Mo pgAdmin
2. Connect toi server
3. Right-click "Databases" -> "Create" -> "Database"
4. Ten: "englishcenter"
5. Click "Save"

**Cach 2: Dung command line**
```bash
# Tao database
psql -U postgres -h localhost -c "CREATE DATABASE englishcenter"

# Kiem tra database
psql -U postgres -h localhost -c "\l"
```

### Buoc 5: Cau hinh Connection String
Trong `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=englishcenter;Username=postgres;Password=your_password"
  }
}
```

## ENTITY FRAMEWORK MIGRATIONS

### Buoc 1: Kiem tra Migrations
```bash
cd english-center-management/backend/EnglishCenter.API

# Danh sach migrations
dotnet ef migrations list
```

### Buoc 2: Tao Migration (neu chua co)
```bash
# Tao migration moi
dotnet ef migrations add InitialCreate
```

### Buoc 3: Update Database
```bash
# Apply migrations
dotnet ef database update
```

### Buoc 4: Kiem tra Database
**SQL Server:**
```bash
# Ket noi va kiem tra tables
sqlcmd -S localhost -E -d EnglishCenterDB -Q "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES"
```

**PostgreSQL:**
```bash
# Ket noi va kiem tra tables
psql -U postgres -h localhost -d englishcenter -c "\dt"
```

## DATABASE SCHEMA OVERVIEW

### Main Tables:
- **Students** - Thong tin hoc vien
- **Teachers** - Thong tin giao vien
- **Courses** - Thong tin khoa hoc
- **Classes** - Thong tin lop hoc
- **Enrollments** - Dang ky hoc
- **Payments** - Thanh toan
- **TestScores** - Diem thi
- **Users** - Authentication
- **Roles** - User roles

### Relationships:
- Students -> Enrollments -> Classes
- Teachers -> Classes
- Classes -> Courses
- Students -> Payments
- Students -> TestScores

## BACKUP & RESTORE

### SQL Server Backup
```bash
# Backup database
sqlcmd -S localhost -E -Q "BACKUP DATABASE EnglishCenterDB TO DISK='C:\backup\EnglishCenterDB.bak'"

# Restore database
sqlcmd -S localhost -E -Q "RESTORE DATABASE EnglishCenterDB FROM DISK='C:\backup\EnglishCenterDB.bak'"
```

### PostgreSQL Backup
```bash
# Backup database
pg_dump englishcenter > backup.sql

# Restore database
psql -U postgres -h localhost englishcenter < backup.sql
```

## PERFORMANCE OPTIMIZATION

### SQL Server
```sql
-- Tao indexes cho cac columns thuong search
CREATE INDEX IX_Students_Email ON Students(Email);
CREATE INDEX IX_Students_PhoneNumber ON Students(PhoneNumber);
CREATE INDEX IX_Enrollments_StudentId ON Enrollments(StudentId);
```

### PostgreSQL
```sql
-- Tao indexes
CREATE INDEX IX_Students_Email ON Students(Email);
CREATE INDEX IX_Students_PhoneNumber ON Students(PhoneNumber);
CREATE INDEX IX_Enrollments_StudentId ON Enrollments(StudentId);

-- Analyze table statistics
ANALYZE Students;
ANALYZE Enrollments;
```

## SECURITY CONFIGURATION

### SQL Server
```sql
-- Tao user cho application
CREATE LOGIN EnglishCenterUser WITH PASSWORD = 'StrongPassword123!';
USE EnglishCenterDB;
CREATE USER EnglishCenterUser FOR LOGIN EnglishCenterUser;
ALTER ROLE db_owner ADD MEMBER EnglishCenterUser;
```

### PostgreSQL
```sql
-- Tao user cho application
CREATE USER englishcenter_user WITH PASSWORD 'StrongPassword123!';
GRANT ALL PRIVILEGES ON DATABASE englishcenter TO englishcenter_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO englishcenter_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO englishcenter_user;
```

## TROUBLESHOOTING

### 1. Connection Failed
```bash
# SQL Server - kiem tra service
Get-Service -Name *SQL*

# PostgreSQL - kiem tra service
Get-Service postgresql*

# Kiem tra port
netstat -ano | findstr :1433  # SQL Server
netstat -ano | findstr :5432  # PostgreSQL
```

### 2. Migration Errors
```bash
# Xoa migration cu
dotnet ef migrations drop

# Kiem tra connection string
dotnet ef database update --verbose
```

### 3. Permission Denied
```bash
# SQL Server - kiem tra permissions
sqlcmd -S localhost -E -Q "SELECT name, type_desc FROM sys.database_principals"

# PostgreSQL - kiem tra permissions
psql -U postgres -h localhost -c "\du"
```

### 4. Database Size Issues
```sql
-- SQL Server - kiem tra size
sp_spaceused

-- PostgreSQL - kiem tra size
SELECT pg_size_pretty(pg_database_size('englishcenter'));
```

## MONITORING TOOLS

### SQL Server
- **SQL Server Management Studio (SSMS)**
- **SQL Server Profiler**
- **Performance Monitor**

### PostgreSQL
- **pgAdmin**
- **pg_stat_statements**
- **pgBadger**

## NEXT STEPS

Sau khi database setup xong:
1. Chay Entity Framework migrations
2. Test database connection tu backend
3. Setup backend (xem file `01_BACKEND_SETUP.md`)
4. Setup frontend (xem file `02_FRONTEND_SETUP.md`)

## SUPPORT

Neu gap van de:
1. Kiem tra database service status
2. Kiem tra connection string trong appsettings.json
3. Xem database logs
4. Test connection voi database client tools
