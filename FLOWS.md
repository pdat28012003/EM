# System Flows - English Center Management System

**Version:** 1.0  
**Date:** April 2026

---

## Table of Contents

1. [Authentication Flows](#1-authentication-flows)
2. [User Role Flows](#2-user-role-flows)
3. [Student Management Flow](#3-student-management-flow)
4. [Teacher Management Flow](#4-teacher-management-flow)
5. [Course & Curriculum Flow](#5-course--curriculum-flow)
6. [Class & Enrollment Flow](#6-class--enrollment-flow)
7. [Assignment & Grade Flow](#7-assignment--grade-flow)
8. [Attendance Flow](#8-attendance-flow)
9. [Payment Flow](#9-payment-flow)

---

## 1. Authentication Flows

### 1.1 User Registration Flow

```
[Client] → POST /auth/register → [API]
                                    ↓
                          Validate email unique
                                    ↓
                          Create User (inactive)
                                    ↓
                          Generate & Send OTP
                                    ↓
[Client] ← Email ← [Email Service] ←┘
   ↓
User enters OTP
   ↓
[Client] → POST /auth/verify-registration → [API]
                                              ↓
                                    Validate OTP
                                              ↓
                                    Activate User
                                              ↓
                                    Generate JWT Tokens
                                              ↓
[Client] ← {accessToken, refreshToken, user} ┘
   ↓
Store in localStorage
Redirect to dashboard
```

### 1.2 Login Flow

```
[Client] → POST /auth/login {email, password}
                    ↓
            [AuthController]
                    ↓
        Validate Credentials
        Check User Exists + Active
        Verify Password Hash
                    ↓
        Generate JWT Token
        Generate Refresh Token
                    ↓
[Client] ← {accessToken, refreshToken, user}
                    ↓
        Setup axios interceptor
        Store tokens
        Route by role
```

### 1.3 Token Refresh Flow

```
[Client] API call with expired token
    ↓
[API] Return 401 Unauthorized
    ↓
[Client] POST /auth/refresh-token {refreshToken}
    ↓
[API] Validate refresh token → Generate new tokens
    ↓
[Client] ← {newAccessToken, newRefreshToken}
    ↓
[Client] Retry original API call with new token
```

---

## 2. User Role Flows

### 2.1 Role-Based Routing

```
                    ┌─────────────┐
                    │    Login    │
                    └──────┬──────┘
                           ↓
                    ┌──────────────┐
                    │ Decode Token │
                    │ Get User Role│
                    └───────┬──────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│    Admin     │   │   Teacher    │   │   Student    │
│  Dashboard   │   │  Dashboard   │   │  Dashboard   │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                   │
       ▼                  ▼                   ▼
• User Mgmt           • My Classes         • My Classes
• Courses             • Schedule           • Schedule
• Classes             • Students           • Assignments
• Payments            • Assignments        • Grades
• Reports             • Attendance         • Payments
• Settings            • Grading            • Resources
```

### 2.2 Permission Matrix

| Feature | Admin | Teacher | Student |
|---------|-------|---------|---------|
| Create/Edit Users | ✅ | ❌ | ❌ |
| Manage Courses | ✅ | ❌ | ❌ |
| Manage Classes | ✅ | ❌ | ❌ |
| Enroll Students | ✅ | ❌ | ❌ |
| Grade Assignments | ✅ | ✅ (own class) | ❌ |
| View Grades | ✅ | ✅ (class) | ✅ (own) |
| Mark Attendance | ✅ | ✅ (class) | ❌ |
| Upload Documents | ✅ | ✅ | ❌ |
| View Schedule | ✅ | ✅ | ✅ |
| Edit Profile | ✅ | ✅ | ✅ |

---

## 3. Student Management Flow

### 3.1 Create Student (Admin)

```
Admin UI
    ↓
Fill Form:
• Full Name
• Email (unique)
• Phone
• Date of Birth
• Address
• Level (Beginner/Elementary/Intermediate/Advanced)
• Password
    ↓
POST /students
CreateStudentDto
    ↓
Backend Process:
1. Validate email unique in Students
2. Check no existing User with same email
3. Auto-create "Student" Role if not exists
4. Create User (auth account):
   - HMACSHA512 password hash
   - RoleId
   - IsActive = true
5. Create Student profile:
   - Link UserId
   - Hash password (legacy)
   - EnrollmentDate = Now
6. Return StudentDto (201 Created)
```

### 3.2 Student View Own Schedule

```
Student Dashboard
    ↓
GET /students/{id}/schedule
Query params: date, startDate, endDate, page, pageSize
    ↓
Backend:
1. Verify student exists
2. Find active enrollments for student
3. Get curriculum IDs from enrolled classes
4. Query CurriculumSessions WHERE curriculum in list
5. Apply date filters if provided
6. Include: CurriculumDay, Curriculum->Course, Room, Teacher
7. Map to ScheduleDto with formatted dates
    ↓
Return PagedResult<ScheduleDto>
    ↓
Display calendar/list view
```

---

## 4. Teacher Management Flow

### 4.1 Create Teacher

```
Admin UI
    ↓
Fill Teacher Form
• Full Name
• Email
• Phone
• Specialization
• Qualifications
• Hourly Rate
• Password
    ↓
POST /teacher
    ↓
Backend:
1. Validate email unique
2. Check no User exists
3. Create "Teacher" Role if needed
4. Create User with password hash
5. Create Teacher profile:
   - UserId link
   - HireDate = Now
   - IsActive = true
6. Return TeacherDto
```

### 4.2 Teacher Schedule Assignment

```
Curriculum Creation
    ↓
For each CurriculumDay:
    Create Sessions
    ↓
┌─────────────────────────────────────┐
│ CreateCurriculumSessionDto           │
│  • curriculumDayId                    │
│  • sessionNumber                      │
│  • startTime (TimeSpan)               │
│  • endTime (TimeSpan)               │
│  • roomId (optional)                  │
│  • teacherId (optional)             │
└─────────────────────────────────────┘
    ↓
POST /curriculum/session
    ↓
Database: CurriculumSessions table
    ↓
Teacher can view schedule via:
GET /teacher/{id}/schedule
```

---

## 5. Course & Curriculum Flow

### 5.1 Course vs Curriculum Hierarchy

```
┌─────────────────────────────────────────────────────┐
│                    COURSE                           │
│           (Template/Framework)                      │
│  • Course Name (e.g., "IELTS Beginner")            │
│  • Course Code (e.g., "IELTS-B101")                │
│  • Description                                      │
│  • Level, Duration, Fee                            │
└────────────────────┬────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                       │
         ▼                       ▼
┌─────────────────┐      ┌─────────────────┐
│  CURRICULUM #1  │      │  CURRICULUM #2  │
│ April 2026      │      │ May 2026        │
│ Batch A         │      │ Batch B         │
└────────┬────────┘      └────────┬────────┘
         │                       │
    ┌────┴────┐             ┌────┴────┐
    │         │             │         │
    ▼         ▼             ▼         ▼
 Day 1     Day 2          Day 1     Day 2
    │         │             │         │
┌───┴───┐ ┌───┴───┐    ┌───┴───┐ ┌───┴───┐
│S1 │S2│ │S1 │S2 │    │S1 │S2 │ │S1 │S2│
└───┴───┘ └───┴───┘    └───┴───┘ └───┴───┘

S = Session (with Room, Teacher, Time)
```

### 5.2 Curriculum Creation Steps

```
Step 1: Create Curriculum
POST /curriculum
{
  curriculumName: "April 2026 Batch",
  courseId: 1,
  startDate: "2026-04-01",
  endDate: "2026-06-30",
  description: "...",
  participantTeacherIds: [1, 2, 3]
}
    ↓
Step 2: Create Days
POST /curriculum/day (multiple calls)
{
  curriculumId: 1,
  scheduleDate: "2026-04-01",
  topic: "Introduction",
  description: "..."
}
    ↓
Step 3: Create Sessions
POST /curriculum/session (multiple calls)
{
  curriculumDayId: 1,
  sessionNumber: 1,
  startTime: "09:00",
  endTime: "10:30",
  sessionName: "Morning Session",
  roomId: 1,
  teacherId: 2
}
    ↓
Step 4: Create Lessons (optional)
POST /curriculum/lesson
{
  curriculumSessionId: 1,
  lessonNumber: 1,
  lessonTitle: "Lesson 1",
  content: "...",
  duration: "00:45"
}
```

---

## 6. Class & Enrollment Flow

### 6.1 Class Creation

```
Admin
    ↓
Select Course
GET /courses
    ↓
Select/Create Curriculum
GET /curriculum/course/{courseId}
    ↓
Select Teacher (optional)
GET /teacher
    ↓
Select Room
GET /room
    ↓
Fill Class Form:
• className
• maxStudents
• startDate / endDate
    ↓
POST /classes
CreateClassDto
    ↓
Database: Create Class record
with links to Course, Curriculum, Teacher, Room
    ↓
Return ClassDto (201)
```

### 6.2 Student Enrollment

```
Admin/Manager
    ↓
Select Class
GET /classes
    ↓
View Current Students
GET /classes/{id}/students
    ↓
Click "Add Student"
    ↓
Get Available Students
GET /students (filter out already enrolled)
    ↓
Select Student
POST /enrollments
{
  studentId: 1,
  classId: 1
}
    ↓
Backend:
1. Validate student not already in class
2. Check class capacity (current < max)
3. Create Enrollment record:
   - Status: "Active"
   - EnrollmentDate: Now
4. Increment Class.CurrentStudents
5. Return EnrollmentDto
```

### 6.3 Class Schedule Generation

```
When Class created with Curriculum:
    ↓
Class.CurriculumId → Curriculum
    ↓
CurriculumDays (ordered by ScheduleDate)
    ↓
For each CurriculumDay:
    CurriculumSessions
    ↓
Each Session becomes a scheduled class:
• Date = CurriculumDay.ScheduleDate
• Time = Session.StartTime - EndTime
• Room = Session.AssignedRoom
• Teacher = Session.Teacher
• Topic = CurriculumDay.Topic
    ↓
Available for:
• Student schedule view
• Teacher schedule view
• Attendance marking
```

---

## 7. Assignment & Grade Flow

### 7.1 Assignment Creation

```
Teacher/Admin
    ↓
Select Class
GET /classes?teacherId={id}
    ↓
Create Assignment Form:
• Title
• Description
• Type (Essay/Quiz/Exercise/Project)
• Due Date
• Max Score (default: 100)
• Attachment (optional)
    ↓
POST /assignment
CreateAssignmentDto
    ↓
Database: Assignment record created
    ↓
If Type = Quiz:
    Add Questions
    POST /assignment/{id}/questions
    {
      questionText,
      questionType: "MultipleChoice",
      points,
      answers: [
        { answerText, isCorrect },
        ...
      ]
    }
```

### 7.2 Student Submission Flow

```
Student
    ↓
View My Assignments
GET /assignment?classId={enrolledClassId}
    ↓
Select Assignment
    ↓
Submit:
• Content (text)
• OR Upload file
• OR Take Quiz
    ↓
If Quiz:
    GET /assignment/{id}/questions
    ↓
    Submit Answers:
    POST /assignment/{id}/submit-quiz
    {
      answers: [
        { questionId, selectedAnswerId }
      ],
      timeSpentSeconds
    }
    ↓
    Auto-graded:
    Calculate score
    Return QuizResultDto
    ↓
If File/Text:
    POST /submissions
    {
      assignmentId,
      studentId,
      content,
      attachmentUrl
    }
    ↓
    Status: "Submitted"
    Wait for teacher grading
```

### 7.3 Teacher Grading Flow

```
Teacher
    ↓
View Class Assignments
GET /assignment?classId={id}
    ↓
View Submissions
GET /assignment/{id}/submissions
    ↓
Select Submission
    ↓
Grade:
PUT /assignment/submissions/{id}/grade
{
  score: 85,
  feedback: "Good work, but..."
}
    ↓
Backend:
• Update submission score
• Set Status: "Graded"
• Set GradedAt: Now
• Set GradedBy: teacherId
    ↓
Student can view grade
```

---

## 8. Attendance Flow

### 8.1 Take Attendance

```
Teacher/Admin
    ↓
Select Class
GET /classes
    ↓
Select Date
    ↓
View Scheduled Sessions
GET /classes/{id}/schedule?date=2026-04-03
    ↓
Select Session
    ↓
Get Enrolled Students
GET /classes/{id}/students
    ↓
Mark Attendance:
POST /attendance (for each student)
{
  studentId: 1,
  lessonId: 1,  // or curriculumSessionId
  attendanceDate: "2026-04-03",
  status: "Present" | "Absent" | "Late" | "Excused",
  notes: "..."
}
    ↓
Or Bulk Create:
Multiple records in one request
```

### 8.2 Attendance Report

```
Admin/Teacher
    ↓
GET /attendance
Query params:
• classId
• studentId
• date / startDate / endDate
    ↓
Backend:
Query Attendance table
Join with Students, Lessons
    ↓
Return AttendanceDto[]
• studentName
• lessonTitle
• attendanceDate
• status
• notes
```

---

## 9. Payment Flow

### 9.1 Record Payment

```
Admin/Accountant
    ↓
Select Student
GET /students
    ↓
View Payment History
GET /students/{id}/payments
    ↓
Record New Payment:
POST /payments
CreatePaymentDto
{
  studentId: 1,
  amount: 5000000,
  paymentMethod: "Cash" | "BankTransfer" | "Card" | "Momo",
  notes: "Tuition for April 2026"
}
    ↓
Backend:
Create Payment record
Status: "Completed"
PaymentDate: Now
    ↓
Return PaymentDto
```

### 9.2 Payment Overview

```
Admin Dashboard
    ↓
GET /dashboard/stats
    ↓
Returns:
• totalRevenue (all time)
• monthlyRevenue (current month)
    ↓
GET /payments
Query: month, year, status
    ↓
Paged list of payments
Filterable, sortable
```

---

## 10. Data Flow Summary

### 10.1 Frontend to Backend

```
React Component
    ↓
API Service (api.js)
• studentsAPI
• teachersAPI
• classesAPI
• etc.
    ↓
Axios Instance
• baseURL: http://localhost:5000/api
• Auth header: Bearer {token}
• Request/Response interceptors
    ↓
ASP.NET Core API
    ↓
Controller → Service → Repository → Database
```

### 10.2 Key Database Relationships

```
User (Auth)
  │
  ├── Student (1:1)
  │      │
  │      ├── Enrollment (1:N) → Class
  │      ├── Payment (1:N)
  │      ├── TestScore (1:N)
  │      └── Attendance (1:N)
  │
  └── Teacher (1:1)
         │
         ├── Class (1:N)
         └── CurriculumSession (1:N)

Course
  │
  ├── Class (1:N)
  │      │
  │      ├── Enrollment (1:N)
  │      ├── Assignment (1:N)
  │      └── TestScore (1:N)
  │
  └── Curriculum (1:N)
         │
         ├── CurriculumDay (1:N)
         │      └── CurriculumSession (1:N)
         │             ├── Lesson (1:N)
         │             └── Attendance (1:N)
         └── Class (1:N)

Room
  └── CurriculumSession (1:N)
```

---

## 11. API Response Patterns

### 11.1 Success Patterns

| Operation | Status Code | Response |
|-----------|-------------|----------|
| GET List | 200 OK | PagedResult<T> or T[] |
| GET Single | 200 OK | T |
| POST Create | 201 Created | T (created object) |
| PUT Update | 200 OK or 204 NoContent | T or empty |
| DELETE | 204 NoContent | empty |

### 11.2 Error Patterns

```json
// 400 Bad Request
{
  "message": "Validation failed",
  "errors": {
    "email": ["Email is required"],
    "password": ["Min length 6"]
  }
}

// 401 Unauthorized
{
  "message": "Invalid credentials"
}

// 404 Not Found
{
  "message": "Student not found"
}

// 409 Conflict
{
  "message": "Email already exists"
}

// 500 Internal Error
{
  "message": "Error retrieving data",
  "error": "..."
}
```

---

## 12. Frontend State Flow

### 12.1 Page Load Sequence

```
Component Mount
    ↓
useEffect(() => {
  loadData()
}, [])
    ↓
loadData():
1. setLoading(true)
2. try {
     const [students, classes] = await Promise.all([
       studentsAPI.getAll(),
       classesAPI.getAll()
     ])
     setStudents(students.data)
     setClasses(classes.data)
   } catch (error) {
     showNotification(error)
   } finally {
     setLoading(false)
   }
    ↓
Render UI with data
```

### 12.2 Form Submission Flow

```
User Submit Form
    ↓
handleSubmit():
1. Validate form (client-side)
2. setSubmitting(true)
3. try {
     if (editing) {
       await api.update(id, formData)
       showSuccess("Updated")
     } else {
       await api.create(formData)
       showSuccess("Created")
     }
     closeDialog()
     refreshList()
   } catch (error) {
     showError(error.response?.data?.message)
   } finally {
     setSubmitting(false)
   }
```
