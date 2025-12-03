import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '../layouts'
import { Home, Login, Register, Dashboard, Profile, NotificationsPage, Products, ProductDetail, Cart, Checkout, Orders, OrderDetail, Vouchers } from '../pages'
import { AdminDashboard, AdminProducts } from '../pages/admin'
import AdminMessages from '../pages/admin/AdminMessages'
import AdminOrders from '../pages/admin/AdminOrders'
import SystemConfig from '../pages/admin/SystemConfig'
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
      
      <Route path="/notifications" element={
        <ProtectedRoute>
          <MainLayout>
            <NotificationsPage />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/products" element={
        <MainLayout>
          <Products />
        </MainLayout>
      } />
      
      <Route path="/products/:id" element={
        <MainLayout>
          <ProductDetail />
        </MainLayout>
      } />
      
      <Route path="/cart" element={
        <MainLayout>
          <Cart />
        </MainLayout>
      } />
      
      <Route path="/vouchers" element={
        <MainLayout>
          <Vouchers />
        </MainLayout>
      } />
      
      <Route path="/checkout" element={
        <ProtectedRoute>
          <MainLayout>
            <Checkout />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders" element={
        <ProtectedRoute>
          <MainLayout>
            <Orders />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      <Route path="/orders/:orderId" element={
        <ProtectedRoute>
          <MainLayout>
            <OrderDetail />
          </MainLayout>
        </ProtectedRoute>
      } />
      
      {/* Admin Routes - Chỉ admin mới truy cập được */}
      <Route path="/admin" element={
        <AdminRoute>
          <AdminDashboard />
        </AdminRoute>
      } />
      
      <Route path="/admin/products" element={
        <AdminRoute>
          <AdminProducts />
        </AdminRoute>
      } />
      
      <Route path="/admin/messages" element={
        <AdminRoute>
          <AdminMessages />
        </AdminRoute>
      } />
      
      <Route path="/admin/orders" element={
        <AdminRoute>
          <AdminOrders />
        </AdminRoute>
      } />
      
      <Route path="/admin/system-config" element={
        <AdminRoute>
          <SystemConfig />
        </AdminRoute>
      } />
      
      {/* Thêm các route khác ở đây */}
    </Routes>
  )
}

export default AppRoutes