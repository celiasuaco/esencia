import { Link } from 'react-router-dom';

const Navbar = () => {
    return (
        <nav className="flex justify-between items-center p-6 bg-white border-b border-[#E8E2D6]">
            <Link to="/" className="text-2xl font-serif text-primary">Esencia</Link>

            <div className="flex items-center gap-4">
                <Link to="/register" className="p-2 rounded-full hover:bg-[#FDFBF7] transition-colors">
                    {/* Icono de usuario sencillo (SVG) */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#5B7B63" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </Link>
            </div>
        </nav>
    );
};

export default Navbar;