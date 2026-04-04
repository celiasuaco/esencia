import { useState, useEffect } from 'react';
import { TrendingUp, ShoppingBag, Users, Euro, Repeat } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';
import { WishlistVsSalesChart, RetentionPieChart, MonthlySalesChart } from '../../components/DashboardCharts';

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

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#FDFBF9]">
            <div className="animate-pulse font-serif text-2xl text-[#324339]">Esencia de datos...</div>
        </div>
    );

    if (!stats) return <div className="p-10 text-center text-red-500">Error de conexión.</div>;

    const kpiCards = [
        {
            title: 'Ingresos Totales',
            value: `${stats.total_revenue.toFixed(2)} €`,
            icon: Euro,
            color: 'from-[#324339] to-[#4A5D52]',
        },
        {
            title: 'Pedidos Históricos',
            value: stats.total_orders,
            icon: ShoppingBag,
            color: 'from-[#C77C5D] to-[#A86447]',
        },
        {
            title: 'Ticket Promedio',
            value: `${stats.avg_ticket.toFixed(2)} €`,
            icon: TrendingUp,
            color: 'from-[#5B7B63] to-[#3D5742]',
        },
        {
            title: 'Clientes VIP',
            value: stats.total_clients,
            icon: Users,
            color: 'from-[#8FA895] to-[#5B7B63]',
        },
    ];

    return (
        <div className="p-8 bg-[#FDFBF9] min-h-screen">
            <div className="mb-12">
                <h1 className="text-5xl font-serif text-[#324339] mb-2 italic">Dashboard</h1>
                <p className="text-[#324339]/50 uppercase tracking-widest text-xs font-bold">Business Intelligence & KPIs</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {kpiCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-white rounded-[2rem] shadow-xl shadow-[#324339]/5 p-8 border border-[#324339]/5 hover:-translate-y-1 transition-all">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xs text-[#324339]/40 font-bold uppercase tracking-wider">{card.title}</h3>
                                <div className={`bg-gradient-to-br ${card.color} p-3 rounded-2xl shadow-lg`}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                            </div>
                            <p className="text-3xl font-serif text-[#324339]">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Gráfico Barras: Deseo vs Venta */}
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-[#324339]/5 p-10 border border-[#324339]/5">
                    <div className="flex items-center gap-3 mb-8">
                        <ShoppingBag className="text-[#A86447]" size={20} />
                        <h2 className="text-2xl font-serif text-[#324339]">Deseo vs Conversión Real</h2>
                    </div>
                    <WishlistVsSalesChart data={stats.wishlist_vs_sales} />
                    <p className="mt-6 text-xs text-[#6B7F72] italic text-center">Relación entre productos en carritos vs ventas finalizadas por pieza.</p>
                </div>

                {/* Gráfico Pie: Fidelización */}
                <div className="bg-white rounded-[2.5rem] shadow-xl shadow-[#324339]/5 p-10 border border-[#324339]/5">
                    <div className="flex items-center gap-3 mb-8">
                        <Repeat className="text-[#324339]" size={20} />
                        <h2 className="text-2xl font-serif text-[#324339]">Fidelización</h2>
                    </div>
                    <RetentionPieChart data={stats.customer_retention} />
                    <div className="mt-4 space-y-2">
                        <div className="flex justify-between text-sm">
                            <span className="text-[#6B7F72]">Clientes Recurrentes</span>
                            <span className="font-bold text-[#324339]">{stats.customer_retention.recurring}</span>
                        </div>
                        <div className="flex justify-between text-sm border-t border-gray-100 pt-2">
                            <span className="text-[#6B7F72]">Nuevos Clientes</span>
                            <span className="font-bold text-[#A86447]">{stats.customer_retention.new}</span>
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-xl shadow-[#324339]/5 p-10 border border-[#324339]/5">
                    <div className="flex items-center gap-3 mb-8">
                        <ShoppingBag className="text-[#A86447]" size={20} />
                        <h2 className="text-2xl font-serif text-[#324339]">Ventas Mensuales</h2>
                    </div>
                    <MonthlySalesChart data={stats.monthly_sales} />
                    <p className="mt-6 text-xs text-[#6B7F72] italic text-center">Gráfica donde se muestra el desempeño de ventas a lo largo del tiempo.</p>
                </div>

            </div>
        </div>
    );
}