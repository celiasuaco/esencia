import { useState } from 'react';
import { authService } from '../../services/authService';

const LoginForm = ({ onSwitchForm }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // 1. Llamamos al login y capturamos la respuesta directa
            const data = await authService.login(email, password);

            // 2. Usamos los datos que vienen directos de la API (no del storage)
            const user = data.user;

            if (user && user.role === 'ADMIN') {
                window.location.href = '/dashboard';
            } else {
                window.location.href = '/profile';
            }
        } catch (err) {
            setError("Email o contraseña incorrectos");
        }
    };

    return (
        <div className="register-card"> {/* Mismo contenedor blanco que el registro */}
            <h2 className="text-3xl font-serif text-primary text-center mb-2">Bienvenido</h2>
            <p className="text-secondary text-center mb-8">Ingresa a tu cuenta exclusiva</p>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        className="input-field"
                        placeholder="tu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Contraseña</label>
                    <input
                        id="password"
                        type="password"
                        className="input-field"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="btn-primary mt-4">Entrar</button>
            </form>

            <p className="mt-6 text-center text-secondary text-sm">
                ¿No tienes cuenta?{' '}
                <button onClick={onSwitchForm} className="text-primary font-medium hover:underline">
                    Regístrate
                </button>
            </p>
        </div>
    );
};

export default LoginForm;