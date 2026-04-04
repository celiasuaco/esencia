import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import UserCard from '../../components/user/UserCard';
import { Loader2, Award, Search } from 'lucide-react';

export default function AdminUserListPage() {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await authService.getUsersStats();
                setClients(data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const filteredClients = clients.filter(c =>
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="h-screen flex flex-col items-center justify-center bg-[#FDFBF9]">
            <Loader2 className="animate-spin text-[#A86447] mb-4" size={40} />
            <p className="font-serif italic text-[#324339]/40 tracking-widest text-sm">Analizando base de clientes...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#FDFBF9] pt-10 pb-20 px-6">
            <div className="max-w-5xl mx-auto">
                <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-4xl font-serif text-[#324339] italic mb-2">Análisis de Clientes</h1>
                    </div>

                    {/* Buscador Rápido */}
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#324339]/20" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar cliente..."
                            className="w-full pl-12 pr-4 py-3 rounded-2xl border border-[#324339]/10 focus:border-[#A86447] outline-none text-sm bg-white shadow-sm transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </header>

                {/* Ranking de Valor (Sutil) */}
                <div className="mb-8 flex items-center gap-3 px-6 py-4 bg-[#324339]/[0.02] rounded-2xl border border-[#324339]/5">
                    <Award className="text-[#A86447]" size={20} />
                    <span className="text-xs font-serif italic text-[#324339]/60">
                        Mostrando clientes ordenados por volumen de inversión total.
                    </span>
                </div>

                {/* Listado */}
                <div className="grid grid-cols-1 gap-6">
                    {filteredClients.length > 0 ? (
                        filteredClients.map(client => (
                            <UserCard key={client.id} client={client} />
                        ))
                    ) : (
                        <div className="text-center py-20 bg-white rounded-[3rem] border border-dashed border-[#324339]/10">
                            <p className="font-serif italic text-[#324339]/30 text-lg">No se han encontrado registros de clientes.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}