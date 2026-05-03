import { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import AdminChatbot from '../chatbot/AdminChatbot';
import LayoutDashboard from 'lucide-react/dist/esm/icons/layout-dashboard';
import ExternalLink from 'lucide-react/dist/esm/icons/external-link';
import LogOut from 'lucide-react/dist/esm/icons/log-out';
import User from 'lucide-react/dist/esm/icons/user';
import Package from 'lucide-react/dist/esm/icons/package';
import Store from 'lucide-react/dist/esm/icons/store';
import Users from 'lucide-react/dist/esm/icons/users';

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();

    const [isAdmin, setIsAdmin] = useState(
        authService.isAuthenticated() && authService.getCurrentUser()?.role === 'ADMIN'
    );

    useEffect(() => {
        const handleAuthChange = () => {
            const user = authService.getCurrentUser();
            const isAuthorized = authService.isAuthenticated() && user?.role === 'ADMIN';

            setIsAdmin(isAuthorized);

            if (!isAuthorized) {
                navigate('/login', { replace: true });
            }
        };

        globalThis.addEventListener('authChange', handleAuthChange);

        return () => {
            globalThis.removeEventListener('authChange', handleAuthChange);
        };
    }, [navigate]);

    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/products', icon: Store, label: 'Productos' },
        { path: '/admin/orders', icon: Package, label: 'Pedidos' },
        { path: '/admin/users', icon: Users, label: 'Clientes' },
    ];

    if (!isAdmin) return null;

    return (
        <div className="flex min-h-screen bg-[#FDFBF9]">
            <aside className="w-20 lg:w-64 bg-[#324339] text-[#FDFBF9] flex flex-col fixed h-full shadow-2xl transition-all duration-300 z-50">

                <div className="p-4 lg:p-8 text-center lg:text-left h-24 flex flex-col justify-center">
                    <h2 className="text-2xl lg:text-3xl font-serif font-bold italic tracking-wider text-[#A86447] transition-all duration-300">
                        <span className="lg:hidden">E.</span>
                        <span className="hidden lg:inline">Esencia</span>
                    </h2>
                    <p className="hidden lg:block text-[10px] text-[#FDFBF9]/50 uppercase tracking-[0.2em] font-bold animate-fade-in">
                        Admin Panel
                    </p>
                </div>

                <nav className="flex-1 px-3 lg:px-4 space-y-2 mt-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center justify-center lg:justify-start gap-4 px-3 py-4 lg:px-4 rounded-2xl transition-all duration-300 ${isActive
                                    ? 'bg-[#A86447] text-white shadow-lg shadow-[#A86447]/20'
                                    : 'text-[#FDFBF9]/60 hover:bg-white/5 hover:text-white'
                                    }`}
                                title={item.label}
                            >
                                <Icon className="w-6 h-6 lg:w-5 lg:h-5" />
                                <span className="hidden lg:block font-medium text-sm tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                <div className="px-3 lg:px-4 mb-4">
                    <Link
                        to="/admin/profile"
                        className={`flex items-center justify-center lg:justify-start gap-4 px-3 py-4 lg:px-4 rounded-2xl transition-all duration-300 ${location.pathname === '/admin/profile'
                            ? 'bg-[#A86447] text-white shadow-lg'
                            : 'text-[#FDFBF9]/60 hover:bg-white/5 hover:text-white'
                            }`}
                        title="Mi Perfil"
                    >
                        <User className="w-6 h-6 lg:w-5 lg:h-5" />
                        <span className="hidden lg:block font-medium text-sm">Mi Perfil</span>
                    </Link>
                </div>

                <div className="p-4 lg:p-6 border-t border-white/5 space-y-6 lg:space-y-4">
                    <Link to="/" className="flex items-center justify-center lg:justify-start gap-3 text-xs text-[#FDFBF9]/40 hover:text-[#A86447] transition-colors" title="Ver tienda">
                        <ExternalLink className="w-5 h-5 lg:w-4 lg:h-4" />
                        <span className="hidden lg:block uppercase tracking-widest">Ver tienda</span>
                    </Link>
                    <button
                        onClick={() => authService.logout()}
                        className="flex items-center justify-center lg:justify-start gap-3 text-xs text-red-400/70 hover:text-red-400 transition-colors w-full outline-none"
                        title="Cerrar Sesión"
                    >
                        <LogOut className="w-5 h-5 lg:w-4 lg:h-4" />
                        <span className="hidden lg:block uppercase tracking-widest">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-12 bg-[#FDFBF9] transition-all duration-300">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
                <AdminChatbot />
            </main>
        </div>
    );
}