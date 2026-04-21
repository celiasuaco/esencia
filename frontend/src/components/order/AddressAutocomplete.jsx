// src/components/AddressAutocomplete.jsx
import React, { useState, useCallback } from 'react';
import debounce from 'lodash.debounce';

export default function AddressAutocomplete({ onAddressSelect }) {
    const [suggestions, setSuggestions] = useState([]);
    const [query, setQuery] = useState("");

    const searchAddress = useCallback(
        debounce(async (text) => {
            if (text.length < 3) return;
            const resp = await fetch(`https://photon.komoot.io/api/?q=${text}&limit=5&lang=es`);
            const data = await resp.json();
            setSuggestions(data.features);
        }, 300),
        []
    );

    const handleChange = (e) => {
        setQuery(e.target.value);
        searchAddress(e.target.value);
    };

    const handleSelect = (feature) => {
        const { name, street, city, country } = feature.properties;
        const fullAddress = `${street || name}, ${city}, ${country}`;
        const [lng, lat] = feature.geometry.coordinates;

        setQuery(fullAddress);
        setSuggestions([]);

        // Pasamos al componente padre tanto el texto como las coordenadas
        onAddressSelect({ address: fullAddress, lat, lng });
    };

    return (
        <div className="relative w-full">
            <input
                type="text"
                value={query}
                onChange={handleChange}
                placeholder="Escribe tu dirección..."
                className="w-full p-4 rounded-2xl border border-[#32433920] focus:outline-none focus:border-[#A86447]"
            />

            {suggestions.length > 0 && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl mt-2 shadow-lg">
                    {suggestions.map((s, i) => (
                        <li
                            key={i}
                            onClick={() => handleSelect(s)}
                            className="p-3 hover:bg-[#FDFBF9] cursor-pointer text-sm text-[#324339]"
                        >
                            {s.properties.name} {s.properties.street}, {s.properties.city} ({s.properties.country})
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}