import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { Plus, Edit2, Trash2, Search, Package, Filter } from 'lucide-react';

export default function AdminProductsPage() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);

    const [filterCategory, setFilterCategory] = useState('ALL');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { loadProducts(); }, []);

    useEffect(() => {
        let result = products;
        if (filterCategory !== 'ALL') result = result.filter(p => p.category === filterCategory);
        if (filterStatus !== 'ALL') {
            const active = filterStatus === 'ACTIVE';
            result = result.filter(p => p.is_active === active);
        }
        if (searchTerm) {
            result = result.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }
        setFilteredProducts(result);
    }, [filterCategory, filterStatus, searchTerm, products]);

    const loadProducts = async () => {
        try {
            const data = await productService.getAll();
            setProducts(data);
            setFilteredProducts(data);
        } catch (err) { alert("Error cargando inventario"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("¿Desactivar este producto?")) {
            await productService.delete(id);
            loadProducts();
        }
    };

    return (
        <div className="p-4 lg:p-8 max-w-[1600px] mx-auto">
            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div className="mb-10">
                    <h1 className="text-5xl font-serif text-[#2C3632] mb-2">Gestión de Productos</h1>
                    <p className="text-[#6B7F72]">Crea, modifica y elimina tus productos</p>
                </div>
                <button
                    onClick={() => navigate('/admin/products/new')}
                    className="bg-[#A86447] text-white px-6 py-2.5 rounded-xl hover:bg-[#A86447] transition-all flex items-center gap-2 shadow-sm font-medium text-sm"
                >
                    <Plus size={18} /> Crear Producto
                </button>
            </div>

            {/* BARRA DE FILTROS */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">

                {/* Buscador */}
                <div className="relative w-full md:w-2/5">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3937B]" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre de joya..."
                        className="w-full pl-12 pr-4 py-3 bg-[#FDFBF7] border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#A86447]/20 focus:border-[#A86447] outline-none text-sm transition-all"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filtro de Estado */}
                <div className="flex bg-[#FDFBF7] p-1 rounded-xl border border-gray-200 w-full md:w-auto">
                    {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterStatus === status
                                ? 'bg-white text-[#A86447] shadow-sm'
                                : 'text-[#8FA895] hover:text-[#2C3632]'
                                }`}
                        >
                            {status === 'ALL' ? 'Todos' : status === 'ACTIVE' ? 'Activos' : 'Inactivos'}
                        </button>
                    ))}
                </div>

                {/* Filtro de Categoría */}
                <div className="relative w-full md:w-auto md:flex-1">
                    <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A3937B]" size={16} />
                    <select
                        className="w-full pl-11 pr-8 py-3 bg-[#FDFBF7] border border-gray-200 rounded-xl text-sm text-[#2C3632] outline-none focus:ring-2 focus:ring-[#A86447]/20 focus:border-[#A86447] appearance-none cursor-pointer"
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                    >
                        <option value="ALL">Todas las categorías</option>
                        <option value="ANILLO">Anillos</option>
                        <option value="COLLAR">Collares</option>
                        <option value="PENDIENTE">Pendientes</option>
                        <option value="PULSERA">Pulseras</option>
                    </select>
                    {/* Flecha personalizada para el select */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#A3937B]">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="19 9l-7 7-7-7" /></svg>
                    </div>
                </div>

                {/* Botón de reset */}
                {(searchTerm || filterStatus !== 'ALL' || filterCategory !== 'ALL') && (
                    <button
                        onClick={() => { setSearchTerm(''); setFilterStatus('ALL'); setFilterCategory('ALL'); }}
                        className="text-[#A86447] hover:text-[#722F1D] text-xs font-bold px-2 transition-colors"
                    >
                        Limpiar
                    </button>
                )}
            </div>
            <p className="text-sm text-[#8FA895] mb-6 font-medium tracking-tight">Mostrando {filteredProducts.length} de {products.length} productos</p>

            {/* GRID DE PRODUCTOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map(p => (
                    <div key={p.id} className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col group">
                        {/* CONTENEDOR DE IMAGEN HOMOGÉNEO */}
                        <div className="relative aspect-square bg-[#FDFBF7] overflow-hidden">
                            <img
                                src={p.photo}
                                alt={p.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <div className="absolute top-3 left-3 flex flex-col gap-2">
                                {p.stock < 10 && p.stock > 0 && (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#B38B4D] text-white shadow-md border border-white/20 uppercase tracking-wider">
                                        Stock bajo
                                    </span>
                                )}
                                {p.stock === 0 && (
                                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-[#722F1D] text-white shadow-md border border-white/20 uppercase tracking-wider">
                                        Agotado
                                    </span>
                                )}
                            </div>
                            <div className="absolute top-3 right-3">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-bold shadow-md border border-white/20 uppercase tracking-widest ${p.is_active
                                    ? 'bg-[#4A5D4E] text-white'
                                    : 'bg-[#8E8279] text-white'
                                    }`}>
                                    {p.is_active ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>

                        <div className="p-5 flex flex-col flex-grow">
                            <h3 className="text-lg font-medium text-[#2C3632] mb-1 line-clamp-1">{p.name}</h3>
                            <p className="text-sm text-gray-400 mb-4">{p.category_display || p.category}</p>

                            <div className="flex justify-between items-center mb-5">
                                <span className="text-xl font-bold text-[#2C3632]">{Number(p.price).toFixed(2)} €</span>
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${p.stock <= 5 ? 'bg-orange-50 text-[#A86447]' : 'bg-green-50 text-green-700'}`}>
                                    <Package size={14} />
                                    {p.stock}
                                </div>
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={() => navigate(`/admin/products/edit/${p.id}`)}
                                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-[#A86447] hover:bg-[#A86447] text-white rounded-lg transition-colors text-sm font-medium"
                                >
                                    <Edit2 size={16} /> Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(p.id)}
                                    className="p-2 border border-red-100 bg-red-50 text-red-500 hover:bg-red-100 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}