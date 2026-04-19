import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';
import { orderService } from '../services/orderService';
import { checkoutService } from '../services/checkoutService';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, ShieldCheck } from 'lucide-react';
import { authService } from '../services/authService';
import AddressModal from '../components/order/AddressModal';
import { toast } from 'sonner';

export default function CartPage() {
    const isAuthenticated = authService.isAuthenticated();
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Función que dispara el proceso final
    const handleConfirmAddress = async (direccionConfirmada) => {
        setIsModalOpen(false);
        const toastId = toast.loading("Iniciando proceso de pago seguro...");

        try {
            const { url } = await checkoutService.createPaymentSession(direccionConfirmada);

            if (url) {
                toast.success("Redirigiendo a Stripe...", { id: toastId });
                window.location.href = url;
            } else {
                throw new Error("No se recibió la URL de pago");
            }
        } catch (error) {
            console.error("Error en el proceso de compra:", error);
            toast.error("Hubo un fallo al preparar tu pedido", {
                id: toastId,
                description: error.response?.data?.error || "Inténtalo de nuevo."
            });
        }
    };

    const API_BASE_URL = 'http://localhost:8000';

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return "/default-product.png";
        if (photoPath.startsWith('http')) return photoPath;
        const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        return `${API_BASE_URL}${normalizedPath}`;
    };

    const loadCart = async () => {
        try {
            const data = await cartService.getCart();
            setCart(data);
        } catch (err) {
            console.error("Error al cargar el carrito:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCart(); }, []);

    const handleUpdateQuantity = async (item, newQuantity) => {
        if (newQuantity < 1) return;

        const idToUpdate = isAuthenticated ? item.id : item.product;

        try {
            await cartService.updateQuantity(idToUpdate, newQuantity);
            loadCart();
        } catch (err) {
            console.error("Error al actualizar cantidad:", err);
        }
    };

    const handleRemove = async (item) => {
        const idToRemove = isAuthenticated ? item.id : item.product;
        try {
            await cartService.removeItem(idToRemove);
            loadCart();
        } catch (err) {
            console.error("Error al eliminar el producto:", err);
        }
    };

    const handleFinalizarCompra = async () => {
        if (!isAuthenticated) {
            toast.error("Identificación requerida", {
                description: "Por favor, inicia sesión para finalizar tu pedido."
            });
            navigate('/login', { state: { from: '/cart' } });
            return;
        }

        const direccionUsuario = window.prompt("Por favor, introduce tu dirección de envío:", "Calle Mayor 1, Madrid");

        if (!direccionUsuario) {
            toast.error("La dirección es obligatoria para el envío.");
            return;
        }

        const toastId = toast.loading("Iniciando proceso de pago seguro...");

        try {
            const order = await orderService.createOrder(direccionUsuario);

            const { url } = await checkoutService.createPaymentSession(order.id);

            if (url) {
                toast.success("Redirigiendo a Stripe...", { id: toastId });
                window.location.href = url;
            } else {
                throw new Error("No se recibió la URL de pago");
            }
        } catch (error) {
            console.error("Error al procesar el pedido:", error);
            toast.error("Error al procesar el pedido", {
                id: toastId,
                description: error.response?.data?.error || "Inténtalo de nuevo en unos minutos."
            });
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9] font-serif italic text-[#324339]">
            <span className="animate-pulse text-xl">Preparando tu selección...</span>
        </div>
    );

    if (!cart || cart.items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#FDFBF9] px-4 text-center">
                <ShoppingBag size={50} className="text-[#A86447] mb-6 opacity-40" />
                <h2 className="text-4xl font-serif text-[#324339] mb-4 italic">Tu bolsa está vacía</h2>
                <Link to="/catalog" className="mt-4 bg-[#324339] text-white px-10 py-4 rounded-full uppercase tracking-widest text-[10px] font-bold hover:bg-[#A86447] transition-all">
                    Explorar Colección
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF9] pt-4 pb-20">
            <AddressModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={handleConfirmAddress}
            />
            <div className="max-w-6xl mx-auto px-6">

                <button
                    onClick={() => navigate('/catalog')}
                    className="flex items-center gap-2 text-[#324339]/40 hover:text-[#A86447] transition-colors text-[10px] uppercase tracking-[0.25em] font-bold mb-6 group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                    Seguir Comprando
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">

                    {/* Lista de Productos */}
                    <div className="space-y-6">
                        <h1 className="text-4xl font-serif text-[#324339] italic mb-8">Mi Selección</h1>

                        <div className="space-y-6">
                            {cart.items.map((item) => (
                                <div key={item.id || item.product} className="flex gap-6 bg-white p-5 rounded-[2rem] border border-[#324339]/5 shadow-[0_10px_30px_rgba(50,67,57,0.03)] hover:border-[#A86447]/30 transition-all duration-500">
                                    <div className="w-32 h-32 bg-[#FDFBF9] rounded-[1.5rem] overflow-hidden flex-shrink-0 border border-[#324339]/5">
                                        <img
                                            src={getPhotoUrl(item.product_details.photo)}
                                            alt={item.product_details.name}
                                            className="w-full h-full object-contain p-2"
                                        />
                                    </div>

                                    <div className="flex-grow flex flex-col justify-between py-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <span className="text-[9px] uppercase tracking-widest text-[#A86447] font-bold block mb-1">
                                                    {item.product_details.category_display || "Joyería"}
                                                </span>
                                                <h3 className="font-serif text-[#324339] text-xl italic leading-tight">{item.product_details.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <ShieldCheck size={12} className="text-[#324339]/30" />
                                                    <p className="text-[11px] text-[#324339]/40">{item.product_details.material || "Material de alta calidad"}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item)}
                                                className="text-[#324339]/20 hover:text-[#A86447] transition-colors p-2 hover:bg-[#A86447]/5 rounded-full"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-center mt-4">
                                            <div className="flex items-center border border-[#324339]/10 rounded-full px-3 py-1 gap-5 bg-[#FDFBF9]">
                                                <button onClick={() => handleUpdateQuantity(item, item.quantity - 1)} className="text-[#324339]/40 hover:text-[#A86447]"><Minus size={14} /></button>
                                                <span className="text-xs font-bold text-[#324339]">{item.quantity}</span>
                                                <button onClick={() => handleUpdateQuantity(item, item.quantity + 1)} className="text-[#324339]/40 hover:text-[#A86447]"><Plus size={14} /></button>
                                            </div>
                                            <p className="text-2xl font-serif italic text-[#324339]">
                                                {Number(item.product_details.price * item.quantity).toFixed(2)} €
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* LINK ADICIONAL AL CATÁLOGO */}
                        <div className="pt-16 pb-10 mt-10">
                            <Link
                                to="/catalog"
                                className="flex items-center justify-center gap-6 group"
                            >
                                <div className="h-[1px] w-12 bg-[#324339]/10 group-hover:w-20 group-hover:bg-[#A86447] transition-all duration-700"></div>
                                <div className="text-center">
                                    <p className="font-serif text-[#324339] italic text-lg leading-none">¿Buscas algo más?</p>
                                    <span className="text-[9px] uppercase tracking-[0.4em] text-[#A86447] mt-2 block opacity-80">
                                        Volver al catálogo
                                    </span>
                                </div>
                                <div className="h-[1px] w-12 bg-[#324339]/10 group-hover:w-20 group-hover:bg-[#A86447] transition-all duration-700"></div>
                            </Link>
                        </div>
                    </div>

                    {/* Resumen de Pedido */}
                    <div className="lg:-mt-4 z-10">
                        <div className="sticky top-24 bg-white p-10 rounded-[2.5rem] border-2 border-[#324339] shadow-[0_20px_50px_rgba(50,67,57,0.1)] space-y-8">
                            <div className="flex items-center gap-3 border-b border-[#324339]/5 pb-6">
                                <ShoppingBag size={20} className="text-[#A86447]" />
                                <h2 className="font-serif text-2xl text-[#324339] italic">Resumen</h2>
                            </div>

                            <div className="space-y-4 text-[13px]">
                                <div className="flex justify-between text-[#324339]/60">
                                    <span className="tracking-wide">Subtotal</span>
                                    <span className="font-medium">{Number(cart.subtotal).toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between text-[#324339]/60">
                                    <span className="tracking-wide">Gastos de envío</span>
                                    <span className="text-[#A86447] font-bold">
                                        {Number(cart.shipping) === 0 ? "GRATUITO" : `${cart.shipping} €`}
                                    </span>
                                </div>

                                <div className="pt-6 border-t border-[#324339]/5">
                                    <div className="flex justify-between items-baseline">
                                        <span className="font-serif text-xl text-[#324339]">Total</span>
                                        <div className="text-right">
                                            <span className="text-3xl font-serif italic font-bold text-[#324339]">
                                                {Number(cart.total).toFixed(2)} €
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right mt-1">
                                        <span className="text-[10px] text-[#324339]/40 uppercase tracking-widest">IVA Incluido</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                className="w-full bg-[#324339] text-white py-5 rounded-full uppercase tracking-[0.2em] text-[11px] font-bold hover:bg-[#A86447] transition-all duration-500 shadow-xl shadow-[#324339]/20 active:scale-95"
                                onClick={() => {
                                    if (isAuthenticated) {
                                        setIsModalOpen(true);
                                    } else {
                                        toast.error("Identificación requerida");
                                        navigate('/login', { state: { from: '/cart' } });
                                    }
                                }}
                            >
                                Finalizar Compra
                            </button>

                            <div className="bg-[#A86447]/5 p-4 rounded-2xl border border-[#A86447]/10">
                                <p className="text-[10px] text-center text-[#A86447] uppercase tracking-[0.15em] font-bold leading-relaxed">
                                    {Number(cart.subtotal) >= 100
                                        ? "Tienes envío premium gratuito"
                                        : `Faltan ${(100 - Number(cart.subtotal)).toFixed(2)}€ para envío gratis`}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}