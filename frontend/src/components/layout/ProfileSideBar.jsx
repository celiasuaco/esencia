import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { User, LogOut, Package, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';

const ProfileSidebar = ({ user: initialUser, activeTab, onTabChange }) => {
    // Estado local para manejar los datos frescos del backend
    const [userData, setUserData] = useState(initialUser);
    const [fetching, setFetching] = useState(false);

    const API_BASE_URL = 'http://127.0.0.1:8000';

    // Efecto para sincronizar con el backend al cargar el componente
    useEffect(() => {
        const refreshUserData = async () => {
            setFetching(true);
            try {
                // Llamada al nuevo método de authService
                const freshData = await authService.getProfile();
                setUserData(freshData);
                console.log("Datos sincronizados en Sidebar:", freshData);
            } catch (error) {
                console.error("Error al refrescar perfil:", error);
            } finally {
                setFetching(false);
            }
        };

        refreshUserData();
    }, []);

    // Actualizar estado local si la prop 'user' cambia desde fuera
    useEffect(() => {
        setUserData(initialUser);
    }, [initialUser]);

    const initial = userData?.full_name ? userData.full_name.charAt(0).toUpperCase() : '?';

    // Verificación de rol (CLIENT en mayúsculas según tu lógica)
    const isClient = userData && userData.role === 'CLIENT';

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith('http')) return photoPath;
        const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        return `${API_BASE_URL}${normalizedPath}`;
    };

    const photoUrl = getPhotoUrl(userData?.photo);

    return (
        <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-[#324339]/5 border border-[#324339]/5 text-center relative overflow-hidden">

                {/* Indicador de carga sutil */}
                {fetching && (
                    <div className="absolute top-2 right-2">
                        <Loader2 className="w-3 h-3 animate-spin text-[#A86447]/40" />
                    </div>
                )}

                <div className="flex justify-center mb-6">
                    <div className="relative w-28 h-28 rounded-full bg-gradient-to-br from-[#A86447] to-[#324339] flex items-center justify-center text-white text-4xl font-serif shadow-xl overflow-hidden border-4 border-white">
                        <span className="absolute z-0">{initial}</span>
                        {photoUrl && (
                            <img
                                src={photoUrl}
                                className="absolute inset-0 w-full h-full object-cover z-10"
                                alt="Perfil"
                                onError={(e) => { e.target.style.display = 'none'; }}
                            />
                        )}
                    </div>
                </div>

                <h3 className="text-xl font-serif text-[#324339] italic">{userData?.full_name}</h3>
                <p className="text-xs text-[#324339]/50 mt-1 uppercase tracking-widest break-all px-2">
                    {userData?.email}
                </p>

                <nav className="mt-12 space-y-2 text-left">
                    {/* Botón Mis Datos */}
                    <button
                        onClick={() => onTabChange?.('data')}
                        className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium transition-all ${activeTab === 'data'
                                ? 'bg-[#324339] text-white shadow-lg shadow-[#324339]/20'
                                : 'text-[#324339]/60 hover:bg-[#FDFBF9]'
                            }`}
                    >
                        <User className="w-5 h-5" />
                        <span>Mis Datos</span>
                    </button>

                    {/* Apartado Mis Pedidos - Solo para Clientes */}
                    {isClient && (
                        <button
                            onClick={() => onTabChange?.('orders')}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium transition-all ${activeTab === 'orders'
                                    ? 'bg-[#324339] text-white shadow-lg shadow-[#324339]/20'
                                    : 'text-[#324339]/60 hover:bg-[#FDFBF9]'
                                }`}
                        >
                            <Package className="w-5 h-5" />
                            <span>Mis Pedidos</span>
                        </button>
                    )}

                    <button
                        onClick={() => authService.logout()}
                        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium text-red-600/80 hover:bg-red-50 transition-all mt-10"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Cerrar Sesión</span>
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