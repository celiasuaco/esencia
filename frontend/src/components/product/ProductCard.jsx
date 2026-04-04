import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { cartService } from '../../services/cartService';
import { ShoppingBag, Eye } from 'lucide-react';

export default function ProductCard({ product, badge }) {
    const navigate = useNavigate();
    const API_BASE_URL = 'http://localhost:8000';

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return "/default-product.png";
        if (photoPath.startsWith('http')) return photoPath;
        const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        return `${API_BASE_URL}${normalizedPath}`;
    };

    const handleAddToCart = async (e) => {
        if (e) e.stopPropagation();
        navigate('/cart');
        try {
            await cartService.addToCart(product.id, 1);
        } catch (err) {
            console.error("Error al añadir al carrito:", err);
        }
    };

    return (
        <button
            onClick={() => navigate(`/product/${product.id}`)}
            className="group cursor-pointer w-full relative"
        >
            {/* Contenedor Principal con Borde de Lujo */}
            <div className="relative rounded-[2rem] border border-[#324339]/10 bg-white p-4 shadow-[0_15px_40px_rgba(50,67,57,0.05)] transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_30px_60px_rgba(50,67,57,0.12)] group-hover:border-[#A86447]/30">

                {badge && (
                    <span className="absolute top-6 left-6 bg-[#A86447] text-white px-3 py-1 rounded-full text-[9px] font-bold tracking-[0.15em] uppercase z-20 shadow-lg shadow-[#A86447]/20">
                        {badge}
                    </span>
                )}

                {/* Área de Imagen con Gradiente de Profundidad */}
                <div className="relative overflow-hidden rounded-[1.5rem] bg-[#FDFBF9] aspect-square flex items-center justify-center border border-[#324339]/5">
                    <img
                        src={getPhotoUrl(product.photo)}
                        alt={product.name}
                        className="w-full h-full object-contain p-6 transition-transform duration-1000 group-hover:scale-110"
                        onError={(e) => { e.target.src = "https://placehold.co/400x400?text=Joyas+Esencia"; }}
                    />

                    {/* Overlay al hacer Hover */}
                    <div className="absolute inset-0 bg-[#324339]/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 backdrop-blur-[2px] flex flex-col items-center justify-center gap-3 px-6">
                        <button
                            onClick={handleAddToCart}
                            className="w-full py-3 bg-[#A86447] text-white rounded-full text-[10px] uppercase tracking-[0.2em] font-bold flex items-center justify-center gap-2 hover:bg-white hover:text-[#A86447] transition-all transform active:scale-95 shadow-xl"
                        >
                            <ShoppingBag size={14} />
                            Añadir a la bolsa
                        </button>
                        <div className="flex items-center gap-2 text-white/80 text-[9px] uppercase tracking-widest font-medium">
                            <Eye size={12} />
                            <span>Ver detalle</span>
                        </div>
                    </div>
                </div>

                {/* Información del Producto con Acentos */}
                <div className="pt-6 pb-2 text-center">
                    {/* Separador artesanal */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="h-[1px] w-6 bg-[#A86447]/30"></div>
                        <div className="h-1 w-1 rounded-full bg-[#A86447]"></div>
                        <div className="h-[1px] w-6 bg-[#A86447]/30"></div>
                    </div>

                    <h3 className="text-[#324339] font-serif italic text-lg tracking-tight transition-colors duration-300 group-hover:text-[#A86447]">
                        {product.name}
                    </h3>

                    <div className="mt-2">
                        <p className="text-[#A86447] font-serif italic ">
                            {Number(product.price).toFixed(2)} €
                        </p>
                    </div>
                </div>

                {/* Detalle decorativo en las esquinas al hacer hover */}
                <div className="absolute -top-1 -right-1 w-6 h-6 border-t-2 border-r-2 border-[#A86447] opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-tr-xl"></div>
                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-2 border-l-2 border-[#A86447] opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-bl-xl"></div>
            </div>
        </button>
    );
}

ProductCard.propTypes = {
    product: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        photo: PropTypes.string,
        price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }).isRequired,
    badge: PropTypes.string
};