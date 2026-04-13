# Hướng dẫn Triển khai (Deployment Guide)

Tài liệu này hướng dẫn cách triển khai hệ thống quản lý trung tâm tiếng anh lên Cloud.

## 1. Cấu hình file .env
Hệ thống sử dụng các file `.env` để quản lý cấu hình:
- `.env` tại thư mục gốc: Dùng cho Docker Compose.
- `english-center-management/backend/EnglishCenter.API/.env`: Dùng cho Backend.
- `english-center-management/frontend/.env`: Dùng cho Frontend.

Hãy cập nhật các thông số cần thiết như `DB_PASSWORD`, `JWT_TOKEN`, và `REACT_APP_API_URL` trước khi triển khai.

## 2. Triển khai Database lên Cloud
Có 2 cách chính để triển khai database:

### Cách 1: Sử dụng Docker Compose (Khuyên dùng)
Docker Compose sẽ tự động thiết lập SQL Server và các biến môi trường cần thiết.
```bash
docker-compose up -d
```

### Cách 2: Sử dụng Azure SQL Database hoặc AWS RDS
1. Tạo một instance SQL Server trên Azure/AWS.
2. Lấy chuỗi kết nối (Connection String).
3. Cập nhật `CONNECTION_STRING` trong file `.env` của Backend hoặc cấu hình trực tiếp trên môi trường Cloud.

## 3. Triển khai Backend (API)
Backend đã được cấu hình để đọc biến môi trường từ `appsettings.Production.json`. 
Khi triển khai lên các nền tảng như Azure App Service hay Render, hãy thiết lập các biến môi trường tương ứng:
- `ConnectionStrings__DefaultConnection`
- `AppSettings__Token`

## 4. Triển khai Frontend (React)
Frontend sẽ được build thành các file tĩnh. Hãy đảm bảo biến `REACT_APP_API_URL` được trỏ đúng về địa chỉ IP hoặc tên miền của Backend API.

## 5. Các bước triển khai nhanh với Docker
Nếu server của bạn đã cài đặt Docker và Docker Compose:
1. Copy toàn bộ mã nguồn lên server.
2. Chỉnh sửa file `.env` với các thông số thực tế.
3. Chạy lệnh: `docker-compose up -d --build`

Hệ thống sẽ tự động khởi tạo Database, Backend và Frontend.
