---
description: Repository Information Overview
alwaysApply: true
---

# English Center Management System Information

## Repository Summary
This repository contains a comprehensive management system for an English training center. It consists of an ASP.NET Core Web API backend and a React frontend, facilitating the management of students, teachers, courses, classes, enrollments, and payments.

## Repository Structure
- **backend/**: Contains the server-side logic, API controllers, and database context.
- **frontend/**: Contains the client-side React application with Material-UI.

### Main Repository Components
- **Backend (EnglishCenter.API)**: Built with .NET 8, utilizing Entity Framework Core for SQL Server data persistence and JWT for authentication.
- **Frontend**: A React 18 single-page application using Material-UI for UI components and Axios for API communication.

## Projects

### Backend (EnglishCenter.API)
**Configuration File**: [./backend/EnglishCenter.API/EnglishCenter.API.csproj](./backend/EnglishCenter.API/EnglishCenter.API.csproj)

#### Language & Runtime
**Language**: C#  
**Version**: .NET 8.0  
**Build System**: MSBuild / .NET CLI  
**Package Manager**: NuGet

#### Dependencies
**Main Dependencies**:
- **Microsoft.EntityFrameworkCore (8.0.0)**: ORM for database access.
- **Microsoft.EntityFrameworkCore.SqlServer (8.0.0)**: SQL Server provider.
- **Microsoft.AspNetCore.Authentication.JwtBearer (8.0.0)**: JWT authentication.
- **Microsoft.AspNetCore.Identity.EntityFrameworkCore (8.0.0)**: Identity management.
- **AutoMapper (12.0.1)**: Object mapping.
- **FluentValidation (11.3.0)**: Validation logic.
- **Swashbuckle.AspNetCore (6.5.0)**: Swagger/OpenAPI support.

#### Build & Installation
```bash
cd backend/EnglishCenter.API
dotnet restore
dotnet build
dotnet ef database update
dotnet run
```

#### Main Files & Resources
- **Program.cs**: [./backend/EnglishCenter.API/Program.cs](./backend/EnglishCenter.API/Program.cs) - Entry point and DI container setup.
- **appsettings.json**: [./backend/EnglishCenter.API/appsettings.json](./backend/EnglishCenter.API/appsettings.json) - Configuration and connection strings.
- **Controllers/**: [./backend/EnglishCenter.API/Controllers/](./backend/EnglishCenter.API/Controllers/) - API endpoint implementations.

### Frontend
**Configuration File**: [./frontend/package.json](./frontend/package.json)

#### Language & Runtime
**Language**: JavaScript  
**Version**: Node.js 18+  
**Build System**: npm / react-scripts  
**Package Manager**: npm

#### Dependencies
**Main Dependencies**:
- **react (18.2.0)**: UI library.
- **@mui/material (5.14.20)**: Material-UI components.
- **react-router-dom (6.20.1)**: Navigation.
- **axios (1.6.2)**: HTTP client.
- **@mui/x-data-grid (6.18.4)**: Data tables.

#### Build & Installation
```bash
cd frontend
npm install
npm start
```

#### Main Files & Resources
- **index.js**: [./frontend/src/index.js](./frontend/src/index.js) - Entry point.
- **App.js**: [./frontend/src/App.js](./frontend/src/App.js) - Root component and routing.
- **services/api.js**: [./frontend/src/services/api.js](./frontend/src/services/api.js) - API client configuration.

#### Testing
**Framework**: Jest (via react-scripts)  
**Run Command**:
```bash
npm test
```
