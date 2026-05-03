import { useState, useRef, useEffect } from 'react';
import { authService } from '../../services/authService';
import Camera from 'lucide-react/dist/esm/icons/camera';
import Save from 'lucide-react/dist/esm/icons/save';
import X from 'lucide-react/dist/esm/icons/x';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import * as Yup from 'yup';

const EditProfileForm = ({ user, onCancel, onUpdateSuccess }) => {
    const API_BASE_URL = 'http://127.0.0.1:8000';

    const [formData, setFormData] = useState({
        full_name: user.full_name || '',
        email: user.email || ''
    });
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const fileInputRef = useRef(null);

    const profileSchema = Yup.object().shape({
        full_name: Yup.string()
            .required('El nombre es obligatorio')
            .min(3, 'El nombre es demasiado corto'),
        email: Yup.string()
            .email('Introduce un email válido')
            .required('El email es obligatorio')
    });

    useEffect(() => {
        return () => {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
        };
    }, [preview]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (preview && preview.startsWith('blob:')) {
                URL.revokeObjectURL(preview);
            }
            setImage(file);
            setPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        try {
            await profileSchema.validate(formData, { abortEarly: false });

            setLoading(true);
            const submissionData = new FormData();
            submissionData.append('full_name', formData.full_name);
            submissionData.append('email', formData.email);
            if (image) submissionData.append('photo', image);

            const updatedUser = await authService.updateProfile(submissionData);
            authService.updateLocalUser(updatedUser);
            onUpdateSuccess();
        } catch (err) {
            if (err.inner) {
                const transformedErrors = {};
                err.inner.forEach(e => { transformedErrors[e.path] = e.message; });
                setErrors(transformedErrors);
            } else if (err.response && err.response.data) {
                setErrors(err.response.data);
            }
            console.error("Error updating profile:", err);
        } finally {
            setLoading(false);
        }
    };

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return null;
        if (photoPath.startsWith('http')) return photoPath;
        const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        return `${API_BASE_URL}${normalizedPath}`;
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col items-center pt-5 space-y-8 animate-fade-in">
            <div className="relative group">
                <button
                    type="button"
                    className="relative cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#5B7B63] focus:ring-offset-4 rounded-full border-none bg-transparent p-0"
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
                            <span className="text-4xl font-serif text-[#A3937B]">
                                {formData.full_name.charAt(0)}
                            </span>
                        )}
                    </div>

                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="text-white w-8 h-8" />
                    </div>
                </button>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleImageChange}
                accept="image/*"
            />

            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#6B7F72] ml-1">Nombre Completo</label>
                    <input
                        name="full_name"
                        type="text"
                        className={`w-full p-3 bg-[#FDFBF9] border rounded-xl outline-none transition-all ${errors.full_name ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E8DDD1] focus:ring-2 focus:ring-[#5B7B63]'
                            }`}
                        value={formData.full_name}
                        onChange={handleInputChange}
                    />
                    {errors.full_name && (
                        <div className="flex items-center gap-1 text-red-500 text-xs mt-1 ml-1">
                            <AlertCircle size={12} />
                            <span>{errors.full_name}</span>
                        </div>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-[#6B7F72] ml-1">Email</label>
                    <input
                        name="email"
                        type="email"
                        className={`w-full p-3 bg-[#FDFBF9] border rounded-xl outline-none transition-all ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-[#E8DDD1] focus:ring-2 focus:ring-[#5B7B63]'
                            }`}
                        value={formData.email}
                        onChange={handleInputChange}
                    />
                    {errors.email && (
                        <div className="flex items-center gap-1 text-red-500 text-xs mt-1 ml-1">
                            <AlertCircle size={12} />
                            <span>{errors.email}</span>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 bg-gradient-to-r from-[#5B7B63] to-[#3D5742] text-white px-8 py-3 rounded-full shadow-lg hover:scale-105 transition-all font-medium min-w-[180px] disabled:opacity-50"
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