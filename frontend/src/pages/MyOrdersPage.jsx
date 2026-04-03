import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { orderService } from '../services/orderService';
import { Package, Calendar, ChevronRight, Loader2 } from 'lucide-react';

export default function MyOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const STATUS_LABELS = {
        'PENDING': 'Pendiente',
        'PAID': 'Pagado',
        'SHIPPED': 'Enviado',
        'DELIVERED': 'Entregado',
        'CANCELLED': 'Anulado'
    };

    useEffect(() => {
        const fetchMyOrders = async () => {
            try {
                const data = await orderService.getMyOrders();
                setOrders(data);
            } catch (error) {
                console.error("Error fetching orders:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchMyOrders();
    }, []);

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
            <Loader2 className="w-10 h-10 text-[#A86447] animate-spin mb-4" />
            <p className="font-serif italic text-[#324339]/60">Cargando tu historial...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-6 py-12">
            <header className="mb-12">
                <h1 className="text-4xl font-serif text-[#324339] italic mb-2">Mis Pedidos</h1>
                <p className="text-[#324339]/60 text-sm tracking-widest uppercase">Historial de compras y seguimiento</p>
            </header>

            {orders.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[2rem] border border-[#324339]/5 shadow-sm">
                    <Package className="w-12 h-12 text-[#324339]/10 mx-auto mb-4" />
                    <p className="font-serif italic text-[#324339]/40 text-lg">Aún no has realizado ningún pedido.</p>
                </div>
            ) : (
                <div className="bg-white rounded-[2rem] border border-[#324339]/5 shadow-sm overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-[#324339]/[0.02] border-b border-[#324339]/5">
                                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#324339]/40">Seguimiento</th>
                                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#324339]/40">Fecha</th>
                                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#324339]/40">Estado</th>
                                <th className="px-8 py-5 text-[10px] uppercase tracking-[0.2em] font-bold text-[#324339]/40 text-right">Total</th>
                                <th className="px-8 py-5"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#324339]/5">
                            {orders.map((order) => (
                                <tr
                                    key={order.id}
                                    className="group hover:bg-[#FDFBF9] transition-colors cursor-pointer"
                                    onClick={() => navigate(`/orders/${order.id}`)}
                                >
                                    <td className="px-8 py-6">
                                        <span className="font-serif italic text-[#324339] text-lg">#{order.tracking_code}</span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-2 text-[#324339]/60 text-sm">
                                            <Calendar size={14} className="text-[#A86447]" />
                                            {new Date(order.placed_at).toLocaleDateString('es-ES')}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#324339]/10 shadow-sm text-[9px] font-bold uppercase tracking-widest text-[#324339]">
                                            <div className={`w-1.5 h-1.5 rounded-full ${order.status === 'DELIVERED' ? 'bg-emerald-500' : 'bg-[#A86447]'}`} />
                                            {STATUS_LABELS[order.status]}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <span className="font-serif text-[#324339] text-lg font-medium">{order.total_amount} €</span>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="inline-flex items-center justify-center w-8 h-8 rounded-full border border-[#324339]/10 text-[#324339]/20 group-hover:text-[#A86447] group-hover:border-[#A86447]/30 transition-all">
                                            <ChevronRight size={18} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}