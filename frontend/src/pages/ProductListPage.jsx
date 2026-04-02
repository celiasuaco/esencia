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
            } catch (err) {
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
            <span className="animate-pulse text-xl">Explorando la colección...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFBF9] pb-24">

            {/* HEADER - Versión Compacta */}
            <header className="pt-16 pb-12 px-6 border-b border-[#324339]/5 mb-10 relative overflow-hidden">
                {/* E decorativa más pequeña y sutil */}
                <div className="absolute inset-0 opacity-[0.02] flex items-center justify-center pointer-events-none">
                    <span className="font-serif italic text-[18rem] text-[#324339] select-none">E</span>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
                    {/* Subtítulo superior */}
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-px w-4 bg-[#324339]/10"></span>
                        <span className="text-[#A86447] tracking-[0.35em] uppercase text-[9px] font-bold">
                            Joyería Artesanal
                        </span>
                        <span className="h-px w-4 bg-[#324339]/10"></span>
                    </div>

                    {/* Título - Tamaño reducido de 6xl/7xl a 4xl/5xl */}
                    <h1 className="text-4xl md:text-5xl font-serif text-[#324339] italic leading-tight tracking-tight">
                        Nuestras Joyas
                    </h1>

                    {/* Divisor inferior más corto */}
                    <div className="flex items-center justify-center gap-3">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#A86447]/80"></span>
                        <div className="h-px w-16 bg-[#324339]/10"></div>
                        <span className="h-1.5 w-1.5 rounded-full border border-[#324339]/15"></span>
                    </div>
                </div>
            </header>

            {/* Categorías - Centralizadas y Flotantes sutilmente */}
            <nav className="sticky top-8 z-40 mb-20 flex justify-center px-4">
                <div className="flex gap-1.5 p-1.5 bg-white/70 backdrop-blur-xl rounded-full border border-[#324339]/5 shadow-sm overflow-x-auto no-scrollbar">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`px-6 py-2.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-bold transition-all
                                ${activeCategory === cat.id
                                    ? 'bg-[#324339] text-white shadow-md shadow-[#324339]/10'
                                    : 'text-[#324339]/60 hover:text-[#324339] hover:bg-[#A86447]/5'}`}
                        >
                            {cat.label}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Grid de Productos con cabecera de sección sutil */}
            <main className="max-w-7xl pt-0 mx-auto px-6">

                {filteredProducts.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-16">
                        {filteredProducts.map(p => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                badge={p.stock < 5 && p.stock > 0 ? "Últimas unidades" : null}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white/40 rounded-3xl border border-dashed border-[#324339]/10">
                        <p className="font-serif italic text-[#324339]/60 text-xl">
                            Estamos preparando nuevas piezas exclusivas para esta colección.
                        </p>
                    </div>
                )}
            </main>

            {/* Footer Minimalista */}
            <footer className="mt-32 text-center border-t border-[#324339]/5 pt-12">
                <div className="max-w-7xl mx-auto px-6">
                    <p className="text-[9px] uppercase tracking-[0.5em] text-[#324339]/40 font-bold">
                        Esencia Atelier • Artistry in Gold • 2026
                    </p>
                </div>
            </footer>
        </div>
    );
}