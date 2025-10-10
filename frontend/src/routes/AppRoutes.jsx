import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '../layouts'
import { Home, Login, Register, Dashboard } from '../pages'
import ProtectedRoute from '../components/ProtectedRoute'

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
      {/* Thêm các route khác ở đây */}
    </Routes>
  )
}

export default AppRoutes