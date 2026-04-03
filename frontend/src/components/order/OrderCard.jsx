import PropTypes from 'prop-types';
import { Calendar, ChevronRight, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_STYLES = {
    'PENDING': 'text-amber-700 bg-amber-50 border-amber-200',
    'PAID': 'text-emerald-700 bg-emerald-50 border-emerald-200',
    'SHIPPED': 'text-[#324339] bg-[#324339]/5 border-[#324339]/10',
    'DELIVERED': 'text-[#A86447] bg-[#A86447]/5 border-[#A86447]/10',
    'CANCELLED': 'text-rose-700 bg-rose-50 border-rose-200',
};

const STATUS_LABELS = {
    'PENDING': 'Pendiente',
    'PAID': 'Pagado',
    'SHIPPED': 'Enviado',
    'DELIVERED': 'Entregado',
    'CANCELLED': 'Cancelado'
};

export default function OrderCard({ order, isAdmin = false }) {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(`/admin/orders/${order.id}`)}
            className="group bg-white rounded-[2rem] border border-[#324339]/5 p-6 shadow-sm hover:shadow-xl hover:border-[#A86447]/30 transition-all duration-500 cursor-pointer relative overflow-hidden"
        >
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#324339] group-hover:bg-[#A86447] transition-colors duration-500" />

            <div className="flex flex-wrap justify-between items-start gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] uppercase tracking-[0.3em] text-[#A86447] font-bold">
                            Pedido Oficial
                        </span>
                        <div className="h-1 w-1 rounded-full bg-[#A86447]" />
                    </div>
                    <h3 className="font-serif italic text-2xl text-[#324339]">#{order.tracking_code}</h3>
                </div>

                <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold tracking-[0.15em] uppercase border ${STATUS_STYLES[order.status]}`}>
                    {STATUS_LABELS[order.status]}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-3">
                    <div className="flex items-center gap-3 text-[#324339]/60 text-sm italic font-serif">
                        <Calendar size={14} className="text-[#A86447]" />
                        <span>{new Date(order.placed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    {isAdmin && (
                        <div className="flex items-center gap-3 text-[#324339]/60 text-[11px] uppercase tracking-widest font-bold">
                            <User size={14} className="text-[#324339]" />
                            <span>{order.user_email}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-end md:justify-end md:gap-8">
                    <div className="text-right">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-[#324339]/40 block">Monto Total</span>
                        <span className="text-2xl font-serif italic text-[#324339]">{order.total_amount} €</span>
                    </div>
                    <div className="bg-[#324339] text-white p-2 rounded-full group-hover:bg-[#A86447] transition-colors duration-500">
                        <ChevronRight size={20} />
                    </div>
                </div>
            </div>
        </button>
    );
}

OrderCard.propTypes = {
    order: PropTypes.object.isRequired,
    isAdmin: PropTypes.bool
};