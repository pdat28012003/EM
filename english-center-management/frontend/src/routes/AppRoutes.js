import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/admin/Layout';
import Login from '../components/login/Login';
import PrivateRoute from '../components/admin/PrivateRoute';
import StudentDashboard from '../components/student/StudentDashboard';
import TeacherDashboard from '../components/teacher/Dashboard/Dashboard';
import TeacherLayout from '../components/teacher/TeacherLayout';
import TeacherClasses from '../components/teacher/Class/Class';
import StudentLayout from '../components/student/StudentLayout';
import Profile from '../components/profile/Profile';
import Dashboard from '../components/admin/Dashboard';
import Students from '../components/admin/Students';
import Teachers from '../components/admin/Teachers';
import Classes from '../components/admin/Classes';
import Payments from '../components/admin/Payments';
import Curriculum from '../components/admin/Curriculum';
import CurriculumDetail from '../components/admin/CurriculumDetail';
import Rooms from '../components/admin/Rooms';
import TeacherSchedule from '../components/admin/TeacherSchedule';
import Attendance from '../components/admin/Attendance';
import Schedules from '../components/admin/Schedules';
import TestScores from '../components/admin/TestScores';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />

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
      <Route path="/teacher-schedule/:teacherId" element={
        <PrivateRoute>
          <Layout>
            <TeacherSchedule />
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
