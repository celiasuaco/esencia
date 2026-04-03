import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import {
    ArrowLeft,
    Package,
    MapPin,
    CreditCard,
    User,
    CheckCircle2,
    Circle,
    Loader2,
    Calendar,
    ShieldCheck,
    AlertCircle,
    Hash
} from 'lucide-react';
import { toast } from 'sonner';

export default function AdminOrderDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [updatingStatus, setUpdatingStatus] = useState(null);

    const STATUS_FLOW = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED'];
    const STATUS_LABELS = {
        'PENDING': 'Pendiente',
        'PAID': 'Pagado',
        'SHIPPED': 'Enviado',
        'DELIVERED': 'Entregado'
    };

    // URL Base para las imágenes (ajusta según tu config de Django)
    const API_BASE_URL = 'http://localhost:8000';

    const getPhotoUrl = (photoPath) => {
        if (!photoPath) return "/default-product.png";
        if (photoPath.startsWith('http')) return photoPath;
        return `${API_BASE_URL}${photoPath}`;
    };

    useEffect(() => { fetchOrder(); }, [id]);

    const fetchOrder = async () => {
        try {
            const data = await orderService.getOrderDetails(id);
            setOrder(data);
        } catch {
            toast.error('Archivo no encontrado');
            navigate('/admin/orders');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (status) => {
        setUpdatingStatus(status);
        try {
            await orderService.updateStatus(id, status);
            toast.success('Registro actualizado');
            fetchOrder();
        } catch {
            toast.error('Error en la sincronización');
        } finally {
            setUpdatingStatus(null);
        }
    };

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF9]">
            <Loader2 className="animate-spin text-[#A86447]" size={32} />
            <span className="font-serif italic text-[#324339]/60 mt-4 uppercase tracking-[0.3em] text-[10px]">Esencia Archive</span>
        </div>
    );

    if (!order) return null;

    const currentIndex = STATUS_FLOW.indexOf(order.status);

    return (
        <div className="min-h-screen bg-[#FDFBF9] text-[#324339] px-6 py-12">
            <div className="max-w-5xl mx-auto space-y-10">

                {/* 1. HEADER & NAVIGATION */}
                <header className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/admin/orders')}
                            className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-[#324339]/40 hover:text-[#A86447] transition-all group"
                        >
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Volver al índice
                        </button>
                        <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-[0.4em] text-[#A86447] font-bold">Registro de Venta</span>
                            <h1 className="text-5xl font-serif italic leading-none tracking-tighter">
                                Order #{order.tracking_code}
                            </h1>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 text-[#324339]/60 font-serif italic border-b border-[#324339]/10 pb-1">
                        <Calendar size={16} className="text-[#A86447]" />
                        <span>{new Date(order.placed_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                </header>

                {/* 2. PROGRESS FLOW (Mantenido intacto por petición) */}
                <div className="px-4 py-8 bg-white rounded-[2rem] border border-[#324339]/5 shadow-sm">
                    <div className="flex items-center justify-between relative max-w-4xl mx-auto">
                        <div className="absolute top-[15px] left-0 w-full h-[1px] bg-[#324339]/5 -z-0" />
                        {STATUS_FLOW.map((status, i) => {
                            const isCompleted = i < currentIndex;
                            const isCurrent = i === currentIndex;
                            return (
                                <div key={status} className="flex-1 flex items-center relative z-10">
                                    <div className="flex flex-col items-center w-full group">
                                        <button
                                            onClick={() => handleStatusUpdate(status)}
                                            disabled={isCurrent || updatingStatus}
                                            className={`w-8 h-8 rounded-full mb-4 flex items-center justify-center transition-all duration-500 border shadow-sm ${isCurrent
                                                ? 'bg-[#A86447] border-[#A86447] text-white scale-110 shadow-[#A86447]/20'
                                                : isCompleted
                                                    ? 'bg-[#324339] border-[#324339] text-white'
                                                    : 'bg-white border-[#324339]/10 text-[#324339]/20 hover:border-[#A86447]/40'
                                                }`}
                                        >
                                            {updatingStatus === status ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : isCompleted ? (
                                                <CheckCircle2 size={16} />
                                            ) : (
                                                <Circle size={12} strokeWidth={isCurrent ? 3 : 1} />
                                            )}
                                        </button>
                                        <span className={`text-[9px] uppercase tracking-[0.2em] font-bold transition-colors ${isCurrent ? 'text-[#A86447]' : isCompleted ? 'text-[#324339]' : 'text-[#324339]/30'
                                            }`}>
                                            {STATUS_LABELS[status]}
                                        </span>
                                    </div>
                                    {i < STATUS_FLOW.length - 1 && (
                                        <div className="absolute top-[15px] left-[50%] w-full h-[1px] -z-10 overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${isCompleted ? 'bg-[#324339] w-full' : 'bg-transparent w-0'}`} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* 3. PANEL UNIFICADO: DATOS + PRODUCTOS */}
                <div className="bg-white border border-[#324339]/10 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col">

                    {/* Sección A: Datos de envío y pago (Horizontal) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 border-b border-[#324339]/5 bg-[#324339]/[0.02]">
                        <div className="p-8 border-r border-[#324339]/5 space-y-3">
                            <div className="flex items-center gap-3 text-[#A86447]">
                                <User size={14} />
                                <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Cliente</span>
                            </div>
                            <p className="font-serif italic text-lg leading-tight break-all">{order.user_email}</p>
                        </div>
                        <div className="p-8 border-r border-[#324339]/5 space-y-3">
                            <div className="flex items-center gap-3 text-[#A86447]">
                                <MapPin size={14} />
                                <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Dirección</span>
                            </div>
                            <p className="text-sm text-[#324339]/70 leading-relaxed italic">{order.address}</p>
                        </div>
                        <div className="p-8 space-y-3">
                            <div className="flex items-center gap-3 text-[#A86447]">
                                <CreditCard size={14} />
                                <span className="text-[9px] uppercase tracking-[0.3em] font-bold">Estado de Cobro</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`h-2 w-2 rounded-full ${order.is_paid ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
                                <p className={`text-[10px] uppercase font-bold tracking-widest ${order.is_paid ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {order.is_paid ? 'Transacción Verificada' : 'Esperando Fondos'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Sección B: Manifiesto con Fotos */}
                    <div className="p-8 sm:p-12 space-y-10">
                        <div className="flex items-center gap-4 border-b border-[#324339]/5 pb-6">
                            <ShieldCheck size={20} className="text-[#A86447]" />
                            <h2 className="font-serif text-2xl italic text-[#324339]">Detalle de Artículos Certificados</h2>
                        </div>

                        <div className="space-y-12">
                            {order.order_items.map((item) => (
                                <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 group">
                                    <div className="flex items-center gap-8">
                                        {/* FOTO DEL PRODUCTO */}
                                        <div className="w-24 h-24 bg-[#FDFBF9] rounded-3xl border border-[#324339]/10 overflow-hidden flex-shrink-0 group-hover:border-[#A86447]/40 transition-colors duration-500 shadow-sm relative">
                                            <img
                                                src={getPhotoUrl(item.product_photo)}
                                                alt={item.product_name}
                                                className="w-full h-full object-cover" // <-- CAMBIADO A object-cover
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = '/default-product.png';
                                                }}
                                            />
                                            {/* Overlay sutil para mejorar la integración visual */}
                                            <div className="absolute inset-0 bg-[#324339]/5 mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                        </div>

                                        <div className="space-y-2">
                                            <p className="text-2xl font-serif italic text-[#324339] group-hover:text-[#A86447] transition-colors duration-500">
                                                {item.product_name}
                                            </p>
                                            <div className="flex items-center gap-3">
                                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#324339]/40 bg-[#FDFBF9] px-3 py-1 rounded-full border border-[#324339]/5">
                                                    Cantidad: {item.quantity}
                                                </span>
                                                <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#324339]/30">
                                                    × {Number(item.price_at_purchase).toFixed(2)} €
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-left sm:text-right border-l sm:border-l-0 sm:border-r border-[#324339]/5 pl-4 sm:pr-8">
                                        <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#324339]/30 mb-1">Subtotal Pieza</p>
                                        <p className="font-serif text-2xl text-[#324339]">{Number(item.subtotal).toFixed(2)} €</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Sección C: Totales (Fondo Verde Esencia) */}
                    <div className="bg-[#324339] p-8 sm:p-12 text-white relative">
                        <div className="absolute top-0 right-12 w-32 h-1 bg-[#A86447]" />

                        <div className="max-w-md ml-auto space-y-4">
                            <div className="flex justify-between text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold">
                                <span>Suma de Colección</span>
                                <span>{Number(order.subtotal_amount).toFixed(2)} €</span>
                            </div>
                            <div className="flex justify-between text-white/40 text-[10px] uppercase tracking-[0.3em] font-bold border-b border-white/5 pb-4">
                                <span>Logística de Envío</span>
                                <span>{Number(order.shipping_amount).toFixed(2)} €</span>
                            </div>

                            <div className="flex justify-between items-end pt-4">
                                <div className="space-y-1">
                                    <span className="font-serif text-3xl italic text-white leading-none">Inversión Final</span>
                                    <p className="text-[9px] uppercase tracking-[0.4em] text-white/30">Certified Transaction</p>
                                </div>
                                <span className="text-5xl font-serif text-[#A86447] italic leading-none tracking-tighter">
                                    {Number(order.total_amount).toFixed(2)} €
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* BOTÓN DE CANCELACIÓN (Fuera del panel principal para evitar errores) */}
                {order.status !== 'DELIVERED' && order.status !== 'CANCELLED' && (
                    <div className="flex justify-center pt-4">
                        <button
                            onClick={() => handleStatusUpdate('CANCELLED')}
                            className="flex items-center gap-3 px-8 py-3 rounded-full border border-rose-200 text-rose-400 text-[10px] uppercase tracking-widest font-bold hover:bg-rose-50 hover:text-rose-600 transition-all opacity-40 hover:opacity-100"
                        >
                            <AlertCircle size={14} /> Anular Registro de Orden
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}