import { useState } from 'react';
import { authService } from '../../services/authService';
import { toast } from 'sonner'; // 1. Importamos toast

const RegisterForm = ({ onSwitchForm }) => {
    const [formData, setFormData] = useState({ email: '', password: '', full_name: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await authService.register(formData);
            // 2. Éxito con Toast
            toast.success("¡Cuenta creada con éxito!", {
                description: "Ya puedes acceder a tu cuenta exclusiva."
            });
            onSwitchForm();
        } catch (err) {
            toast.error(err);
        }
    };

    return (
        <div className="register-card">
            <h2 className="text-3xl font-serif text-primary text-center mb-2">Crear Cuenta</h2>
            <p className="text-secondary text-center mb-8">Únete a nuestra comunidad exclusiva</p>


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