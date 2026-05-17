import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense, useState, useEffect } from "react";
import { authService } from "./services/authService";
import { Toaster } from 'sonner';

import ScrollToTop from "./components/utils/ScrollToTop";

const Navbar = lazy(() => import("./components/layout/Navbar"));
const AdminLayout = lazy(() => import("./components/layout/AdminLayout"));

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
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboardPage"));
const AdminProductsPage = lazy(() => import("./pages/admin/AdminProductsPage"));
const ProductFormPage = lazy(() => import("./pages/admin/ProductFormPage"));
const AdminOrdersPage = lazy(() => import("./pages/admin/AdminOrdersPage"));
const AdminOrderDetailPage = lazy(() => import("./pages/admin/AdminOrderDetailPage"));
const AdminUserListPage = lazy(() => import("./pages/admin/AdminUserListPage"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] font-serif italic text-2xl text-[#2C3632]">
    <div className="animate-pulse tracking-widest">Esencia...</div>
  </div>
);

function App() {
  const [user, setUser] = useState(authService.getCurrentUser());

  useEffect(() => {
    const handleAuthUpdate = () => {
      setUser(authService.getCurrentUser());
    };
    globalThis.addEventListener('authChange', handleAuthUpdate);
    globalThis.addEventListener('storage', handleAuthUpdate);
    return () => {
      globalThis.removeEventListener('authChange', handleAuthUpdate);
      globalThis.removeEventListener('storage', handleAuthUpdate);
    };
  }, []);

  const isAdmin = user?.role === 'ADMIN';
  const isAuthenticated = !!user;

  return (
    <BrowserRouter>
      <ScrollToTop />
      <Toaster position="top-right" richColors expand closeButton theme="light" />

      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* CLIENTES / PÚBLICO */}
          <Route element={<Navbar />}>
            <Route path="/" element={<ShowcasePage />} />
            <Route
              path="/login"
              element={!isAuthenticated ? <AuthPage /> : <Navigate to={isAdmin ? "/dashboard" : "/catalog"} replace />}
            />
            <Route
              path="/register"
              element={!isAuthenticated ? <AuthPage /> : <Navigate to="/catalog" replace />}
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:uid/:token" element={<ResetPasswordConfirm />} />
            <Route path="/catalog" element={<ProductListPage />} />
            <Route path="/product/:id" element={<ProductDetailPage />} />
            <Route path="/checkout/success" element={<CheckoutSuccessPage />} />
            <Route path="/terminos" element={<Terms />} />

            <Route
              path="/cart"
              element={!isAdmin ? <CartPage /> : <Navigate to="/dashboard" replace />}
            />

            <Route
              path="/profile"
              element={isAuthenticated && !isAdmin ? <ProfilePage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/orders"
              element={isAuthenticated && !isAdmin ? <MyOrdersPage /> : <Navigate to="/" replace />}
            />
            <Route
              path="/orders/:id"
              element={isAuthenticated && !isAdmin ? <AdminOrderDetailPage /> : <Navigate to="/" replace />}
            />
          </Route>

          {/* ADMINISTRADORES*/}
          <Route element={isAdmin ? <AdminLayout /> : <Navigate to="/" replace />}>
            <Route path="/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/profile" element={<ProfilePage />} />
            <Route path="/admin/products" element={<AdminProductsPage />} />
            <Route path="/admin/products/new" element={<ProductFormPage />} />
            <Route path="/admin/products/edit/:id" element={<ProductFormPage />} />
            <Route path="/admin/orders" element={<AdminOrdersPage />} />
            <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
            <Route path="/admin/users" element={<AdminUserListPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;