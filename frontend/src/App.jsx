import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useState, useEffect } from "react";
import { authService } from "./services/authService";
import { Toaster } from 'sonner';

import Navbar from "./components/layout/Navbar";
import ScrollToTop from "./components/utils/ScrollToTop";

const ShowcasePage = lazy(() => import("./pages/ShowcasePage"));
const AuthPage = lazy(() => import("./pages/auth/AuthPage"));
const ForgotPassword = lazy(() => import("./components/auth/ForgotPassword"));
const ResetPasswordConfirm = lazy(() => import("./components/auth/ResetPasswordConfirm"));
const ProductListPage = lazy(() => import("./pages/ProductListPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const CheckoutSuccessPage = lazy(() => import("./pages/CheckoutSuccessPage"));
const ProfilePage = lazy(() => import("./pages/auth/ProfilePage"));
const Terms = lazy(() => import("./pages/legal/Terms"));

const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const ProductFormPage = lazy(() => import("./pages/admin/ProductFormPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(() => import("./pages/admin/AdminOrderDetailPage"));
const AdminUserListPage = lazy(() => import("./pages/admin/AdminUserListPage"));
const Chatbot = lazy(() => import("./components/chatbot/Chatbot"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] font-serif italic text-2xl text-[#2C3632]">
    <div className="animate-pulse tracking-widest">Esencia...</div>
  </div>
);

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    setUser(authService.getCurrentUser());
  }, []);

  const isAdmin = user && user.role === 'ADMIN';

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster
        position="top-right"
        richColors
        expand={true}
        closeButton
        theme="light"
      />
      <Suspense fallback={null}>
        <Chatbot />
      </Suspense>

      <Suspense fallback={<PageLoader />}>
        <Routes>

          {/* GRUPO 1: CLIENTES / PÚBLICO (Con Navbar superior) */}
          <Route element={<Navbar />}>
            <Route path="/" element={<ShowcasePage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/register" element={<AuthPage />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPasswordConfirm />} />
            <Route path="/catalog" element={<ProductListPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/terminos" element={<Terms />} />

            {/* Perfil de Cliente protegido */}
            <Route
              path="/profile"
              element={user && !isAdmin ? <ProfilePage /> : <Navigate to="/login" />}
            />
            <Route path="/orders" element={user && !isAdmin ? <MyOrdersPage /> : <Navigate to="/login" />} />
            <Route path="/orders/:id" element={user && !isAdmin ? <AdminOrderDetailPage /> : <Navigate to="/login" />} />
          </Route>

          {/* GRUPO 2: ADMINISTRADORES */}
          <Route
            element={isAdmin ? <AdminLayout /> : <Navigate to="/login" />}
          >
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/profile" element={<ProfilePage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/products/new" element={<ProductFormPage />} />
            <Route path="/admin/products/edit/:id" element={<ProductFormPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="/admin/users" element={<AdminUserListPage />} />
          </Route>

          {/* Redirección de seguridad */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;