# HUONG DAN CAI DAT BACKEND

## TONG QUAN

Backend duoc xay dung bang ASP.NET Core 8 voi Entity Framework Core, cung cap RESTful API cho frontend.

## YEU CAU TRUOC KHI CAI DAT

1. **.NET 8 SDK** da duoc cai dat
2. **Database Server** (SQL Server hoac PostgreSQL) dang chay
3. **Visual Studio 2022** hoac **VS Code**

## BUOC 1: CHUAN BI PROJECT

```bash
# Di chuyen den thu muc backend
cd english-center-management/backend/EnglishCenter.API

# Kiem tra .NET version
dotnet --version
```

## BUOC 2: CAI DAT DEPENDENCIES

```bash
# Restore packages
dotnet restore

# Build project de kiem tra loi
dotnet build
```

## BUOC 3: CAU HINH CONNECTION STRING

Mo file `appsettings.json` va cap nhat connection string:

### Cho SQL Server:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=EnglishCenterDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

### Cho PostgreSQL:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Database=englishcenter;Username=postgres;Password=your_password"
  }
}
```

## BUOC 4: CAU HINH JWT TOKEN

Trong file `appsettings.json`, cap nhat AppSettings:
```json
{
  "AppSettings": {
    "Token": "your_super_secret_jwt_key_here_make_it_long_and_secure"
  }
}
```

## BUOC 5: CHAY ENTITY FRAMEWORK MIGRATIONS

```bash
# Kiem tra migrations co san
dotnet ef migrations list

# Neu chua co migration, tao migration moi
dotnet ef migrations add InitialCreate

# Update database
dotnet ef database update
```

## BUOC 6: CHAY BACKEND

### Cach 1: Dung command line
```bash
dotnet run
```

### Cach 2: Dung Visual Studio
- Mo file `EnglishCenter.sln`
- Set `EnglishCenter.API` lam startup project
- Nhan F5 de chay

## BUOC 7: KIEM TRA BACKEND

Sau khi chay thanh cong, mo browser va truy cap:

1. **Swagger UI**: `https://localhost:5001/swagger`
2. **Health Check**: `http://localhost:5000/api/dashboard/stats`

## TROUBLESHOOTING

### 1. Loi "Cannot connect to database"
```bash
# Kiem tra SQL Server service
Get-Service -Name *SQL*

# Kiem tra PostgreSQL service
pg_ctl status
```

### 2. Loi "JWT token not configured"
- Kiem tra AppSettings.Token trong appsettings.json
- Dam bao token co do dai it nhat 32 ky tu

### 3. Loi "Migration failed"
```bash
# Xoa migration cu
dotnet ef migrations drop

# Tao migration moi
dotnet ef migrations add InitialCreate
dotnet ef database update
```

### 4. Loi Port 5000/5001 bi dung
Mo file `Properties/launchSettings.json` va thay doi port:
```json
{
  "profiles": {
    "http": {
      "applicationUrl": "http://localhost:5001"
    },
    "https": {
      "applicationUrl": "https://localhost:5002"
    }
  }
}
```

## CAU HINH ADVANCED

### 1. Enable CORS
Trong `Program.cs`, them:
```csharp
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

app.UseCors("AllowFrontend");
```

### 2. Enable Swagger Documentation
Da duoc cau hinh san trong project. Truy cap `/swagger` de xem API docs.

### 3. Logging Configuration
Trong `appsettings.json`:
```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning",
      "Microsoft.EntityFrameworkCore.Database.Command": "Warning"
    }
  }
}
```

## TESTING BACKEND

### 1. Test voi Postman/Insomnia
- Import API endpoints tu Swagger
- Test GET `/api/students`
- Test POST `/api/students`

### 2. Test voi curl
```bash
# Test health check
curl http://localhost:5000/api/dashboard/stats

# Test students API
curl http://localhost:5000/api/students
```

## DEPLOYMENT NOTES

### 1. Production Build
```bash
dotnet publish -c Release -o ./publish
```

### 2. Environment Variables
```env
ASPNETCORE_ENVIRONMENT=Production
ConnectionStrings__DefaultConnection=Server=prod-server;Database=EnglishCenterDB;User Id=prod_user;Password=prod_password;
AppSettings__Token=production_jwt_token_key
```

## NEXT STEPS

Sau khi backend chay thanh cong:
1. Cai dat Frontend (xem file `02_FRONTEND_SETUP.md`)
2. Cau hinh Environment Variables (xem file `05_ENVIRONMENT_CONFIG.md`)
3. Test ket noi giua Frontend va Backend

## SUPPORT

Neu gap van de:
1. Kiem tra log trong console
2. Xem file `server_error.log` trong thu muc backend
3. Tao issue va cung cap log chi tiet
