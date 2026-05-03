import { useState } from 'react';
import PropTypes from 'prop-types';
import { authService } from '../../services/authService';
import Mail from 'lucide-react/dist/esm/icons/mail';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import * as Yup from 'yup';

export default function ForgotPassword({ onSwitchForm }) {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    const forgotPasswordSchema = Yup.object().shape({
        email: Yup.string()
            .email('Introduce un email válido')
            .required('El email es obligatorio')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});

        try {
            await forgotPasswordSchema.validate({ email }, { abortEarly: false });

            setLoading(true);
            await authService.sendPasswordResetEmail(email);
            setSent(true);
        } catch (err) {
            if (err.name === 'ValidationError') {
                const validationErrors = {};
                err.inner.forEach(error => {
                    validationErrors[error.path] = error.message;
                });
                setErrors(validationErrors);
            } else {
                console.error("Error sending password reset email:", err);
                setErrors({ email: err.response?.data?.error || "No pudimos procesar tu solicitud. Inténtalo más tarde." });
            }
        } finally {
            setLoading(false);
        }
    };

    if (sent) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
                <div className="register-card text-center max-w-md w-full animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-green-50 rounded-full mb-6">
                        <CheckCircle2 className="text-green-600 w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-serif text-primary mb-4">¡Correo enviado!</h2>
                    <p className="text-secondary mb-8 leading-relaxed">
                        Si el correo <strong className="text-primary">{email}</strong> está registrado, recibirás un enlace para restablecer tu contraseña en unos minutos.
                    </p>
                    <button
                        type="button"
                        onClick={onSwitchForm}
                        className="btn-primary inline-block w-full py-3 text-center transition-all hover:opacity-90"
                    >
                        Volver al inicio de sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
            <div className="register-card max-w-md w-full shadow-xl border border-[#E8E2D6]">
                <button
                    type="button"
                    onClick={onSwitchForm}
                    className="inline-flex items-center gap-2 text-secondary mb-8 hover:text-primary transition-colors text-sm font-medium group"
                >
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Volver al login
                </button>

                <h2 className="text-4xl font-serif text-primary text-center mb-3">Recuperar acceso</h2>
                <p className="text-secondary text-center mb-10 text-sm leading-relaxed">
                    Introduce tu email y te enviaremos las <br /> instrucciones de recuperación.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-2 text-left">
                        <label htmlFor="forgot-password-email" className="text-sm font-medium text-primary ml-1">
                            Email
                        </label>

                        <div className="relative flex items-center">
                            <Mail
                                className={`absolute left-4 transition-colors z-10 ${errors.email ? 'text-red-400' : 'text-[#A3937B]'}`}
                                size={20}
                            />
                            <input
                                id="forgot-password-email"
                                type="text"
                                name="email"
                                autoComplete="email"
                                className={`input-field !pl-12 w-full focus:ring-2 outline-none transition-all ${errors.email
                                    ? 'border-red-500 focus:ring-red-100 bg-red-50/30'
                                    : 'focus:ring-primary/20 border-gray-200'
                                    }`}
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    if (Object.keys(errors).length > 0) setErrors({});
                                }}
                            />
                        </div>

                        {errors.email && (
                            <div className="flex items-center gap-1.5 mt-1 ml-1 text-red-600 animate-fade-in">
                                <AlertCircle size={14} className="flex-shrink-0" />
                                <p className="text-[11px] font-semibold tracking-tight">{errors.email}</p>
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98] transition-all"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                Enviando...
                            </span>
                        ) : 'Enviar enlace de recuperación'}
                    </button>
                </form>

                <div className="mt-10 pt-6 border-t border-[#FDFBF7] text-center">
                    <p className="text-secondary text-sm">
                        ¿Recordaste tu contraseña?{' '}
                        <button
                            type="button"
                            onClick={onSwitchForm}
                            className="text-primary font-bold hover:underline"
                        >
                            Inicia sesión
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
}

ForgotPassword.propTypes = {
    onSwitchForm: PropTypes.func.isRequired
};