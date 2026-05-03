import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { User, LogOut, Package, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';

const ProfileSidebar = ({ user: initialUser, activeTab, onTabChange }) => {
    const [userData, setUserData] = useState(initialUser);
    const [fetching, setFetching] = useState(false);

    const API_BASE_URL = 'http://127.0.0.1:8000';

    const refreshFromStorage = () => {
        const currentData = authService.getCurrentUser();
        if (currentData) {
            setUserData(currentData);
        }
    };

    useEffect(() => {
        const handleAuthUpdate = () => {
            refreshFromStorage();
        };

        globalThis.addEventListener('authChange', handleAuthUpdate);

        const fetchProfile = async () => {
            setFetching(true);
            try {
                const freshData = await authService.getProfile();
                setUserData(freshData);
            } catch (error) {
                console.error("Error al refrescar perfil:", error);
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();

        return () => {
            globalThis.removeEventListener('authChange', handleAuthUpdate);
        };
    }, []);

    useEffect(() => {
        setUserData(initialUser);
    }, [initialUser]);

    const initial = userData?.full_name ? userData.full_name.charAt(0).toUpperCase() : '?';
    const isClient = userData && userData.role === 'CLIENT';

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith('http')) return photoPath;
        const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        return `${API_BASE_URL}${normalizedPath}`;
    };

    const photoUrl = getPhotoUrl(userData?.photo);

    return (
        <aside className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl shadow-xl shadow-[#324339]/5 border border-[#324339]/5 text-center relative overflow-hidden">

                {fetching && (
                    <div className="absolute top-2 right-2">
                        <Loader2 className="w-3 h-3 animate-spin text-[#A86447]/40" />
                    </div>
                )}

                <div className="flex flex-col items-center">
                    <div className="relative w-20 h-20 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-[#A86447] to-[#324339] flex items-center justify-center text-white text-2xl md:text-4xl font-serif shadow-xl overflow-hidden border-4 border-white mb-4 transition-all">
                        <span className="absolute z-0">{initial}</span>
                        {photoUrl && (
                            <img
                                src={photoUrl}
                                fetchPriority="high"
                                className="absolute inset-0 w-full h-full object-cover z-10 animate-fade-in"
                                alt="Perfil"
                                key={photoUrl}
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}
                    </div>

                    <h3 className="text-lg md:text-xl font-serif text-[#324339] italic truncate w-full px-2">
                        {userData?.full_name}
                    </h3>
                    <p className="text-[10px] md:text-xs text-[#324339]/50 mt-1 uppercase tracking-widest break-all px-2 hidden sm:block">
                        {userData?.email}
                    </p>
                </div>

                <nav className="mt-8 md:mt-12 flex flex-row lg:flex-col gap-2 md:gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0">
                    <button
                        onClick={() => onTabChange?.('data')}
                        className={`flex-1 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'data'
                            ? 'bg-[#324339] text-white shadow-lg'
                            : 'text-[#324339]/60 hover:bg-[#FDFBF9]'
                            }`}
                    >
                        <User className="w-4 h-4 md:w-5 md:h-5" />
                        <span>Mis Datos</span>
                    </button>

                    {isClient && (
                        <button
                            onClick={() => onTabChange?.('orders')}
                            className={`flex-1 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'orders'
                                ? 'bg-[#324339] text-white shadow-lg'
                                : 'text-[#324339]/60 hover:bg-[#FDFBF9]'
                                }`}
                        >
                            <Package className="w-4 h-4 md:w-5 md:h-5" />
                            <span>Mis Pedidos</span>
                        </button>
                    )}

                    <button
                        onClick={() => authService.logout()}
                        className="flex-1 lg:w-full flex items-center justify-center lg:justify-start gap-3 px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium text-red-600/80 hover:bg-red-50 transition-all lg:mt-10"
                    >
                        <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="hidden md:inline lg:inline">Cerrar Sesión</span>
                        <span className="md:hidden">Salir</span>
                    </button>
                </nav>
            </div>
        </aside>
    );
};

ProfileSidebar.propTypes = {
    user: PropTypes.shape({
        full_name: PropTypes.string,
        email: PropTypes.string,
        role: PropTypes.string,
        photo: PropTypes.string
    }).isRequired,
    activeTab: PropTypes.string,
    onTabChange: PropTypes.func
};

export default ProfileSidebar;