# Hệ Thống Quản Lý Trung Tâm Tiếng Anh

## Tổng Quan
Đây là hệ thống quản lý toàn diện cho trung tâm đào tạo tiếng Anh, bao gồm:
- **Backend**: ASP.NET Core 8 Web API
- **Frontend**: React with Material-UI
- **Database**: SQL Server với Entity Framework Core

## Tính Năng Chính

### 1. Quản Lý Học Viên
- Thêm, sửa, xóa (soft delete) học viên
- Tìm kiếm theo tên, email, số điện thoại
- Lọc theo trình độ
- Xem lịch sử đăng ký lớp
- Xem lịch sử thanh toán
- Xem điểm thi

### 2. Quản Lý Giáo Viên
- Thêm giáo viên mới
- Quản lý thông tin cá nhân, chuyên môn, bằng cấp
- Xem lịch dạy của giáo viên
- Quản lý lương theo giờ

### 3. Quản Lý Khóa Học
- Tạo các khóa học với nhiều level
- Định nghĩa thời lượng, số giờ, học phí
- Kích hoạt/vô hiệu hóa khóa học

### 4. Quản Lý Lớp Học
- Tạo lớp học từ khóa học
- Phân công giáo viên
- Quản lý sĩ số, phòng học
- Theo dõi trạng thái lớp (Active, Completed, Cancelled)

### 5. Quản Lý Đăng Ký
- Đăng ký học viên vào lớp
- Kiểm tra sĩ số tối đa
- Theo dõi trạng thái đăng ký

### 6. Quản Lý Thanh Toán
- Ghi nhận thanh toán học phí
- Nhiều phương thức thanh toán (Cash, Card, Transfer)
- Lịch sử thanh toán của học viên
- Báo cáo doanh thu

### 7. Quản Lý Điểm Thi
- Nhập điểm cho 4 kỹ năng: Listening, Reading, Writing, Speaking
- Tự động tính điểm trung bình
- Theo dõi tiến độ học tập

### 8. Dashboard
- Tổng quan số liệu quan trọng
- Doanh thu tháng/tổng doanh thu
- Số lượng học viên, giáo viên, lớp học

## Cài Đặt

### Yêu Cầu Hệ Thống
- .NET 8 SDK
- SQL Server (LocalDB hoặc Express)
- Node.js 18+ và npm
- Visual Studio 2022 hoặc VS Code

### Backend Setup

1. Di chuyển đến thư mục backend:
```bash
cd backend/EnglishCenter.API
```

2. Cập nhật connection string trong `appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=EnglishCenterDB;Trusted_Connection=True;TrustServerCertificate=True;"
  }
}
```

3. Chạy migrations để tạo database:
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

4. Chạy API:
```bash
dotnet run
```

API sẽ chạy tại: `https://localhost:5001` hoặc `http://localhost:5000`

### Frontend Setup

1. Di chuyển đến thư mục frontend:
```bash
cd frontend
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Cập nhật API URL trong `src/services/api.js` nếu cần:
```javascript
const API_BASE_URL = 'http://localhost:5000/api';
```

4. Chạy ứng dụng:
```bash
npm start
```

Ứng dụng sẽ mở tại: `http://localhost:3000`

## Cấu Trúc Dự Án

### Backend Structure
```
EnglishCenter.API/
├── Controllers/          # API Controllers
├── Models/              # Entity Models
├── Data/                # DbContext và Migrations
├── DTOs/                # Data Transfer Objects
├── Program.cs           # Application startup
└── appsettings.json     # Configuration
```

### Frontend Structure
```
frontend/
├── public/              # Static files
└── src/
    ├── components/      # React Components
    │   ├── Dashboard.js
    │   ├── Students.js
    │   ├── Teachers.js
    │   ├── Classes.js
    │   ├── Payments.js
    │   └── Layout.js
    ├── services/        # API Services
    │   └── api.js
    ├── App.js           # Main App Component
    └── index.js         # Entry Point
```

## API Endpoints

### Students
- `GET /api/students` - Lấy danh sách học viên
- `GET /api/students/{id}` - Lấy thông tin chi tiết học viên
- `POST /api/students` - Tạo học viên mới
- `PUT /api/students/{id}` - Cập nhật học viên
- `DELETE /api/students/{id}` - Xóa học viên (soft delete)

### Teachers
- `GET /api/teachers` - Lấy danh sách giáo viên
- `GET /api/teachers/{id}` - Lấy thông tin chi tiết giáo viên
- `POST /api/teachers` - Tạo giáo viên mới

### Courses
- `GET /api/courses` - Lấy danh sách khóa học
- `GET /api/courses/{id}` - Lấy thông tin chi tiết khóa học
- `POST /api/courses` - Tạo khóa học mới

### Classes
- `GET /api/classes` - Lấy danh sách lớp học
- `GET /api/classes/{id}` - Lấy thông tin chi tiết lớp học
- `POST /api/classes` - Tạo lớp học mới

### Enrollments
- `GET /api/enrollments` - Lấy danh sách đăng ký
- `POST /api/enrollments` - Đăng ký học viên vào lớp
- `DELETE /api/enrollments/{id}` - Hủy đăng ký

### Payments
- `GET /api/payments` - Lấy danh sách thanh toán
- `POST /api/payments` - Tạo thanh toán mới

### Dashboard
- `GET /api/dashboard/stats` - Lấy thống kê tổng quan

## Công Nghệ Sử Dụng

### Backend
- ASP.NET Core 8
- Entity Framework Core 8
- SQL Server
- Swagger/OpenAPI

### Frontend
- React 18
- Material-UI (MUI) 5
- React Router 6
- Axios
- MUI Data Grid

## Tính Năng Nâng Cao Có Thể Mở Rộng

1. **Authentication & Authorization**
   - JWT Token authentication
   - Role-based access control (Admin, Teacher, Student)

2. **Quản Lý Lịch Học**
   - Tạo thời khóa biểu chi tiết
   - Xung đột lịch dạy/học
   - Điểm danh

3. **Báo Cáo & Thống Kê**
   - Báo cáo doanh thu theo tháng/quý/năm
   - Báo cáo học viên mới
   - Báo cáo hiệu suất giáo viên

4. **Thông Báo**
   - Email notifications
   - SMS notifications
   - In-app notifications

5. **Tài Liệu Học Tập**
   - Upload/download tài liệu
   - Bài tập trực tuyến
   - Video bài giảng

## Hỗ Trợ

Nếu có vấn đề hoặc câu hỏi, vui lòng tạo issue trên repository.

## License

MIT License
