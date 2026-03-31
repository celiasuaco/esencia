export default function ProductCard({ product, badge }) {
    return (
        <div className="group cursor-pointer">
            <div className="relative overflow-hidden rounded-2xl bg-[#F5F1ED] aspect-square flex flex-col items-center justify-center p-6 transition-all hover:shadow-xl">
                {badge && (
                    <span className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase text-[#C77C5D] z-10">
                        {badge}
                    </span>
                )}

                {/* Icono temporal mientras no hay imágenes reales */}
                <div className="text-[#A3937B] opacity-40 group-hover:scale-110 transition-transform duration-500">
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                        <circle cx="12" cy="8" r="5" />
                        <path d="M12 13v9" />
                    </svg>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-white/80 backdrop-blur-md">
                    <button className="w-full py-2 bg-[#324339] text-white rounded-xl text-xs uppercase tracking-widest font-medium hover:bg-[#C77C5D] transition-colors">
                        Ver Detalle
                    </button>
                </div>
            </div>

            <div className="mt-4 text-center">
                <h3 className="text-[#2C3632] font-medium text-sm">{product.name}</h3>
                <p className="text-[#C77C5D] font-serif mt-1">{product.price} €</p>
            </div>
        </div>
    );
}