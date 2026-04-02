import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { cartService } from '../services/cartService';
import { Trash2, Minus, Plus, ShoppingBag, ArrowLeft, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function CartPage() {
    const navigate = useNavigate();
    const [cart, setCart] = useState(null);
    const [loading, setLoading] = useState(true);

    const API_BASE_URL = 'http://localhost:8000';
    const accentTerracota = "#D48A66";

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
            toast.error("Error al cargar el carrito");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadCart(); }, []);

    const handleUpdateQuantity = async (itemId, newQuantity) => {
        if (newQuantity < 1) return;
        try {
            await cartService.updateQuantity(itemId, newQuantity);
            loadCart();
        } catch (err) {
            toast.error("Stock no disponible");
        }
    };

    const handleRemove = async (itemId) => {
        try {
            await cartService.removeItem(itemId);
            toast.success("Bolsa actualizada");
            loadCart();
        } catch (err) {
            toast.error("Error al eliminar");
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
                <ShoppingBag size={50} className="text-[#D48A66] mb-6 opacity-40" />
                <h2 className="text-4xl font-serif text-[#324339] mb-4 italic">Tu bolsa está vacía</h2>
                <Link to="/catalog" className="mt-4 bg-[#324339] text-white px-10 py-4 rounded-full uppercase tracking-widest text-[10px] font-bold hover:bg-[#D48A66] transition-all">
                    Explorar Colección
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBF9] pt-4 pb-20">
            <div className="max-w-6xl mx-auto px-6">

                <button
                    onClick={() => navigate('/catalog')}
                    className="flex items-center gap-2 text-[#324339]/40 hover:text-[#D48A66] transition-colors text-[10px] uppercase tracking-[0.25em] font-bold mb-6 group"
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
                                <div key={item.id} className="flex gap-6 bg-white p-5 rounded-[2rem] border border-[#324339]/5 shadow-[0_10px_30px_rgba(50,67,57,0.03)] hover:border-[#D48A66]/30 transition-all duration-500">
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
                                                <span className="text-[9px] uppercase tracking-widest text-[#D48A66] font-bold block mb-1">
                                                    {item.product_details.category_display}
                                                </span>
                                                <h3 className="font-serif text-[#324339] text-xl italic leading-tight">{item.product_details.name}</h3>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <ShieldCheck size={12} className="text-[#324339]/30" />
                                                    <p className="text-[11px] text-[#324339]/40">{item.product_details.material}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemove(item.id)}
                                                className="text-[#324339]/20 hover:text-[#D48A66] transition-colors p-2 hover:bg-[#D48A66]/5 rounded-full"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>

                                        <div className="flex justify-between items-center mt-4">
                                            <div className="flex items-center border border-[#324339]/10 rounded-full px-3 py-1 gap-5 bg-[#FDFBF9]">
                                                <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className="text-[#324339]/40 hover:text-[#D48A66]"><Minus size={14} /></button>
                                                <span className="text-xs font-bold text-[#324339]">{item.quantity}</span>
                                                <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className="text-[#324339]/40 hover:text-[#D48A66]"><Plus size={14} /></button>
                                            </div>
                                            <p className="text-2xl font-serif italic text-[#324339]">
                                                {Number(item.subtotal).toFixed(2)} €
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* LINK ADICIONAL AL CATÁLOGO AL FINAL DE LA LISTA */}
                        <div className="pt-16 pb-10 mt-10">
                            <Link
                                to="/catalog"
                                className="flex items-center justify-center gap-6 group"
                            >
                                <div className="h-[1px] w-12 bg-[#324339]/10 group-hover:w-20 group-hover:bg-[#D48A66] transition-all duration-700"></div>

                                <div className="text-center">
                                    <p className="font-serif text-[#324339] italic text-lg leading-none">¿Buscas algo más?</p>
                                    <span className="text-[9px] uppercase tracking-[0.4em] text-[#D48A66] mt-2 block opacity-80">
                                        Volver al catálogo
                                    </span>
                                </div>

                                <div className="h-[1px] w-12 bg-[#324339]/10 group-hover:w-20 group-hover:bg-[#D48A66] transition-all duration-700"></div>
                            </Link>
                        </div>
                    </div>

                    {/* Resumen de Pedido */}
                    <div className="lg:-mt-4 z-10">
                        <div className="sticky top-24 bg-white p-10 rounded-[2.5rem] border-2 border-[#324339] shadow-[0_20px_50px_rgba(50,67,57,0.1)] space-y-8">
                            <div className="flex items-center gap-3 border-b border-[#324339]/5 pb-6">
                                <ShoppingBag size={20} className="text-[#D48A66]" />
                                <h2 className="font-serif text-2xl text-[#324339] italic">Resumen</h2>
                            </div>

                            <div className="space-y-4 text-[13px]">
                                <div className="flex justify-between text-[#324339]/60">
                                    <span className="tracking-wide">Subtotal</span>
                                    <span className="font-medium">{Number(cart.subtotal).toFixed(2)} €</span>
                                </div>
                                <div className="flex justify-between text-[#324339]/60">
                                    <span className="tracking-wide">Gastos de envío</span>
                                    <span className="text-[#D48A66] font-bold">
                                        {Number(cart.shipping) === 0 ? "GRATUITO" : `${cart.shipping} €`}
                                    </span>
                                </div>

                                <div className="pt-6 border-t border-[#324339]/5 flex justify-between items-baseline">
                                    <span className="font-serif text-xl text-[#324339]">Total</span>
                                    <div className="text-right">
                                        <span className="text-2xl font-serif italic text-[#324339]">
                                            {Number(cart.total).toFixed(2)} €
                                        </span>
                                    </div>
                                </div>
                                <span className="text-[10px] text-[#324339]/40 uppercase tracking-widest">IVA Incluido</span>
                            </div>

                            <button className="w-full bg-[#324339] text-white py-5 rounded-full uppercase tracking-[0.2em] text-[11px] font-bold hover:bg-[#D48A66] transition-all duration-500 shadow-xl shadow-[#324339]/20 active:scale-95">
                                Finalizar Compra
                            </button>

                            <div className="bg-[#D48A66]/5 p-4 rounded-2xl border border-[#D48A66]/10">
                                <p className="text-[10px] text-center text-[#D48A66] uppercase tracking-[0.15em] font-bold leading-relaxed">
                                    {Number(cart.subtotal) >= 100
                                        ? "Tienes envío gratuito"
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