import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area, Tooltip as RechartsTooltip
} from 'recharts';

import { MapContainer, TileLayer, CircleMarker, Tooltip as LeafletTooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import MarkerClusterGroup from 'react-leaflet-cluster';

import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';

const COLORS = ['#324339', '#A86447'];

export const WishlistVsSalesChart = ({ data }) => (
    <div className="h-80 w-full">
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E8DDD1" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7F72', fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7F72', fontSize: 12 }} />
                <RechartsTooltip
                    contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                <Bar name="Añadido al Carrito" dataKey="wishlist_count" fill="#A86447" radius={[4, 4, 0, 0]} barSize={30} />
                <Bar name="Ventas Reales" dataKey="sale_count" fill="#324339" radius={[4, 4, 0, 0]} barSize={30} />
            </BarChart>
        </ResponsiveContainer>
    </div>
);

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
                    <RechartsTooltip />
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
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#324339', fontSize: 10, fontWeight: 'bold' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#324339', fontSize: 10 }} tickFormatter={(value) => `${value}€`} />
                <RechartsTooltip
                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', padding: '15px' }}
                />
                <Area type="monotone" dataKey="value" stroke="#324339" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
            </AreaChart>
        </ResponsiveContainer>
    </div>
);

export const SalesHeatMap = ({ points }) => {
    const pointOptions = {
        fillColor: "#A86447",
        color: "white",
        weight: 1.5,
        opacity: 1,
        fillOpacity: 0.9,
    };

    return (
        <div className="h-96 w-full rounded-[2rem] overflow-hidden border border-[#324339]/5 shadow-inner">
            <MapContainer
                center={[40.4167, -3.7033]}
                zoom={6}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                zoomAnimation={true}
                markerZoomAnimation={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                    attribution='&copy; CartoDB'
                />

                <MarkerClusterGroup
                    chunkedLoading
                    showCoverageOnHover={false}
                    maxClusterRadius={50}
                >
                    {points.map((point, idx) => (
                        <CircleMarker
                            key={idx}
                            center={[point.lat, point.lng]}
                            radius={7}
                            pathOptions={pointOptions}
                        >
                            <LeafletTooltip direction="top" offset={[0, -5]} opacity={1}>
                                <div className="font-serif text-[#324339] p-1">
                                    <span className="block text-[10px] uppercase tracking-wider text-[#A86447] font-bold">Venta</span>
                                    <span className="text-sm italic">{point.amount.toFixed(2)} €</span>
                                </div>
                            </LeafletTooltip>
                        </CircleMarker>
                    ))}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
};