import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, ExternalLink, LogOut, User } from 'lucide-react'; // Añadimos User
import { authService } from '../../services/authService';

export default function AdminLayout() {
    const location = useLocation();

    const menuItems = [
        { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    ];

    return (
        <div className="flex min-h-screen bg-[#FDFBF9]">
            {/* Sidebar Lateral */}
            <aside className="w-64 bg-[#324339] text-white flex flex-col fixed h-full shadow-2xl">
                <div className="p-8">
                    <h2 className="text-3xl font-serif italic tracking-wider mb-1">Esencia</h2>
                    <p className="text-xs text-[#8FA895] uppercase tracking-widest font-medium">Panel de Administración</p>
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
                                    ? 'bg-[#C77C5D] text-white shadow-lg'
                                    : 'text-[#8FA895] hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Botón de Perfil en el Sidebar */}
                <div className="px-4 mb-4">
                    <Link
                        to="admin/profile"
                        className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all duration-300 ${location.pathname === '/profile'
                            ? 'bg-[#C77C5D] text-white shadow-lg'
                            : 'text-[#8FA895] hover:bg-white/5 hover:text-white'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        <span className="font-medium">Mi Perfil</span>
                    </Link>
                </div>

                {/* Footer del Sidebar */}
                <div className="p-6 border-t border-white/10 space-y-4">
                    <Link to="/" className="flex items-center gap-3 text-sm text-[#8FA895] hover:text-white transition-colors">
                        <ExternalLink className="w-4 h-4" />
                        <span>Ver tienda</span>
                    </Link>
                    <button
                        onClick={() => authService.logout()}
                        className="flex items-center gap-3 text-sm text-red-400 hover:text-red-300 transition-colors w-full"
                    >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Contenido Principal */}
            <main className="flex-1 ml-64 p-12">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}