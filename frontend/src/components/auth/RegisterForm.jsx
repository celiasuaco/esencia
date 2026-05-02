import { useState } from 'react';
import { authService } from '../../services/authService';
import { useNavigate } from 'react-router-dom';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Mail from 'lucide-react/dist/esm/icons/mail';
import User from 'lucide-react/dist/esm/icons/user';

const RegisterForm = ({ onSwitchForm }) => {
    const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        setLoading(true);

        try {
            const data = await authService.register(formData);

            if (data && data.access) {
                localStorage.setItem('accessToken', data.access);
                localStorage.setItem('refreshToken', data.refresh);
                localStorage.setItem('user', JSON.stringify(data.user));

                navigate('/catalog');
            } else {
                onSwitchForm();
            }
        } catch (err) {
            console.error("Registration error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-card max-w-md w-full animate-fade-in">
            <h2 className="text-3xl font-serif text-primary text-center mb-2">Crear Cuenta</h2>
            <p className="text-secondary text-center mb-8">Únete a nuestra comunidad exclusiva</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="flex flex-col gap-1.5 text-left">
                    <label htmlFor="full_name" className="text-sm font-medium text-primary ml-1">
                        Nombre Completo
                    </label>
                    <div className="relative flex items-center group">
                        <User className="absolute left-4 text-[#A3937B] group-focus-within:text-primary transition-colors z-10" size={18} />
                        <input
                            id="full_name"
                            name="full_name"
                            type="text"
                            autoComplete="name"
                            className="input-field !pl-12 w-full focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Ej. Pepe Pérez"
                            value={formData.full_name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                    <label htmlFor="email_reg" className="text-sm font-medium text-primary ml-1">
                        Email
                    </label>
                    <div className="relative flex items-center group">
                        <Mail className="absolute left-4 text-[#A3937B] group-focus-within:text-primary transition-colors z-10" size={18} />
                        <input
                            id="email_reg"
                            name="email"
                            type="email"
                            autoComplete="email"
                            className="input-field !pl-12 w-full focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                    <label htmlFor="password_reg" className="text-sm font-medium text-primary ml-1">
                        Contraseña
                    </label>
                    <div className="relative flex items-center group">
                        <Lock className="absolute left-4 text-[#A3937B] group-focus-within:text-primary transition-colors z-10" size={18} />
                        <input
                            id="password_reg"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="new-password"
                            className="input-field !pl-12 !pr-12 w-full focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-[#A3937B] hover:text-primary transition-colors z-10 p-1"
                            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    className="btn-primary w-full py-4 mt-6 shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Procesando...
                        </>
                    ) : 'Registrarse'}
                </button>
            </form>

            <p className="mt-8 text-center text-secondary text-sm">
                ¿Ya tienes cuenta?{' '}
                <button onClick={onSwitchForm} className="text-primary font-bold hover:underline transition-all">
                    Inicia sesión
                </button>
            </p>
        </div>
    );
};

export default RegisterForm;