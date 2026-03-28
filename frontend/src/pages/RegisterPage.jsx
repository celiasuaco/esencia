import { useState } from 'react';
import { registerUser } from '../services/authService';

const RegisterPage = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await registerUser(formData);
            alert("¡Bienvenida a Esencia!");
        } catch (err) {
            console.error(err);
            alert("Hubo un error al crear tu cuenta");
        }
    };

    return (
        <div className="form-container">
            <div className="register-card">
                <h1 className="text-3xl text-center text-primary mb-2">Crear Cuenta</h1>
                <p className="text-center text-muted-foreground mb-8 font-sans">Únete a nuestra comunidad exclusiva</p>

                <form onSubmit={handleSubmit}>
                    <div className="input-group">
                        <label>Nombre Completo</label>
                        <input
                            className="input-field"
                            type="text"
                            placeholder="Ej. Pepe Pérez"
                            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <label>Email</label>
                        <input
                            className="input-field"
                            type="email"
                            placeholder="pepe@email.com"
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div className="input-group">
                        <label>Contraseña</label>
                        <input
                            className="input-field"
                            type="password"
                            placeholder="••••••••"
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        />
                    </div>

                    <button type="submit" className="btn-primary">
                        Registrarse
                    </button>
                </form>
            </div>
        </div>
    );
};

export default RegisterPage;