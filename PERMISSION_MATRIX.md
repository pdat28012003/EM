# Ma Trận Phân Quyền (Permission Matrix) - English Center Management

**Phiên bản:** 2.0  
**Ngày cập nhật:** April 15, 2026  
**Trạng thái:** Revision Draft

---

## Mục Lục

1. [Tổng Quan Roles](#tổng-quan-roles)
2. [Ma Trận Quyền Chi Tiết](#ma-trận-quyền-chi-tiết)
3. [Quyền Theo Module](#quyền-theo-module)
4. [Quy Tắc Truy Cập Dữ Liệu](#quy-tắc-truy-cập-dữ-liệu)
5. [Chiến Lược Phân Quyền Frontend](#chiến-lược-phân-quyền-frontend)
6. [Chiến Lược Phân Quyền Backend](#chiến-lược-phân-quyền-backend)
7. [Các Trường Hợp Đặc Biệt](#các-trường-hợp-đặc-biệt)

---

## Tổng Quan Roles

### 1. Admin (Quản Trị Viên)
- **Mô tả:** Người quản lý toàn hệ thống
- **Trách nhiệm chính:**
  - Quản lý tất cả người dùng (tạo, chỉnh sửa, khóa, phân quyền)
  - Quản lý khóa học, lớp học, chương trình học
  - Quản lý thanh toán, báo cáo tài chính
  - Xem nhật ký hoạt động toàn hệ thống
- **Quyền Truy Cập:** Toàn bộ hệ thống

### 2. Teacher (Giáo Viên)
- **Mô tả:** Người dạy, chịu trách nhiệm lớp học và điểm số
- **Trách nhiệm chính:**
  - Quản lý lớp học được gán
  - Tạo và chấm điểm bài tập
  - Chấm công đăng ký
  - Tạo tài liệu, bài giảng cho lớp
  - Xem lịch dạy của mình
- **Quyền Truy Cập:** Dữ liệu của các lớp mình phụ trách

### 3. Student (Học Viên)
- **Mô tả:** Người học
- **Trách nhiệm chính:**
  - Nộp bài tập
  - Xem điểm, lịch học
  - Nộp thanh toán
  - Xem tài liệu, thông báo
- **Quyền Truy Cập:** Chỉ dữ liệu cá nhân của mình

---

## Ma Trận Quyền Chi Tiết

### Chú Thích:
- ✅ **Full** = Có quyền đầy đủ (Create, Read, Update, Delete)
- ✅ **R/U** = Chỉ Read & Update
- ✅ **R** = Chỉ Read
- ✅ **R (Own)** = Chỉ Read dữ liệu của chính mình
- ✅ **R/U (Own)** = Chỉ Read & Update dữ liệu của chính mình
- ✅ **Create** = Chỉ Create (thường dùng cho enrollment)
- ❌ = Không có quyền

### 1. Module: Xác Thực (Authentication)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| POST /auth/register | ❌ | ✅ (Self) | ✅ (Self) |
| POST /auth/login | ✅ | ✅ | ✅ |
| POST /auth/logout | ✅ | ✅ | ✅ |
| POST /auth/refresh-token | ✅ | ✅ | ✅ |
| GET /auth/me | ✅ | ✅ | ✅ |
| PUT /auth/update-profile | ✅ (All) | ✅ (Own) | ✅ (Own) |
| POST /auth/forgot-password | ✅ | ✅ | ✅ |
| POST /auth/reset-password | ✅ | ✅ | ✅ |
| POST /auth/change-password | ✅ | ✅ | ✅ |

### 2. Module: Quản Lý Người Dùng (User Management)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /users (Danh sách) | ✅ Full | ❌ | ❌ |
| GET /users/{id} | ✅ Full | ❌ | ✅ (Own) |
| POST /users (Tạo mới) | ✅ Full | ❌ | ❌ |
| PUT /users/{id} (Chỉnh sửa) | ✅ Full | ❌ | ✅ (Own) |
| DELETE /users/{id} (Xóa) | ✅ Full | ❌ | ❌ |
| PATCH /users/{id}/role (Phân quyền) | ✅ Full | ❌ | ❌ |
| PATCH /users/{id}/status (Kích hoạt/Khóa) | ✅ Full | ❌ | ❌ |

### 3. Module: Quản Lý Học Viên (Students)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /students (Danh sách) | ✅ Full | ✅ (Own lớp) | ❌ |
| GET /students/{id} | ✅ Full | ✅ (Own lớp) | ✅ (Own) |
| POST /students (Tạo mới) | ✅ Full | ❌ | ❌ |
| PUT /students/{id} (Chỉnh sửa) | ✅ Full | ❌ | ✅ (Own) |
| DELETE /students/{id} (Xóa mềm) | ✅ Full | ❌ | ❌ |
| GET /students/{id}/enrollments | ✅ Full | ✅ (Own lớp) | ✅ (Own) |
| GET /students/{id}/schedule | ✅ Full | ✅ (Own dạy) | ✅ (Own) |
| GET /students/{id}/payments | ✅ Full | ❌ | ✅ (Own) |
| GET /students/{id}/testscores | ✅ Full | ✅ (Own lớp) | ✅ (Own) |
| GET /students/{id}/classes | ✅ Full | ✅ (Own dạy) | ✅ (Own) |
| GET /students/{id}/grades | ✅ Full | ✅ (Own lớp) | ✅ (Own) |

### 4. Module: Quản Lý Giáo Viên (Teachers)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /teacher (Danh sách) | ✅ Full | ✅ R | ❌ |
| GET /teacher/{id} | ✅ Full | ✅ (Own) | ❌ |
| POST /teacher (Tạo mới) | ✅ Full | ❌ | ❌ |
| PUT /teacher/{id} (Chỉnh sửa) | ✅ Full | ✅ (Own) | ❌ |
| DELETE /teacher/{id} (Xóa mềm) | ✅ Full | ❌ | ❌ |
| GET /teacher/{id}/schedule | ✅ Full | ✅ (Own) | ❌ |
| GET /teacher/{id}/classes | ✅ Full | ✅ (Own) | ❌ |
| GET /teacher/{id}/assignments | ✅ Full | ✅ (Own) | ❌ |

### 5. Module: Quản Lý Khóa Học (Courses)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /courses (Danh sách) | ✅ Full | ✅ R | ✅ R |
| GET /courses/{id} | ✅ Full | ✅ R | ✅ R |
| POST /courses (Tạo mới) | ✅ Full | ❌ | ❌ |
| PUT /courses/{id} (Chỉnh sửa) | ✅ Full | ❌ | ❌ |
| DELETE /courses/{id} (Xóa) | ✅ Full | ❌ | ❌ |
| PATCH /courses/{id}/status (Kích hoạt) | ✅ Full | ❌ | ❌ |

### 6. Module: Quản Lý Lớp Học (Classes)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /classes (Danh sách) | ✅ Full | ✅ (Own) | ✅ (Own) |
| GET /classes/{id} | ✅ Full | ✅ (Own) | ✅ (Own) |
| POST /classes (Tạo mới) | ✅ Full | ❌ | ❌ |
| PUT /classes/{id} (Chỉnh sửa) | ✅ Full | ❌ | ❌ |
| DELETE /classes/{id} (Xóa) | ✅ Full | ❌ | ❌ |
| GET /classes/{id}/students | ✅ Full | ✅ (Own) | ✅ (Own) |
| PATCH /classes/{id}/status | ✅ Full | ❌ | ❌ |

### 7. Module: Quản Lý Chương Trình Học (Curriculum)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /curriculum | ✅ Full | ✅ (Own) | ✅ (Own) |
| GET /curriculum/{id} | ✅ Full | ✅ (Own) | ✅ (Own) |
| POST /curriculum (Tạo mới) | ✅ Full | ❌ | ❌ |
| PUT /curriculum/{id} (Chỉnh sửa) | ✅ Full | ❌ | ❌ |
| DELETE /curriculum/{id} (Xóa) | ✅ Full | ❌ | ❌ |
| GET /curriculum/{id}/days | ✅ Full | ✅ (Own) | ✅ (Own) |
| POST /curriculum/day | ✅ Full | ❌ | ❌ |
| GET /curriculum/{id}/sessions | ✅ Full | ✅ (Own) | ✅ (Own) |
| POST /curriculum/session | ✅ Full | ❌ | ❌ |
| PUT /curriculum/session/{id} | ✅ Full | ❌ | ❌ |

### 8. Module: Đăng Ký Lớp (Enrollments)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /enrollments (Danh sách) | ✅ Full | ✅ (Own lớp) | ❌ |
| GET /enrollments/{id} | ✅ Full | ✅ (Own lớp) | ✅ (Own) |
| POST /enrollments (Tạo) | ✅ Full | ❌ | ✅ (Self) |
| PUT /enrollments/{id} (Chỉnh sửa) | ✅ Full | ❌ | ❌ |
| DELETE /enrollments/{id} (Xóa) | ✅ Full | ❌ | ❌ |
| PATCH /enrollments/{id}/status | ✅ Full | ✅ (Own lớp) | ❌ |

### 9. Module: Bài Tập & Điểm (Assignments & Grades)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /assignment (Danh sách) | ✅ Full | ✅ (Own lớp) | ✅ (Own) |
| GET /assignment/{id} | ✅ Full | ✅ (Own lớp) | ✅ (Own) |
| POST /assignment (Tạo) | ✅ Full | ✅ (Own lớp) | ❌ |
| PUT /assignment/{id} (Chỉnh sửa) | ✅ Full | ✅ (Own & chưa nộp) | ❌ |
| DELETE /assignment/{id} (Xóa) | ✅ Full | ✅ (Own & chưa nộp) | ❌ |
| GET /assignment/{id}/questions | ✅ Full | ✅ (Own) | ✅ (Own) |
| POST /assignment/{id}/questions | ✅ Full | ✅ (Own) | ❌ |
| POST /assignment/{id}/submit | ✅ Full | ❌ | ✅ (Own) |
| GET /assignment/{id}/submissions | ✅ Full | ✅ (Own lớp) | ✅ (Own) |
| PUT /assignment/{id}/submissions/{subId}/grade | ✅ Full | ✅ (Own lớp) | ❌ |
| DELETE /assignment/{id}/submissions/{subId} | ✅ Full | ✅ (Own lớp) | ❌ |
| POST /assignment/{id}/submit-quiz | ✅ Full | ❌ | ✅ (Own) |
| GET /grades (Danh sách) | ✅ Full | ✅ (Own lớp) | ✅ (Own) |
| GET /grades/{id} | ✅ Full | ✅ (Own lớp) | ✅ (Own) |

### 10. Module: Chấm Công (Attendance)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /attendance (Danh sách) | ✅ Full | ✅ (Own lớp) | ✅ (Own) |
| GET /attendance/{id} | ✅ Full | ✅ (Own lớp) | ✅ (Own) |
| POST /attendance (Tạo) | ✅ Full | ✅ (Own lớp) | ❌ |
| PUT /attendance/{id} (Chỉnh sửa) | ✅ Full | ✅ (Own lớp) | ❌ |
| POST /session-attendance (Chấm công buổi) | ✅ Full | ✅ (Own lớp) | ❌ |
| GET /session-attendance | ✅ Full | ✅ (Own lớp) | ✅ (Own) |

### 11. Module: Thanh Toán (Payments)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /payment (Danh sách) | ✅ Full | ❌ | ✅ (Own) |
| GET /payment/{id} | ✅ Full | ❌ | ✅ (Own) |
| POST /payment (Tạo) | ✅ Full | ❌ | ✅ (Own) |
| PUT /payment/{id} (Chỉnh sửa) | ✅ Full | ❌ | ❌ |
| DELETE /payment/{id} (Xóa) | ✅ Full | ❌ | ❌ |
| PATCH /payment/{id}/status | ✅ Full | ❌ | ❌ |
| GET /payment/report (Báo cáo) | ✅ Full | ❌ | ❌ |

### 12. Module: Tài Liệu (Documents)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /documents (Danh sách) | ✅ Full | ✅ (Own dạy) | ✅ (Own đăng ký) |
| GET /documents/{id} | ✅ Full | ✅ (Own) | ✅ (Own) |
| POST /documents (Tạo) | ✅ Full | ✅ (Own lớp) | ❌ |
| PUT /documents/{id} (Chỉnh sửa) | ✅ Full | ✅ (Own) | ❌ |
| DELETE /documents/{id} (Xóa) | ✅ Full | ✅ (Own) | ❌ |
| POST /documents/upload | ✅ Full | ✅ (Own lớp) | ❌ |

### 13. Module: Thông Báo (Notifications)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /notification | ✅ Full | ✅ (Own) | ✅ (Own) |
| GET /notification/{id} | ✅ Full | ✅ (Own) | ✅ (Own) |
| POST /notification (Tạo) | ✅ Full | ✅ (Own lớp) | ❌ |
| PUT /notification/{id} (Chỉnh sửa) | ✅ Full | ✅ (Own) | ❌ |
| DELETE /notification/{id} (Xóa) | ✅ Full | ✅ (Own) | ❌ |
| PATCH /notification/{id}/read | ✅ Full | ✅ (Own) | ✅ (Own) |

### 14. Module: Nhật Ký Hoạt Động (Activity Logs)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /activity-logs (Danh sách) | ✅ Full | ✅ (Own) | ✅ (Own) |
| GET /activity-logs/{id} | ✅ Full | ✅ (Own) | ✅ (Own) |
| DELETE /activity-logs (Xóa) | ✅ Full | ❌ | ❌ |

### 15. Module: Dashboard & Reports

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /dashboard (Tổng quan) | ✅ Full | ✅ (Own) | ✅ (Own) |
| GET /dashboard/revenue | ✅ Full | ❌ | ❌ |
| GET /dashboard/students | ✅ Full | ✅ (Own lớp) | ❌ |
| GET /dashboard/classes | ✅ Full | ✅ (Own) | ❌ |
| POST /upload (Tải file) | ✅ Full | ✅ (Own) | ❌ |
| GET /rooms (Danh sách phòng) | ✅ Full | ✅ R | ✅ R |
| GET /skills (Danh sách kỹ năng) | ✅ Full | ✅ R | ✅ R |
| GET /test-scores | ✅ Full | ✅ (Own lớp) | ✅ (Own) |

### 16. Module: Phòng Học (Rooms)

| Tính Năng | Admin | Teacher | Student |
|-----------|-------|---------|---------|
| GET /room (Danh sách) | ✅ Full | ✅ R | ✅ R |
| GET /room/{id} | ✅ Full | ✅ R | ✅ R |
| POST /room (Tạo) | ✅ Full | ❌ | ❌ |
| PUT /room/{id} (Chỉnh sửa) | ✅ Full | ❌ | ❌ |
| DELETE /room/{id} (Xóa) | ✅ Full | ❌ | ❌ |

---

## Quyền Theo Module

### Quy Tắc Chung

#### Admin (Quản Trị Viên)
```
Quyền: TOÀN BỘ (Full Access)
- Truy cập tất cả API endpoints
- CRUD toàn bộ dữ liệu
- Biến đổi dữ liệu: lịch sử, hoàn tác
- Quản lý người dùng & phân quyền
- Xem tất cả báo cáo & statistics
- Xuất dữ liệu
```

#### Teacher (Giáo Viên)
```
Quyền CƠ BẢN:
- Xem/Cập nhật thông tin cá nhân
- Xem lịch dạy của mình
- Quản lý lớp được gán:
  - Xem danh sách học viên
  - Tạo & chấm điểm bài tập
  - Chấm công & điểm tính
  - Tạo & quản lý tài liệu lớp
  - Gửi thông báo
- Xem hoạt động của họ

Hạn Chế:
- KHÔNG thể xem dữ liệu lớp khác
- KHÔNG thể xóa học viên hay lớp
- KHÔNG thể quản lý thanh toán
- KHÔNG thể tạo khóa học hay lớp mới
```

#### Student (Học Viên)
```
Quyền CƠ BẢN:
- Xem/Cập nhật thông tin cá nhân
- Xem lịch học của mình
- Xem lớp được đăng ký
- Nộp bài tập
- Xem lịch trình của mình
- Xem điểm thi
- Xem tài liệu lớp
- Xem thông báo

Hạn Chế:
- KHÔNG thể xem dữ liệu học viên khác
- KHÔNG thể chỉnh sửa bài tập đã nộp
- KHÔNG thể xem thông tin thanh toán (ngoài của mình)
- KHÔNG thể xem điểm thi của người khác
```

---

## Quy Tắc Truy Cập Dữ Liệu

### 1. **Dữ Liệu Cá Nhân (Personal Data)**

#### Admin
- Truy cập toàn bộ dữ liệu cá nhân của tất cả người dùng

#### Teacher
- Truy cập thông tin cá nhân của chính mình
- Truy cập thông tin học viên trong lớp dạy
- Truy cập thông tin giáo viên khác (chỉ đọc)

#### Student
- Truy cập chỉ thông tin cá nhân của chính mình
- KHÔNG thể xem thông tin học viên khác

### 2. **Dữ Liệu Lớp Học (Class Data)**

#### Admin
- Xem tất cả lớp học

#### Teacher
- Xem chỉ lớp được gán dạy
- Có thể chỉnh sửa dữ liệu lớp (tuy nhiên quyền hạn hẹp)

#### Student
- Xem chỉ lớp đã đăng ký
- KHÔNG thể chỉnh sửa

### 3. **Bài Tập & Điểm (Assignments & Grades)**

#### Admin
- Xem tất cả bài tập & điểm

#### Teacher
- Xem bài tập & điểm của học viên trong lớp dạy
- Tạo, chỉnh sửa bài tập
- Chấm điểm & nhận xét

#### Student
- Xem bài tập của lớp đăng ký
- Xem điểm cá nhân
- Nộp bài & nộp quiz
- KHÔNG thể xem điểm học viên khác

### 4. **Thanh Toán (Payment Data)**

#### Admin
- Xem/Quản lý tất cả thanh toán
- Chỉnh sửa & xóa thanh toán (audit trail)

#### Teacher
- Không có quyền

#### Student
- Xem lịch sử thanh toán cá nhân
- Tạo thanh toán mới
- KHÔNG thể chỉnh sửa/xóa

### 5. **Tài Liệu (Documents)**

#### Admin
- Quản lý tất cả tài liệu

#### Teacher
- Tạo & quản lý tài liệu của lớp dạy
- Xóa tài liệu riêng

#### Student
- Xem tài liệu lớp đã đăng ký
- KHÔNG thể tải lên hay xóa

---

## Chiến Lược Phân Quyền Frontend

### 1. **Route Protection**

```javascript
// AuthGuard.js - Bảo vệ các route theo role

Private Routes (yêu cầu authentication):
├── /dashboard
│   ├── Admin Dashboard (useRole('Admin'))
│   ├── Teacher Dashboard (useRole('Teacher'))
│   └── Student Dashboard (useRole('Student'))
├── /students
│   ├── List Students (Admin, Teacher)
│   ├── View Student (Admin, Teacher - own class, Student - own)
│   ├── Edit Student (Admin, Student - own)
├── /teachers
│   ├── List Teachers (Admin)
│   ├── View Teacher (Admin, Teacher - own)
├── /classes
│   ├── List Classes (Admin, Teacher - own, Student - own)
│   ├── View Class (Admin, Teacher - own, Student - own)
├── /assignments
│   ├── List Assignments (Admin, Teacher - own, Student - own)
│   ├── Submit Assignment (Student)
│   ├── Grade Assignment (Admin, Teacher - own)
├── /payments
│   ├── List Payments (Admin, Student - own)
│   ├── Create Payment (Student)
└── /profile
    ├── My Profile (All authenticated)
    └── Edit Profile (Self, Admin)
```

### 2. **Component-Level Visibility**

```javascript
// Ẩn/Hiển thị components dựa trên role

<AdminOnly>  {/* Student, Teacher không thấy */}
  <ManageUsers />
  <RevenueReport />
</AdminOnly>

<TeacherOnly>  {/* Admin, Student không thấy */}
  <MyClasses />
  <GradeAssignments />
</TeacherOnly>

<StudentOnly>  {/* Teacher, Admin không thấy */}
  <SubmitAssignment />
  <MySchedule />
</StudentOnly>

<RoleBasedComponent roles={['Admin', 'Teacher']}>
  <ViewStudents />
</RoleBasedComponent>
```

### 3. **UI Elements Conditional Rendering**

```javascript
// Nút hành động được hiển thị có điều kiện

{canDeleteUser && <DeleteButton />}
{canGradeAssignment && <GradeButton />}
{canSubmitAssignment && <SubmitButton />}
{isOwner && <EditButton />}
```

### 4. **Form Validation Frontend**

```javascript
// Validation dựa role trước khi gửi API

Input validation:
- Admin: toàn bộ fields
- Teacher: hạn chế fields (không thể chỉnh sửa tên, email)
- Student: chỉ profile, status mà họ có thể sửa
```

---

## Chiến Lược Phân Quyền Backend

### 1. **Authorization Middleware**

```csharp
// Authorize attribute với role checking

[Authorize(Roles = "Admin")]
public IActionResult GetAllUsers() { }

[Authorize(Roles = "Admin,Teacher")]
public IActionResult GetStudents() { }

[Authorize]  // Tất cả authenticated users
public IActionResult GetMyProfile() { }
```

### 2. **Policy-Based Authorization**

```csharp
// Chính sách phân quyền chi tiết

// Policy: "CanViewStudent" - Chỉ xem học viên trong lớp của mình
builder.Services.AddAuthorizationCore(options =>
{
    options.AddPolicy("CanViewStudent", policy =>
        policy.Requirements.Add(new ViewStudentRequirement()));
    
    options.AddPolicy("CanGradeAssignment", policy =>
        policy.Requirements.Add(new GradeAssignmentRequirement()));
    
    options.AddPolicy("CanSubmitAssignment", policy =>
        policy.Requirements.Add(new SubmitAssignmentRequirement()));
});

[Authorize(Policy = "CanViewStudent")]
public IActionResult GetStudent(int studentId) { }
```

### 3. **Data Filtering**

```csharp
// Lọc dữ liệu ở Database level

public IActionResult GetStudents()
{
    var user = User;
    var role = user.FindFirst(ClaimTypes.Role)?.Value;
    
    var query = _context.Students.AsQueryable();
    
    if (role == "Teacher")
    {
        var teacherId = int.Parse(user.FindFirst("TeacherId")?.Value);
        query = query.Where(s => s.Enrollments
            .Any(e => e.Curriculum.Classes
                .Any(c => c.TeacherId == teacherId)));
    }
    else if (role == "Student")
    {
        var studentId = int.Parse(user.FindFirst("StudentId")?.Value);
        query = query.Where(s => s.StudentId == studentId);
    }
    
    return Ok(query.ToList());
}
```

### 4. **Audit Logging**

```csharp
// Ghi lại tất cả hành động

public class AuditMiddleware
{
    public async Task InvokeAsync(HttpContext context)
    {
        var user = context.User.FindFirst("UserId")?.Value;
        var method = context.Request.Method;
        var path = context.Request.Path;
        
        await next(context);
        
        _auditService.LogAction(
            userId: user,
            action: $"{method} {path}",
            timestamp: DateTime.UtcNow,
            statusCode: context.Response.StatusCode
        );
    }
}
```

---

## Các Trường Hợp Đặc Biệt

### 1. **Teacher Chấm Điểm**

**Điều Kiện:**
- Teacher phải là giáo viên của lớp
- Bài tập phải thuộc lớp dạy
- Bài tập chưa được chấm hoặc đang chờ chỉnh sửa

**API:**
```
PUT /assignment/{assignmentId}/submissions/{submissionId}/grade
{
  "score": 85,
  "feedback": "Good work!",
  "rubricScores": { "grammar": 18, "vocabulary": 17, ... }
}
```

**Authorization Logic:**
```csharp
var assignment = await _context.Assignments.FindAsync(assignmentId);
var submission = await _context.AssignmentSubmissions.FindAsync(submissionId);

// Verify: Teacher owns this assignment's class
var isTeacherOfClass = assignment.Class.TeacherId == currentTeacherId;

// Verify: Submission belongs to this assignment
var belongsToAssignment = submission.AssignmentId == assignmentId;

if (!isTeacherOfClass || !belongsToAssignment)
    return Unauthorized();
```

### 2. **Student Nộp Bài Tập**

**Điều Kiện:**
- Student phải đã đăng ký lớp
- Bài tập phải mở (trong hạn)
- Student chưa nộp hoặc đang tái nộp

**API:**
```
POST /assignment/{assignmentId}/submit
{
  "content": "...",
  "attachmentUrl": "..."
}
```

**Authorization Logic:**
```csharp
var enrollment = await _context.Enrollments
    .FirstOrDefaultAsync(e => 
        e.StudentId == currentStudentId && 
        e.Curriculum.Classes.Any(c => c.Assignments.Any(a => a.Id == assignmentId))
    );

if (enrollment == null)
    return Forbidden("Not enrolled in this class");

var assignment = await _context.Assignments.FindAsync(assignmentId);
if (assignment.DueDate < DateTime.UtcNow && !assignment.AllowLateSubmission)
    return BadRequest("Assignment deadline passed");
```

### 3. **Teacher Xem Điểm của Học Viên**

**Điều Kiện:**
- Teacher phải dạy lớp học của học viên
- Học viên phải đã nộp bài

**API:**
```
GET /assignments/{assignmentId}/submissions?classId={classId}
```

**Authorization Logic:**
```csharp
var assignment = await _context.Assignments
    .Include(a => a.Class)
    .FirstOrDefaultAsync(a => a.Id == assignmentId);

bool isTeacherOfClass = assignment.Class.TeacherId == currentTeacherId;
if (!isTeacherOfClass)
    return Unauthorized();
```

### 4. **Admin Xóa/Khôi Phục Dữ Liệu**

**Điều Kiện:**
- Chỉ Admin toàn quyền
- Tất cả hành động phải log để audit

**Soft Delete Pattern:**
```csharp
// Xóa mềm (update IsDeleted = true)
public async Task<IActionResult> DeleteStudent(int studentId)
{
    var student = await _context.Students.FindAsync(studentId);
    student.IsDeleted = true;
    student.DeletedAt = DateTime.UtcNow;
    student.DeletedBy = currentUserId;
    
    await _context.SaveChangesAsync();
    await _auditService.LogDeletion("Student", studentId, currentUserId);
    
    return Ok();
}

// Khôi phục
public async Task<IActionResult> RestoreStudent(int studentId)
{
    var student = await _context.Students.IgnoreQueryFilters()
        .FirstOrDefaultAsync(s => s.StudentId == studentId);
    
    student.IsDeleted = false;
    student.DeletedAt = null;
    
    await _context.SaveChangesAsync();
    await _auditService.LogRestoration("Student", studentId, currentUserId);
    
    return Ok();
}
```

### 5. **Enrollment Approval Logic**

**Điều Kiện (nếu có):**
- Student có thể tự đăng ký (Auto-approved)
- Hoặc Admin phải duyệt (Pending → Approved)
- Kiểm tra sĩ số lớp

**Flow:**
```
Student Request Enrollment
    ↓
Validate:
- Student exists
- Class exists & not full
- Student not already enrolled
    ↓
Create Enrollment (Status: "Active")
    ↓
Or if Admin approval needed:
Create Enrollment (Status: "Pending")
    ↓
Admin Review
    ↓
PATCH /enrollments/{id}/status
{
  "status": "Approved"
}
```

### 6. **Multi-Class Teacher**

**Trường Hợp:** Teacher dạy nhiều lớp

**Authorization:**
```csharp
// Teacher có thể xem tất cả học viên trong lớp dạy
var myClasses = await _context.Classes
    .Where(c => c.TeacherId == currentTeacherId)
    .ToListAsync();

var myClassIds = myClasses.Select(c => c.ClassId).ToList();

var students = await _context.Students
    .Where(s => s.Enrollments.Any(e => myClassIds.Contains(e.Class.ClassId)))
    .ToListAsync();
```

### 7. **Phân Quyền Nâng Cao (Future)**

**Có thể mở rộng với:**
- Teacher quản lý (được phân quyền từ Admin)
- Parent role (xem thông tin con)
- Receptionist (quản lý thanh toán)
- Finance (báo cáo tài chính)

---

## Tóm Tắt Quyền Theo Role

### Admin
- ✅ Tất cả quyền
- ✅ User management
- ✅ Tạo/Sửa/Xóa Courses, Classes, Curriculum
- ✅ Quản lý Payment
- ✅ Audit logs

### Teacher
- ✅ Xem/Sửa thông tin cá nhân
- ✅ Quản lý lớp được gán
- ✅ Tạo & chấm điểm bài tập
- ✅ Chấm công
- ✅ Tạo tài liệu & thông báo
- ❌ Không được xóa học viên/lớp
- ❌ Không được quản lý thanh toán

### Student
- ✅ Xem thông tin cá nhân
- ✅ Xem lịch học
- ✅ Nộp bài tập
- ✅ Xem điểm
- ✅ Xem tài liệu & thông báo
- ✅ Quản lý thanh toán cá nhân
- ❌ Không được xem dữ liệu người khác
- ❌ Không được chỉnh sửa lớp/bài tập

---

## Lưu Ý Bảo Mật

1. **Token Validation:** Kiểm tra token hợp lệ ở mỗi request
2. **Claim Validation:** Xác thực claim role & id trong token
3. **SQL Injection Protection:** Sử dụng parameterized queries
4. **Rate Limiting:** Giới hạn số request trên phút
5. **CORS:** Cấu hình CORS cho phép domain được phép
6. **HTTPS:** Bắt buộc HTTPS cho production
7. **Password:** Hash password với salt (HMACSHA512)
8. **Audit Logging:** Ghi lại tất cả hành động sensitive
9. **Data Validation:** Validate tất cả input ở backend
10. **Error Handling:** Không leak thông tin nhạy cảm trong error message

---

**Phiên bản:** 2.0  
**Trạng thái:** Ready for Implementation  
**Có hiệu lực từ:** April 15, 2026
