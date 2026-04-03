import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import Navbar from "./components/layout/Navbar";
import AdminDashboard from "./pages/admin/AdminDashboardPage";
import ProfilePage from "./pages/auth/ProfilePage";
import ShowcasePage from "./pages/ShowcasePage";
import AuthPage from "./pages/auth/AuthPage";
import { authService } from "./services/authService";
import AdminProductsPage from "./pages/admin/AdminProductsPage";
import ProductFormPage from "./pages/admin/ProductFormPage";
import ForgotPassword from "./components/auth/ForgotPassword";
import ResetPasswordConfirm from "./components/auth/ResetPasswordConfirm";
import ProductListPage from "./pages/ProductListPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import AdminOrdersPage from "./pages/admin/AdminOrdersPage";
import AdminOrderDetailPage from "./pages/admin/AdminOrderDetailPage";
import { Toaster } from 'sonner';

function App() {
  const user = authService.getCurrentUser();
  const isAdmin = user && user.role === 'ADMIN';

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        richColors
        expand={true}
        closeButton
        theme="light"
      />
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

          {/* Perfil de Cliente: Solo si NO es admin (o si quieres que el admin vea la tienda) */}
          <Route
            path="/profile"
            element={user && !isAdmin ? <ProfilePage /> : <Navigate to="/login" />}
          />
        </Route>

        {/* GRUPO 2: ADMINISTRADORES (Con Sidebar lateral) */}
        <Route
          element={isAdmin ? <AdminLayout /> : <Navigate to="/login" />}
        >
          <Route path="/dashboard" element={<AdminDashboard />} />

          {/* Perfil de Administrador: Misma página, distinto Layout */}
          <Route path="/admin/profile" element={<ProfilePage />} />
          <Route path="/admin/products" element={<AdminProductsPage />} />
          <Route path="/admin/products/new" element={<ProductFormPage />} />
          <Route path="/admin/products/edit/:id" element={<ProductFormPage />} />
          <Route path="/admin/orders" element={<AdminOrdersPage />} />
          <Route path="/admin/orders/:id" element={<AdminOrderDetailPage />} />
        </Route>

        {/* Redirección de seguridad */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;