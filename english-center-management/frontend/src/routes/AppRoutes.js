import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/admin/Layout';
import Login from '../components/login/Login';
import ForgotPassword from '../components/login/ForgotPassword';
import ResetPassword from '../components/login/ResetPassword';
import PrivateRoute from '../components/admin/PrivateRoute';
import StudentDashboard from '../components/student/StudentDashboard';
import TeacherDashboard from '../components/teacher/Dashboard/Dashboard';
import TeacherLayout from '../components/teacher/TeacherLayout';
import TeacherClasses from '../components/teacher/Class/Class';
import ClassDetail from '../components/teacher/Class/ClassDetail/ClassDetail';
import TeacherSchedule from '../components/teacher/Schedule/Schedule';
import Documents from '../components/teacher/Documents/Documents';
import StudentLayout from '../components/student/StudentLayout';
import StudentDocuments from '../components/student/Documents/Documents';
import StudentSchedule from '../components/student/Schedule/Schedule';
import StudentCourses from '../components/student/Courses/Courses';
import StudentAssignments from '../components/student/Assignments/Assignments';
import AdminDocuments from '../components/admin/documents/Documents';
import Profile from '../components/profile/Profile';
import Dashboard from '../components/admin/Dashboard';
import Students from '../components/admin/students/Students';
import Teachers from '../components/admin/teachers/Teachers';
import Classes from '../components/admin/classes/Classes';
import Courses from '../components/admin/courses/Courses';
import Skills from '../components/admin/skills/Skills';
import Payments from '../components/admin/payments/Payments';
import Curriculum from '../components/admin/curriculum/Curriculum';
import CurriculumDetail from '../components/admin/curriculum/CurriculumDetail';
import Rooms from '../components/admin/rooms/Rooms';
import Attendance from '../components/admin/attendance/Attendance';
import Schedules from '../components/admin/schedules/Schedules';
import TestScores from '../components/admin/testscores/TestScores';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      {/* Student Routes */}
      <Route path="/student/dashboard" element={
        <PrivateRoute allowedRoles={['student']}>
          <StudentLayout>
            <StudentDashboard />
          </StudentLayout>
        </PrivateRoute>
      } />
      <Route path="/student/profile" element={
        <PrivateRoute allowedRoles={['student']}>
          <StudentLayout>
            <Profile />
          </StudentLayout>
        </PrivateRoute>
      } />
      <Route path="/student/documents" element={
        <PrivateRoute allowedRoles={['student']}>
          <StudentLayout>
            <StudentDocuments />
          </StudentLayout>
        </PrivateRoute>
      } />
      <Route path="/student/courses" element={
        <PrivateRoute allowedRoles={['student']}>
          <StudentLayout>
            <StudentCourses />
          </StudentLayout>
        </PrivateRoute>
      } />
      <Route path="/student/assignments" element={
        <PrivateRoute allowedRoles={['student']}>
          <StudentLayout>
            <StudentAssignments />
          </StudentLayout>
        </PrivateRoute>
      } />

      <Route path="/student/schedule" element={
        <PrivateRoute allowedRoles={['student']}>
          <StudentLayout>
            <StudentSchedule />
          </StudentLayout>
        </PrivateRoute>
      } />
      {/* Teacher Routes */}
      <Route path="/teacher/dashboard" element={
        <PrivateRoute allowedRoles={['teacher']}>
          <TeacherLayout>
            <TeacherDashboard />
          </TeacherLayout>
        </PrivateRoute>
      } />
      <Route path="/teacher/profile" element={
        <PrivateRoute allowedRoles={['teacher']}>
          <TeacherLayout>
            <Profile />
          </TeacherLayout>
        </PrivateRoute>
      } />
      <Route path="/teacher/classes" element={
        <PrivateRoute allowedRoles={['teacher']}>
          <TeacherLayout>
            <TeacherClasses />
          </TeacherLayout>
        </PrivateRoute>
      } />
      <Route path="/teacher/classes/:classId" element={
        <PrivateRoute allowedRoles={['teacher']}>
          <TeacherLayout>
            <ClassDetail />
          </TeacherLayout>
        </PrivateRoute>
      } />
      <Route path="/teacher/schedule" element={
        <PrivateRoute allowedRoles={['teacher']}>
          <TeacherLayout>
            <TeacherSchedule />
          </TeacherLayout>
        </PrivateRoute>
      } />
      <Route path="/teacher/documents" element={
        <PrivateRoute allowedRoles={['teacher']}>
          <TeacherLayout>
            <Documents />
          </TeacherLayout>
        </PrivateRoute>
      } />

      {/* Admin Routes */}
      <Route path="/" element={
        <PrivateRoute allowedRoles={['admin']}>
          <Layout>
            <Dashboard />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/admin/profile" element={
        <PrivateRoute allowedRoles={['admin']}>
          <Layout>
            <Profile />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/students" element={
        <PrivateRoute>
          <Layout>
            <Students />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/teachers" element={
        <PrivateRoute>
          <Layout>
            <Teachers />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/courses" element={
        <PrivateRoute>
          <Layout>
            <Courses />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/skills" element={
        <PrivateRoute>
          <Layout>
            <Skills />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/classes" element={
        <PrivateRoute>
          <Layout>
            <Classes />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/payments" element={
        <PrivateRoute>
          <Layout>
            <Payments />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/curriculum" element={
        <PrivateRoute>
          <Layout>
            <Curriculum />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/curriculum/:curriculumId" element={
        <PrivateRoute>
          <Layout>
            <CurriculumDetail />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/rooms" element={
        <PrivateRoute>
          <Layout>
            <Rooms />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/attendance" element={
        <PrivateRoute>
          <Layout>
            <Attendance />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/schedules" element={
        <PrivateRoute>
          <Layout>
            <Schedules />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/test-scores" element={
        <PrivateRoute>
          <Layout>
            <TestScores />
          </Layout>
        </PrivateRoute>
      } />
      <Route path="/documents" element={
        <PrivateRoute>
          <Layout>
            <AdminDocuments />
          </Layout>
        </PrivateRoute>
      } />

      {/* Common Routes */}
      <Route path="/profile" element={
        <PrivateRoute>
          <Profile />
        </PrivateRoute>
      } />

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
