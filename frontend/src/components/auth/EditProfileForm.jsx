import { useState, useRef } from 'react';
import { authService } from '../../services/authService';
import { Camera, Save, X } from 'lucide-react';

const EditProfileForm = ({ user, onCancel, onUpdateSuccess }) => {

    const API_BASE_URL = 'http://127.0.0.1:8000';

    const [fullName, setFullName] = useState(user.full_name);
    const [email, setEmail] = useState(user.email);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData();
        formData.append('full_name', fullName);
        formData.append('email', email);
        if (image) formData.append('photo', image);

        try {
            const updatedUser = await authService.updateProfile(formData);
            authService.updateLocalUser(updatedUser);
            onUpdateSuccess('Perfil actualizado correctamente');
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith('http')) return photoPath;

        // Normalizamos la ruta para asegurar que empiece con una sola barra
        const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        return `${API_BASE_URL}${normalizedPath}`;
    };


    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-8">

            {/* Selector de Foto Circular - CAMBIADO DE <div> A <button> PARA SONARQUBE */}
            <button
                type="button"
                className="relative group cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5B7B63] focus:ring-offset-4 rounded-full border-none bg-transparent p-0"
                onClick={() => fileInputRef.current.click()}
                aria-label="Cambiar foto de perfil"
            >
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#F5F1ED] shadow-inner bg-gray-100 flex items-center justify-center">
                    {preview || user.photo ? (
                        <img
                            src={preview || getPhotoUrl(user.photo)}
                            className="w-full h-full object-cover"
                            alt="Vista previa de perfil"
                        />
                    ) : (
                        <span className="text-4xl font-serif text-[#A3937B]">{fullName.charAt(0)}</span>
                    )}
                </div>

                {/* Overlay de cámara */}
                <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity">
                    <Camera className="text-white w-8 h-8" />
                </div>
            </button>

            <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={handleImageChange}
                accept="image/*"
            />

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#6B7F72]">Nombre Completo</label>
                    <input
                        type="text"
                        className="w-full p-3 bg-[#FDFBF9] border border-[#E8DDD1] rounded-xl focus:ring-2 focus:ring-[#5B7B63] outline-none"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#6B7F72]">Email</label>
                    <input
                        type="email"
                        className="w-full p-3 bg-[#FDFBF9] border border-[#E8DDD1] rounded-xl focus:ring-2 focus:ring-[#5B7B63] outline-none"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </div>
            </div>

            {/* Botones Centralizados */}
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#5B7B63] to-[#3D5742] text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-all font-medium min-w-[180px] disabled:opacity-50 disabled:hover:scale-100"
                >
                    <Save className="w-4 h-4" />
                    {loading ? 'Guardando...' : 'Guardar Cambios'}
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="flex items-center justify-center gap-2 border border-[#A3937B] text-[#A3937B] px-8 py-3 rounded-full hover:bg-[#F5F1ED] transition-all font-medium min-w-[180px]"
                >
                    <X className="w-4 h-4" />
                    Cancelar
                </button>
            </div>
        </form>
    );
};

export default EditProfileForm;