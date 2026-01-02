import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { MainLayout } from '../layouts'
import { Home, Login, Register, Profile, NotificationsPage, Products, ProductPage, ProductDetail, Combos, Cart, Checkout, Orders, OrderDetail, Vouchers } from '../pages'
import { AdminDashboard, AdminProducts, AdminCategories, AdminReviews, AdminComments, AdminVouchers, AdminUsers, AdminRoles, AdminInventory, AdminCombos } from '../pages/admin'
import AdminMessages from '../pages/admin/AdminMessages'
import AdminOrders from '../pages/admin/AdminOrders'
import AdminTransactions from '../pages/admin/AdminTransactions'
import AdminReports from '../pages/admin/AdminReports'
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
      
      <Route path="/categories/:slug" element={
        <MainLayout>
          <ProductPage />
        </MainLayout>
      } />
      
      <Route path="/products/:id" element={
        <MainLayout>
          <ProductDetail />
        </MainLayout>
      } />
      
      <Route path="/combos" element={
        <MainLayout>
          <Combos />
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
      
      <Route path="/admin/categories" element={
        <AdminRoute>
          <AdminCategories />
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
      
      <Route path="/admin/inventory" element={
        <AdminRoute>
          <AdminInventory />
        </AdminRoute>
      } />
      
      <Route path="/admin/combos" element={
        <AdminRoute>
          <AdminCombos />
        </AdminRoute>
      } />
      
      <Route path="/admin/system-config" element={
        <AdminRoute>
          <SystemConfig />
        </AdminRoute>
      } />
      
      <Route path="/admin/transactions" element={
        <AdminRoute>
          <AdminTransactions />
        </AdminRoute>
      } />
      
      <Route path="/admin/reviews" element={
        <AdminRoute>
          <AdminReviews />
        </AdminRoute>
      } />
      
      <Route path="/admin/comments" element={
        <AdminRoute>
          <AdminComments />
        </AdminRoute>
      } />
      
      <Route path="/admin/vouchers" element={
        <AdminRoute>
          <AdminVouchers />
        </AdminRoute>
      } />
      
      <Route path="/admin/users" element={
        <AdminRoute>
          <AdminUsers />
        </AdminRoute>
      } />
      
      <Route path="/admin/roles" element={
        <AdminRoute>
          <AdminRoles />
        </AdminRoute>
      } />
      
      <Route path="/admin/reports" element={
        <AdminRoute>
          <AdminReports />
        </AdminRoute>
      } />
      
      {/* Thêm các route khác ở đây */}
    </Routes>
  )
}

export default AppRoutes