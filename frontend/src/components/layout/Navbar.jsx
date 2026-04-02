import { Link, Outlet } from 'react-router-dom';
import { authService } from '../../services/authService';
import Footer from './Footer';
import { ShoppingBag, User } from 'lucide-react'; // Importamos User de lucide

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

                    <Link to="/catalog" className="font-serif text-[15px] text-[#324339]/70 hover:text-[#D48A66] transition-colors duration-500 italic tracking-wide">
                        colección
                    </Link>
                </div>

                {/* LADO DERECHO: Iconos de Carrito y Usuario */}
                <div className="flex-1 flex justify-end items-center gap-2">

                    {/* Carrito */}
                    <Link to="/cart" className="p-2 rounded-full hover:bg-[#FDFBF9] transition-colors group">
                        <ShoppingBag
                            size={20}
                            strokeWidth={1.5}
                            className="text-[#324339] group-hover:text-[#D48A66] group-hover:scale-110 transition-all duration-300"
                        />
                    </Link>

                    {/* Perfil (Re-añadido y corregido) */}
                    <Link to={getProfilePath()} className="p-2 rounded-full hover:bg-[#FDFBF9] transition-colors group">
                        <User
                            size={22}
                            strokeWidth={1.5}
                            className={`${isAuthenticated ? "text-[#D48A66]" : "text-[#324339]"
                                } group-hover:scale-110 transition-all duration-300`}
                        />
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