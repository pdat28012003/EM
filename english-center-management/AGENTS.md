---
description: Repository Information Overview
alwaysApply: true
---

# English Center Management System Information

## Repository Summary
This repository contains a comprehensive management system for an English training center. It consists of a .NET Web API backend and a React frontend, allowing for the management of students, teachers, courses, classes, enrollments, payments, and test scores.

## Repository Structure
The project is organized into two main directories:
- **backend/**: Contains the ASP.NET Core Web API and database migration logic.
- **frontend/**: Contains the React application with Material-UI components.

### Main Repository Components
- **Backend (EnglishCenter.API)**: A RESTful API built with ASP.NET Core 8, utilizing Entity Framework Core for data persistence in SQL Server.
- **Frontend**: A single-page application built with React 18 and Material-UI 5 for the user interface.

## Projects

### Backend (EnglishCenter.API)
**Configuration File**: [./english-center-management/backend/EnglishCenter.API/EnglishCenter.API.csproj](./english-center-management/backend/EnglishCenter.API/EnglishCenter.API.csproj)

#### Language & Runtime
**Language**: C#  
**Version**: .NET 8.0  
**Build System**: MSBuild / .NET CLI  
**Package Manager**: NuGet

#### Dependencies
**Main Dependencies**:
- **Microsoft.EntityFrameworkCore (8.0.0)**: ORM for database access.
- **Microsoft.EntityFrameworkCore.SqlServer (8.0.0)**: SQL Server provider for EF Core.
- **Microsoft.AspNetCore.Authentication.JwtBearer (8.0.0)**: JWT authentication support.
- **Swashbuckle.AspNetCore (6.5.0)**: Swagger/OpenAPI documentation.
- **AutoMapper (12.0.1)**: Object-to-object mapping.
- **FluentValidation (11.3.0)**: Rule-based validation.

#### Build & Installation
```bash
cd english-center-management/backend/EnglishCenter.API
dotnet restore
dotnet build
dotnet ef database update
dotnet run
```

#### Main Files & Resources
- **Program.cs**: [./english-center-management/backend/EnglishCenter.API/Program.cs](./english-center-management/backend/EnglishCenter.API/Program.cs) - Application entry point and service configuration.
- **appsettings.json**: [./english-center-management/backend/EnglishCenter.API/appsettings.json](./english-center-management/backend/EnglishCenter.API/appsettings.json) - Database connection strings and logging configuration.
- **ApplicationDbContext.cs**: [./english-center-management/backend/EnglishCenter.API/Data/ApplicationDbContext.cs](./english-center-management/backend/EnglishCenter.API/Data/ApplicationDbContext.cs) - Entity Framework database context.

### Frontend
**Configuration File**: [./english-center-management/frontend/package.json](./english-center-management/frontend/package.json)

#### Language & Runtime
**Language**: JavaScript  
**Version**: Node.js 18+  
**Build System**: npm / react-scripts  
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- **react (18.2.0)**: UI library.
- **@mui/material (5.14.20)**: Material-UI component library.
- **react-router-dom (6.20.1)**: Routing library.
- **axios (1.6.2)**: HTTP client for API requests.
- **@mui/x-data-grid (6.18.4)**: Data grid component for tables.

#### Build & Installation
```bash
cd english-center-management/frontend
npm install
npm start
```

#### Main Files & Resources
- **index.js**: [./english-center-management/frontend/src/index.js](./english-center-management/frontend/src/index.js) - Entry point for the React application.
- **App.js**: [./english-center-management/frontend/src/App.js](./english-center-management/frontend/src/App.js) - Main application component and routing.
- **api.js**: [./english-center-management/frontend/src/services/api.js](./english-center-management/frontend/src/services/api.js) - Axios instance and API service definitions.

#### Testing
**Framework**: Jest (via react-scripts)  
**Run Command**:
```bash
npm test
```
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
- Nhiều phương thức