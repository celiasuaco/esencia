import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import Navbar from '../../components/layout/Navbar'; // Reutilizamos tu Navbar

const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Determinamos el modo inicial basándonos en la URL (o por defecto login)
    const isRegisterInitial = location.pathname === '/register';
    const [showRegister, setShowRegister] = useState(isRegisterInitial);

    const handleSwitchForm = () => {
        // Cambiamos el estado interno
        setShowRegister(!showRegister);

        // Y actualizamos la URL (para que el usuario pueda compartir el link correcto)
        if (!showRegister) {
            navigate('/register', { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            <Navbar /> {/* Añadimos la Navbar para consistencia visual */}

            <main className="flex items-center justify-center p-4 mt-20">
                <div className="w-full max-w-md transition-all duration-300 ease-in-out">
                    {showRegister ? (
                        <RegisterForm onSwitchForm={handleSwitchForm} />
                    ) : (
                        <LoginForm onSwitchForm={handleSwitchForm} />
                    )}
                </div>
            </main>
        </div>
    );
};

export default AuthPage;