import { useState, useEffect, useCallback } from 'react';
import { orderService } from '../../services/orderService';
import OrderCard from '../../components/order/OrderCard';
import { Search, Filter, Loader2, Calendar, Euro, X, Mail, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const INITIAL_FILTERS = {
    email: '',
    tracking: '',
    status: '',
    date_from: '',
    date_to: '',
    price_min: '',
    price_max: ''
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState(INITIAL_FILTERS);

    const fetchOrders = useCallback(async () => {
        setLoading(true);
        try {
            const data = await orderService.getAllOrders(search);
            setOrders(data);
        } catch (err) {
            toast.error("Error al sincronizar el historial");
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchOrders();
        }, 500);
        return () => clearTimeout(timer);
    }, [fetchOrders]);

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setSearch(prev => ({ ...prev, [name]: value }));
    };

    const resetFilters = () => setSearch(INITIAL_FILTERS);

    return (
        <div className="min-h-screen bg-[#FDFBF9] pt-10 pb-20 px-6">
            <div className="max-w-6xl mx-auto">
                <header className="mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                    <div>
                        <h1 className="text-4xl font-serif text-[#324339] italic mb-2">Gestión de Pedidos</h1>
                        <p className="text-[#324339]/40 text-[10px] tracking-[0.3em] uppercase font-bold">Control Contable y Operativo</p>
                    </div>
                    <button
                        onClick={resetFilters}
                        className="text-[10px] uppercase tracking-widest font-bold text-[#A86447] hover:text-[#324339] transition-colors flex items-center gap-2 border-b border-[#A86447]/20 pb-1"
                    >
                        <X size={12} /> Limpiar Filtros
                    </button>
                </header>

                {/* PANEL DE FILTROS AVANZADOS */}
                <div className="bg-white rounded-[2.5rem] border border-[#324339]/5 p-8 shadow-sm mb-12">
                    <div className="flex flex-col gap-8">

                        {/* Fila 1: Búsqueda y Estado */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                            <div className="lg:col-span-4 relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#324339]/20 group-focus-within:text-[#A86447] transition-colors" size={18} />
                                <input
                                    name="tracking"
                                    type="text"
                                    placeholder="Nº Seguimiento..."
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#324339]/10 focus:border-[#A86447] outline-none text-sm bg-[#FDFBF9]/50 transition-all shadow-inner"
                                    value={search.tracking}
                                    onChange={handleFilterChange}
                                />
                            </div>

                            <div className="lg:col-span-4 relative group">
                                <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#324339]/20 group-focus-within:text-[#A86447] transition-colors" size={18} />
                                <select
                                    name="status"
                                    className="w-full pl-12 pr-10 py-4 rounded-2xl border border-[#324339]/10 focus:border-[#A86447] outline-none text-sm bg-[#FDFBF9]/50 appearance-none text-[#324339]/60 cursor-pointer shadow-inner"
                                    value={search.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="PENDING">Pendiente</option>
                                    <option value="PAID">Pagado</option>
                                    <option value="SHIPPED">Enviado</option>
                                    <option value="DELIVERED">Entregado</option>
                                    <option value="CANCELLED">Cancelado</option>
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-30" size={14} />
                            </div>

                            <div className="lg:col-span-4 relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#324339]/20 group-focus-within:text-[#A86447] transition-colors" size={18} />
                                <input
                                    name="email"
                                    type="text"
                                    placeholder="Email cliente..."
                                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-[#324339]/10 focus:border-[#A86447] outline-none text-sm bg-[#FDFBF9]/50 transition-all shadow-inner"
                                    value={search.email}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>

                        {/* Fila 2: Rango Contable (Diseño compacto) */}
                        <div className="flex flex-wrap lg:flex-nowrap items-center gap-10 pt-6 border-t border-[#324339]/5">

                            {/* Fechas - Ocupa el espacio disponible */}
                            <div className="flex-1 min-w-[300px] space-y-3">
                                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#324339]/30 flex items-center gap-2">
                                    <Calendar size={14} className="text-[#A86447]" /> Rango Temporal
                                </p>
                                <div className="flex items-center gap-3">
                                    <input
                                        name="date_from"
                                        type="date"
                                        className="flex-1 px-4 py-3 rounded-xl border border-[#324339]/5 text-xs text-[#324339]/70 focus:border-[#A86447] outline-none bg-[#FDFBF9]/80 shadow-sm"
                                        value={search.date_from}
                                        onChange={handleFilterChange}
                                    />
                                    <span className="text-[#324339]/20 font-serif">a</span>
                                    <input
                                        name="date_to"
                                        type="date"
                                        className="flex-1 px-4 py-3 rounded-xl border border-[#324339]/5 text-xs text-[#324339]/70 focus:border-[#A86447] outline-none bg-[#FDFBF9]/80 shadow-sm"
                                        value={search.date_to}
                                        onChange={handleFilterChange}
                                    />
                                </div>
                            </div>

                            {/* Importes - Input corto y fijo */}
                            <div className="space-y-3">
                                <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#324339]/30 flex items-center gap-2">
                                    <Euro size={14} className="text-[#A86447]" /> Importe (€)
                                </p>
                                <div className="flex items-center gap-2">
                                    <input
                                        name="price_min"
                                        type="number"
                                        placeholder="Mín"
                                        className="w-24 px-4 py-3 rounded-xl border border-[#324339]/5 text-xs focus:border-[#A86447] outline-none bg-[#FDFBF9]/80 shadow-sm text-center"
                                        value={search.price_min}
                                        onChange={handleFilterChange}
                                    />
                                    <div className="h-[1px] w-2 bg-[#324339]/10" />
                                    <input
                                        name="price_max"
                                        type="number"
                                        placeholder="Máx"
                                        className="w-24 px-4 py-3 rounded-xl border border-[#324339]/5 text-xs focus:border-[#A86447] outline-none bg-[#FDFBF9]/80 shadow-sm text-center"
                                        value={search.price_max}
                                        onChange={handleFilterChange}
                                    />
                                </div>
                            </div>

                        </div>
                    </div>
                </div>

                {/* RESULTADOS - Usamos Grid para evitar que se monten las tarjetas */}
                {loading ? (
                    <div className="flex flex-col items-center py-32 gap-6">
                        <Loader2 className="animate-spin text-[#A86447]" size={40} />
                        <span className="font-serif italic text-[#324339]/40 tracking-widest text-sm">Consultando archivo...</span>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8">
                        {orders.length > 0 ? (
                            orders.map(order => (
                                <OrderCard
                                    key={order.id}
                                    order={order}
                                    isAdmin={true}
                                />
                            ))
                        ) : (
                            <div className="text-center py-32 bg-white rounded-[3rem] border border-dashed border-[#324339]/10">
                                <p className="font-serif italic text-[#324339]/30 text-lg">No se han hallado registros bajo estos criterios.</p>
                                <button
                                    onClick={resetFilters}
                                    className="mt-4 text-[#A86447] text-[10px] uppercase tracking-widest font-bold hover:underline"
                                >
                                    Mostrar todos los pedidos
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}