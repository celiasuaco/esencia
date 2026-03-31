// src/components/layout/Footer.jsx
import { Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
    return (
        <footer className="bg-[#2C3632] text-white border-t border-white/5">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">

                    {/* Sobre Esencia */}
                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="text-3xl font-serif mb-4 text-[#D1BFA7] italic">Esencia</h3>
                        <p className="text-sm text-[#8FA895] leading-relaxed max-w-xs">
                            Alta joyería artesanal hecha con alma. Diseños únicos que celebran la belleza natural.
                        </p>
                    </div>

                    {/* Enlaces Legales */}
                    <div>
                        <h4 className="mb-6 font-serif text-lg text-[#D1BFA7]">Legal</h4>
                        <ul className="space-y-4 text-sm text-[#8FA895]">
                            <li><Link to="/privacidad" className="hover:text-white transition-colors">Privacidad</Link></li>
                            <li><Link to="/cookies" className="hover:text-white transition-colors">Cookies</Link></li>
                            <li><Link to="/terminos" className="hover:text-white transition-colors">Términos</Link></li>
                        </ul>
                    </div>

                    {/* Contacto */}
                    <div>
                        <h4 className="mb-6 font-serif text-lg text-[#D1BFA7]">Contacto</h4>
                        <ul className="space-y-4 text-sm text-[#8FA895]">
                            <li className="flex items-center justify-center md:justify-start gap-3">
                                <Mail size={16} className="text-[#C77C5D]" /> <span>info@esencia.com</span>
                            </li>
                            <li className="flex items-center justify-center md:justify-start gap-3">
                                <MapPin size={16} className="text-[#C77C5D]" /> <span>España</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
}