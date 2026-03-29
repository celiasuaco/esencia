import { useState } from 'react';
import { authService } from '../../services/authService';

const RegisterForm = ({ onSwitchForm }) => {
    const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await authService.register(formData);
            alert("¡Cuenta creada con éxito!");
            onSwitchForm();
        } catch (err) {
            setError(typeof err === 'string' ? err : 'Error al crear cuenta');
        }
    };

    return (
        <div className="register-card"> {/* Usamos tu clase original */}
            <h2 className="text-3xl font-serif text-primary text-center mb-2">Crear Cuenta</h2>
            <p className="text-secondary text-center mb-8">Únete a nuestra comunidad exclusiva</p>

            {error && <p className="text-red-500 text-sm mb-4 text-center">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="input-group">
                    <label htmlFor="full_name">Nombre Completo</label>
                    <input
                        id="full_name"
                        type="text"
                        className="input-field"
                        placeholder="Ej. Celia Suárez"
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        required
                    />
                </div>
                <div className="input-group">
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        className="input-field"
                        placeholder="pepe@email.com"
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>
                <button type="submit" className="btn-primary mt-4">Registrarse</button>
            </form>

            <p className="mt-6 text-center text-secondary text-sm">
                ¿Ya tienes cuenta?{' '}
                <button onClick={onSwitchForm} className="text-primary font-medium hover:underline">
                    Inicia sesión
                </button>
            </p>
        </div>
    );
};

export default RegisterForm;