import { Link, Outlet } from 'react-router-dom';
import { authService } from '../../services/authService';
import Footer from './Footer'; // 1. Importa el Footer

const Navbar = () => {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getCurrentUser();

    const getProfilePath = () => {
        if (!isAuthenticated) return "/register";
        if (user?.role === 'ADMIN') return "/admin/profile";
        return "/profile";
    };

    return (
        <div className="flex flex-col min-h-screen"> {/* 2. Contenedor flex */}
            <nav className="flex justify-between items-center p-6 bg-white border-b border-[#E8E2D6] sticky top-0 z-50">
                <Link to="/" className="text-2xl font-serif text-primary">Esencia</Link>
                <div className="flex items-center gap-4">
                    <Link to={getProfilePath()} className="p-2 rounded-full hover:bg-[#FDFBF7]">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={isAuthenticated ? "#5B7B63" : "#A3937B"} strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </Link>
                </div>
            </nav>

            <main className="flex-grow"> {/* 3. El contenido crece para empujar el footer abajo */}
                <Outlet />
            </main>

            <Footer /> {/* 4. El Footer aparece al final */}
        </div>
    );
};

export default Navbar;