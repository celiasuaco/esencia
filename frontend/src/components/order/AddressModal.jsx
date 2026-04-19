// src/components/checkout/AddressModal.jsx
import { MapPin, X } from 'lucide-react';

export default function AddressModal({ isOpen, onClose, onConfirm, initialAddress = "" }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#324339]/40 backdrop-blur-sm">
            <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 relative border border-[#324339]/5">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-[#324339]/20 hover:text-[#A86447] transition-colors"
                >
                    <X size={20} />
                </button>

                <div className="text-center mb-8">
                    <div className="bg-[#A86447]/5 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <MapPin className="text-[#A86447]" size={24} />
                    </div>
                    <h2 className="text-2xl font-serif italic text-[#324339]">Dirección de Envío</h2>
                    <p className="text-[10px] uppercase tracking-widest text-[#324339]/40 mt-2 font-bold">Confirme su destino</p>
                </div>

                <form onSubmit={(e) => {
                    e.preventDefault();
                    onConfirm(new FormData(e.target).get('address'));
                }}>
                    <textarea
                        name="address"
                        required
                        defaultValue={initialAddress}
                        placeholder="Calle, Número, Piso, Ciudad..."
                        className="w-full bg-[#FDFBF9] border border-[#324339]/10 rounded-2xl p-4 text-sm focus:ring-1 focus:ring-[#A86447] focus:border-[#A86447] outline-none min-h-[100px] transition-all"
                    />

                    <button
                        type="submit"
                        className="w-full mt-6 bg-[#324339] text-white py-4 rounded-full uppercase tracking-widest text-[10px] font-bold hover:bg-[#A86447] transition-all shadow-lg shadow-[#324339]/20"
                    >
                        Confirmar y Pagar
                    </button>
                </form>
            </div>
        </div>
    );
}