import { Link } from 'react-router-dom';
import Mail from 'lucide-react/dist/esm/icons/mail';
import MapPin from 'lucide-react/dist/esm/icons/map-pin';

export default function Footer() {
    return (
        <footer className="bg-[#324339] text-[#FDFBF9] border-t border-[#A86447]/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 text-center md:text-left">

                    <div className="flex flex-col items-center md:items-start">
                        <h3 className="text-3xl font-serif mb-4 text-[#A86447] italic">Esencia</h3>
                        <p className="text-sm text-[#FDFBF9]/70 leading-relaxed max-w-xs">
                            Alta joyería artesanal hecha con alma. Diseños únicos que celebran la belleza natural y la elegancia atemporal.
                        </p>
                    </div>

                    <div>
                        <h4 className="mb-6 font-serif text-lg text-[#A86447]">Legal</h4>
                        <ul className="space-y-4 text-sm text-[#FDFBF9]/60">
                            <li>
                                <Link to="/terminos" className="hover:text-[#A86447] transition-colors focus:outline-none focus:ring-1 focus:ring-[#A86447] rounded px-1">
                                    Términos y Privacidad
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="mb-6 font-serif text-lg text-[#A86447]">Contacto</h4>
                        <ul className="space-y-4 text-sm text-[#FDFBF9]/60">
                            <li className="flex items-center justify-center md:justify-start gap-3">
                                <Mail size={16} className="text-[#A86447]" aria-hidden="true" />
                                <span>info@esenciajoyeria.app</span>
                            </li>
                            <li className="flex items-center justify-center md:justify-start gap-3">
                                <MapPin size={16} className="text-[#A86447]" aria-hidden="true" />
                                <span>España</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-[#FDFBF9]/10 text-center text-xs text-[#FDFBF9]/40 uppercase tracking-widest">
                    © {new Date().getFullYear()} Esencia Joyería. Todos los derechos reservados.
                </div>
            </div>
        </footer>
    );
}