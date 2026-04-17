// src/pages/CheckoutSuccessPage.jsx
import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Package, ArrowRight, Loader2 } from 'lucide-react';
import { checkoutService } from '../services/checkoutService';

export default function CheckoutSuccessPage() {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('verifying');

    useEffect(() => {
        const confirmPayment = async () => {
            const sessionId = searchParams.get('session_id');

            if (!sessionId) {
                console.error("No se encontró session_id en la URL");
                setStatus('error');
                return;
            }

            console.log("🔍 Iniciando confirmación para sesión:", sessionId);

            try {
                await checkoutService.confirmPayment(sessionId);

                console.log("Pago confirmado y stock actualizado correctamente");
                setStatus('success');
            } catch (err) {
                console.error("Error en la confirmación del pago:", err);
                setStatus('error');
            }
        };

        confirmPayment();
    }, [searchParams]);

    return (
        <div className="min-h-screen bg-[#FDFBF9] flex items-center justify-center px-6">
            <div className="max-w-md w-full bg-white p-12 rounded-[3rem] shadow-[0_20px_60px_rgba(50,67,57,0.08)] text-center border border-[#324339]/5">

                {status === 'verifying' && (
                    <div className="flex flex-col items-center gap-4">
                        <Loader2 className="animate-spin text-[#A86447]" size={40} />
                        <p className="font-serif italic text-[#324339]">Verificando tu pago...</p>
                    </div>
                )}

                {status === 'success' && (
                    <>
                        <div className="flex justify-center mb-8">
                            <div className="bg-[#324339]/5 p-6 rounded-full">
                                <CheckCircle2 size={60} className="text-[#324339]" strokeWidth={1} />
                            </div>
                        </div>

                        <h1 className="text-4xl font-serif italic text-[#324339] mb-4">¡Pedido Confirmado!</h1>
                        <p className="text-[#324339]/60 text-sm leading-relaxed mb-10">
                            Gracias por confiar en <span className="text-[#A86447] font-bold">Esencia</span>.
                            Tu joya está siendo preparada por nuestros artesanos.
                        </p>

                        <div className="space-y-4">
                            <Link to="/orders" className="flex items-center justify-center gap-3 w-full bg-[#324339] text-white py-4 rounded-full font-bold text-[10px] uppercase tracking-widest hover:bg-[#A86447] transition-all group">
                                <Package size={16} />
                                Ver mis pedidos
                                <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <div className="text-center">
                        <h2 className="text-2xl font-serif text-red-600 mb-4">Algo ha fallado</h2>
                        <p className="text-sm text-gray-500 mb-6">No pudimos verificar el pago automáticamente. Si el cobro se ha realizado, contacta con soporte.</p>
                        <Link to="/catalog" className="text-[#324339] font-bold underline">Volver al catálogo</Link>
                    </div>
                )}
            </div>
        </div>
    );
}