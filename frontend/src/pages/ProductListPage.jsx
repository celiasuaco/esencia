import { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import { toast } from 'sonner';

const CATEGORIES = [
    { id: 'ALL', label: 'Colección Completa' },
    { id: 'ANILLO', label: 'Anillos' },
    { id: 'COLLAR', label: 'Collares' },
    { id: 'PENDIENTE', label: 'Pendientes' },
    { id: 'PULSERA', label: 'Pulseras' },
];

export default function ProductListPage() {
    const [products, setProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await productService.getAll();
                setProducts(data);
            } catch {
                toast.error("No se pudo cargar el catálogo");
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = activeCategory === 'ALL'
        ? products
        : products.filter(p => p.category === activeCategory);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9] font-serif italic text-[#324339]">
            <span className="animate-pulse text-xl tracking-widest">Esencia...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFBF9] pb-24">

            {/* HEADER ARTÍSTICO */}
            <header className="pt-24 pb-20 px-6 relative overflow-hidden bg-white/40 border-b border-[#324339]/5">
                {/* Isotipo 'E' de fondo en Terracota muy sutil */}
                <div className="absolute inset-0 opacity-[0.04] flex items-center justify-center pointer-events-none">
                    <span className="font-serif italic text-[25rem] text-[#A86447] select-none translate-y-10">E</span>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <span className="h-[1px] w-10 bg-[#A86447]/40"></span>
                        <span className="text-[#A86447] tracking-[0.4em] uppercase text-[10px] font-bold">
                            Atelier de Lujo
                        </span>
                        <span className="h-[1px] w-10 bg-[#A86447]/40"></span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-serif text-[#324339] italic leading-tight">
                        Nuestras <span className="text-[#A86447]">Joyas</span>
                    </h1>

                    <p className="text-[#324339]/60 max-w-lg mx-auto text-sm leading-relaxed tracking-wide font-light italic">
                        Piezas forjadas a mano donde el <span className="text-[#324339] font-semibold not-italic">oro</span> y la <span className="text-[#324339] font-semibold not-italic">esencia</span> se encuentran.
                    </p>

                    {/* Divisor decorativo */}
                    <div className="flex items-center justify-center gap-3 pt-4">
                        <div className="h-2 w-2 rounded-full bg-[#A86447]"></div>
                        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#324339]/20 to-transparent"></div>
                        <div className="h-2 w-2 rounded-full border border-[#324339]/30"></div>
                    </div>
                </div>
            </header>

            {/* NAVEGACIÓN DE CATEGORÍAS - Estilo 'Floating Dark Pill' */}
            <nav className="sticky top-10 z-40 -mt-8 flex justify-center px-4">
                <div className="flex gap-2 p-2 bg-[#324339] rounded-full shadow-[0_25px_50px_-12px_rgba(50,67,57,0.4)] border border-white/5 overflow-x-auto no-scrollbar max-w-full">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-8 py-3 rounded-full text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-500 whitespace-nowrap
                                ${activeCategory === cat.id
                                    ? 'bg-[#A86447] text-white shadow-lg scale-105'
                                    : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* CUERPO DEL CATÁLOGO */}
            <main className="max-w-7xl mx-auto px-8 mt-24">
                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-12 gap-y-24">
                        {filteredProducts.map(p => (
                            <div key={p.id} className="group relative">
                                <ProductCard
                                    product={p}
                                    badge={p.stock < 3 && p.stock > 0 ? "Pieza Limitada" : null}
                                />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-40 bg-white/40 rounded-[4rem] border-2 border-dashed border-[#A86447]/10 mx-4">
                        <p className="font-serif italic text-[#324339]/70 text-2xl mb-4">
                            Inspiración en proceso...
                        </p>
                        <p className="text-[10px] uppercase tracking-widest text-[#A86447] font-bold">
                            Próximamente nuevas piezas exclusivas
                        </p>
                    </div>
                )}
            </main>

            {/* CIERRE DE PÁGINA */}
            <div className="mt-40 flex flex-col items-center gap-6 opacity-30">
                <div className="h-20 w-[1px] bg-gradient-to-b from-[#A86447] to-transparent"></div>
                <span className="font-serif italic text-4xl text-[#324339]">E</span>
            </div>
        </div>
    );
}