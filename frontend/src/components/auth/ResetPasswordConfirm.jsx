import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react';

export default function ResetPasswordConfirm() {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.confirmPasswordReset(uid, token, password);
            alert("Contraseña actualizada con éxito. Ya puedes iniciar sesión.");
            navigate('/login');
        } catch (err) {
            alert("El enlace ha expirado o es inválido. Solicita uno nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
            <div className="register-card max-w-md w-full shadow-xl border border-[#E8E2D6]">

                {/* Icono decorativo de seguridad */}
                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-[#FDFBF7] rounded-full flex items-center justify-center border border-[#E8E2D6]">
                        <ShieldCheck className="text-primary w-8 h-8" />
                    </div>
                </div>

                <h2 className="text-3xl font-serif text-primary text-center mb-2">Nueva contraseña</h2>
                <p className="text-secondary text-center mb-10 text-sm leading-relaxed">
                    Estás a un paso de recuperar tu cuenta. <br /> Elige tu nueva clave de acceso.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="password" className="text-sm font-medium text-primary ml-1">
                            Nueva Contraseña
                        </label>

                        <div className="relative flex items-center group">
                            <Lock
                                className="absolute left-4 text-[#A3937B] group-focus-within:text-primary transition-colors z-10"
                                size={18}
                            />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                className="input-field !pl-12 !pr-12 w-full focus:ring-2 focus:ring-primary/20 outline-none"
                                placeholder="Escribe tu nueva contraseña"
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

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Actualizando...
                            </span>
                        ) : 'Restablecer contraseña'}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        onClick={() => navigate('/login')}
                        className="text-secondary text-sm hover:text-primary transition-colors"
                    >
                        Cancelar y volver al login
                    </button>
                </div>
            </div>
        </div>
    );
}