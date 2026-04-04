import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { productService } from '../../services/productService';
import { ArrowLeft, Save, Camera } from 'lucide-react';
import { toast } from 'sonner';

export default function ProductFormPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'ANILLO',
        price: '',
        stock: 0,
        material: 'Oro 18k',
        is_active: true
    });
    const [photo, setPhoto] = useState(null);

    useEffect(() => {
        if (id) {
            const loadProduct = async () => {
                try {
                    const data = await productService.getById(id);
                    setFormData({
                        name: data.name || '',
                        description: data.description || '',
                        category: data.category || 'ANILLO',
                        price: data.price || '',
                        stock: data.stock || 0,
                        material: data.material || '',
                        is_active: data.is_active
                    });
                    if (data.photo) setImagePreview(data.photo);
                } catch (err) {
                    toast.error("Error al cargar el producto", { description: err });
                    navigate('/admin/products');
                }
            };
            loadProduct();
        }
    }, [id, navigate]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhoto(file);
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (Number.parseFloat(formData.price) <= 0) {
            return toast.error("El precio debe ser mayor a 0");
        }

        setLoading(true);
        const data = new FormData();

        Object.keys(formData).forEach(key => {
            data.append(key, formData[key]);
        });

        if (photo instanceof File) {
            data.append('photo', photo);
        }

        try {
            if (id) {
                await productService.update(id, data);
            } else {
                await productService.create(data);
            }
            navigate('/admin/products');
        } catch (err) {
            console.error("Error al guardar el producto:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 lg:p-8">
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 text-[#A3937B] mb-8 hover:text-[#A86447] transition-colors font-medium"
            >
                <ArrowLeft size={18} /> Volver al inventario
            </button>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-[#A86447] to-[#A17F58] px-8 py-10 text-white">
                    <h2 className="text-3xl font-serif italic">{id ? 'Editar Joya' : 'Nueva Joya'}</h2>
                    <p className="opacity-80 text-sm mt-2">Gestiona los detalles técnicos y visuales de la colección</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 lg:p-12">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">

                        {/* SECCIÓN IMAGEN */}
                        <div className="space-y-4">
                            <label htmlFor="photo-upload" className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                Imagen Principal
                            </label>
                            <button
                                type="button"
                                onClick={() => fileInputRef.current.click()}
                                className="w-full relative aspect-square rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 cursor-pointer hover:border-[#A86447] transition-all flex items-center justify-center overflow-hidden group focus:ring-2 focus:ring-[#A86447] outline-none"
                                aria-label="Subir imagen de producto"
                            >
                                {imagePreview ? (
                                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <div className="text-center">
                                        <Camera className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                        <p className="text-xs text-gray-400">Subir imagen</p>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera className="text-white w-8 h-8" />
                                </div>
                            </button>
                            <input
                                id="photo-upload"
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                accept="image/*"
                                onChange={handleImageChange}
                            />
                        </div>

                        {/* SECCIÓN CAMPOS */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label htmlFor="name" className="text-xs font-bold text-[#A3937B] uppercase">Nombre de la pieza</label>
                                    <input
                                        id="name"
                                        type="text"
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-1 focus:ring-[#A86447] outline-none transition-all"
                                        required
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="category" className="text-xs font-bold text-[#A3937B] uppercase">Categoría</label>
                                    <select
                                        id="category"
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-[#A86447] cursor-pointer"
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        <option value="ANILLO">Anillo</option>
                                        <option value="COLLAR">Collar</option>
                                        <option value="PENDIENTE">Pendiente</option>
                                        <option value="PULSERA">Pulsera</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="price" className="text-xs font-bold text-[#A3937B] uppercase">Precio (€)</label>
                                    <input
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-[#A86447]"
                                        required
                                        value={formData.price}
                                        onChange={e => setFormData({ ...formData, price: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="stock" className="text-xs font-bold text-[#A3937B] uppercase">Stock</label>
                                    <input
                                        id="stock"
                                        type="number"
                                        className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-[#A86447]"
                                        required
                                        value={formData.stock}
                                        onChange={e => setFormData({ ...formData, stock: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="material" className="text-xs font-bold text-[#A3937B] uppercase">Material</label>
                                <input
                                    id="material"
                                    type="text"
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl outline-none focus:ring-1 focus:ring-[#A86447]"
                                    value={formData.material}
                                    onChange={e => setFormData({ ...formData, material: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="description" className="text-xs font-bold text-[#A3937B] uppercase">Descripción detallada</label>
                                <textarea
                                    id="description"
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl h-32 outline-none focus:ring-1 focus:ring-[#A86447] resize-none"
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    className="w-5 h-5 accent-[#A86447] cursor-pointer"
                                    checked={formData.is_active}
                                    onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Producto activo (visible en catálogo)
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex gap-4 border-t border-gray-50 pt-8">
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-4 bg-[#A86447] text-white rounded-2xl font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                        >
                            <Save size={20} />
                            {loading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    {' '}Procesando...
                                </span>
                            ) : 'Confirmar Cambios'}
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/admin/products')}
                            className="px-8 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}