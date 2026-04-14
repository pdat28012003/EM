# Chức năng hệ thống & API tương ứng - English Center Management System

**Version:** 1.0  
**Date:** April 2026  
**Base URL:** `http://localhost:5000/api`

---

## 1. Xác thực & Tài khoản (Authentication)

**Mục tiêu:** Đăng ký/đăng nhập, OTP, refresh token, lấy & cập nhật hồ sơ người dùng.

**API (`/api/auth`):**

- **Đăng ký (gửi OTP)**
  - `POST /api/auth/register`
- **Xác thực đăng ký bằng OTP**
  - `POST /api/auth/verify-registration`
- **Gửi lại OTP**
  - `POST /api/auth/resend-otp?email={email}&type={type}`
- **Đăng nhập**
  - `POST /api/auth/login`
- **Refresh token**
  - `POST /api/auth/refresh-token`
- **Quên mật khẩu (gửi OTP)**
  - `POST /api/auth/forgot-password`
- **Đặt lại mật khẩu bằng OTP**
  - `POST /api/auth/reset-password`
- **Lấy thông tin user hiện tại**
  - `GET /api/auth/me`
- **Cập nhật profile**
  - `PUT /api/auth/update-profile`

---

## 2. Quản lý Học viên (Students)

**Mục tiêu:** CRUD học viên (soft delete), tìm kiếm/lọc, xem lịch học, lịch sử đăng ký, thanh toán, điểm thi.

**API (`/api/students`):**

- **Danh sách học viên (search/filter/paging)**
  - `GET /api/students?search={q}&level={level}&isActive={bool}&page={n}&pageSize={n}`
- **Chi tiết học viên**
  - `GET /api/students/{id}`
- **Tạo học viên**
  - `POST /api/students`
- **Cập nhật học viên**
  - `PUT /api/students/{id}`
- **Xóa học viên (soft delete)**
  - `DELETE /api/students/{id}`
- **Lịch sử đăng ký lớp (enrollments) của học viên**
  - `GET /api/students/{id}/enrollments`
- **Lịch sử thanh toán của học viên**
  - `GET /api/students/{id}/payments`
- **Điểm thi của học viên**
  - `GET /api/students/{id}/testscores`
- **Lịch học của học viên (paging + filter theo ngày)**
  - `GET /api/students/{id}/schedule?date={date}&startDate={date}&endDate={date}&page={n}&pageSize={n}`
- **Danh sách lớp của học viên**
  - `GET /api/students/{studentId}/classes`

**Flow liên quan (từ `FLOWS.md`):**

- **Create Student (Admin)**
  - UI nhập thông tin -> `POST /students` (tương đương `POST /api/students`)
- **Student View Own Schedule**
  - `GET /students/{id}/schedule` (tương đương `GET /api/students/{id}/schedule`)

---

## 3. Quản lý Giáo viên (Teachers)

**Mục tiêu:** CRUD giáo viên (soft delete), tìm kiếm/lọc, xem lịch dạy.

**API (`/api/teacher`):**

- **Danh sách giáo viên (search/filter/paging)**
  - `GET /api/teacher?search={q}&isActive={bool}&page={n}&pageSize={n}`
- **Chi tiết giáo viên**
  - `GET /api/teacher/{id}`
- **Tạo giáo viên**
  - `POST /api/teacher`
- **Cập nhật giáo viên**
  - `PUT /api/teacher/{id}`
- **Xóa giáo viên (soft delete)**
  - `DELETE /api/teacher/{id}`
- **Lịch dạy của giáo viên**
  - `GET /api/teacher/{id}/schedule?date={date}&startDate={date}&endDate={date}&page={n}&pageSize={n}`

**Flow liên quan (từ `FLOWS.md`):**

- **Create Teacher**
  - `POST /teacher` (tương đương `POST /api/teacher`)
- **Teacher Schedule Assignment**
  - Tạo session có thể gán `teacherId` -> `POST /curriculum/session` (tương đương `POST /api/curriculum/session`)
  - Xem lịch -> `GET /teacher/{id}/schedule` (tương đương `GET /api/teacher/{id}/schedule`)

---

## 4. Quản lý Khóa học (Courses)

**Mục tiêu:** CRUD khóa học, làm template cho lớp học và curriculum.

**API (`/api/courses`):**

- **Danh sách khóa học**
  - `GET /api/courses`
- **Chi tiết khóa học**
  - `GET /api/courses/{id}`
- **Tạo khóa học**
  - `POST /api/courses`
- **Cập nhật khóa học**
  - `PUT /api/courses/{id}`
- **Xóa khóa học**
  - `DELETE /api/courses/{id}`

---

## 5. Quản lý Lớp học (Classes)

**Mục tiêu:** CRUD lớp học, lọc theo khóa học/giáo viên/trạng thái, xem danh sách học viên trong lớp.

**API (`/api/classes`):**

- **Danh sách lớp (search/filter/paging)**
  - `GET /api/classes?search={q}&courseId={id}&teacherId={id}&status={status}&page={n}&pageSize={n}`
- **Chi tiết lớp**
  - `GET /api/classes/{id}`
- **Tạo lớp**
  - `POST /api/classes`
- **Cập nhật lớp**
  - `PUT /api/classes/{id}`
- **Xóa lớp**
  - `DELETE /api/classes/{id}`
- **Danh sách học viên trong lớp**
  - `GET /api/classes/{id}/students`

**Flow liên quan (từ `FLOWS.md`):**

- **Class Creation**
  - Lấy courses -> `GET /courses` (tương đương `GET /api/courses`)
  - Lấy curriculum theo course -> `GET /curriculum/course/{courseId}` (tương đương `GET /api/curriculum/course/{courseId}`)
  - Lấy teacher -> `GET /teacher` (tương đương `GET /api/teacher`)
  - Lấy room -> `GET /room` (tương đương `GET /api/room`)
  - Tạo lớp -> `POST /classes` (tương đương `POST /api/classes`)

---

## 6. Quản lý Phòng học (Rooms)

**Mục tiêu:** CRUD phòng học, quản lý sức chứa và khung giờ sẵn sàng.

**API (`/api/room`):**

- **Danh sách phòng (paging)**
  - `GET /api/room?page={n}&pageSize={n}`
- **Chi tiết phòng**
  - `GET /api/room/{id}`
- **Tạo phòng**
  - `POST /api/room`
- **Cập nhật phòng**
  - `PUT /api/room/{id}`
- **Xóa phòng**
  - `DELETE /api/room/{id}`

---

## 7. Quản lý Chương trình học (Curriculum)

**Mục tiêu:** Quản lý curriculum theo course, các ngày học (day), buổi học (session), bài học (lesson).

**API (`/api/curriculum`):**

- **Danh sách curriculum (search/filter/paging)**
  - `GET /api/curriculum?search={q}&courseId={id}&status={status}&page={n}&pageSize={n}`
- **Chi tiết curriculum**
  - `GET /api/curriculum/{id}`
- **Danh sách curriculum theo course**
  - `GET /api/curriculum/course/{courseId}`
- **Tạo curriculum**
  - `POST /api/curriculum`
- **Cập nhật curriculum**
  - `PUT /api/curriculum/{id}`
- **Xóa curriculum**
  - `DELETE /api/curriculum/{id}`

**API - Curriculum Day:**

- **Tạo ngày học**
  - `POST /api/curriculum/day`
- **Cập nhật ngày học**
  - `PUT /api/curriculum/day/{id}`
- **Xóa ngày học**
  - `DELETE /api/curriculum/day/{id}`

**API - Curriculum Session:**

- **Tạo session**
  - `POST /api/curriculum/session`
- **Cập nhật session**
  - `PUT /api/curriculum/session/{id}`
- **Xóa session**
  - `DELETE /api/curriculum/session/{id}`

**API - Lesson:**

- **Tạo lesson**
  - `POST /api/curriculum/lesson`
- **Cập nhật lesson**
  - `PUT /api/curriculum/lesson/{id}`
- **Xóa lesson**
  - `DELETE /api/curriculum/lesson/{id}`

**Flow liên quan (từ `FLOWS.md`):**

- **Curriculum Creation Steps**
  - Step 1 -> `POST /curriculum` (tương đương `POST /api/curriculum`)
  - Step 2 -> `POST /curriculum/day` (tương đương `POST /api/curriculum/day`)
  - Step 3 -> `POST /curriculum/session` (tương đương `POST /api/curriculum/session`)
  - Step 4 -> `POST /curriculum/lesson` (tương đương `POST /api/curriculum/lesson`)

---

## 8. Quản lý Đăng ký lớp (Enrollments)

**Mục tiêu:** Đăng ký học viên vào lớp, hủy đăng ký.

**API (`/api/enrollments`):**

- **Danh sách đăng ký**
  - `GET /api/enrollments`
- **Tạo đăng ký (Enroll student)**
  - `POST /api/enrollments`
- **Hủy đăng ký**
  - `DELETE /api/enrollments/{id}`

**Flow liên quan (từ `FLOWS.md`):**

- **Student Enrollment**
  - Xem lớp -> `GET /classes` (tương đương `GET /api/classes`)
  - Xem học viên trong lớp -> `GET /classes/{id}/students` (tương đương `GET /api/classes/{id}/students`)
  - Lấy danh sách học viên -> `GET /students` (tương đương `GET /api/students`)
  - Tạo enrollment -> `POST /enrollments` (tương đương `POST /api/enrollments`)

---

## 9. Quản lý Bài tập (Assignments) & Nộp bài

**Mục tiêu:** Giáo viên/Admin tạo bài tập, tạo câu hỏi quiz, học viên xem và nộp bài/quiz, giáo viên chấm điểm bài nộp.

**API (`/api/assignment`):**

- **Danh sách bài tập (filter/paging)**
  - `GET /api/assignment?classId={id}&teacherId={id}&type={type}&status={status}&page={n}&pageSize={n}`
- **Chi tiết bài tập**
  - `GET /api/assignment/{id}`
- **Tạo bài tập**
  - `POST /api/assignment`
- **Cập nhật bài tập**
  - `PUT /api/assignment/{id}`
- **Xóa bài tập**
  - `DELETE /api/assignment/{id}`
- **Danh sách bài nộp của 1 assignment (paging)**
  - `GET /api/assignment/{id}/submissions?page={n}&pageSize={n}`
- **Chấm điểm bài nộp**
  - `PUT /api/assignment/submissions/{id}/grade`

**API - Quiz (Questions/Answers):**

- **Lấy danh sách câu hỏi quiz**
  - `GET /api/assignment/{id}/questions`
- **Tạo câu hỏi quiz**
  - `POST /api/assignment/{id}/questions`
- **Cập nhật câu hỏi quiz**
  - `PUT /api/assignment/questions/{id}`
- **Xóa câu hỏi quiz**
  - `DELETE /api/assignment/questions/{id}`
- **Xóa đáp án quiz**
  - `DELETE /api/assignment/answers/{id}`

**Lưu ý:** `FLOWS.md` có mô tả `POST /submissions` và `POST /assignment/{id}/submit-quiz`, nhưng **không thấy trong `API_CONTRACT.md`**. Nếu backend có các endpoint này, bạn có thể bổ sung vào `API_CONTRACT.md` để đồng nhất tài liệu.

---

## 10. Quản lý Điểm (Grades)

**Mục tiêu:** Lưu/tra cứu điểm (theo assignment/student/class).

**API (`/api/grade`):**

- **Điểm theo assignment**
  - `GET /api/grade/assignment/{assignmentId}`
- **Điểm theo học viên**
  - `GET /api/grade/student/{studentId}`
- **Điểm theo lớp**
  - `GET /api/grade/class/{classId}`
- **Tạo grade**
  - `POST /api/grade`
- **Cập nhật grade**
  - `PUT /api/grade/{id}`
- **Xóa grade**
  - `DELETE /api/grade/{id}`

---

## 11. Quản lý Kỹ năng (Skills)

**Mục tiêu:** CRUD kỹ năng, bật/tắt trạng thái (theo UI đang có toggle status).

**API (`/api/skill`):**

- **Danh sách skills**
  - `GET /api/skill?search={q}&isActive={bool}`
- **Chi tiết skill**
  - `GET /api/skill/{id}`
- **Tạo skill**
  - `POST /api/skill`
- **Cập nhật skill**
  - `PUT /api/skill/{id}`
- **Xóa skill**
  - `DELETE /api/skill/{id}`

---

## 12. Điểm danh (Attendance)

**Mục tiêu:** Tạo/sửa/xóa bản ghi điểm danh, tra cứu điểm danh theo lớp/học viên/ngày, theo lesson.

**API (`/api/attendance`):**

- **Danh sách attendance (filter/paging)**
  - `GET /api/attendance?classId={id}&studentId={id}&date={date}&page={n}&pageSize={n}`
- **Chi tiết attendance**
  - `GET /api/attendance/{id}`
- **Tra cứu theo lesson**
  - `GET /api/attendance/lesson/{lessonId}`
- **Tạo attendance**
  - `POST /api/attendance`
- **Cập nhật attendance**
  - `PUT /api/attendance/{id}`
- **Xóa attendance**
  - `DELETE /api/attendance/{id}`

**Flow liên quan (từ `FLOWS.md`):**

- **Take Attendance**
  - Xem lớp -> `GET /classes` (tương đương `GET /api/classes`)
  - Xem schedule theo ngày -> `GET /classes/{id}/schedule?date=...` (**chưa thấy trong `API_CONTRACT.md`**)
  - Xem học viên trong lớp -> `GET /classes/{id}/students` (tương đương `GET /api/classes/{id}/students`)
  - Tạo attendance -> `POST /attendance` (tương đương `POST /api/attendance`)

---

## 13. Quản lý Điểm thi (Test Scores)

**Mục tiêu:** CRUD điểm thi 4 kỹ năng, lọc theo lớp/học viên, paging.

**API (`/api/testscores`):**

- **Danh sách test scores (filter/paging)**
  - `GET /api/testscores?search={q}&classId={id}&studentId={id}&page={n}&pageSize={n}`
- **Chi tiết test score**
  - `GET /api/testscores/{id}`
- **Tạo test score**
  - `POST /api/testscores`
- **Cập nhật test score**
  - `PUT /api/testscores/{id}`
- **Xóa test score**
  - `DELETE /api/testscores/{id}`

---

## 14. Quản lý Thanh toán (Payments)

**Mục tiêu:** Ghi nhận thanh toán, xem danh sách thanh toán (filter/paging), xem lịch sử theo học viên.

**API (`/api/payments`):**

- **Danh sách payments (filter/paging)**
  - `GET /api/payments?search={q}&studentId={id}&status={status}&page={n}&pageSize={n}`
- **Tạo payment**
  - `POST /api/payments`

**API liên quan theo học viên:**

- **Lịch sử thanh toán của học viên**
  - `GET /api/students/{id}/payments`

**Flow liên quan (từ `FLOWS.md`):**

- **Record Payment**
  - Xem học viên -> `GET /students` (tương đương `GET /api/students`)
  - Xem lịch sử -> `GET /students/{id}/payments` (tương đương `GET /api/students/{id}/payments`)
  - Ghi nhận -> `POST /payments` (tương đương `POST /api/payments`)

---

## 15. Quản lý Tài liệu (Documents)

**Mục tiêu:** CRUD tài liệu, upload/download file, lọc theo người upload, xem tài liệu theo teacher/student.

**API (`/api/documents`):**

- **Danh sách documents (filter/paging)**
  - `GET /api/documents?search={q}&type={type}&uploadedBy={id}&page={n}&pageSize={n}`
- **Chi tiết document**
  - `GET /api/documents/{id}`
- **Tạo document**
  - `POST /api/documents`
- **Cập nhật document**
  - `PUT /api/documents/{id}`
- **Xóa document**
  - `DELETE /api/documents/{id}`
- **Upload file**
  - `POST /api/documents/upload`
- **Download file**
  - `GET /api/documents/{id}/download`
- **Documents theo giáo viên**
  - `GET /api/documents/teacher/{teacherId}?page={n}&pageSize={n}`
- **Documents theo học viên**
  - `GET /api/documents/student/{studentId}?page={n}&pageSize={n}`

---

## 16. Thông báo (Notifications)

**Mục tiêu:** Danh sách thông báo theo user, đếm chưa đọc, tạo thông báo, đánh dấu đã đọc/chưa đọc, thao tác hàng loạt.

**API (`/api/notification`):**

- **Danh sách notifications**
  - `GET /api/notification?userId={id}&isRead={bool}&page={n}&pageSize={n}`
- **Đếm số chưa đọc**
  - `GET /api/notification/unread-count`
- **Tạo notification**
  - `POST /api/notification`
- **Đánh dấu đã đọc**
  - `PUT /api/notification/{id}/read`
- **Đánh dấu chưa đọc**
  - `PUT /api/notification/{id}/unread`
- **Đánh dấu nhiều cái đã đọc**
  - `PUT /api/notification/mark-read`
- **Đánh dấu tất cả đã đọc**
  - `PUT /api/notification/mark-all-read`
- **Xóa notification**
  - `DELETE /api/notification/{id}`

---

## 17. Nhật ký hoạt động (Activity Logs)

**Mục tiêu:** Ghi nhận & xem lịch sử hoạt động của user/teacher/student.

**API (`/api/activitylogs`):**

- **Xem hoạt động của tôi**
  - `GET /api/activitylogs/my-activities?page={n}&pageSize={n}`
- **Xem hoạt động theo giáo viên**
  - `GET /api/activitylogs/teacher/{teacherId}?page={n}&pageSize={n}`
- **Xem hoạt động theo học viên**
  - `GET /api/activitylogs/student/{studentId}?page={n}&pageSize={n}`
- **Tạo activity log**
  - `POST /api/activitylogs`
- **Xóa activity log**
  - `DELETE /api/activitylogs/{id}`

---

## 18. Dashboard & Thống kê

**Mục tiêu:** Lấy số liệu tổng quan cho dashboard Admin/Teacher.

**API:**

- **Thống kê tổng quan (Admin Dashboard)**
  - `GET /api/dashboard/stats`
- **Thống kê dashboard cho giáo viên**
  - `GET /api/statistics/teacher-dashboard/{teacherId}`

---

## 19. Ghi chú đồng nhất tài liệu (để tránh lệch giữa Flow và API Contract)

- **Assignments/Submissions:** `FLOWS.md` đề cập `POST /submissions` và `POST /assignment/{id}/submit-quiz` nhưng `API_CONTRACT.md` chưa có.
- **Classes Schedule:** `FLOWS.md` đề cập `GET /classes/{id}/schedule?date=...` nhưng `API_CONTRACT.md` chưa có.

Nếu bạn muốn, mình có thể:

- **(1)** Bổ sung các endpoint còn thiếu vào `API_CONTRACT.md`
- **(2)** Hoặc kiểm tra code backend để xác nhận endpoint nào thực sự tồn tại rồi cập nhật lại tài liệu cho chuẩn.
