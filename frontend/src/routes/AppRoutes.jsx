import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '../layouts'
import { Home, Login, Register, Dashboard, Profile } from '../pages'
import { AdminDashboard } from '../pages/admin'
import AdminMessages from '../pages/admin/AdminMessages'
import WebSocketTest from '../components/WebSocketTest'
import ProtectedRoute from '../components/ProtectedRoute'
import AdminRoute from '../components/AdminRoute'

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={
        <MainLayout>
          <Home />
        </MainLayout>
      } />
      <Route path="/home" element={
        <MainLayout>
          <Home />
        </MainLayout>
      } />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/profile" element={
        <ProtectedRoute>
          <MainLayout>
            <Profile />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes - Chỉ admin mới truy cập được */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      
      <Route path="/admin/messages" element={
        <AdminRoute>
          <AdminMessages />
        </AdminRoute>
      } />
      
      {/* Test route for WebSocket */}
      <Route path="/test" element={
        <ProtectedRoute>
          <MainLayout>
            <WebSocketTest />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Thêm các route khác ở đây */}
    </Routes>
  )
}

export default AppRoutes