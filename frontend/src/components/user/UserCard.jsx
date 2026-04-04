import { User, Calendar, ShoppingBag, TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

const UserCard = ({ client }) => {
    const API_BASE_URL = 'http://127.0.0.1:8000';

    const getPhotoUrl = (path) => {
        if (!path) return null;
        return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    };

    const initial = client.full_name ? client.full_name.charAt(0).toUpperCase() : '?';

    return (
        /* Borde resaltado en Verde Esencia (#324339). 
           Al hacer hover, el borde se intensifica y el color Terracota (#A86447) aparece en la sombra.
        */
        <div className="bg-white rounded-[2rem] border-2 border-[#324339]/20 p-6 hover:border-[#324339] hover:shadow-xl hover:shadow-[#A86447]/10 transition-all duration-500 group">
            <div className="flex items-center gap-6">
                {/* Avatar con borde sutil en Terracota */}
                <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#A86447] to-[#324339] flex-shrink-0 flex items-center justify-center text-white text-xl font-serif shadow-inner overflow-hidden border-2 border-white">
                    <span className="absolute">{initial}</span>
                    {client.photo && (
                        <img
                            src={getPhotoUrl(client.photo)}
                            alt={client.full_name}
                            className="absolute inset-0 w-full h-full object-cover z-10"
                            onError={(e) => e.target.style.display = 'none'}
                        />
                    )}
                </div>

                {/* Info Principal */}
                <div className="flex-grow">
                    <h3 className="text-lg font-serif italic text-[#324339] transition-colors group-hover:text-[#A86447]">
                        {client.full_name}
                    </h3>
                    <p className="text-xs text-[#324339]/50 break-all">{client.email}</p>
                    <div className="flex items-center gap-2 mt-2 text-[10px] text-[#A86447] uppercase tracking-widest font-bold">
                        <Calendar size={12} />
                        <span>Desde {new Date(client.date_joined).toLocaleDateString('es-ES')}</span>
                    </div>
                </div>

                {/* Métricas Contables */}
                <div className="flex items-center gap-8 pr-4">
                    <div className="text-center">
                        <p className="text-[9px] uppercase tracking-widest text-[#324339]/40 mb-1">Pedidos</p>
                        <div className="flex items-center justify-center gap-1.5 text-[#324339]">
                            <ShoppingBag size={14} className="text-[#A86447]" />
                            <span className="font-serif text-xl">{client.orders_count}</span>
                        </div>
                    </div>

                    <div className="text-right min-w-[100px]">
                        <p className="text-[9px] uppercase tracking-widest text-[#324339]/40 mb-1">Inversión Total</p>
                        <div className="flex items-center justify-end gap-1.5 text-[#324339]">
                            <TrendingUp size={14} className="text-[#324339]" />
                            <span className="font-serif text-2xl tracking-tighter">
                                {Number(client.total_spent || 0).toFixed(2)}
                                <span className="text-sm ml-1 text-[#A86447]">€</span>
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

UserCard.propTypes = {
    client: PropTypes.shape({
        full_name: PropTypes.string,
        email: PropTypes.string,
        date_joined: PropTypes.string,
        photo: PropTypes.string,
        orders_count: PropTypes.number,
        total_spent: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }).isRequired
};

export default UserCard;