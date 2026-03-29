import { useState, useEffect } from 'react';
import { User, LogOut, Edit, Mail } from 'lucide-react';
import { authService } from '../services/authService';
import Navbar from '../components/layout/Navbar';
import EditProfileForm from '../components/auth/EditProfileForm';

export default function ProfilePage() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('data');
    const [isEditing, setIsEditing] = useState(false);
    const [success, setSuccess] = useState('');

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith('http')) return photoPath;
        const baseUrl = 'http://127.0.0.1:8000';
        const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        return `${baseUrl}${normalizedPath}`;
    };

    const fetchUserData = () => {
        const currentUser = authService.getCurrentUser();
        if (currentUser) setUser(currentUser);
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    if (!user) return null;

    const photoUrl = getPhotoUrl(user.photo);

    return (
        <div className="min-h-screen bg-[#FDFBF9]">
            <Navbar />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <h1 className="text-5xl font-serif text-[#2C3632] mb-12">Mi Cuenta</h1>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* Sidebar Izquierda */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-3xl shadow-xl p-8 border border-[#5B7B63]/10">
                            <div className="text-center mb-8">
                                {/* CONTENEDOR DE FOTO CORREGIDO */}
                                <div className="w-28 h-28 bg-gradient-to-br from-[#C77C5D] to-[#A86447] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-4xl text-white font-serif overflow-hidden relative">
                                    <span className="absolute z-0">{user.full_name.charAt(0).toUpperCase()}</span>
                                    {user.photo && (
                                        <img
                                            src={photoUrl}
                                            alt="Perfil"
                                            className="absolute inset-0 w-full h-full object-cover z-10"
                                            onError={(e) => e.target.style.display = 'none'}
                                        />
                                    )}
                                </div>
                                <h2 className="text-xl font-serif text-[#2C3632]">{user.full_name}</h2>
                                <p className="text-sm text-[#6B7F72] mt-1 break-all">{user.email}</p>
                            </div>

                            <nav className="space-y-2">
                                <button
                                    onClick={() => { setActiveTab('data'); setIsEditing(false); }}
                                    className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl transition-all ${activeTab === 'data' ? 'bg-gradient-to-r from-[#5B7B63] to-[#3D5742] text-white shadow-lg' : 'text-[#6B7F72] hover:bg-[#F5F1ED]'}`}
                                >
                                    <User className="w-5 h-5" />
                                    <span className="font-medium">Mis Datos</span>
                                </button>
                                <button onClick={() => authService.logout()} className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[#6B7F72] hover:bg-red-50 hover:text-red-600 transition-all">
                                    <LogOut className="w-5 h-5" />
                                    <span className="font-medium">Cerrar Sesión</span>
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Contenedor Principal */}
                    <div className="lg:col-span-3">
                        <div className="bg-white rounded-3xl shadow-xl p-10 border border-[#5B7B63]/10 h-full">
                            {isEditing ? (
                                <div>
                                    <h2 className="text-2xl font-serif text-[#2C3632] mb-8">Editar Perfil</h2>
                                    <EditProfileForm
                                        user={user}
                                        onCancel={() => setIsEditing(false)}
                                        onUpdateSuccess={(msg) => {
                                            setSuccess(msg);
                                            // IMPORTANTE: Refrescar el usuario tras el cambio
                                            const freshUser = authService.getCurrentUser();
                                            setUser(freshUser);
                                            setIsEditing(false);
                                        }}
                                    />
                                </div>
                            ) : (
                                <div>
                                    <div className="flex items-center justify-between mb-10 pb-6 border-b border-[#E8DDD1]">
                                        <h2 className="text-2xl font-serif text-[#2C3632]">Datos Personales</h2>
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="flex items-center gap-2 text-[#C77C5D] hover:text-[#A86447] transition-colors font-medium"
                                        >
                                            <Edit className="w-4 h-4" />
                                            <span>Editar</span>
                                        </button>
                                    </div>

                                    {success && <p className="mb-6 p-4 bg-green-50 text-green-700 rounded-2xl text-center border border-green-100">{success}</p>}

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-12 gap-x-8 py-10">
                                        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                                            <label className="flex items-center gap-2 text-sm text-[#6B7F72] font-medium">
                                                <User className="w-4 h-4" /> Nombre completo
                                            </label>
                                            <p className="text-[#2C3632] text-xl font-serif border-b-2 border-[#F5F1ED] pb-1 w-full md:w-auto">
                                                {user.full_name}
                                            </p>
                                        </div>

                                        <div className="flex flex-col items-center md:items-start text-center md:text-left space-y-2">
                                            <label className="flex items-center gap-2 text-sm text-[#6B7F72] font-medium">
                                                <Mail className="w-4 h-4" /> Correo Electrónico
                                            </label>
                                            <p className="text-[#2C3632] text-xl font-serif border-b-2 border-[#F5F1ED] pb-1 w-full md:w-auto">
                                                {user.email}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}