import { authService } from '../../services/authService';
import { User, LogOut } from 'lucide-react';

const ProfileSidebar = ({ user, activeTab }) => {
    const API_BASE_URL = 'http://127.0.0.1:8000';

    const initial = user?.full_name ? user.full_name.charAt(0).toUpperCase() : '?';

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith('http')) return photoPath;
        const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        return `${API_BASE_URL}${normalizedPath}`;
    };

    const photoUrl = getPhotoUrl(user?.photo);

    return (
        <aside className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-[#5B7B63]/10 text-center">

                <div className="flex justify-center mb-4">
                    <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#C77C5D] to-[#A86447] flex items-center justify-center text-white text-4xl font-serif shadow-lg overflow-hidden border-4 border-white">

                        <span className="absolute z-0">{initial}</span>

                        {photoUrl && (
                            <img
                                src={photoUrl}
                                className="absolute inset-0 w-full h-full object-cover z-10"
                                alt="Perfil"
                                onError={(e) => {
                                    e.target.style.display = 'none';
                                }}
                            />
                        )}
                    </div>
                </div>

                <h3 className="text-xl font-serif text-[#2C3632]">{user?.full_name}</h3>
                <p className="text-sm text-[#6B7F72] mt-1 break-all px-2">{user?.email}</p>

                <nav className="mt-10 space-y-2 text-left">
                    <button className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium transition-all ${activeTab === 'data'
                        ? 'bg-gradient-to-r from-[#5B7B63] to-[#3D5742] text-white shadow-md'
                        : 'text-[#6B7F72] hover:bg-[#F5F1ED]'
                        }`}>
                        <User className="w-5 h-5" />
                        Mis Datos
                    </button>

                    <button
                        onClick={() => authService.logout()}
                        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium text-red-600 hover:bg-red-50 transition-all mt-8"
                    >
                        <LogOut className="w-5 h-5" />
                        Cerrar Sesión
                    </button>
                </nav>
            </div>
        </aside>
    );
};

export default ProfileSidebar;