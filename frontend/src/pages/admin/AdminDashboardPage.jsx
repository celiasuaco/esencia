import { useState, useEffect, lazy, Suspense } from 'react';
import { TrendingUp, ShoppingBag, Users, Euro, Repeat, MapPin, Loader2 } from 'lucide-react';
import { dashboardService } from '../../services/dashboardService';

const WishlistVsSalesChart = lazy(() => import('../../components/DashboardCharts').then(module => ({ default: module.WishlistVsSalesChart })));
const RetentionPieChart = lazy(() => import('../../components/DashboardCharts').then(module => ({ default: module.RetentionPieChart })));
const MonthlySalesChart = lazy(() => import('../../components/DashboardCharts').then(module => ({ default: module.MonthlySalesChart })));
const SalesHeatMap = lazy(() => import('../../components/DashboardCharts').then(module => ({ default: module.SalesHeatMap })));

const ChartLoader = () => (
    <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-2">
        <Loader2 className="animate-spin" size={24} />
        <span className="text-xs uppercase tracking-widest font-bold opacity-50">Procesando analítica...</span>
    </div>
);

export default function AdminDashboardPage() {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const controller = new AbortController();

        const fetchStats = async () => {
            try {
                setLoading(true);
                const data = await dashboardService.getStats({ signal: controller.signal });
                if (data) setStats(data);
            } catch (error) {
                if (error.name !== 'AbortError') console.error("Error cargando estadísticas", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
        return () => controller.abort();
    }, []);

    if (loading) return (
        <div className="h-screen flex items-center justify-center bg-[#FDFBF9]">
            <div className="animate-pulse font-serif text-xl md:text-2xl text-[#324339]">Esencia de datos...</div>
        </div>
    );

    if (!stats) return (
        <div className="p-6 md:p-10 text-center">
            <p className="text-red-500 mb-4">Error de conexión con el servidor de datos.</p>
            <button onClick={() => globalThis.location.reload()} className="px-6 py-2 bg-[#324339] text-white rounded-full text-sm transition-transform active:scale-95">
                Reintentar
            </button>
        </div>
    );

    const kpiCards = [
        { title: 'Ingresos Totales', value: `${(stats.total_revenue || 0).toFixed(2)} €`, icon: Euro, color: 'from-[#324339] to-[#4A5D52]' },
        { title: 'Pedidos Históricos', value: stats.total_orders || 0, icon: ShoppingBag, color: 'from-[#C77C5D] to-[#A86447]' },
        { title: 'Ticket Promedio', value: `${(stats.avg_ticket || 0).toFixed(2)} €`, icon: TrendingUp, color: 'from-[#5B7B63] to-[#3D5742]' },
        { title: 'Clientes', value: stats.total_clients || 0, icon: Users, color: 'from-[#8FA895] to-[#5B7B63]' },
    ];

    return (
        <div className="min-h-screen bg-[#FDFBF9] p-4 sm:p-6 md:p-8 lg:p-10">

            <header className="mb-8 md:mb-12">
                <h1 className="text-3xl md:text-5xl font-serif text-[#324339] mb-2 italic">Dashboard</h1>
                <p className="text-[#324339]/50 uppercase tracking-[0.2em] text-[10px] md:text-xs font-bold">Business Intelligence & KPIs</p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12">
                {kpiCards.map((card, index) => {
                    const Icon = card.icon;
                    return (
                        <div key={index} className="bg-white rounded-2xl md:rounded-[2rem] shadow-xl shadow-[#324339]/5 p-6 md:p-8 border border-[#324339]/5 hover:-translate-y-1 transition-all duration-300">
                            <div className="flex items-center justify-between mb-4 md:mb-6 gap-2">
                                <h3 className="text-[10px] md:text-xs text-[#324339]/40 font-bold uppercase tracking-wider">{card.title}</h3>
                                <div className={`bg-gradient-to-br ${card.color} p-2 rounded-xl shadow-lg flex-shrink-0`}>
                                    <Icon className="w-5 h-5 md:w-6 md:h-6 text-white" />
                                </div>
                            </div>
                            <p className="text-xl md:text-2xl font-serif text-[#324339] truncate">{card.value}</p>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">

                <section className="lg:col-span-7 bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl shadow-[#324339]/5 p-6 md:p-10 border border-[#324339]/5">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <ShoppingBag className="text-[#A86447]" size={20} />
                        <h2 className="text-xl md:text-2xl font-serif text-[#324339]">Deseo vs Conversión Real</h2>
                    </div>
                    <div className="w-full overflow-hidden">
                        <Suspense fallback={<ChartLoader />}>
                            <WishlistVsSalesChart data={stats.wishlist_vs_sales || []} />
                        </Suspense>
                    </div>
                </section>

                <section className="lg:col-span-5 bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl shadow-[#324339]/5 p-6 md:p-10 border border-[#324339]/5">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <Repeat className="text-[#324339]" size={20} />
                        <h2 className="text-xl md:text-2xl font-serif text-[#324339]">Fidelización</h2>
                    </div>
                    <Suspense fallback={<ChartLoader />}>
                        <RetentionPieChart data={stats.customer_retention || { recurring: 0, new: 0 }} />
                    </Suspense>
                    {stats.customer_retention && (
                        <div className="mt-6 space-y-3">
                            <div className="flex justify-between text-xs md:text-sm">
                                <span className="text-[#6B7F72]">Clientes Recurrentes</span>
                                <span className="font-bold text-[#324339]">{stats.customer_retention.recurring}</span>
                            </div>
                            <div className="flex justify-between text-xs md:text-sm border-t border-gray-100 pt-3">
                                <span className="text-[#6B7F72]">Nuevos Clientes</span>
                                <span className="font-bold text-[#A86447]">{stats.customer_retention.new}</span>
                            </div>
                        </div>
                    )}
                </section>

                <section className="lg:col-span-12 bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl shadow-[#324339]/5 p-6 md:p-10 border border-[#324339]/5">
                    <div className="flex items-center gap-3 mb-6 md:mb-8">
                        <TrendingUp className="text-[#A86447]" size={20} />
                        <h2 className="text-xl md:text-2xl font-serif text-[#324339]">Ventas Mensuales</h2>
                    </div>
                    <div className="w-full overflow-hidden">
                        <Suspense fallback={<ChartLoader />}>
                            <MonthlySalesChart data={stats.monthly_sales || []} />
                        </Suspense>
                    </div>
                </section>
            </div>

            <section className="mt-6 md:mt-8 bg-white rounded-2xl md:rounded-[2.5rem] shadow-xl shadow-[#324339]/5 p-6 md:p-10 border border-[#324339]/5">
                <div className="flex items-center gap-3 mb-6 md:mb-8">
                    <MapPin className="text-[#A86447]" size={20} />
                    <h2 className="text-xl md:text-2xl font-serif text-[#324339]">Distribución Geográfica</h2>
                </div>
                <div className="w-full h-[300px] md:h-[450px] rounded-xl overflow-hidden">
                    <Suspense fallback={<ChartLoader />}>
                        <SalesHeatMap points={stats.heatmap_data || []} />
                    </Suspense>
                </div>
            </section>
        </div>
    );
}