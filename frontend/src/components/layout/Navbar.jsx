import { Link, Outlet } from 'react-router-dom';
import { authService } from '../../services/authService';

const Navbar = () => {
    const isAuthenticated = authService.isAuthenticated();
    const user = authService.getCurrentUser();

    // Lógica de redirección dinámica
    const getProfilePath = () => {
        if (!isAuthenticated) return "/register";
        if (user?.role === 'ADMIN') return "/admin/profile";
        return "/profile"; // Cliente estándar
    };

    return (
        <>
            <nav className="flex justify-between items-center p-6 bg-white border-b border-[#E8E2D6]">
                <Link to="/" className="text-2xl font-serif text-primary">Esencia</Link>

                <div className="flex items-center gap-4">
                    {/* El link cambia según el estado y rol */}
                    <Link to={getProfilePath()} className="p-2 rounded-full hover:bg-[#FDFBF7]">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke={isAuthenticated ? "#5B7B63" : "#A3937B"}
                            strokeWidth="2"
                        >
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                    </Link>
                </div>
            </nav>

            <Outlet />
        </>
    );
};

export default Navbar;