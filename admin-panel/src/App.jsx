import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import Layout from './components/layout/Layout';
import Login from './pages/auth/Login';
import Dashboard from './pages/dashboard/Dashboard';
import ProductsList from './pages/products/ProductsList';
import ProductForm from './pages/products/ProductForm';
import OrdersList from './pages/orders/OrdersList';
import CategoriesPage from './pages/categories/CategoriesPage';
import UsersPage from './pages/users/UsersPage';
import CouponsPage from './pages/coupons/CouponsPage';

function PrivateRoute({ children }) {
  const { isAuthenticated } = useSelector((s) => s.auth);
  return isAuthenticated ? <Layout>{children}</Layout> : <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500, style: { fontSize: 14, fontFamily: 'Inter, sans-serif' } }} />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/products"    element={<PrivateRoute><ProductsList /></PrivateRoute>} />
        <Route path="/products/add" element={<PrivateRoute><ProductForm /></PrivateRoute>} />
        <Route path="/products/edit/:id" element={<PrivateRoute><ProductForm /></PrivateRoute>} />
        <Route path="/orders"      element={<PrivateRoute><OrdersList /></PrivateRoute>} />
        <Route path="/categories"  element={<PrivateRoute><CategoriesPage /></PrivateRoute>} />
        <Route path="/users"       element={<PrivateRoute><UsersPage /></PrivateRoute>} />
        <Route path="/coupons"     element={<PrivateRoute><CouponsPage /></PrivateRoute>} />
        <Route path="*"            element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </Provider>
  );
}
