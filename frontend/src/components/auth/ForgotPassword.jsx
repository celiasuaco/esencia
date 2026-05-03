import { useState } from 'react';
import PropTypes from 'prop-types';
import { authService } from '../../services/authService';
import Mail from 'lucide-react/dist/esm/icons/mail';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import CheckCircle2 from 'lucide-react/dist/esm/icons/check-circle-2';
import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle';
import UserPlus from 'lucide-react/dist/esm/icons/user-plus';
import * as Yup from 'yup';

export default function ForgotPassword({ onSwitchForm = () => { }, onSwitchToRegister = () => { } }) {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [accountNotFound, setAccountNotFound] = useState(false);

    const forgotPasswordSchema = Yup.object().shape({
        email: Yup.string()
            .email('Introduce un email válido')
            .required('El email es obligatorio')
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrors({});
        setAccountNotFound(false);

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
            } else if (err.response?.status === 404) {
                setAccountNotFound(true);
                setErrors({ email: err });
            } else {
                setErrors({ email: err || "Error de conexión." });
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
                        Se ha enviado un enlace de recuperación a <strong className="text-primary">{email}</strong>.
                    </p>
                    <button type="button" onClick={onSwitchForm} className="btn-primary w-full py-3">
                        Volver al inicio de sesión
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
            <div className="register-card max-w-md w-full shadow-xl border border-[#E8E2D6]">
                <button type="button" onClick={onSwitchForm} className="inline-flex items-center gap-2 text-secondary mb-8 hover:text-primary transition-colors text-sm font-medium">
                    <ArrowLeft size={16} /> Volver al login
                </button>

                <h2 className="text-4xl font-serif text-primary text-center mb-3">Recuperar acceso</h2>
                <p className="text-secondary text-center mb-10 text-sm">Introduce tu email para enviarte instrucciones.</p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-primary ml-1">Email</label>
                        <div className="relative flex items-center">
                            <Mail className={`absolute left-4 z-10 ${errors.email ? 'text-red-400' : 'text-[#A3937B]'}`} size={20} />
                            <input
                                type="text"
                                className={`input-field !pl-12 w-full transition-all ${errors.email ? 'border-red-500 bg-red-50/30' : 'border-gray-200'}`}
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => {
                                    setEmail(e.target.value);
                                    setErrors({});
                                    setAccountNotFound(false);
                                }}
                            />
                        </div>

                        {errors.email && !accountNotFound && (
                            <div className="flex items-center gap-1.5 mt-1 text-red-600 animate-fade-in">
                                <AlertCircle size={14} />
                                <p className="text-[11px] font-semibold">{errors.email}</p>
                            </div>
                        )}

                        {accountNotFound && (
                            <div className="mt-3 p-4 bg-orange-50 border border-orange-100 rounded-xl animate-fade-in">
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={16} className="text-orange-600 mt-0.5 flex-shrink-0" />
                                    <div>
                                        <p className="text-orange-900 text-xs font-bold mb-1">{errors.email}</p>
                                        <p className="text-orange-800/80 text-[11px] mb-3">Invitamos a que te registres para disfrutar de Esencia.</p>
                                        <button
                                            type="button"
                                            onClick={onSwitchToRegister}
                                            className="flex items-center gap-2 text-orange-700 font-bold text-[11px] hover:text-orange-900"
                                        >
                                            <UserPlus size={14} /> Crear una cuenta nueva
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <button type="submit" disabled={loading} className="btn-primary w-full py-4">
                        {loading ? 'Verificando...' : 'Enviar enlace de recuperación'}
                    </button>
                </form>
            </div>
        </div>
    );
}

ForgotPassword.propTypes = {
    onSwitchForm: PropTypes.func.isRequired,
    onSwitchToRegister: PropTypes.func.isRequired
};