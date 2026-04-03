import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ExternalLink, LogOut, User, Package, Store } from 'lucide-react';
import { authService } from '../../services/authService';

export default function AdminLayout() {
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/admin/products', icon: Store, label: 'Productos' },
        { path: '/admin/orders', icon: Package, label: 'Pedidos' },
    ];

    return (
        <div className="flex min-h-screen bg-[#FDFBF9]">
            {/* Sidebar Lateral */}
            <aside className="w-64 bg-[#324339] text-[#FDFBF9] flex flex-col fixed h-full shadow-2xl">
                <div className="p-8">
                    <h2 className="text-3xl font-serif font-bold italic tracking-wider mb-1 text-[#A86447]">Esencia</h2>
                    <p className="text-[10px] text-[#FDFBF9]/50 uppercase tracking-[0.2em] font-bold">Admin Panel</p>
                </div>

                {/* Navegación Principal */}
                <nav className="flex-1 px-4 space-y-2 mt-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${isActive
                                    ? 'bg-[#A86447] text-white shadow-lg shadow-[#A86447]/20'
                                    : 'text-[#FDFBF9]/60 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium text-sm tracking-wide">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Botón de Perfil en el Sidebar */}
                <div className="px-4 mb-4">
                    <Link
                        to="/admin/profile"
                        className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${location.pathname === '/admin/profile'
                            ? 'bg-[#A86447] text-white shadow-lg'
                            : 'text-[#FDFBF9]/60 hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        <span className="font-medium text-sm">Mi Perfil</span>
                    </Link>
                </div>

                {/* Footer del Sidebar */}
                <div className="p-6 border-t border-white/5 space-y-4">
                    <Link to="/" className="flex items-center gap-3 text-xs text-[#FDFBF9]/40 hover:text-[#A86447] transition-colors uppercase tracking-widest">
                        <ExternalLink className="w-4 h-4" />
                        <span>Ver tienda</span>
                    </Link>
                    <button
                        onClick={() => authService.logout()}
                        className="flex items-center gap-3 text-xs text-red-400/70 hover:text-red-400 transition-colors w-full uppercase tracking-widest"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Contenido Principal */}
            <main className="flex-1 ml-64 p-12 bg-[#FDFBF9]">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}