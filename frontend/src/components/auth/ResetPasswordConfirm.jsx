import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import Lock from 'lucide-react/dist/esm/icons/lock';
import Eye from 'lucide-react/dist/esm/icons/eye';
import EyeOff from 'lucide-react/dist/esm/icons/eye-off';
import ShieldCheck from 'lucide-react/dist/esm/icons/shield-check';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import * as Yup from 'yup';

export default function ResetPasswordConfirm() {
    const { uid, token } = useParams();
    const navigate = useNavigate();
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const [errors, setErrors] = useState({});

    const resetPasswordSchema = Yup.object().shape({
        password: Yup.string()
            .required('La contraseña es obligatoria')
            .min(8, 'La contraseña debe tener al menos 8 caracteres')
            .matches(/[A-Z]/, 'Debe contener al menos una letra mayúscula')
            .matches(/\d/, 'Debe contener al menos un número')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;

        setErrors({});

        try {
            await resetPasswordSchema.validate({ password }, { abortEarly: false });

            setLoading(true);
            await authService.confirmPasswordReset(uid, token, password);
            navigate('/login');
        } catch (err) {
            if (err.name === 'ValidationError') {
                const validationErrors = {};
                err.inner.forEach(error => {
                    validationErrors[error.path] = error.message;
                });
                setErrors(validationErrors);
            } else {
                console.error("Error resetting password:", err);
                setErrors({ password: "El enlace ha expirado o no es válido." });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
            <div className="register-card max-w-md w-full shadow-xl border border-[#E8E2D6] animate-fade-in">

                <div className="flex justify-center mb-6">
                    <div className="w-16 h-16 bg-[#FDFBF7] rounded-full flex items-center justify-center border border-[#E8E2D6]">
                        <ShieldCheck className={`w-8 h-8 ${errors.password ? 'text-red-500' : 'text-primary'}`} />
                    </div>
                </div>

                <h2 className="text-3xl font-serif text-primary text-center mb-2">Nueva contraseña</h2>
                <p className="text-secondary text-center mb-10 text-sm leading-relaxed">
                    Estás a un paso de recuperar tu cuenta. <br /> Elige tu nueva clave de acceso.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-2 text-left">
                        <label htmlFor="reset-password-input" className="text-sm font-medium text-primary ml-1">
                            Nueva Contraseña
                        </label>

                        <div className="relative flex items-center group">
                            <Lock
                                className={`absolute left-4 transition-colors z-10 ${errors.password ? 'text-red-400' : 'text-[#A3937B] group-focus-within:text-primary'}`}
                                size={18}
                            />
                            <input
                                id="reset-password-input"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                className={`input-field !pl-12 !pr-12 w-full focus:ring-2 outline-none transition-all ${errors.password
                                    ? 'border-red-500 focus:ring-red-100 bg-red-50/30'
                                    : 'focus:ring-primary/20 border-gray-200'
                                    }`}
                                placeholder="Escribe tu nueva contraseña"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    if (errors.password) setErrors({});
                                }}
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

                        {errors.password && (
                            <div className="flex items-center gap-1.5 mt-1 ml-1 text-red-600 animate-fade-in">
                                <AlertCircle size={14} className="flex-shrink-0" />
                                <p className="text-[11px] font-semibold tracking-tight">{errors.password}</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 flex items-center justify-center gap-2 transform active:scale-[0.98] transition-all disabled:opacity-70 shadow-md"
                    >
                        {loading ? (
                            <div className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Actualizando...</span>
                            </div>
                        ) : (
                            'Restablecer contraseña'
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-secondary text-sm hover:text-primary transition-colors font-medium"
                    >
                        Cancelar y volver al login
                    </button>
                </div>
            </div>
        </div>
    );
}