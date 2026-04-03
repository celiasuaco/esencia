import { useState, useEffect } from 'react';
import { orderService } from '../../services/orderService';
import OrderCard from '../../components/order/OrderCard';
import { Search, Filter, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState({ email: '', tracking: '' });

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const data = await orderService.getAllOrders(search);
            setOrders(data);
        } catch (err) {
            console.error(err);
            toast.error("Error al cargar pedidos");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => fetchOrders(), 500); // Debounce de búsqueda
        return () => clearTimeout(timer);
    }, [search]);

    const handleStatusUpdate = async (orderId, newStatus) => {
        try {
            await orderService.updateStatus(orderId, newStatus);
            toast.success(`Pedido #${orderId} actualizado a ${newStatus}`);
            fetchOrders();
        } catch (err) {
            console.error(err);
            toast.error("No se pudo actualizar el estado");
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFBF9] pt-10 pb-20 px-6">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12">
                    <h1 className="text-4xl font-serif text-[#324339] italic mb-2">Gestión de Pedidos</h1>
                    <p className="text-[#324339]/40 text-sm tracking-wide uppercase">Panel de control operativo</p>
                </header>

                {/* Barra de Búsqueda y Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#324339]/20" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por código de seguimiento..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#324339]/10 focus:border-[#A86447] outline-none transition-all text-sm shadow-sm bg-white"
                            value={search.tracking}
                            onChange={(e) => setSearch({ ...search, tracking: e.target.value })}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#324339]/20" size={18} />
                        <input
                            type="text"
                            placeholder="Filtrar por email de cliente..."
                            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#324339]/10 focus:border-[#A86447] outline-none transition-all text-sm shadow-sm bg-white"
                            value={search.email}
                            onChange={(e) => setSearch({ ...search, email: e.target.value })}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center py-20 gap-4">
                        <Loader2 className="animate-spin text-[#A86447]" size={32} />
                        <span className="font-serif italic text-[#324339]/60">Sincronizando registros...</span>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {orders.map(order => (
                            <OrderCard
                                key={order.id}
                                order={order}
                                isAdmin={true}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}