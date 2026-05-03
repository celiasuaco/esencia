import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';

const AuthPage = () => {
    const location = useLocation();
    const navigate = useNavigate();

    const isRegisterInitial = location.pathname === '/register';
    const [showRegister, setShowRegister] = useState(isRegisterInitial);

    useEffect(() => {
        const checkExistingAuth = () => {
            if (authService.isAuthenticated()) {
                const user = authService.getCurrentUser();
                const target = user?.role === 'ADMIN' ? '/dashboard' : '/catalog';
                navigate(target, { replace: true });
            }
        };

        const handleGlobalAuthChange = () => {
            checkExistingAuth();
        };

        globalThis.addEventListener('authChange', handleGlobalAuthChange);

        checkExistingAuth();

        return () => {
            globalThis.removeEventListener('authChange', handleGlobalAuthChange);
        };
    }, [navigate]);

    const handleSwitchForm = () => {
        const nextState = !showRegister;
        setShowRegister(nextState);

        if (nextState) {
            navigate('/register', { replace: true });
        } else {
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="min-h-screen pt-0 bg-[#FDFBF7]">
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