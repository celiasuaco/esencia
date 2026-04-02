import { Link, Outlet } from 'react-router-dom';
import { authService } from '../../services/authService';
import Footer from './Footer';

const Navbar = () => {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getCurrentUser();

    const getProfilePath = () => {
        if (!isAuthenticated) return "/register";
        if (user?.role === 'ADMIN') return "/admin/profile";
        return "/profile";
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#FDFBF9]">
            <nav className="flex justify-between items-center px-10 py-4 bg-white border-b border-[#324339]/10 sticky top-0 z-50 shadow-sm">

                {/* LADO IZQUIERDO: Logo + Navegación */}
                <div className="flex-1 flex items-baseline gap-10">
                    <Link to="/" className="text-2xl font-serif font-bold text-[#324339] tracking-tight hover:opacity-80 transition-opacity">
                        Esencia
                    </Link>

                    <Link to="/catalog" className="text-lg font-serif text-[#324339] tracking-tight hover:opacity-80 transition-opacity">
                        colección
                    </Link>
                </div>

                {/* LADO DERECHO: Iconos de usuario */}
                <div className="flex-1 flex justify-end items-center gap-4">
                    <Link to={getProfilePath()} className="p-2 rounded-full hover:bg-[#FDFBF9] transition-colors group">
                        <svg
                            width="22"
                            height="22"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={isAuthenticated ? "#A86447" : "#324339"}
                            strokeWidth="1.5"
                            className="group-hover:scale-110 transition-transform duration-300"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </Link>
                </div>
            </nav>

            <main className="flex-grow">
                <Outlet />
            </main>

            <Footer />
        </div>
    );
};

export default Navbar;