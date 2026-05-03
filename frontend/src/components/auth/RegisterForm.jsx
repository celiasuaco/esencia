import { useState } from 'react';
import PropTypes from 'prop-types';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Mail from 'lucide-react/dist/esm/icons/mail';
import User from 'lucide-react/dist/esm/icons/user';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import * as Yup from 'yup';

const RegisterForm = ({ onSwitchForm }) => {
    const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const registerSchema = Yup.object().shape({
        full_name: Yup.string()
            .required('El nombre es obligatorio'),
        email: Yup.string()
            .email('Introduce un email válido')
            .required('El email es obligatorio'),
        password: Yup.string()
            .required('La contraseña es obligatoria')
            .min(8, 'Debe tener al menos 8 caracteres')
            .matches(/[A-Z]/, 'Debe contener al menos una mayúscula')
            .matches(/\d/, 'Debe contener al menos un número')
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setErrors({});

        try {
            await registerSchema.validate(formData, { abortEarly: false });

            setLoading(true);
            const data = await authService.register(formData);

            if (data?.access) {
                localStorage.setItem('accessToken', data.access);
                localStorage.setItem('refreshToken', data.refresh);
                localStorage.setItem('user', JSON.stringify(data.user));
                window.dispatchEvent(new Event('authChange'));
                navigate('/catalog');
            } else {
                onSwitchForm();
            }
        } catch (err) {
            if (err.name === 'ValidationError') {
                const validationErrors = {};
                err.inner.forEach(error => {
                    validationErrors[error.path] = error.message;
                });
                setErrors(validationErrors);
            } else {
                console.error("Registration error:", err);
                const serverError = err.response?.data?.error || "Error al crear la cuenta.";
                setErrors({ email: serverError });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-card max-w-md w-full animate-fade-in text-left">
            <h2 className="text-3xl font-serif text-primary text-center mb-2">Crear Cuenta</h2>
            <p className="text-secondary text-center mb-8">Únete a nuestra comunidad exclusiva</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="register-full-name" className="text-sm font-medium text-primary ml-1">
                        Nombre Completo
                    </label>
                    <div className="relative flex items-center group">
                        <User
                            className={`absolute left-4 transition-colors z-10 ${errors.full_name ? 'text-red-400' : 'text-[#A3937B] group-focus-within:text-primary'}`}
                            size={18}
                        />
                        <input
                            id="register-full-name"
                            name="full_name"
                            type="text"
                            autoComplete="name"
                            className={`input-field !pl-12 w-full outline-none transition-all ${errors.full_name ? 'border-red-500 focus:ring-red-100 bg-red-50/30' : 'focus:ring-primary/20 border-gray-200'}`}
                            placeholder="Ej. Pepe Pérez"
                            value={formData.full_name}
                            onChange={handleChange}
                        />
                    </div>
                    {errors.full_name && (
                        <div className="flex items-center gap-1.5 mt-1 ml-1 text-red-600 animate-fade-in">
                            <AlertCircle size={14} />
                            <p className="text-[11px] font-semibold tracking-tight">{errors.full_name}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="register-email" className="text-sm font-medium text-primary ml-1">
                        Email
                    </label>
                    <div className="relative flex items-center group">
                        <Mail
                            className={`absolute left-4 transition-colors z-10 ${errors.email ? 'text-red-400' : 'text-[#A3937B] group-focus-within:text-primary'}`}
                            size={18}
                        />
                        <input
                            id="register-email"
                            name="email"
                            type="text"
                            autoComplete="email"
                            className={`input-field !pl-12 w-full outline-none transition-all ${errors.email ? 'border-red-500 focus:ring-red-100 bg-red-50/30' : 'focus:ring-primary/20 border-gray-200'}`}
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>
                    {errors.email && (
                        <div className="flex items-center gap-1.5 mt-1 ml-1 text-red-600 animate-fade-in">
                            <AlertCircle size={14} />
                            <p className="text-[11px] font-semibold tracking-tight">{errors.email}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="register-password" className="text-sm font-medium text-primary ml-1">
                        Contraseña
                    </label>
                    <div className="relative flex items-center group">
                        <Lock
                            className={`absolute left-4 transition-colors z-10 ${errors.password ? 'text-red-400' : 'text-[#A3937B] group-focus-within:text-primary'}`}
                            size={18}
                        />
                        <input
                            id="register-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            className={`input-field !pl-12 !pr-12 w-full outline-none transition-all ${errors.password ? 'border-red-500 focus:ring-red-100 bg-red-50/30' : 'focus:ring-primary/20 border-gray-200'}`}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-[#A3937B] hover:text-primary transition-colors z-10 p-1"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                    {errors.password && (
                        <div className="flex items-center gap-1.5 mt-1 ml-1 text-red-600 animate-fade-in">
                            <AlertCircle size={14} />
                            <p className="text-[11px] font-semibold tracking-tight">{errors.password}</p>
                        </div>
                    )}
                </div>

                <button
                    type="submit"
                    className="btn-primary w-full py-4 mt-6 shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Procesando...</span>
                        </div>
                    ) : 'Registrarse'}
                </button>
            </form>

            <p className="mt-8 text-center text-secondary text-sm">
                ¿Ya tienes cuenta?{' '}
                <button
                    type="button"
                    onClick={onSwitchForm}
                    className="text-primary font-bold hover:underline transition-all"
                >
                    Inicia sesión
                </button>
            </p>
        </div>
    );
};

RegisterForm.propTypes = {
    onSwitchForm: PropTypes.func.isRequired
};

export default RegisterForm;