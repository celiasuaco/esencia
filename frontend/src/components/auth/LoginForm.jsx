import { useState } from 'react';
import PropTypes from 'prop-types';
import { authService } from '../../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Mail from 'lucide-react/dist/esm/icons/mail';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import * as Yup from 'yup';

const LoginForm = ({ onSwitchForm }) => {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    const loginSchema = Yup.object().shape({
        email: Yup.string()
            .email('Introduce un email válido')
            .required('El email es obligatorio'),
        password: Yup.string()
            .required('La contraseña es obligatoria')
    });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: null }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setErrors({});

        try {
            await loginSchema.validate(formData, { abortEarly: false });

            setLoading(true);
            const data = await authService.login(formData.email, formData.password);

            window.dispatchEvent(new Event('authChange'));

            if (data.user.role === 'ADMIN') {
                navigate('/dashboard');
            } else {
                navigate('/catalog');
            }
        } catch (err) {
            if (err.name === 'ValidationError') {
                const validationErrors = {};
                err.inner.forEach(error => {
                    validationErrors[error.path] = error.message;
                });
                setErrors(validationErrors);
            } else {
                console.error("Login error:", err);
                setErrors({
                    email: ' ',
                    password: 'Email o contraseña incorrectos'
                });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-card max-w-md w-full animate-fade-in text-left">
            <h2 className="text-3xl font-serif text-primary text-center mb-2">Bienvenido</h2>
            <p className="text-secondary text-center mb-8">Ingresa a tu cuenta exclusiva</p>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="login-email" className="text-sm font-medium text-primary ml-1">
                        Email
                    </label>
                    <div className="relative flex items-center group">
                        <Mail
                            className={`absolute left-4 transition-colors z-10 ${errors.email ? 'text-red-400' : 'text-[#A3937B] group-focus-within:text-primary'}`}
                            size={18}
                        />
                        <input
                            id="login-email"
                            name="email"
                            type="text"
                            autoComplete="username"
                            className={`input-field !pl-12 w-full outline-none transition-all ${errors.email
                                ? 'border-red-500 focus:ring-red-100 bg-red-50/30'
                                : 'focus:ring-primary/20 border-gray-200'
                                }`}
                            placeholder="tu@email.com"
                            value={formData.email}
                            onChange={handleInputChange}
                        />
                    </div>
                    {errors.email && errors.email !== ' ' && (
                        <div className="flex items-center gap-1.5 mt-1 ml-1 text-red-600 animate-fade-in">
                            <AlertCircle size={14} />
                            <p className="text-[11px] font-semibold tracking-tight">{errors.email}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-1.5">
                    <label htmlFor="login-password" className="text-sm font-medium text-primary ml-1">
                        Contraseña
                    </label>
                    <div className="relative flex items-center group">
                        <Lock
                            className={`absolute left-4 transition-colors z-10 ${errors.password ? 'text-red-400' : 'text-[#A3937B] group-focus-within:text-primary'}`}
                            size={18}
                        />
                        <input
                            id="login-password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className={`input-field !pl-12 !pr-12 w-full outline-none transition-all ${errors.password
                                ? 'border-red-500 focus:ring-red-100 bg-red-50/30'
                                : 'focus:ring-primary/20 border-gray-200'
                                }`}
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleInputChange}
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
                    className="btn-primary w-full py-4 mt-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                    disabled={loading}
                >
                    {loading ? (
                        <div className="flex items-center gap-2">
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Entrando...</span>
                        </div>
                    ) : 'Entrar'}
                </button>
            </form>

            <div className="mt-8 space-y-3 text-center">
                <p>
                    <Link
                        to="/forgot-password"
                        className="text-secondary text-sm hover:text-primary font-medium transition-all"
                    >
                        ¿Has olvidado tu contraseña?
                    </Link>
                </p>

                <p className="text-secondary text-sm">
                    ¿No tienes cuenta?{' '}
                    <button
                        type="button"
                        onClick={onSwitchForm}
                        className="text-primary font-bold hover:underline transition-all"
                    >
                        Regístrate
                    </button>
                </p>
            </div>
        </div>
    );
};

LoginForm.propTypes = {
    onSwitchForm: PropTypes.func.isRequired
};

export default LoginForm;