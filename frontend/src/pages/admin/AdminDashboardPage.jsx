import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Users, AlertTriangle } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';

export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await dashboardService.getStats();
                setStats(data);
            } catch (error) {
                console.error("Error cargando estadísticas", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return <div className="p-10 text-center font-serif text-2xl">Cargando Esencia de datos...</div>;
    if (!stats) return <div className="p-10 text-center text-red-500">Error al conectar con el servidor.</div>;

    const { metrics } = stats;

    const kpiCards = [
        {
            title: 'Ingresos Totales',
            value: `${metrics.sales.total_revenue.toLocaleString()} €`,
            icon: TrendingUp,
            color: 'from-[#5B7B63] to-[#3D5742]',
        },
        {
            title: 'Pedidos Pendientes',
            value: metrics.sales.pending_orders,
            icon: ShoppingBag,
            color: 'from-[#C77C5D] to-[#A86447]',
        },
        {
            title: 'Usuarios Totales',
            value: metrics.users.total_count,
            icon: Users,
            color: 'from-[#8FA895] to-[#5B7B63]',
        },
        {
            title: 'Alertas de Stock',
            value: metrics.inventory.low_stock_alerts,
            icon: AlertTriangle,
            color: metrics.inventory.low_stock_alerts > 0 ? 'from-red-500 to-red-700' : 'from-[#E8A88E] to-[#C77C5D]',
        },
    ];

    return (
        <div className="p-6">
            <div className="mb-10">
                <h1 className="text-5xl font-serif text-[#2C3632] mb-2">Dashboard</h1>
                <p className="text-[#6B7F72]">Métricas de tu plataforma</p>
            </div>

            {/* KPI Cards Dinámicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {kpiCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-white rounded-3xl shadow-lg p-8 border border-[#5B7B63]/10 hover:shadow-xl transition-shadow">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm text-[#6B7F72] font-medium">{card.title}</h3>
                                <div className={`bg-gradient-to-br ${card.color} p-3 rounded-2xl shadow-lg`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-3xl font-serif text-[#2C3632]">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            {/* Gráfica de Ventas (Aquí podrías conectar una lista de ventas mensuales si el backend la diera) */}
            <div className="bg-white rounded-3xl shadow-lg p-8 mb-10 border border-[#5B7B63]/10">
                <h2 className="text-2xl font-serif text-[#2C3632] mb-8">Rendimiento</h2>
                <div className="h-64 flex items-center justify-center bg-[#FDFBF9] rounded-2xl border border-dashed border-[#E8DDD1]">
                    <p className="text-[#6B7F72]">Gráficos interactivos conectados a {metrics.sales.total_orders} pedidos realizados</p>
                </div>
            </div>

            {/* El resto de componentes (Heatmap, Predicción) los puedes dejar como mocks hasta que los implementemos en el backend */}
        </div>
    );
}