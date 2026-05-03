import { useState, useEffect } from 'react';
import { showcaseService } from '../services/showcaseService';
import ProductCard from '../components/product/ProductCard';

const ShowcasePage = () => {
    const [data, setData] = useState({ last_units: [], best_sellers: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchShowcase = async () => {
            try {
                const res = await showcaseService.getShowcase();
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchShowcase();
    }, []);

    if (loading) return <div className="min-h-screen flex items-center justify-center font-serif italic text-2xl text-[#2C3632]">Esencia...</div>;

    return (
        <div className="min-h-screen bg-[#FDFBF7]">
            <section className="relative h-[85vh] bg-[#2C3632] flex items-center justify-center text-center px-4 overflow-hidden">
                <img
                    src="/showcase.webp"
                    alt="Esencia Alta Joyería"
                    fetchPriority="high"
                    loading="eager"
                    className="absolute inset-0 w-full h-full object-cover opacity-30 grayscale"
                />

                <div className="relative z-10">
                    <span className="text-[#D1BFA7] tracking-[0.5em] uppercase text-xs mb-6 block italic">Alta Joyería Artesanal</span>
                    <h1 className="text-8xl md:text-9xl font-serif text-white mb-10 italic leading-tight">Esencia</h1>
                    <button className="px-12 py-4 border border-white text-white rounded-full hover:bg-white hover:text-[#2C3632] transition-all duration-700 tracking-[0.2em] text-xs uppercase font-semibold">
                        Descubrir mi Esencia
                    </button>
                </div>
            </section>

            <div className="max-w-7xl mx-auto pt-16 px-8 py-24 space-y-32">

                {data.last_units.length > 0 && (
                    <section>
                        <div className="flex items-center gap-8 mb-12">
                            <h2 className="text-4xl font-serif text-[#2C3632] whitespace-nowrap italic">Últimas Unidades</h2>
                            <div className="h-[1px] w-full bg-[#E8E2D6]"></div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                            {data.last_units.map(p => (
                                <ProductCard key={p.id} product={p} badge="Exclusivo" />
                            ))}
                        </div>
                    </section>
                )}

                <section>
                    <div className="flex items-center gap-8 mb-12">
                        <div className="h-[1px] w-full bg-[#E8E2D6]"></div>
                        <h2 className="text-4xl font-serif text-[#2C3632] whitespace-nowrap italic text-right">Más Vendidos</h2>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
                        {data.best_sellers.map(p => (
                            <ProductCard key={p.id} product={p} badge="Favorito" />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ShowcasePage;