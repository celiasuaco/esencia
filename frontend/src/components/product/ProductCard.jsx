import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';

ProductCard.propTypes = {
    product: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        photo: PropTypes.string,
        price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }).isRequired,
    badge: PropTypes.string
};

export default function ProductCard({ product, badge }) {
    const navigate = useNavigate();

    // URL base del backend para las imágenes
    const API_BASE_URL = 'http://localhost:8000';

    // Función para normalizar la URL de la foto
    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return "/default-product.png"; // Imagen por defecto si no hay ruta
        if (photoPath.startsWith('http')) return photoPath; // Si ya es absoluta (ej. producción)

        // Si es relativa, le pegamos la base del servidor
        const normalizedPath = photoPath.startsWith('/') ? photoPath : `/${photoPath}`;
        return `${API_BASE_URL}${normalizedPath}`;
    };

    return (
        <div
            onClick={() => navigate(`/product/${product.id}`)}
            className="group cursor-pointer"
        >
            <div className="relative rounded-[1.75rem] border border-[#324339]/10 bg-white/70 p-3 backdrop-blur-sm shadow-[0_18px_45px_rgba(50,67,57,0.08)] transition-all duration-500 group-hover:-translate-y-2 group-hover:shadow-[0_28px_60px_rgba(50,67,57,0.16)]">
                <div className="absolute inset-0 rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(168,100,71,0.08),transparent_28%,rgba(50,67,57,0.05))] opacity-0 transition-opacity duration-500 group-hover:opacity-100"></div>

                <div className="relative overflow-hidden rounded-[1.25rem] bg-[#F5F1ED] aspect-square flex flex-col items-center justify-center border border-[#324339]/8">
                    {badge && (
                        <span className="absolute top-4 left-4 bg-[#FDFBF9]/92 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-bold tracking-[0.24em] uppercase text-[#A86447] z-10 shadow-sm border border-[#A86447]/10">
                            {badge}
                        </span>
                    )}

                    <img
                        src={getPhotoUrl(product.photo)}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
                        onError={(e) => { e.target.src = "https://placehold.co/400x400?text=Joyas+Esencia"; }}
                    />

                    <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_38%,rgba(50,67,57,0.76)_100%)] opacity-70"></div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                        <button className="w-full py-3 bg-[#324339] text-white rounded-full text-[11px] uppercase tracking-[0.28em] font-semibold hover:bg-[#A86447] transition-colors shadow-[0_12px_30px_rgba(50,67,57,0.25)]">
                            Ver Detalle
                        </button>
                    </div>
                </div>

                <div className="relative pt-5 px-2 text-center">
                    <div className="flex items-center justify-center gap-3 mb-3 opacity-70">
                        <span className="h-px w-8 bg-[#324339]/10"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#A86447]"></span>
                        <span className="h-px w-8 bg-[#324339]/10"></span>
                    </div>
                    <h3 className="text-[#324339] font-medium text-sm tracking-[0.03em] transition-colors duration-300 group-hover:text-[#A86447]">
                        {product.name}
                    </h3>
                    <p className="text-[#A86447] font-serif mt-2 text-lg italic">
                        {Number(product.price).toFixed(2)} €
                    </p>
                </div>
            </div>
        </div>
    );
}

ProductCard.propTypes = {
    product: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        photo: PropTypes.string,
        price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }).isRequired
};