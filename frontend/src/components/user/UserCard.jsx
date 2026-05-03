import { Calendar, ShoppingBag, TrendingUp } from 'lucide-react';
import PropTypes from 'prop-types';

const UserCard = ({ client }) => {
    const API_BASE_URL = 'http://127.0.0.1:8000';

    const getPhotoUrl = (path) => {
        if (!path) return null;
        return path.startsWith('http') ? path : `${API_BASE_URL}${path}`;
    };

    const initial = client.full_name ? client.full_name.charAt(0).toUpperCase() : '?';

    return (
        <div className="bg-white rounded-[1.5rem] md:rounded-[2rem] border-2 border-[#324339]/20 p-4 md:p-6 hover:border-[#324339] hover:shadow-xl hover:shadow-[#A86447]/10 transition-all duration-500 group">
            <div className="flex flex-col md:flex-row items-center md:items-center gap-4 md:gap-6">

                <div className="flex items-center gap-4 w-full md:w-auto md:flex-grow">
                    <div className="relative w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-[#A86447] to-[#324339] flex-shrink-0 flex items-center justify-center text-white text-lg md:text-xl font-serif shadow-inner overflow-hidden border-2 border-white">
                        <span className="absolute">{initial}</span>
                        {client.photo && (
                            <img
                                src={getPhotoUrl(client.photo)}
                                alt={client.full_name}
                                fetchPriority="high"
                                className="absolute inset-0 w-full h-full object-cover z-10"
                                onError={(e) => e.target.style.display = 'none'}
                            />
                        )}
                    </div>

                    <div className="flex-grow min-w-0">
                        <h3 className="text-base md:text-lg font-serif italic text-[#324339] transition-colors group-hover:text-[#A86447] truncate">
                            {client.full_name}
                        </h3>
                        <p className="text-[10px] md:text-xs text-[#324339]/50 truncate">{client.email}</p>
                        <div className="flex items-center gap-2 mt-1 text-[9px] md:text-[10px] text-[#A86447] uppercase tracking-widest font-bold">
                            <Calendar size={12} className="flex-shrink-0" />
                            <span>Desde {new Date(client.date_joined).toLocaleDateString('es-ES')}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 w-full md:w-auto pt-4 md:pt-0 border-t md:border-t-0 border-[#324339]/5">
                    <div className="text-left md:text-center">
                        <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#324339]/40 mb-1">Pedidos</p>
                        <div className="flex items-center gap-1.5 text-[#324339]">
                            <ShoppingBag size={14} className="text-[#A86447]" />
                            <span className="font-serif text-lg md:text-xl">{client.orders_count}</span>
                        </div>
                    </div>

                    <div className="text-right min-w-[100px] md:min-w-[120px]">
                        <p className="text-[8px] md:text-[9px] uppercase tracking-widest text-[#324339]/40 mb-1">Inversión Total</p>
                        <div className="flex items-center justify-end gap-1.5 text-[#324339]">
                            <TrendingUp size={14} className="text-[#324339]" />
                            <span className="font-serif text-xl md:text-2xl tracking-tighter">
                                {Number(client.total_spent || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                <span className="text-xs ml-1 text-[#A86447]">€</span>
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