import { useState } from 'react';
import { authService } from '../../services/authService';
import { Link, useNavigate } from 'react-router-dom';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Mail from 'lucide-react/dist/esm/icons/mail';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';

const LoginForm = ({ onSwitchForm }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const [error, setError] = useState(null);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setError(null);
        setLoading(true);

        try {
            const data = await authService.login(email, password);

            if (data.user.role === 'ADMIN') {
                navigate('/dashboard');
            } else {
                navigate('/catalog');
            }

            window.location.reload();
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data?.error || "Credenciales incorrectas. Inténtalo de nuevo.");
            setLoading(false);
        }
    };

    return (
        <div className="register-card max-w-md w-full animate-fade-in">
            <h2 className="text-3xl font-serif text-primary text-center mb-2">Bienvenido</h2>
            <p className="text-secondary text-center mb-8">Ingresa a tu cuenta exclusiva</p>

            {error && (
                <div className="mb-6 p-3 bg-red-50 border-l-4 border-red-500 flex items-center gap-3 animate-shake">
                    <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
                    <p className="text-sm text-red-700 font-medium">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="flex flex-col gap-1.5 text-left">
                    <label htmlFor="email" className="text-sm font-medium text-primary ml-1">
                        Email
                    </label>
                    <div className="relative flex items-center group">
                        <Mail
                            className={`absolute left-4 transition-colors z-10 ${error ? 'text-red-400' : 'text-[#A3937B] group-focus-within:text-primary'}`}
                            size={18}
                        />
                        <input
                            id="email"
                            type="email"
                            name="email"
                            autoComplete="username"
                            className={`input-field !pl-12 w-full outline-none transition-all ${error ? 'border-red-500 focus:ring-red-100' : 'focus:ring-primary/20'}`}
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (error) setError(null);
                            }}
                            required
                        />
                    </div>
                </div>

                <div className="flex flex-col gap-1.5 text-left">
                    <label htmlFor="password" className="text-sm font-medium text-primary ml-1">
                        Contraseña
                    </label>
                    <div className="relative flex items-center group">
                        <Lock
                            className={`absolute left-4 transition-colors z-10 ${error ? 'text-red-400' : 'text-[#A3937B] group-focus-within:text-primary'}`}
                            size={18}
                        />
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            className={`input-field !pl-12 !pr-12 w-full outline-none transition-all ${error ? 'border-red-500 focus:ring-red-100' : 'focus:ring-primary/20'}`}
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => {
                                setPassword(e.target.value);
                                if (error) setError(null);
                            }}
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
                    className="btn-primary w-full py-4 mt-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                            Entrando...
                        </>
                    ) : 'Entrar'}
                </button>
            </form>

            <div className="mt-8 space-y-3">
                <p className="text-center">
                    <Link
                        to="/forgot-password"
                        className="text-secondary text-sm hover:text-primary font-medium transition-all"
                    >
                        ¿Has olvidado tu contraseña?
                    </Link>
                </p>

                <p className="text-center text-secondary text-sm">
                    ¿No tienes cuenta?{' '}
                    <button
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

export default LoginForm;