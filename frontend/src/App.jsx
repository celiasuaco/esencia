import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import AuthPage from "./pages/auth/AuthPage";
import ProfilePage from "./pages/auth/ProfilePage";
import AdminDashboard from "./pages/admin/AdminDashboardPage";
import AdminLayout from "./components/layout/AdminLayout";
import { authService } from "./services/authService";
import "./App.css";

function App() {
  const user = authService.getCurrentUser();
  const isAdmin = user && user.role === 'ADMIN';

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/login" />} />

        <Route element={isAdmin ? <AdminLayout /> : <Navigate to="/login" />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;