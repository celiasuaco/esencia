import { useState } from 'react';
import { toast } from 'sonner';

export default function ProductForm({
    product = null,
    onSubmit = () => { },
    onCancel = () => { }
}) {
    const [formData, setFormData] = useState(product || {
        name: '',
        description: '',
        category: 'ANILLO',
        price: '',
        stock: '',
        material: 'Oro 18k'
    });
    const [photo, setPhoto] = useState(null);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validación rápida frontend
        if (Number.parseFloat(formData.price) <= 0) {
            return toast.error("El precio debe ser mayor a 0");
        }

        const data = new FormData();
        // Creamos una copia para no ensuciar el estado del componente
        const cleanData = { ...formData };

        delete cleanData.category_display;
        delete cleanData.id;
        delete cleanData.photo;

        Object.keys(cleanData).forEach(key => {
            data.append(key, cleanData[key]);
        });

        if (photo) {
            data.append('photo', photo);
        }

        onSubmit(data);
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border border-[#E8E2D6]">
            <h3 className="font-serif text-xl text-[#2C3632] mb-4">
                {product ? 'Editar Joya' : 'Nueva Joya'}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                    type="text" placeholder="Nombre de la joya"
                    className="p-2 border rounded-lg"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                />
                <select
                    className="p-2 border rounded-lg"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                    <option value="ANILLO">Anillo</option>
                    <option value="COLLAR">Collar</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="PULSERA">Pulsera</option>
                </select>

                <input
                    type="number" placeholder="Precio (€)"
                    className="p-2 border rounded-lg"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                />
                <input
                    type="number" placeholder="Stock disponible"
                    className="p-2 border rounded-lg"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    required
                />
            </div>

            <textarea
                placeholder="Descripción de la pieza..."
                className="w-full p-2 border rounded-lg h-24"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />

            <div>
                <label
                    htmlFor="photo-upload" // Añade esto
                    className="block text-xs font-bold text-[#A3937B] uppercase mb-1"
                >
                    Imagen de producto
                </label>
                <input
                    id="photo-upload" // Añade este ID igual al htmlFor
                    type="file"
                    onChange={(e) => setPhoto(e.target.files[0])}
                    className="text-sm"
                />
            </div>

            <div className="flex gap-2 justify-end mt-6">
                <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-500">Cancelar</button>
                <button type="submit" className="px-6 py-2 bg-[#324339] text-white rounded-lg hover:bg-[#C77C5D] transition-colors">
                    Guardar Producto
                </button>
            </div>
        </form>
    );
}