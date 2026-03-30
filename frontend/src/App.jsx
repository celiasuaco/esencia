import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AdminLayout from "./components/layout/AdminLayout";
import Navbar from "./components/layout/Navbar";
import AdminDashboard from "./pages/admin/AdminDashboardPage";
import ProfilePage from "./pages/auth/ProfilePage";
import DashboardPage from "./pages/DashboardPage";
import AuthPage from "./pages/auth/AuthPage";
import { authService } from "./services/authService";

function App() {
  const user = authService.getCurrentUser();
  const isAdmin = user && user.role === 'ADMIN';

  return (
    <BrowserRouter>
      <Routes>

        {/* GRUPO 1: CLIENTES / PÚBLICO (Con Navbar superior) */}
        <Route element={<Navbar />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/register" element={<AuthPage />} />

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

          {/* Futuras rutas de gestión */}
          <Route path="/admin/products" element={<div>Gestión de Productos</div>} />
        </Route>

        {/* Redirección de seguridad */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;