import { useState } from 'react';
import { authService } from '../../services/authService';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await authService.sendPasswordResetEmail(email);
            setSent(true);
        } catch {
            alert("Error al enviar el correo. Inténtalo de nuevo.");
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
                    <Link to="/login" className="btn-primary inline-block w-full py-3 text-center">
                        Volver al inicio de sesión
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF7] p-4">
            <div className="register-card max-w-md w-full shadow-xl border border-[#E8E2D6]">
                <Link to="/login" className="inline-flex items-center gap-2 text-secondary mb-8 hover:text-primary transition-colors text-sm font-medium group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Volver al login
                </Link>

                <h2 className="text-4xl font-serif text-primary text-center mb-3">Recuperar acceso</h2>
                <p className="text-secondary text-center mb-10 text-sm leading-relaxed">
                    Introduce tu email y te enviaremos las <br /> instrucciones de recuperación.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex flex-col gap-2">
                        <label htmlFor="email" className="text-sm font-medium text-primary ml-1">
                            Email
                        </label>

                        {/* CONTENEDOR DE ENTRADA CORREGIDO */}
                        <div className="relative flex items-center">
                            <Mail
                                className="absolute left-4 text-[#A3937B] pointer-events-none z-10"
                                size={20}
                            />
                            <input
                                id="email"
                                type="email"
                                required
                                // He añadido !pl-12 para forzar el padding izquierdo y evitar que se pise con el icono
                                className="input-field !pl-12 w-full focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-4 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98] transition-all"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                {' '}Enviando...
                            </span>
                        ) : 'Enviar enlace de recuperación'}
                    </button>
                </form>

                <div className="mt-10 pt-6 border-t border-[#FDFBF7] text-center">
                    <p className="text-secondary text-sm">
                        ¿Recordaste tu contraseña?{' '}
                        <Link to="/login" className="text-primary font-bold hover:underline">
                            Inicia sesión
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}