# API Contract - English Center Management System

**Version:** 1.0  
**Base URL:** `http://localhost:5000/api`  
**Date:** April 2026

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Students](#2-students)
3. [Teachers](#3-teachers)
4. [Courses](#4-courses)
5. [Classes](#5-classes)
6. [Rooms](#6-rooms)
7. [Curriculum](#7-curriculum)
8. [Enrollments](#8-enrollments)
9. [Assignments](#9-assignments)
10. [Grades](#10-grades)
11. [Skills](#11-skills)
12. [Attendance](#12-attendance)
13. [Test Scores](#13-test-scores)
14. [Payments](#14-payments)
15. [Documents](#15-documents)
16. [Notifications](#16-notifications)
17. [Activity Logs](#17-activity-logs)
18. [Dashboard](#18-dashboard)
19. [Common Models](#19-common-models)

---

## 1. Authentication

**Base Path:** `/api/auth`

### 1.1 Register
- **Endpoint:** `POST /api/auth/register`
- **Description:** Đăng ký tài khoản mới (gửi OTP)
- **Request Body:**
  ```json
  {
    "email": "string (required, email)",
    "password": "string (required, min 6)",
    "fullName": "string (required)",
    "phoneNumber": "string",
    "role": "string (default: 'Student')"
  }
  ```
- **Response:** `200 OK` - "Đăng ký thành công. Vui lòng kiểm tra email để lấy mã OTP."
- **Error:** `400 Bad Request` - "Email đã tồn tại hoặc Role không hợp lệ."

### 1.2 Verify Registration
- **Endpoint:** `POST /api/auth/verify-registration`
- **Description:** Xác thực OTP để kích hoạt tài khoản
- **Request Body:**
  ```json
  {
    "email": "string (required, email)",
    "otpCode": "string (required)"
  }
  ```
- **Response:** `200 OK` - "Xác thực thành công. Tài khoản của bạn đã được kích hoạt."
- **Error:** `400 Bad Request` - "Mã OTP không hợp lệ hoặc đã hết hạn."

### 1.3 Resend OTP
- **Endpoint:** `POST /api/auth/resend-otp`
- **Description:** Gửi lại mã OTP
- **Query Params:** `email`, `type`
- **Response:** `200 OK` - "Mã OTP mới đã được gửi."

### 1.4 Login
- **Endpoint:** `POST /api/auth/login`
- **Description:** Đăng nhập
- **Request Body:**
  ```json
  {
    "email": "string (required, email)",
    "password": "string (required)"
  }
  ```
- **Response:** `200 OK`
  ```json
  {
    "accessToken": "string",
    "refreshToken": "string",
    "tokenType": "Bearer",
    "expiresIn": 0,
    "user": {
      "userId": 0,
      "email": "string",
      "fullName": "string",
      "phoneNumber": "string",
      "avatar": "string",
      "role": "string"
    }
  }
  ```
- **Error:** `401 Unauthorized` - "Email hoặc mật khẩu không chính xác..."

### 1.5 Refresh Token
- **Endpoint:** `POST /api/auth/refresh-token`
- **Description:** Làm mới access token
- **Request Body:**
  ```json
  {
    "refreshToken": "string (required)"
  }
  ```
- **Response:** `200 OK` - LoginResponse
- **Error:** `401 Unauthorized` - "Refresh Token không hợp lệ hoặc đã hết hạn."

### 1.6 Forgot Password
- **Endpoint:** `POST /api/auth/forgot-password`
- **Description:** Yêu cầu mã OTP để đặt lại mật khẩu
- **Request Body:**
  ```json
  {
    "email": "string (required, email)"
  }
  ```
- **Response:** `200 OK` - "Mã OTP khôi phục mật khẩu đã được gửi qua email."

### 1.7 Reset Password
- **Endpoint:** `POST /api/auth/reset-password`
- **Description:** Đặt lại mật khẩu bằng mã OTP
- **Request Body:**
  ```json
  {
    "email": "string (required, email)",
    "otpCode": "string (required)",
    "newPassword": "string (required, min 6)"
  }
  ```
- **Response:** `200 OK` - "Mật khẩu đã được đặt lại thành công."

### 1.8 Get Current User
- **Endpoint:** `GET /api/auth/me`
- **Auth:** Required (Bearer Token)
- **Description:** Lấy thông tin người dùng hiện tại
- **Response:** `200 OK` - UserDto

### 1.9 Update Profile
- **Endpoint:** `PUT /api/auth/update-profile`
- **Auth:** Required (Bearer Token)
- **Description:** Chỉnh sửa thông tin người dùng
- **Request Body:**
  ```json
  {
    "fullName": "string",
    "email": "string",
    "phoneNumber": "string",
    "avatar": "string"
  }
  ```
- **Response:** `200 OK` - UserDto

---

## 2. Students

**Base Path:** `/api/students`

### 2.1 Get All Students
- **Endpoint:** `GET /api/students`
- **Query Params:**
  - `search` - Tìm kiếm theo tên, email, SĐT
  - `level` - Cấp độ (Beginner|Elementary|Intermediate|Advanced)
  - `isActive` - Trạng thái (mặc định: true)
  - `page` - Số trang (mặc định: 1)
  - `pageSize` - Kích thước trang (mặc định: 10)
- **Response:** `200 OK` - PagedResult<StudentDto>

### 2.2 Get Student by ID
- **Endpoint:** `GET /api/students/{id}`
- **Response:** `200 OK` - StudentDto

### 2.3 Create Student
- **Endpoint:** `POST /api/students`
- **Request Body:** CreateStudentDto
  ```json
  {
    "fullName": "string (required, max 100)",
    "email": "string (required, email, max 100)",
    "phoneNumber": "string (required, phone, max 20)",
    "dateOfBirth": "datetime (required)",
    "address": "string (max 500)",
    "password": "string (required, min 6, max 30)",
    "level": "string (required: Beginner|Elementary|Intermediate|Advanced)"
  }
  ```
- **Response:** `201 Created` - StudentDto

### 2.4 Update Student
- **Endpoint:** `PUT /api/students/{id}`
- **Request Body:** UpdateStudentDto
- **Response:** `204 No Content`

### 2.5 Delete Student (Soft Delete)
- **Endpoint:** `DELETE /api/students/{id}`
- **Response:** `204 No Content`

### 2.6 Get Student Enrollments
- **Endpoint:** `GET /api/students/{id}/enrollments`
- **Response:** `200 OK` - EnrollmentDto[]

### 2.7 Get Student Payments
- **Endpoint:** `GET /api/students/{id}/payments`
- **Response:** `200 OK` - PaymentDto[]

### 2.8 Get Student Test Scores
- **Endpoint:** `GET /api/students/{id}/testscores`
- **Response:** `200 OK` - TestScoreDto[]

### 2.9 Get Student Schedule
- **Endpoint:** `GET /api/students/{id}/schedule`
- **Query Params:**
  - `date` - Lọc theo ngày cụ thể
  - `startDate` - Lọc từ ngày
  - `endDate` - Lọc đến ngày
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<ScheduleDto>

---

## 3. Teachers

**Base Path:** `/api/teacher`

### 3.1 Get All Teachers
- **Endpoint:** `GET /api/teacher`
- **Query Params:**
  - `isActive` - Trạng thái
  - `search` - Tìm kiếm theo tên, email, SĐT, chuyên môn
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<TeacherDto>

### 3.2 Get Teacher by ID
- **Endpoint:** `GET /api/teacher/{id}`
- **Response:** `200 OK` - TeacherDto

### 3.3 Create Teacher
- **Endpoint:** `POST /api/teacher`
- **Request Body:** CreateTeacherDto
  ```json
  {
    "fullName": "string (required, min 2, max 50)",
    "email": "string (required, email, max 100)",
    "phoneNumber": "string (required, phone, max 20)",
    "password": "string (max 500)",
    "specialization": "string",
    "qualifications": "string",
    "hourlyRate": "decimal"
  }
  ```
- **Response:** `201 Created` - TeacherDto

### 3.4 Update Teacher
- **Endpoint:** `PUT /api/teacher/{id}`
- **Request Body:** UpdateTeacherDto
- **Response:** `200 OK` - TeacherDto

### 3.5 Delete Teacher (Soft Delete)
- **Endpoint:** `DELETE /api/teacher/{id}`
- **Response:** `204 No Content`

### 3.6 Get Teacher Schedule
- **Endpoint:** `GET /api/teacher/{id}/schedule`
- **Query Params:**
  - `date` - Lọc theo ngày cụ thể
  - `startDate` - Lọc từ ngày
  - `endDate` - Lọc đến ngày
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<ScheduleDto>

---

## 4. Courses

**Base Path:** `/api/courses`

### 4.1 Get All Courses
- **Endpoint:** `GET /api/courses`
- **Response:** `200 OK` - CourseDto[]

### 4.2 Get Course by ID
- **Endpoint:** `GET /api/courses/{id}`
- **Response:** `200 OK` - CourseDto

### 4.3 Create Course
- **Endpoint:** `POST /api/courses`
- **Request Body:** CreateCourseDto
  ```json
  {
    "courseName": "string",
    "courseCode": "string",
    "description": "string",
    "level": "string",
    "durationInWeeks": 0,
    "totalHours": 0,
    "fee": 0
  }
  ```
- **Response:** `201 Created` - CourseDto

### 4.4 Update Course
- **Endpoint:** `PUT /api/courses/{id}`
- **Request Body:** UpdateCourseDto
- **Response:** `200 OK` - CourseDto

### 4.5 Delete Course
- **Endpoint:** `DELETE /api/courses/{id}`
- **Response:** `204 No Content`

---

## 5. Classes

**Base Path:** `/api/classes`

### 5.1 Get All Classes
- **Endpoint:** `GET /api/classes`
- **Query Params:**
  - `search` - Tìm kiếm
  - `courseId` - Lọc theo khóa học
  - `teacherId` - Lọc theo giáo viên
  - `status` - Lọc theo trạng thái
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<ClassDto>

### 5.2 Get Class by ID
- **Endpoint:** `GET /api/classes/{id}`
- **Response:** `200 OK` - ClassDto

### 5.3 Create Class
- **Endpoint:** `POST /api/classes`
- **Request Body:** CreateClassDto
  ```json
  {
    "className": "string",
    "courseId": 0,
    "curriculumId": 0,
    "teacherId": 0,
    "startDate": "datetime",
    "endDate": "datetime",
    "maxStudents": 0,
    "roomId": 0
  }
  ```
- **Response:** `201 Created` - ClassDto

### 5.4 Update Class
- **Endpoint:** `PUT /api/classes/{id}`
- **Request Body:** UpdateClassDto
- **Response:** `200 OK` - ClassDto

### 5.5 Delete Class
- **Endpoint:** `DELETE /api/classes/{id}`
- **Response:** `204 No Content`

### 5.6 Get Class Students
- **Endpoint:** `GET /api/classes/{id}/students`
- **Response:** `200 OK` - StudentDto[]

### 5.7 Get Student Classes
- **Endpoint:** `GET /api/students/{studentId}/classes`
- **Response:** `200 OK` - ClassDto[]

---

## 6. Rooms

**Base Path:** `/api/room`

### 6.1 Get All Rooms
- **Endpoint:** `GET /api/room`
- **Query Params:**
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<RoomDto>

### 6.2 Get Room by ID
- **Endpoint:** `GET /api/room/{id}`
- **Response:** `200 OK` - RoomDto

### 6.3 Create Room
- **Endpoint:** `POST /api/room`
- **Request Body:** CreateRoomDto
  ```json
  {
    "roomName": "string",
    "description": "string",
    "capacity": 0,
    "availableStartTime": "timespan",
    "availableEndTime": "timespan"
  }
  ```
- **Response:** `201 Created` - RoomDto

### 6.4 Update Room
- **Endpoint:** `PUT /api/room/{id}`
- **Request Body:** RoomDto
- **Response:** `200 OK` - Message

### 6.5 Delete Room
- **Endpoint:** `DELETE /api/room/{id}`
- **Response:** `200 OK` - Message

---

## 7. Curriculum

**Base Path:** `/api/curriculum`

### 7.1 Get All Curriculums
- **Endpoint:** `GET /api/curriculum`
- **Query Params:**
  - `search` - Tìm kiếm
  - `courseId` - Lọc theo khóa học
  - `status` - Lọc theo trạng thái
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<CurriculumDto>

### 7.2 Get Curriculum by ID
- **Endpoint:** `GET /api/curriculum/{id}`
- **Response:** `200 OK` - CurriculumDto

### 7.3 Get Curriculum by Course
- **Endpoint:** `GET /api/curriculum/course/{courseId}`
- **Response:** `200 OK` - CurriculumDto[]

### 7.4 Create Curriculum
- **Endpoint:** `POST /api/curriculum`
- **Request Body:** CreateCurriculumDto
  ```json
  {
    "curriculumName": "string",
    "courseId": 0,
    "startDate": "datetime",
    "endDate": "datetime",
    "description": "string",
    "participantTeacherIds": [0]
  }
  ```
- **Response:** `201 Created` - CurriculumDto

### 7.5 Update Curriculum
- **Endpoint:** `PUT /api/curriculum/{id}`
- **Request Body:** UpdateCurriculumDto
- **Response:** `200 OK` - CurriculumDto

### 7.6 Delete Curriculum
- **Endpoint:** `DELETE /api/curriculum/{id}`
- **Response:** `204 No Content`

### 7.7 Create Curriculum Day
- **Endpoint:** `POST /api/curriculum/day`
- **Request Body:** CreateCurriculumDayDto
  ```json
  {
    "curriculumId": 0,
    "scheduleDate": "datetime",
    "topic": "string",
    "description": "string"
  }
  ```
- **Response:** `201 Created` - CurriculumDayDto

### 7.8 Update Curriculum Day
- **Endpoint:** `PUT /api/curriculum/day/{id}`
- **Request Body:** UpdateCurriculumDayDto
- **Response:** `200 OK` - CurriculumDayDto

### 7.9 Delete Curriculum Day
- **Endpoint:** `DELETE /api/curriculum/day/{id}`
- **Response:** `204 No Content`

### 7.10 Create Curriculum Session
- **Endpoint:** `POST /api/curriculum/session`
- **Request Body:** CreateCurriculumSessionDto
  ```json
  {
    "curriculumDayId": 0,
    "sessionNumber": 0,
    "startTime": "timespan",
    "endTime": "timespan",
    "sessionName": "string",
    "sessionDescription": "string",
    "roomId": 0,
    "teacherId": 0
  }
  ```
- **Response:** `201 Created` - CurriculumSessionDto

### 7.11 Update Curriculum Session
- **Endpoint:** `PUT /api/curriculum/session/{id}`
- **Request Body:** UpdateCurriculumSessionDto
- **Response:** `200 OK` - CurriculumSessionDto

### 7.12 Delete Curriculum Session
- **Endpoint:** `DELETE /api/curriculum/session/{id}`
- **Response:** `204 No Content`

### 7.13 Create Lesson
- **Endpoint:** `POST /api/curriculum/lesson`
- **Request Body:** CreateLessonDto
  ```json
  {
    "curriculumSessionId": 0,
    "lessonNumber": 0,
    "lessonTitle": "string",
    "content": "string",
    "duration": "timespan",
    "resources": "string",
    "notes": "string"
  }
  ```
- **Response:** `201 Created` - LessonDto

### 7.14 Update Lesson
- **Endpoint:** `PUT /api/curriculum/lesson/{id}`
- **Request Body:** UpdateLessonDto
- **Response:** `200 OK` - LessonDto

### 7.15 Delete Lesson
- **Endpoint:** `DELETE /api/curriculum/lesson/{id}`
- **Response:** `204 No Content`

---

## 8. Enrollments

**Base Path:** `/api/enrollments`

### 8.1 Get All Enrollments
- **Endpoint:** `GET /api/enrollments`
- **Response:** `200 OK` - EnrollmentDto[]

### 8.2 Create Enrollment
- **Endpoint:** `POST /api/enrollments`
- **Request Body:** CreateEnrollmentDto
  ```json
  {
    "studentId": 0,
    "classId": 0
  }
  ```
- **Response:** `201 Created` - EnrollmentDto

### 8.3 Delete Enrollment
- **Endpoint:** `DELETE /api/enrollments/{id}`
- **Response:** `204 No Content`

---

## 9. Assignments

**Base Path:** `/api/assignment`

### 9.1 Get All Assignments
- **Endpoint:** `GET /api/assignment`
- **Query Params:**
  - `classId` - Lọc theo lớp
  - `teacherId` - Lọc theo giáo viên
  - `type` - Lọc theo loại
  - `status` - Lọc theo trạng thái
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<AssignmentDto>

### 9.2 Get Assignment by ID
- **Endpoint:** `GET /api/assignment/{id}`
- **Response:** `200 OK` - AssignmentDto

### 9.3 Create Assignment
- **Endpoint:** `POST /api/assignment`
- **Request Body:** CreateAssignmentDto
  ```json
  {
    "title": "string (required, max 200)",
    "description": "string (required)",
    "type": "string (required, max 50)",
    "classId": 0,
    "dueDate": "datetime",
    "attachmentUrl": "string",
    "maxScore": 0
  }
  ```
- **Response:** `201 Created` - AssignmentDto

### 9.4 Update Assignment
- **Endpoint:** `PUT /api/assignment/{id}`
- **Request Body:** UpdateAssignmentDto
- **Response:** `200 OK` - AssignmentDto

### 9.5 Delete Assignment
- **Endpoint:** `DELETE /api/assignment/{id}`
- **Response:** `204 No Content`

### 9.6 Get Assignment Submissions
- **Endpoint:** `GET /api/assignment/{id}/submissions`
- **Query Params:**
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<AssignmentSubmissionDto>

### 9.7 Grade Submission
- **Endpoint:** `PUT /api/assignment/submissions/{id}/grade`
- **Request Body:** GradeSubmissionDto
  ```json
  {
    "score": 0,
    "feedback": "string"
  }
  ```
- **Response:** `200 OK` - AssignmentSubmissionDto

### 9.8 Get Quiz Questions
- **Endpoint:** `GET /api/assignment/{id}/questions`
- **Response:** `200 OK` - QuizQuestionDto[]

### 9.9 Create Quiz Question
- **Endpoint:** `POST /api/assignment/{id}/questions`
- **Request Body:** CreateQuizQuestionDto
- **Response:** `201 Created` - QuizQuestionDto

### 9.10 Update Quiz Question
- **Endpoint:** `PUT /api/assignment/questions/{id}`
- **Request Body:** UpdateQuizQuestionDto
- **Response:** `200 OK` - QuizQuestionDto

### 9.11 Delete Quiz Question
- **Endpoint:** `DELETE /api/assignment/questions/{id}`
- **Response:** `204 No Content`

### 9.12 Delete Quiz Answer
- **Endpoint:** `DELETE /api/assignment/answers/{id}`
- **Response:** `204 No Content`

---

## 10. Grades

**Base Path:** `/api/grade`

### 10.1 Get Grades by Assignment
- **Endpoint:** `GET /api/grade/assignment/{assignmentId}`
- **Response:** `200 OK` - GradeDto[]

### 10.2 Get Grades by Student
- **Endpoint:** `GET /api/grade/student/{studentId}`
- **Response:** `200 OK` - GradeDto[]

### 10.3 Get Grades by Class
- **Endpoint:** `GET /api/grade/class/{classId}`
- **Response:** `200 OK` - GradeDto[]

### 10.4 Create Grade
- **Endpoint:** `POST /api/grade`
- **Request Body:** CreateGradeDto
- **Response:** `201 Created` - GradeDto

### 10.5 Update Grade
- **Endpoint:** `PUT /api/grade/{id}`
- **Request Body:** UpdateGradeDto
- **Response:** `200 OK` - GradeDto

### 10.6 Delete Grade
- **Endpoint:** `DELETE /api/grade/{id}`
- **Response:** `204 No Content`

---

## 11. Skills

**Base Path:** `/api/skill`

### 11.1 Get All Skills
- **Endpoint:** `GET /api/skill`
- **Query Params:**
  - `search` - Tìm kiếm
  - `isActive` - Trạng thái
- **Response:** `200 OK` - SkillDto[]

### 11.2 Get Skill by ID
- **Endpoint:** `GET /api/skill/{id}`
- **Response:** `200 OK` - SkillDto

### 11.3 Create Skill
- **Endpoint:** `POST /api/skill`
- **Request Body:** CreateSkillDto
- **Response:** `201 Created` - SkillDto

### 11.4 Update Skill
- **Endpoint:** `PUT /api/skill/{id}`
- **Request Body:** UpdateSkillDto
- **Response:** `200 OK` - SkillDto

### 11.5 Delete Skill
- **Endpoint:** `DELETE /api/skill/{id}`
- **Response:** `204 No Content`

---

## 12. Attendance

**Base Path:** `/api/attendance`

### 12.1 Get All Attendance
- **Endpoint:** `GET /api/attendance`
- **Query Params:**
  - `classId` - Lọc theo lớp
  - `studentId` - Lọc theo học viên
  - `date` - Lọc theo ngày
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<AttendanceDto>

### 12.2 Get Attendance by ID
- **Endpoint:** `GET /api/attendance/{id}`
- **Response:** `200 OK` - AttendanceDto

### 12.3 Get Attendance by Lesson
- **Endpoint:** `GET /api/attendance/lesson/{lessonId}`
- **Response:** `200 OK` - AttendanceDto[]

### 12.4 Create Attendance
- **Endpoint:** `POST /api/attendance`
- **Request Body:** CreateAttendanceDto
  ```json
  {
    "studentId": 0,
    "lessonId": 0,
    "attendanceDate": "datetime",
    "status": "string (default: 'Present')",
    "notes": "string"
  }
  ```
- **Response:** `201 Created` - AttendanceDto

### 12.5 Update Attendance
- **Endpoint:** `PUT /api/attendance/{id}`
- **Request Body:** UpdateAttendanceDto
- **Response:** `200 OK` - AttendanceDto

### 12.6 Delete Attendance
- **Endpoint:** `DELETE /api/attendance/{id}`
- **Response:** `204 No Content`

---

## 13. Test Scores

**Base Path:** `/api/testscores`

### 13.1 Get All Test Scores
- **Endpoint:** `GET /api/testscores`
- **Query Params:**
  - `search` - Tìm kiếm
  - `classId` - Lọc theo lớp
  - `studentId` - Lọc theo học viên
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<TestScoreDto>

### 13.2 Get Test Score by ID
- **Endpoint:** `GET /api/testscores/{id}`
- **Response:** `200 OK` - TestScoreDto

### 13.3 Create Test Score
- **Endpoint:** `POST /api/testscores`
- **Request Body:** CreateTestScoreDto
  ```json
  {
    "studentId": 0,
    "classId": 0,
    "testName": "string",
    "listeningScore": 0,
    "readingScore": 0,
    "writingScore": 0,
    "speakingScore": 0,
    "comments": "string"
  }
  ```
- **Response:** `201 Created` - TestScoreDto

### 13.4 Update Test Score
- **Endpoint:** `PUT /api/testscores/{id}`
- **Request Body:** UpdateTestScoreDto
- **Response:** `200 OK` - TestScoreDto

### 13.5 Delete Test Score
- **Endpoint:** `DELETE /api/testscores/{id}`
- **Response:** `204 No Content`

---

## 14. Payments

**Base Path:** `/api/payments`

### 14.1 Get All Payments
- **Endpoint:** `GET /api/payments`
- **Query Params:**
  - `search` - Tìm kiếm
  - `studentId` - Lọc theo học viên
  - `status` - Lọc theo trạng thái
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<PaymentDto>

### 14.2 Create Payment
- **Endpoint:** `POST /api/payments`
- **Request Body:** CreatePaymentDto
  ```json
  {
    "studentId": 0,
    "amount": 0,
    "paymentMethod": "string",
    "notes": "string"
  }
  ```
- **Response:** `201 Created` - PaymentDto

---

## 15. Documents

**Base Path:** `/api/documents`

### 15.1 Get All Documents
- **Endpoint:** `GET /api/documents`
- **Query Params:**
  - `search` - Tìm kiếm
  - `type` - Lọc theo loại
  - `uploadedBy` - Lọc theo người upload
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<DocumentDto>

### 15.2 Get Document by ID
- **Endpoint:** `GET /api/documents/{id}`
- **Response:** `200 OK` - DocumentDto

### 15.3 Create Document
- **Endpoint:** `POST /api/documents`
- **Request Body:** CreateDocumentDto
- **Response:** `201 Created` - DocumentDto

### 15.4 Update Document
- **Endpoint:** `PUT /api/documents/{id}`
- **Request Body:** UpdateDocumentDto
- **Response:** `200 OK` - DocumentDto

### 15.5 Delete Document
- **Endpoint:** `DELETE /api/documents/{id}`
- **Response:** `204 No Content`

### 15.6 Upload Document
- **Endpoint:** `POST /api/documents/upload`
- **Content-Type:** `multipart/form-data`
- **Request Body:** FormData with file
- **Response:** `201 Created` - DocumentDto

### 15.7 Download Document
- **Endpoint:** `GET /api/documents/{id}/download`
- **Response:** `200 OK` - Blob (file content)

### 15.8 Get Teacher Documents
- **Endpoint:** `GET /api/documents/teacher/{teacherId}`
- **Query Params:** `page`, `pageSize`
- **Response:** `200 OK` - PagedResult<DocumentDto>

### 15.9 Get Student Documents
- **Endpoint:** `GET /api/documents/student/{studentId}`
- **Query Params:** `page`, `pageSize`
- **Response:** `200 OK` - PagedResult<DocumentDto>

---

## 16. Notifications

**Base Path:** `/api/notification`

### 16.1 Get All Notifications
- **Endpoint:** `GET /api/notification`
- **Query Params:**
  - `userId` - Lọc theo người dùng
  - `isRead` - Lọc theo trạng thái đọc
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - NotificationDto[]

### 16.2 Get Unread Count
- **Endpoint:** `GET /api/notification/unread-count`
- **Response:** `200 OK` - `{ count: 0 }`

### 16.3 Create Notification
- **Endpoint:** `POST /api/notification`
- **Request Body:** CreateNotificationDto
- **Response:** `201 Created` - NotificationDto

### 16.4 Mark as Read
- **Endpoint:** `PUT /api/notification/{id}/read`
- **Response:** `200 OK` - NotificationDto

### 16.5 Mark as Unread
- **Endpoint:** `PUT /api/notification/{id}/unread`
- **Response:** `200 OK` - NotificationDto

### 16.6 Mark Multiple as Read
- **Endpoint:** `PUT /api/notification/mark-read`
- **Request Body:** `{ notificationIds: [0] }`
- **Response:** `200 OK`

### 16.7 Mark All as Read
- **Endpoint:** `PUT /api/notification/mark-all-read`
- **Response:** `200 OK`

### 16.8 Delete Notification
- **Endpoint:** `DELETE /api/notification/{id}`
- **Response:** `204 No Content`

---

## 17. Activity Logs

**Base Path:** `/api/activitylogs`

### 17.1 Get My Activities
- **Endpoint:** `GET /api/activitylogs/my-activities`
- **Query Params:**
  - `page` - Số trang
  - `pageSize` - Kích thước trang
- **Response:** `200 OK` - PagedResult<ActivityLogDto>

### 17.2 Get Teacher Activities
- **Endpoint:** `GET /api/activitylogs/teacher/{teacherId}`
- **Query Params:** `page`, `pageSize`
- **Response:** `200 OK` - PagedResult<ActivityLogDto>

### 17.3 Get Student Activities
- **Endpoint:** `GET /api/activitylogs/student/{studentId}`
- **Query Params:** `page`, `pageSize`
- **Response:** `200 OK` - PagedResult<ActivityLogDto>

### 17.4 Create Activity Log
- **Endpoint:** `POST /api/activitylogs`
- **Request Body:** CreateActivityLogDto
- **Response:** `201 Created` - ActivityLogDto

### 17.5 Delete Activity Log
- **Endpoint:** `DELETE /api/activitylogs/{id}`
- **Response:** `204 No Content`

---

## 18. Dashboard

**Base Path:** `/api`

### 18.1 Get Dashboard Stats
- **Endpoint:** `GET /api/dashboard/stats`
- **Response:** `200 OK` - DashboardStatsDto
  ```json
  {
    "totalStudents": 0,
    "activeStudents": 0,
    "totalTeachers": 0,
    "totalClasses": 0,
    "activeClasses": 0,
    "totalRevenue": 0,
    "monthlyRevenue": 0
  }
  ```

### 18.2 Get Teacher Dashboard Statistics
- **Endpoint:** `GET /api/statistics/teacher-dashboard/{teacherId}`
- **Response:** `200 OK` - DashboardStatisticsDto
  ```json
  {
    "totalClasses": { "currentValue": 0, "changeFromLastWeek": 0, "changeType": "increase" },
    "totalStudents": { "currentValue": 0, "changeFromLastWeek": 0, "changeType": "increase" },
    "pendingAssignments": { "currentValue": 0, "changeFromLastWeek": 0, "changeType": "increase" },
    "weeklySchedule": { "currentValue": 0, "changeFromLastWeek": 0, "changeType": "increase" }
  }
  ```

---

## 19. Common Models

### PagedResult<T>
```json
{
  "data": [],
  "totalCount": 0,
  "page": 0,
  "pageSize": 0,
  "totalPages": 0,
  "hasPreviousPage": false,
  "hasNextPage": false
}
```

### StudentDto
```json
{
  "studentId": 0,
  "fullName": "string",
  "email": "string",
  "phoneNumber": "string",
  "dateOfBirth": "datetime",
  "address": "string",
  "enrollmentDate": "datetime",
  "level": "string",
  "isActive": true
}
```

### TeacherDto
```json
{
  "teacherId": 0,
  "fullName": "string",
  "email": "string",
  "phoneNumber": "string",
  "address": "string",
  "specialization": "string",
  "qualifications": "string",
  "hireDate": "datetime",
  "hourlyRate": 0,
  "isActive": true
}
```

### ClassDto
```json
{
  "classId": 0,
  "className": "string",
  "courseId": 0,
  "courseName": "string",
  "curriculumId": 0,
  "curriculumName": "string",
  "teacherId": 0,
  "teacherName": "string",
  "startDate": "datetime",
  "endDate": "datetime",
  "maxStudents": 0,
  "currentStudents": 0,
  "roomId": 0,
  "roomName": "string",
  "status": "string"
}
```

### CourseDto
```json
{
  "courseId": 0,
  "courseName": "string",
  "courseCode": "string",
  "description": "string",
  "level": "string",
  "durationInWeeks": 0,
  "totalHours": 0,
  "fee": 0,
  "isActive": true
}
```

### RoomDto
```json
{
  "roomId": 0,
  "roomName": "string",
  "description": "string",
  "capacity": 0,
  "availableStartTime": "timespan",
  "availableEndTime": "timespan",
  "isActive": true
}
```

### EnrollmentDto
```json
{
  "enrollmentId": 0,
  "studentId": 0,
  "studentName": "string",
  "classId": 0,
  "className": "string",
  "enrollmentDate": "datetime",
  "status": "string"
}
```

### AssignmentDto
```json
{
  "assignmentId": 0,
  "title": "string",
  "description": "string",
  "type": "string",
  "classId": 0,
  "teacherId": 0,
  "dueDate": "datetime",
  "createdAt": "datetime",
  "status": "string",
  "maxScore": 0,
  "attachmentUrl": "string",
  "updatedAt": "datetime",
  "className": "string",
  "teacherName": "string",
  "submissionsCount": 0,
  "gradedCount": 0
}
```

### TestScoreDto
```json
{
  "testScoreId": 0,
  "studentId": 0,
  "studentName": "string",
  "classId": 0,
  "className": "string",
  "testName": "string",
  "listeningScore": 0,
  "readingScore": 0,
  "writingScore": 0,
  "speakingScore": 0,
  "totalScore": 0,
  "testDate": "datetime",
  "comments": "string"
}
```

### PaymentDto
```json
{
  "paymentId": 0,
  "studentId": 0,
  "studentName": "string",
  "amount": 0,
  "paymentDate": "datetime",
  "paymentMethod": "string",
  "status": "string",
  "notes": "string"
}
```

### AttendanceDto
```json
{
  "attendanceId": 0,
  "studentId": 0,
  "studentName": "string",
  "lessonId": 0,
  "lessonTitle": "string",
  "attendanceDate": "datetime",
  "status": "string",
  "notes": "string",
  "createdDate": "datetime",
  "modifiedDate": "datetime"
}
```

### CurriculumDto
```json
{
  "curriculumId": 0,
  "curriculumName": "string",
  "courseId": 0,
  "courseName": "string",
  "startDate": "datetime",
  "endDate": "datetime",
  "description": "string",
  "createdDate": "datetime",
  "modifiedDate": "datetime",
  "status": "string",
  "curriculumDays": [],
  "participantTeachers": []
}
```

---

## HTTP Status Codes

| Code | Meaning | Description |
|------|---------|-------------|
| 200 | OK | Request thành công |
| 201 | Created | Tạo mới thành công |
| 204 | No Content | Thành công nhưng không có dữ liệu trả về |
| 400 | Bad Request | Dữ liệu không hợp lệ |
| 401 | Unauthorized | Chưa xác thực hoặc token hết hạn |
| 403 | Forbidden | Không có quyền truy cập |
| 404 | Not Found | Không tìm thấy resource |
| 409 | Conflict | Xung đột dữ liệu (ví dụ: email đã tồn tại) |
| 500 | Internal Server Error | Lỗi server |

---

## Authentication

API sử dụng **Bearer Token** authentication. Token cần được gửi trong header:

```
Authorization: Bearer <access_token>
```

---

## Frontend API Service Reference

File: `frontend/src/services/api.js`

Các API services đã được định nghĩa:

```javascript
// Auth
authAPI.login(credentials)
authAPI.getProfile()
authAPI.updateProfile(data)

// Students
studentsAPI.getAll(params)
studentsAPI.getById(id)
studentsAPI.create(data)
studentsAPI.update(id, data)
studentsAPI.delete(id)
studentsAPI.getEnrollments(id)
studentsAPI.getPayments(id)
studentsAPI.getTestScores(id)
studentsAPI.getSchedule(id, params)

// Teachers
teachersAPI.getAll(params)
teachersAPI.getById(id)
teachersAPI.create(data)
teachersAPI.update(id, data)
teachersAPI.delete(id)
teachersAPI.getSchedule(id, params)

// Courses
coursesAPI.getAll(params)
coursesAPI.getById(id)
coursesAPI.create(data)
coursesAPI.update(id, data)
coursesAPI.delete(id)

// Classes
classesAPI.getAll(params)
classesAPI.getById(id)
classesAPI.create(data)
classesAPI.delete(id)
classesAPI.getStudents(id)
classesAPI.getStudentClasses(studentId)

// Rooms
roomsAPI.getAll(params)
roomsAPI.getById(id)
roomsAPI.create(data)
roomsAPI.update(id, data)
roomsAPI.delete(id)

// Curriculum
curriculumAPI.getAll(params)
curriculumAPI.getById(id)
curriculumAPI.getByCourse(courseId)
curriculumAPI.create(data)
curriculumAPI.update(id, data)
curriculumAPI.delete(id)
curriculumAPI.createDay(data)
curriculumAPI.updateDay(id, data)
curriculumAPI.deleteDay(id)
curriculumAPI.createSession(data)
curriculumAPI.updateSession(id, data)
curriculumAPI.deleteSession(id)
curriculumAPI.createLesson(data)
curriculumAPI.updateLesson(id, data)
curriculumAPI.deleteLesson(id)

// Assignments
assignmentsAPI.getAll(params)
assignmentsAPI.getById(id)
assignmentsAPI.create(data)
assignmentsAPI.update(id, data)
assignmentsAPI.delete(id)
assignmentsAPI.getSubmissions(assignmentId, params)
assignmentsAPI.gradeSubmission(submissionId, data)
assignmentsAPI.getQuizQuestions(assignmentId)
assignmentsAPI.createQuizQuestion(assignmentId, data)
assignmentsAPI.updateQuizQuestion(questionId, data)
assignmentsAPI.deleteQuizQuestion(questionId)
assignmentsAPI.deleteQuizAnswer(answerId)

// Enrollments
enrollmentsAPI.getAll()
enrollmentsAPI.create(data)
enrollmentsAPI.delete(id)

// Attendance
attendanceAPI.getAll(params)
attendanceAPI.getById(id)
attendanceAPI.create(data)
attendanceAPI.update(id, data)
attendanceAPI.delete(id)
attendanceAPI.getByLesson(lessonId)

// Documents
documentsAPI.getAll(params)
documentsAPI.getById(id)
documentsAPI.create(data)
documentsAPI.update(id, data)
documentsAPI.delete(id)
documentsAPI.upload(formData)
documentsAPI.download(id)
documentsAPI.getTeacherDocuments(teacherId, params)
documentsAPI.getStudentDocuments(studentId, params)

// Notifications
notificationsAPI.getAll(params)
notificationsAPI.getUnreadCount()
notificationsAPI.create(data)
notificationsAPI.markAsRead(id)
notificationsAPI.markAsUnread(id)
notificationsAPI.markMultipleAsRead(ids)
notificationsAPI.markAllAsRead()
notificationsAPI.delete(id)

// Activity Logs
activityLogsAPI.getMyActivities(params)
activityLogsAPI.getTeacherActivities(teacherId, params)
activityLogsAPI.getStudentActivities(studentId, params)
activityLogsAPI.create(data)
activityLogsAPI.delete(id)

// Dashboard
dashboardAPI.getStats()
dashboardAPI.getTeacherDashboardStatistics(teacherId)
```
