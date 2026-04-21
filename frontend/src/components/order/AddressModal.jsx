// src/components/order/AddressModal.jsx
import { useState, useCallback } from 'react';
import { MapPin, X, Loader2 } from 'lucide-react';
import PropTypes from 'prop-types';
import debounce from 'lodash.debounce'; // npm install lodash.debounce

export default function AddressModal({ isOpen, onClose, onConfirm }) {
    const [query, setQuery] = useState("");
    const [suggestions, setSuggestions] = useState([]);
    const [loading, setLoading] = useState(false);

    const searchAddress = useCallback(
        debounce(async (text) => {
            if (text.length < 3) {
                setSuggestions([]);
                return;
            }
            setLoading(true);
            try {
                const params = new URLSearchParams({
                    q: text,
                    limit: '5',
                });

                const resp = await fetch(`https://photon.komoot.io/api/?${params.toString()}`);

                if (!resp.ok) throw new Error("Error en la respuesta de Photon");

                const data = await resp.json();
                setSuggestions(data.features || []);
            } catch (error) {
                console.error("Error buscando dirección:", error);
                setSuggestions([]); // Limpiamos sugerencias si hay error
            } finally {
                setLoading(false);
            }
        }, 400), []
    );

    const handleInputChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        searchAddress(value);
    };

    const handleSelect = (feature) => {
        const { name, street, city, country } = feature.properties;
        const fullAddress = `${street || name}, ${city || ""}, ${country || ""}`.replaceAll(/,,/g, ',');
        const [lng, lat] = feature.geometry.coordinates;

        // Enviamos el objeto completo al padre
        onConfirm({ address: fullAddress, lat, lng });
        setQuery("");
        setSuggestions([]);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#324339]/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 relative border border-[#324339]/5">
                <button onClick={onClose} className="absolute top-6 right-6 text-[#324339]/20 hover:text-[#A86447]"><X size={20} /></button>

                <div className="text-center mb-8">
                    <div className="bg-[#A86447]/5 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MapPin className="text-[#A86447]" size={24} />
                    </div>
                    <h2 className="text-2xl font-serif italic text-[#324339]">Dirección de Envío</h2>
                    <p className="text-[10px] uppercase tracking-widest text-[#324339]/40 mt-2 font-bold">Seleccione una dirección válida</p>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={query}
                        onChange={handleInputChange}
                        placeholder="Empezar a escribir dirección..."
                        className="w-full bg-[#FDFBF9] border border-[#324339]/10 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-[#A86447] outline-none transition-all"
                        autoComplete="off"
                    />
                    {loading && <Loader2 className="absolute right-4 top-4 animate-spin text-[#A86447]" size={18} />}

                    {suggestions.length > 0 && (
                        <ul className="absolute z-10 w-full bg-white border border-gray-100 rounded-2xl mt-2 shadow-xl max-h-60 overflow-y-auto">
                            {suggestions.map((s, i) => (
                                <li
                                    key={i}
                                    onClick={() => handleSelect(s)}
                                    className="p-4 hover:bg-[#FDFBF9] cursor-pointer text-xs text-[#324339] border-b border-gray-50 last:border-none"
                                >
                                    <p className="font-bold">{s.properties.name} {s.properties.street || ""}</p>
                                    <p className="opacity-60">{s.properties.city}, {s.properties.country}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}


AddressModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
};