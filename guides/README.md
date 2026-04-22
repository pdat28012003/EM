# HUONG DAN CAI DAT TUNG PHAN

## TONG QUAN

Day la bo huong dan cai dat chi tiet cho tung phan cua he thong Quan Ly Trung Tam Tieng Anh. Ban co the cai dat tung phan de kiem tra va lay y kien truoc khi cai dat toan bo he thong.

## CAC PHUONG PHAP CAI DAT

### Phuong phap 1: Docker (Khuyen khich)
- Nhanh nhat va don gian nhat
- Cai dat tat ca trong 1 lenh
- Thich hop cho demo va testing

**Xem file:** `04_DOCKER_SETUP.md`

### Phuong phap 2: Manual Setup (Tung phan)
- Cai dat tung phan de kiem tra
- De debug va troubleshooting
- Thich hop cho development

**Thu tu cai dat:**
1. `03_DATABASE_SETUP.md` - Database
2. `01_BACKEND_SETUP.md` - Backend API
3. `02_FRONTEND_SETUP.md` - Frontend
4. `05_ENVIRONMENT_CONFIG.md` - Cau hinh environment

## THU TU CAI DAT DE KIEM TRA

### Buoc 1: Database Setup
**File:** `03_DATABASE_SETUP.md`

**Muc tieu:**
- Database san sang de backend ket noi
- Test database connection
- Verify schema

**Kiem tra:**
```bash
# SQL Server
sqlcmd -S localhost -E -Q "SELECT name FROM sys.databases"

# PostgreSQL
psql -U postgres -h localhost -c "\l"
```

### Buoc 2: Backend Setup
**File:** `01_BACKEND_SETUP.md`

**Muc tieu:**
- Backend API chay thanh cong
- Ket noi database duoc
- Swagger UI hoat dong

**Kiem tra:**
- Truy cap: `https://localhost:5001/swagger`
- Test API: `GET /api/dashboard/stats`

### Buoc 3: Frontend Setup
**File:** `02_FRONTEND_SETUP.md`

**Muc tieu:**
- Frontend chay thanh cong
- Ket noi backend duoc
- Giao dien hien thi

**Kiem tra:**
- Truy cap: `http://localhost:3000`
- Kiem tra browser console log
- Test network requests

### Buoc 4: Environment Configuration
**File:** `05_ENVIRONMENT_CONFIG.md`

**Muc tieu:**
- Cau hinh dung cac environment variables
- Test integration voi SePay, Email
- Security hardening

**Kiem tra:**
- Test payment integration
- Test email functionality
- Verify security settings

## QUICK START CHO TESTING

### 1. Quick Docker Test (5 minutes)
```bash
# Clone project
git clone <repository-url>
cd EM

# Cai dat Docker Desktop neu chua co

# Chay het he thong
docker-compose up -d

# Kiem tra
curl http://localhost:5000/api/dashboard/stats
# Mo browser: http://localhost:3000
```

### 2. Manual Test (30 minutes)
```bash
# 1. Setup Database
# Xem file 03_DATABASE_SETUP.md

# 2. Setup Backend
cd english-center-management/backend/EnglishCenter.API
dotnet restore
dotnet ef database update
dotnet run

# 3. Setup Frontend (mo terminal moi)
cd english-center-management/frontend
npm install
npm start
```

## TESTING CHECKLIST

### Database Test
- [ ] Database server dang chay
- [ ] Database "EnglishCenterDB" da tao
- [ ] Connection string dung
- [ ] Migrations thanh cong

### Backend Test
- [ ] Backend chay thanh cong (port 5000/5001)
- [ ] Swagger UI hoat dong
- [ ] Database ket noi thanh cong
- [ ] JWT token cau hinh
- [ ] API endpoints tra ve data

### Frontend Test
- [ ] Frontend chay thanh cong (port 3000)
- [ ] Giao dien hien thi
- [ ] Ket noi backend thanh cong
- [ ] Khong co CORS error
- [ ] Network requests thanh cong

### Integration Test
- [ ] Login/Logout hoat dong
- [ ] CRUD Students/Teachers
- [ ] Payment flow
- [ ] Email notifications
- [ ] File upload

## ENVIRONMENT PREPARATION

### Windows Development
```powershell
# Kiem tra .NET 8
dotnet --version

# Kiem tra Node.js
node --version
npm --version

# Kiem tra SQL Server
Get-Service -Name *SQL*
```

### Cross-platform Development
```bash
# Kiem tra .NET 8
dotnet --version

# Kiem tra Node.js
node --version
npm --version

# Kiem tra PostgreSQL
psql --version
```

## TROUBLESHOOTING QUICK GUIDE

### 1. Port Conflicts
```bash
# Kiem tra port
netstat -ano | findstr :3000
netstat -ano | findstr :5000
netstat -ano | findstr :1433

# Kill process
taskkill /PID <PID> /F
```

### 2. Database Connection
```bash
# SQL Server
sqlcmd -S localhost -E -Q "SELECT @@VERSION"

# PostgreSQL
psql -U postgres -h localhost -c "SELECT version();"
```

### 3. Backend Issues
```bash
# Check logs
dotnet run --verbosity normal

# Check migrations
dotnet ef database update --verbose
```

### 4. Frontend Issues
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install

# Check environment
echo $Env:REACT_APP_API_URL
```

## PERFORMANCE TESTING

### Backend Performance
```bash
# Test API load
ab -n 1000 -c 10 http://localhost:5000/api/students

# Test database queries
dotnet ef database update --verbose
```

### Frontend Performance
```bash
# Build size analysis
npm run build
npx webpack-bundle-analyzer build/static/js/*.js
```

## SECURITY TESTING

### Basic Security Checks
- [ ] JWT token co do dai >= 32 ky tu
- [ ] Database password manh
- [ ] HTTPS trong production
- [ ] CORS cau hinh dung
- [ ] Environment variables khong commit

### API Security
- [ ] Authentication hoat dong
- [ ] Authorization tuong ung
- [ ] Input validation
- [ ] SQL injection prevention

## DEPLOYMENT PREPARATION

### Production Checklist
- [ ] Environment variables cau hinh
- [ ] Database backup
- [ ] SSL certificates
- [ ] Monitoring setup
- [ ] Logging configured
- [ ] Security hardening

### Docker Production
```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Run production
docker-compose -f docker-compose.prod.yml up -d
```

## SUPPORT & FEEDBACK

### Feedback Collection
1. **Installation Experience:** Co de cai dat khong?
2. **Documentation:** Huong dan co ro khong?
3. **Issues:** Gap loi gi trong qua trinh?
4. **Improvements:** Can them/tbot gi?

### Issue Reporting
1. Collect error logs
2. Note environment details
3. Steps to reproduce
4. Expected vs actual behavior

### Contact Support
- GitHub Issues
- Email support
- Documentation feedback

## NEXT STEPS

Sau khi testing xong:
1. Thu thap feedback tu users
2. Fix issues neu co
3. Update documentation
4. Prepare cho production deployment
5. Training cho users

## ADDITIONAL RESOURCES

### Documentation
- API Documentation: `/swagger`
- Database Schema: `03_DATABASE_SETUP.md`
- Configuration Guide: `05_ENVIRONMENT_CONFIG.md`

### Tools
- Postman/Insomnia cho API testing
- pgAdmin/SSMS cho database management
- Docker Desktop cho container management

### Community
- GitHub Discussions
- Stack Overflow
- Developer Forums
