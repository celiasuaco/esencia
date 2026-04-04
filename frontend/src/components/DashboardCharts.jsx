import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const COLORS = ['#324339', '#A86447'];

// Gráfico Opción C: Deseo vs Venta
export const WishlistVsSalesChart = ({ data }) => (
    <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DDD1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7F72', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7F72', fontSize: 12 }} />
                <Tooltip
                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar name="Añadido al Carrito" dataKey="wishlist_count" fill="#A86447" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar name="Ventas Reales" dataKey="sale_count" fill="#324339" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

// Gráfico Opción B: Tasa de Retorno (Fidelización)
export const RetentionPieChart = ({ data }) => {
    const chartData = [
        { name: 'Recurrentes', value: data.recurring },
        { name: 'Nuevos', value: data.new }
    ];

    return (
        <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={36} />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
};


export const MonthlySalesChart = ({ data }) => (
    <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#324339" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#324339" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#324339" strokeOpacity={0.05} />
                <XAxis
                    dataKey="label"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#324339', fontSize: 10, fontWeight: 'bold' }}
                    dy={10}
                />
                <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#324339', fontSize: 10 }}
                    tickFormatter={(value) => `${value}€`}
                />
                <Tooltip
                    contentStyle={{
                        borderRadius: '20px',
                        border: 'none',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
                        padding: '15px'
                    }}
                />
                <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#324339"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);