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
            <div className="bg-white p-8 rounded-3xl shadow-xl shadow-[#324339]/5 border border-[#324339]/5 text-center">

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

                <h3 className="text-xl font-serif text-[#324339] italic">{user?.full_name}</h3>
                <p className="text-xs text-[#324339]/50 mt-1 uppercase tracking-widest break-all px-2">{user?.email}</p>

                <nav className="mt-12 space-y-2 text-left">
                    <button className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-sm font-medium transition-all ${activeTab === 'data'
                            ? 'bg-[#324339] text-white shadow-lg shadow-[#324339]/20'
                            : 'text-[#324339]/60 hover:bg-[#FDFBF9]'
                        }`}>
                        <User className="w-5 h-5" />
                        <span>Mis Datos</span>
                    </button>

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

export default ProfileSidebar;