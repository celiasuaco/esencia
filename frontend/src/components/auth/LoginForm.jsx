import { useState } from 'react';
import { authService } from '../../services/authService';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { toast } from 'sonner';

const LoginForm = ({ onSwitchForm }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = await authService.login(email, password);
            toast.success(`Bienvenido de nuevo, ${data.user.full_name}`); // Notificación de éxito

            if (data.user.role === 'ADMIN') {
                window.location.href = '/dashboard';
            } else {
                window.location.href = '/profile';
            }
        } catch (err) {
            toast.error(err); // Usa el error limpio del authService
        }
    };

    return (
        <div className="register-card max-w-md w-full">
            <h2 className="text-3xl font-serif text-primary text-center mb-2">Bienvenido</h2>
            <p className="text-secondary text-center mb-8">Ingresa a tu cuenta exclusiva</p>

            <form onSubmit={handleSubmit} className="space-y-5">
                {/* CAMPO EMAIL */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="email" className="text-sm font-medium text-primary ml-1">
                        Email
                    </label>
                    <div className="relative flex items-center group">
                        <Mail
                            className="absolute left-4 text-[#A3937B] group-focus-within:text-primary transition-colors z-10"
                            size={18}
                        />
                        <input
                            id="email"
                            type="email"
                            className="input-field !pl-12 w-full focus:ring-2 focus:ring-primary/20"
                            placeholder="tu@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                </div>

                {/* CAMPO CONTRASEÑA */}
                <div className="flex flex-col gap-1.5">
                    <label htmlFor="password" className="text-sm font-medium text-primary ml-1">
                        Contraseña
                    </label>
                    <div className="relative flex items-center group">
                        <Lock
                            className="absolute left-4 text-[#A3937B] group-focus-within:text-primary transition-colors z-10"
                            size={18}
                        />
                        <input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            className="input-field !pl-12 !pr-12 w-full focus:ring-2 focus:ring-primary/20"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 text-[#A3937B] hover:text-primary transition-colors z-10"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn-primary w-full py-4 mt-2 shadow-md hover:shadow-lg transition-all active:scale-[0.98]">
                    Entrar
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