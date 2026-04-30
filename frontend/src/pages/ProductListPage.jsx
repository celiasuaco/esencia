import { useState, useEffect, useCallback } from 'react';
import { productService } from '../services/productService';
import ProductCard from '../components/product/ProductCard';
import { SlidersHorizontal } from 'lucide-react';

const CATEGORIES = [
    { id: 'ALL', label: 'Colección Completa' },
    { id: 'ANILLO', label: 'Anillos' },
    { id: 'COLLAR', label: 'Collares' },
    { id: 'PENDIENTE', label: 'Pendientes' },
    { id: 'PULSERA', label: 'Pulseras' },
];

const MATERIALS = [
    { id: "Oro 18k", label: "Oro 18k" },
    { id: "Plata de Ley 925", label: "Plata de Ley" },
    { id: "Oro Rosa", label: "Oro Rosa" },
    { id: "Platino", label: "Platino" },
    { id: "Acero Quirúrgico", label: "Acero" },
];

export default function ProductListPage() {
    const [products, setProducts] = useState([]);
    const [activeCategory, setActiveCategory] = useState('ALL');
    const [loading, setLoading] = useState(true);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [extraFilters, setExtraFilters] = useState({
        material: '',
        sort: 'name',
        max_price: ''
    });

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};

            if (activeCategory !== 'ALL') {
                params.category = activeCategory;
            }

            if (extraFilters.material) params.material = extraFilters.material;
            if (extraFilters.sort && extraFilters.sort !== 'name') params.sort = extraFilters.sort;
            if (extraFilters.max_price) params.max_price = extraFilters.max_price;

            const data = await productService.getAll(params);
            setProducts([...data]);
        } catch (error) {
            console.error("Error cargando productos:", error);
        } finally {
            setLoading(false);
        }
    }, [activeCategory, extraFilters]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleExtraFilterChange = (key, value) => {
        setExtraFilters(prev => ({ ...prev, [key]: value }));
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#FDFBF9] font-serif italic text-[#324339]">
            <span className="animate-pulse text-xl tracking-widest">Esencia...</span>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFBF7] pb-24 text-left">
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>

            <header className="pt-24 pb-20 px-6 relative overflow-hidden bg-white/40 border-b border-[#324339]/5">
                <div className="absolute inset-0 opacity-[0.04] flex items-center justify-center pointer-events-none">
                    <span className="font-serif italic text-[25rem] text-[#A86447] select-none translate-y-10">E</span>
                </div>

                <div className="max-w-4xl mx-auto text-center relative z-10 space-y-6">
                    <div className="flex items-center justify-center gap-4 mb-2">
                        <span className="h-[1px] w-10 bg-[#A86447]/40"></span>
                        <span className="text-[#A86447] tracking-[0.4em] uppercase text-[10px] font-bold">Atelier de Lujo</span>
                        <span className="h-[1px] w-10 bg-[#A86447]/40"></span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-serif text-[#324339] italic leading-tight text-center">
                        Nuestras <span className="text-[#A86447]">Joyas</span>
                    </h1>
                    <p className="text-[#324339]/60 max-w-lg mx-auto text-sm leading-relaxed tracking-wide font-light italic text-center">
                        Piezas forjadas a mano donde el <span className="text-[#324339] font-semibold not-italic">oro</span> y la <span className="text-[#324339] font-semibold not-italic">esencia</span> se encuentran.
                    </p>
                    <div className="flex items-center justify-center gap-3 pt-4">
                        <div className="h-2 w-2 rounded-full bg-[#A86447]"></div>
                        <div className="h-[1px] w-32 bg-gradient-to-r from-transparent via-[#324339]/20 to-transparent"></div>
                        <div className="h-2 w-2 rounded-full border border-[#324339]/30"></div>
                    </div>
                </div>
            </header>

            <nav className="sticky top-10 z-40 -mt-8 flex flex-col items-center gap-4 px-4">
                <div className="flex items-center p-1.5 bg-[#324339] rounded-full shadow-2xl border border-white/5 max-w-full">
                    <div className="flex gap-1 overflow-x-auto no-scrollbar px-2">
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveCategory(cat.id)}
                                className={`px-8 py-3 rounded-full text-[10px] uppercase tracking-[0.25em] font-bold transition-all duration-500 whitespace-nowrap
                                    ${activeCategory === cat.id
                                        ? 'bg-[#A86447] text-white shadow-lg scale-105'
                                        : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    <div className="w-[1px] h-6 bg-white/10 mx-2 shrink-0"></div>
                    <button
                        onClick={() => setIsFilterOpen(!isFilterOpen)}
                        className={`p-2.5 rounded-full transition-all duration-300 shrink-0 ${isFilterOpen ? 'bg-[#A86447] text-white' : 'text-white/40 hover:text-white'}`}
                    >
                        <SlidersHorizontal size={16} />
                    </button>
                </div>

                {isFilterOpen && (
                    <div className="w-full max-w-4xl bg-[#324339] rounded-[2rem] p-8 shadow-2xl border border-white/10 animate-in slide-in-from-top-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-left">
                            <div className="flex flex-col gap-2">
                                <label className="text-[9px] uppercase tracking-widest text-[#A86447] font-bold">Material</label>
                                <select
                                    value={extraFilters.material}
                                    onChange={(e) => handleExtraFilterChange('material', e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-white/80 outline-none focus:border-[#A86447] appearance-none"
                                >
                                    <option value="" className="bg-[#324339]">Todos los materiales</option>
                                    {MATERIALS.map(m => (
                                        <option key={m.id} value={m.id} className="bg-[#324339]">
                                            {m.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-[9px] uppercase tracking-widest text-[#A86447] font-bold">Orden</label>
                                <select
                                    value={extraFilters.sort}
                                    onChange={(e) => handleExtraFilterChange('sort', e.target.value)}
                                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-[11px] text-white/80 outline-none"
                                >
                                    <option value="name" className="bg-[#324339]">Nombre</option>
                                    <option value="price_asc" className="bg-[#324339]">Precio más bajo</option>
                                    <option value="price_desc" className="bg-[#324339]">Precio más alto</option>
                                </select>
                            </div>

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between">
                                    <label className="text-[9px] uppercase tracking-widest text-[#A86447] font-bold">Máx</label>
                                    <span className="text-[10px] text-white/40">{extraFilters.max_price || 5000}€</span>
                                </div>
                                <input
                                    type="range" min="0" max="5000" step="100"
                                    value={extraFilters.max_price || 5000}
                                    onChange={(e) => handleExtraFilterChange('max_price', e.target.value)}
                                    className="accent-[#A86447] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer mt-2"
                                />
                            </div>
                        </div>
                    </div>
                )}
            </nav>

            <main className="max-w-7xl mx-auto px-8 mt-16 py-12">
                {products.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {products.map(p => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                badge={p.stock < 3 && p.stock > 0 ? "Pieza Limitada" : null}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-40 bg-white/40 rounded-[4rem] border-2 border-dashed border-[#A86447]/10 mx-4">
                        <p className="font-serif italic text-[#324339]/70 text-2xl mb-4">Inspiración en proceso...</p>
                        <p className="text-[10px] uppercase tracking-widest text-[#A86447] font-bold">Próximamente nuevas piezas exclusivas</p>
                    </div>
                )}
            </main>

            <div className="mt-40 flex flex-col items-center gap-6 opacity-30 pb-20">
                <div className="h-20 w-[1px] bg-gradient-to-b from-[#A86447] to-transparent"></div>
                <span className="font-serif italic text-4xl text-[#324339]">E</span>
            </div>
        </div>
    );
}