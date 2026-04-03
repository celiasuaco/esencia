import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { productService } from '../services/productService';
import { cartService } from '../services/cartService'; // Importar el servicio del carrito
import { ArrowLeft, ShoppingBag, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);

    // URL base para normalizar la imagen (asegúrate de que coincida con tu API)
    const API_BASE_URL = 'http://localhost:8000';

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return "/default-product.png";
        if (photoPath.startsWith('http')) return photoPath;
        const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        return `${API_BASE_URL}${normalizedPath}`;
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const data = await productService.getById(id);
                setProduct(data);
            } catch (err) {
                console.error("Error al cargar el producto:", err);
                toast.error("Producto no encontrado");
                navigate('/catalog');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, navigate]);

    const handleAddToCart = async (e) => {
        if (e) e.stopPropagation();
        navigate('/cart');
        try {
            await cartService.addToCart(product.id, 1);
        } catch (err) {
            console.error("Error al añadir al carrito:", err);
            toast.error("No se pudo añadir el producto");
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9] font-serif italic text-[#324339]">
            <span className="animate-pulse text-xl">Revelando detalle...</span>
        </div>
    );
    if (!product) return null;

    const isLowStock = product?.stock > 0 && product?.stock <= 5;

    return (
        <div className="min-h-screen bg-[#FDFBF9] py-12 px-6">
            <div className="max-w-5xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 text-[#324339]/60 hover:text-[#A86447] transition-colors text-[10px] uppercase tracking-widest mb-10 group"
                >
                    <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Volver a la colección
                </button>

                <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-start">

                    <div className="space-y-6 w-full max-w-[350px] mx-auto lg:mx-0">
                        {isLowStock && (
                            <div className="flex items-center justify-center gap-3 py-2.5 border border-[#A86447]/20 rounded-xl bg-[#A86447]/5 transition-all animate-in fade-in slide-in-from-top-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A86447] opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#A86447]"></span>
                                </span>
                                <p className="text-[9px] uppercase tracking-[0.25em] text-[#A86447] font-bold">
                                    Edición Limitada: {product.stock} disponibles
                                </p>
                            </div>
                        )}

                        <div className="relative aspect-square flex justify-center items-center p-8 border border-[#324339] rounded-[2rem] bg-white shadow-sm transition-all duration-500 hover:shadow-xl hover:border-[#A86447]">

                            <img
                                src={getPhotoUrl(product.photo)}
                                alt={product.name}
                                className="w-full h-full object-contain transition-transform duration-1000 hover:scale-110"
                                onError={(e) => { e.target.src = "https://placehold.co/400x400?text=Joyas+Esencia"; }}
                            />
                        </div>
                    </div>

                    <div className="space-y-8 lg:-mt-6 lg:pt-0">
                        <header className="space-y-2">
                            <span className="text-[#A86447] text-[10px] uppercase tracking-[0.35em] font-bold block">
                                {product.category_display || product.category}
                            </span>
                            <h1 className="text-4xl md:text-5xl font-serif text-[#324339] italic leading-tight">
                                {product.name}
                            </h1>
                            <p className="text-2xl font-serif italic text-[#A86447] pt-2">
                                {Number(product.price).toFixed(2)} €
                            </p>
                        </header>

                        <div className="space-y-8 border-y border-[#324339]/10 py-10">
                            <div className="space-y-3">
                                <h3 className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#A86447]">Descripción</h3>
                                <p className="text-[#324339]/70 leading-relaxed text-[15px] font-light italic">
                                    {product.description}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-8">
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <Sparkles className="text-[#A86447]" size={14} />
                                        <span className="text-[9px] uppercase tracking-widest text-[#324339]/40 font-bold">Material</span>
                                    </div>
                                    <p className="text-sm text-[#324339] pl-6 font-medium">{product.material}</p>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="text-[#324339]" size={14} />
                                        <span className="text-[9px] uppercase tracking-widest text-[#324339]/40 font-bold">Garantía</span>
                                    </div>
                                    <p className="text-sm text-[#324339] pl-6 font-medium">Certificado Esencia</p>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
                            <button
                                onClick={handleAddToCart}
                                className="w-full py-5 bg-[#324339] text-white rounded-full flex items-center justify-center gap-3 hover:bg-[#A86447] transition-all duration-700 font-bold uppercase text-[11px] tracking-[0.25em] shadow-xl shadow-[#324339]/10 group active:scale-95"
                            >
                                <ShoppingBag size={18} className="group-hover:-translate-y-1 transition-transform" />
                                Añadir a la bolsa
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}