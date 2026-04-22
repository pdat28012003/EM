# HUONG DAN CAI DAT FRONTEND

## TONG QUAN

Frontend duoc xay dung bang React 18 voi Material-UI, cung cap giao dien nguoi dung hien dai va thuan tien.

## YEU CAU TRUOC KHI CAI DAT

1. **Node.js 18+** da duoc cai dat
2. **npm** (tu dong cai dat voi Node.js)
3. **Backend API** dang chay (xem file `01_BACKEND_SETUP.md`)
4. **VS Code** hoac editor khac

## BUOC 1: CHUAN BI PROJECT

```bash
# Di chuyen den thu muc frontend
cd english-center-management/frontend

# Kiem tra Node.js version
node --version

# Kiem tra npm version
npm --version
```

## BUOC 2: CAI DAT DEPENDENCIES

```bash
# Cai tat ca dependencies
npm install

# Neu gap loi, thu xoa node_modules va cai lai
rm -rf node_modules package-lock.json
npm install
```

## BUOC 3: CAU HINH API URL

### Tao file .env trong thu muc frontend:
```bash
# Tao file .env
touch .env
```

### Noi dung file .env:
```env
# Backend API URL
REACT_APP_API_URL=http://localhost:5000/api

# File upload URL
REACT_APP_UPLOAD_URL=http://localhost:5000/api/upload/avatar

# Environment (Development/Production)
REACT_APP_ENV=development
```

### Neu backend chay tren port khac:
```env
# Neu backend chay tren port 5001
REACT_APP_API_URL=http://localhost:5001/api
REACT_APP_UPLOAD_URL=http://localhost:5001/api/upload/avatar
```

## BUOC 4: KIEM TRA CAU TRUC PROJECT

Cau trúc thu muc frontend phai co:
```
frontend/
  public/
    index.html
  src/
    components/
      Dashboard.js
      Students.js
      Teachers.js
      Classes.js
      Payments.js
      Layout.js
    services/
      api.js
    App.js
    index.js
  package.json
  .env
```

## BUOC 5: CHAY FRONTEND

### Cach 1: Dung command line
```bash
npm start
```

### Cach 2: Dung VS Code
- Mo thu muc frontend trong VS Code
- Mo terminal trong VS Code
- Chay `npm start`

## BUOC 6: KIEM TRA FRONTEND

Sau khi chay thanh cong:
1. Browser se tu dong mo tai: `http://localhost:3000`
2. Kiem tra console log trong browser (F12)
3. Kiem tra network tab de xem API calls

## TROUBLESHOOTING

### 1. Loi "Module not found"
```bash
# Xoa node_modules va cai lai
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

### 2. Loi "Cannot connect to backend API"
- Kiem tra backend dang chay (port 5000/5001)
- Kiem tra file .env co dung URL khong
- Kiem tra CORS configuration trong backend

### 3. Loi "Port 3000 is already in use"
```bash
# Tim process dang dung port 3000
netstat -ano | findstr :3000

# Kill process (thay <PID> bang process ID)
taskkill /PID <PID> /F

# Hoac chay frontend tren port khac
PORT=3001 npm start
```

### 4. Loi "Failed to compile"
- Kiem tra syntax trong file .js/.jsx
- Kiem tra import statements
- Xem error message chi tiet trong console

### 5. Loi "CORS policy"
Kiem tra backend co cho phep CORS tu `http://localhost:3000`:
```csharp
// Trong Program.cs cua backend
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});
```

## CAU HINH ADVANCED

### 1. Environment Variables cho Production
Tao file `.env.production`:
```env
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_UPLOAD_URL=https://your-domain.com/api/upload/avatar
REACT_APP_ENV=production
```

### 2. Proxy Configuration
Trong file `package.json`, them proxy:
```json
{
  "proxy": "http://localhost:5000"
}
```

### 3. Custom Scripts
Trong `package.json`, them scripts:
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "build:prod": "REACT_APP_ENV=production npm run build"
  }
}
```

## TESTING FRONTEND

### 1. Manual Testing
- Truy cap `http://localhost:3000`
- Kiem tra cac trang: Dashboard, Students, Teachers, Classes
- Test CRUD operations

### 2. API Testing
Mo browser DevTools (F12) -> Network tab:
- Kiem tra API calls co thanh cong khong
- Kiem tra response data
- Kiem tra error messages

### 3. Console Testing
```javascript
// Trong browser console
// Test API call
fetch('http://localhost:5000/api/students')
  .then(response => response.json())
  .then(data => console.log(data));
```

## BUILD FOR PRODUCTION

### 1. Build Project
```bash
npm run build
```

### 2. Kiem tra Build Output
Thu muc `build/` se chua file production:
- `index.html`
- `static/` folder voi CSS, JS files

### 3. Test Build Local
```bash
# Install serve
npm install -g serve

# Serve build folder
serve -s build -l 3000
```

## DEPLOYMENT OPTIONS

### 1. Static Hosting (Netlify, Vercel)
```bash
# Build va deploy
npm run build
# Upload build folder len hosting
```

### 2. Server Deployment
```bash
# Build
npm run build

# Su dung nginx/Apache de serve static files
```

### 3. Docker Deployment
```dockerfile
# Dockerfile cho frontend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
FROM nginx:alpine
COPY --from=0 /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## PERFORMANCE OPTIMIZATION

### 1. Code Splitting
Da duoc cau hinh san trong React.

### 2. Lazy Loading
```javascript
// Trong App.js
const Dashboard = React.lazy(() => import('./components/Dashboard'));
const Students = React.lazy(() => import('./components/Students'));
```

### 3. Bundle Analysis
```bash
npm install --save-dev webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js
```

## NEXT STEPS

Sau khi frontend chay thanh cong:
1. Test ket noi voi backend
2. Cau hinh environment variables (xem file `05_ENVIRONMENT_CONFIG.md`)
3. Test full application flow
4. Prepare cho production deployment

## SUPPORT

Neu gap van de:
1. Kiem tra browser console log
2. Kiem tra network tab trong DevTools
3. Kiem tra backend API status
4. Xem file `package.json` de verify dependencies
