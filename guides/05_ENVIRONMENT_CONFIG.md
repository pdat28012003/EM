# HUONG DAN CAU HINH ENVIRONMENT VARIABLES

## TONG QUAN

Environment variables la cac thong so cau hinh quan trong de he thong hoat dong dung. Cau hinh dung se giup he thong chay on dinh va an toan.

## CAC LOAI ENVIRONMENT FILE

### 1. .env (Development)
- Su dung cho moi truong development
- Khong commit len git
- Chua sensitive information

### 2. .env.production (Production)
- Su dung cho moi truong production
- Cau hinh production-specific
- Security-hardened

### 3. .env.example (Template)
- Template cho developer
- Commit len git
- Khong chua sensitive data

## BACKEND ENVIRONMENT VARIABLES

### File: .env (Backend)
```env
# DATABASE CONFIGURATION
DB_SERVER=localhost
DB_NAME=EnglishCenterDB
DB_USER=sa
DB_PASSWORD=YourStrongPassword123!

# CONNECTION STRING
ConnectionStrings__DefaultConnection=Server=localhost;Database=EnglishCenterDB;Trusted_Connection=True;TrustServerCertificate=True;

# JWT CONFIGURATION
JWT_TOKEN=your_super_secret_jwt_key_here_make_it_long_and_secure
AppSettings__Token=your_super_secret_jwt_key_here_make_it_long_and_secure

# ASP.NET CORE
ASPNETCORE_ENVIRONMENT=Development
ASPNETCORE_URLS=http://localhost:5000;https://localhost:5001

# EMAIL CONFIGURATION
EmailSettings__Email=your_email@gmail.com
EmailSettings__Password=your_app_password
EmailSettings__Host=smtp.gmail.com
EmailSettings__Port=587

# SEPAY PAYMENT CONFIGURATION
SePay__ApiKey=your_sepay_api_key
SePay__ApiUrl=https://qr.sepay.vn/img
SePay__AccountNumber=0399076806
SePay__AccountName=YOUR_ACCOUNT_NAME
SePay__AcqId=970422
SePay__WebhookSecret=your_webhook_secret

# RECAPTCHA CONFIGURATION
ReCaptcha__SecretKey=6Ld1-KQsAAAAAPJzCd8gso1RGZ8y1nIr9XDpLgRw

# LOGGING CONFIGURATION
Logging__LogLevel__Default=Information
Logging__LogLevel__Microsoft.AspNetCore=Warning
Logging__LogLevel__Microsoft.EntityFrameworkCore.Database.Command=Warning

# CORS CONFIGURATION
CORS__Origins=http://localhost:3000,http://localhost:3001

# FILE UPLOAD CONFIGURATION
FileUpload__MaxFileSize=10485760
FileUpload__AllowedExtensions=jpg,jpeg,png,pdf,doc,docx

# BACKEND URLs
BACKEND_PUBLIC_URL=http://localhost:5000
BACKEND_INTERNAL_URL=http://localhost:5000
```

### Production Environment Variables
```env
# DATABASE CONFIGURATION (Production)
DB_SERVER=prod-database-server
DB_NAME=EnglishCenterDB_Prod
DB_USER=englishcenter_user
DB_PASSWORD=StrongProductionPassword123!

# CONNECTION STRING (Production)
ConnectionStrings__DefaultConnection=Server=prod-database-server;Database=EnglishCenterDB_Prod;User Id=englishcenter_user;Password=StrongProductionPassword123!;Encrypt=True;TrustServerCertificate=True;

# JWT CONFIGURATION (Production)
JWT_TOKEN=super_secure_production_jwt_key_minimum_32_characters_long
AppSettings__Token=super_secure_production_jwt_key_minimum_32_characters_long

# ASP.NET CORE (Production)
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://0.0.0.0:8080

# EMAIL CONFIGURATION (Production)
EmailSettings__Email=noreply@yourdomain.com
EmailSettings__Password=production_email_password
EmailSettings__Host=smtp.yourdomain.com
EmailSettings__Port=587

# SEPAY PAYMENT CONFIGURATION (Production)
SePay__ApiKey=live_production_api_key
SePay__ApiUrl=https://qr.sepay.vn/img
SePay__AccountNumber=0399076806
SePay__AccountName=YOUR_COMPANY_NAME
SePay__AcqId=970422
SePay__WebhookSecret=production_webhook_secret

# RECAPTCHA CONFIGURATION (Production)
ReCaptcha__SecretKey=production_recaptcha_secret_key

# LOGGING CONFIGURATION (Production)
Logging__LogLevel__Default=Warning
Logging__LogLevel__Microsoft.AspNetCore=Warning
Logging__LogLevel__Microsoft.EntityFrameworkCore.Database.Command=Error

# CORS CONFIGURATION (Production)
CORS__Origins=https://yourdomain.com,https://www.yourdomain.com

# FILE UPLOAD CONFIGURATION (Production)
FileUpload__MaxFileSize=5242880
FileUpload__AllowedExtensions=jpg,jpeg,png

# BACKEND URLs (Production)
BACKEND_PUBLIC_URL=https://api.yourdomain.com
BACKEND_INTERNAL_URL=http://localhost:8080
```

## FRONTEND ENVIRONMENT VARIABLES

### File: .env (Frontend)
```env
# API CONFIGURATION
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_UPLOAD_URL=http://localhost:5000/api/upload/avatar

# APPLICATION CONFIGURATION
REACT_APP_ENV=development
REACT_APP_VERSION=1.0.0
REACT_APP_TITLE=English Center Management

# RECAPTCHA CONFIGURATION
REACT_APP_RECAPTCHA_SITE_KEY=6Ld1-KQsAAAAAPJzCd8gso1RGZ8y1nIr9XDpLgRw

# GOOGLE ANALYTICS (Optional)
REACT_APP_GA_TRACKING_ID=

# MAP CONFIGURATION (Optional)
REACT_APP_GOOGLE_MAPS_API_KEY=

# FEATURE FLAGS
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_DARK_MODE=false
REACT_APP_ENABLE_ANALYTICS=false

# TIMEOUT CONFIGURATION
REACT_APP_API_TIMEOUT=30000
REACT_APP_UPLOAD_TIMEOUT=60000
```

### Production Environment Variables
```env
# API CONFIGURATION (Production)
REACT_APP_API_URL=https://api.yourdomain.com/api
REACT_APP_UPLOAD_URL=https://api.yourdomain.com/api/upload/avatar

# APPLICATION CONFIGURATION (Production)
REACT_APP_ENV=production
REACT_APP_VERSION=1.0.0
REACT_APP_TITLE=English Center Management

# RECAPTCHA CONFIGURATION (Production)
REACT_APP_RECAPTCHA_SITE_KEY=production_recaptcha_site_key

# GOOGLE ANALYTICS (Production)
REACT_APP_GA_TRACKING_ID=GA_MEASUREMENT_ID

# MAP CONFIGURATION (Production)
REACT_APP_GOOGLE_MAPS_API_KEY=production_google_maps_api_key

# FEATURE FLAGS (Production)
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_DARK_MODE=true
REACT_APP_ENABLE_ANALYTICS=true

# TIMEOUT CONFIGURATION (Production)
REACT_APP_API_TIMEOUT=15000
REACT_APP_UPLOAD_TIMEOUT=30000
```

## DOCKER ENVIRONMENT VARIABLES

### File: .env (Docker Compose)
```env
# DOCKER CONFIGURATION
COMPOSE_PROJECT_NAME=english-center
COMPOSE_FILE=docker-compose.yml

# BACKEND CONFIGURATION
BACKEND_PORT=5000
BACKEND_IMAGE=englishcenterapi:latest

# FRONTEND CONFIGURATION
FRONTEND_PORT=3000
FRONTEND_IMAGE=englishcenterfrontend:latest

# DATABASE CONFIGURATION
DATABASE_PORT=1433
DATABASE_IMAGE=mcr.microsoft.com/mssql/server:2022-latest

# SECRETS
DB_PASSWORD=YourStrongPassword123!
JWT_TOKEN=your_super_secret_jwt_key_here
SEPAY_API_KEY=your_sepay_api_key
```

## CAU HINH STEP BY STEP

### Buoc 1: Tao .env.example
```env
# DATABASE CONFIGURATION
DB_SERVER=localhost
DB_NAME=EnglishCenterDB
DB_USER=sa
DB_PASSWORD=CHANGE_THIS_PASSWORD

# JWT CONFIGURATION
JWT_TOKEN=CHANGE_THIS_JWT_TOKEN

# EMAIL CONFIGURATION
EmailSettings__Email=your_email@gmail.com
EmailSettings__Password=CHANGE_THIS_PASSWORD

# SEPAY CONFIGURATION
SePay__ApiKey=CHANGE_THIS_API_KEY
SePay__AccountNumber=CHANGE_THIS_ACCOUNT_NUMBER
SePay__AccountName=CHANGE_THIS_ACCOUNT_NAME
```

### Buoc 2: Copy .env.example sang .env
```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

### Buoc 3: Chinh sua .env
- Mo file .env
- Thay doi cac gia tri "CHANGE_THIS"
- Luu file

### Buoc 4: Kiem tra environment variables
```bash
# Backend - kiem tra trong Program.cs
var jwtToken = builder.Configuration["AppSettings:Token"];
var connectionString = builder.Configuration["ConnectionStrings:DefaultConnection"];

# Frontend - kiem tra trong browser console
console.log(process.env.REACT_APP_API_URL);
```

## SECURITY BEST PRACTICES

### 1. Never commit .env file
```gitignore
# .gitignore
.env
.env.local
.env.production
.env.development
```

### 2. Use strong passwords
- Minimum 12 characters
- Include uppercase, lowercase, numbers, symbols
- Use password manager

### 3. JWT Token security
- Minimum 32 characters
- Use random string generator
- Rotate tokens periodically

### 4. Database security
- Use dedicated user for application
- Limit permissions
- Use SSL/TLS connections

### 5. API Keys management
- Use different keys for dev/prod
- Rotate keys regularly
- Monitor usage

## VALIDATION

### Backend Validation
```csharp
// Trong Program.cs
var jwtToken = builder.Configuration["AppSettings:Token"];
if (string.IsNullOrEmpty(jwtToken) || jwtToken.Length < 32)
{
    throw new InvalidOperationException("JWT Token must be at least 32 characters long");
}

var connectionString = builder.Configuration["ConnectionStrings:DefaultConnection"];
if (string.IsNullOrEmpty(connectionString))
{
    throw new InvalidOperationException("Database connection string is required");
}
```

### Frontend Validation
```javascript
// Trong src/config.js
const validateEnv = () => {
    const requiredVars = [
        'REACT_APP_API_URL',
        'REACT_APP_RECAPTCHA_SITE_KEY'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
        console.error(`Missing environment variables: ${missingVars.join(', ')}`);
        return false;
    }
    
    return true;
};

export const config = {
    apiUrl: process.env.REACT_APP_API_URL,
    recaptchaSiteKey: process.env.REACT_APP_RECAPTCHA_SITE_KEY,
    isValid: validateEnv()
};
```

## TROUBLESHOOTING

### 1. Environment variables not loading
```bash
# Kiem tra file .env ton tai
dir .env

# Kiem tra file format
type .env

# Kiem tra spacing (khong co space xung quanh =)
```

### 2. Connection string issues
```bash
# Test connection string
dotnet ef database update --verbose
```

### 3. JWT Token errors
```bash
# Kiem tra token length
echo $Env:JWT_TOKEN.Length
```

### 4. Frontend API connection
```javascript
// Kiem tra trong browser console
console.log(process.env.REACT_APP_API_URL);
```

## ENVIRONMENT VARIABLES REFERENCE

### Backend Variables
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `ConnectionStrings__DefaultConnection` | Yes | Database connection string | `Server=localhost;Database=EnglishCenterDB;...` |
| `AppSettings__Token` | Yes | JWT secret key | `super_secret_key_32_chars` |
| `ASPNETCORE_ENVIRONMENT` | No | Environment name | `Development` |
| `EmailSettings__Email` | No | Email for notifications | `email@gmail.com` |
| `SePay__ApiKey` | No | SePay API key | `spsk_live_...` |
| `ReCaptcha__SecretKey` | No | reCAPTCHA secret | `6Ld1-...` |

### Frontend Variables
| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `REACT_APP_API_URL` | Yes | Backend API URL | `http://localhost:5000/api` |
| `REACT_APP_RECAPTCHA_SITE_KEY` | No | reCAPTCHA site key | `6Ld1-...` |
| `REACT_APP_GA_TRACKING_ID` | No | Google Analytics ID | `GA_MEASUREMENT_ID` |

## NEXT STEPS

Sau khi cau hinh environment variables:
1. Test backend startup
2. Test frontend connection
3. Test database connection
4. Test payment integration
5. Test email functionality

## SUPPORT

Neu gap van de:
1. Kiem tra file .env format
2. Kiem tra required variables
3. Xem application logs
4. Test connection strings
