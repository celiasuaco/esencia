import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Loader2 } from 'lucide-react';
import { chatbotService } from '../../services/chatbotService';
import { productService } from '../../services/productService';
import ReactMarkdown from 'react-markdown';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const ChatProductCard = ({ product }) => {
    const navigate = useNavigate();
    const API_URL = "http://localhost:8000";
    const imageUrl = product.photo?.startsWith('http') ? product.photo : `${API_URL}${product.photo}`;

    const handleClick = (e) => {
        e.stopPropagation();
        navigate(`/product/${product.id}`);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className="w-full flex items-center gap-3 bg-white border border-[#324339]/10 p-2 rounded-2xl my-2 hover:border-[#A86447]/30 transition-all group"
        >
            <div className="w-12 h-12 shrink-0 overflow-hidden rounded-xl bg-gray-50 shadow-sm">
                <img
                    src={imageUrl}
                    alt={product.name}
                    crossOrigin="anonymous"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Joyas'; }}
                />
            </div>
            <div className="flex-grow min-w-0 text-left">
                <p className="text-[11px] font-bold text-[#324339] truncate m-0">{product.name}</p>
                <p className="text-[10px] text-[#A86447] font-serif italic m-0">{product.price} €</p>
            </div>
        </button>
    );
};

export default function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [allProducts, setAllProducts] = useState([]);
    const [messages, setMessages] = useState([
        { text: "¡Hola! Soy el asistente de **Esencia**. ¿Buscas alguna joya especial hoy?", isBot: true }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const data = await productService.getAll();
                setAllProducts(data);
            } catch (err) {
                console.error("Error cargando catálogo para chatbot", err);
            }
        };
        fetchProducts();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { text: userMsg, isBot: false }]);
        setIsLoading(true);

        try {
            const data = await chatbotService.ask(userMsg);
            const rawResponse = data.response || "";

            const delimiter = /RECOMENDACION:/i;
            const parts = rawResponse.split(delimiter);

            const cleanText = parts[0].trim();
            let recommended = [];

            if (parts.length > 1) {
                const names = parts[1].split(",").map(n => n.trim().toLowerCase());
                console.log("Nombres detectados por la IA:", names);
                console.log("Catálogo disponible:", allProducts);

                recommended = allProducts.filter(p =>
                    names.some(name => p.name.toLowerCase().includes(name))
                );
                console.log("Productos encontrados para mostrar:", recommended);
            }

            setMessages(prev => [...prev, {
                text: cleanText,
                isBot: true,
                recommendedProducts: recommended
            }]);

        } catch (error) {
            console.error("Error en el servicio de chatbot:", error);
            setMessages(prev => [...prev, { text: "Error de conexión con el servidor.", isBot: true }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            {isOpen && (
                <div className="mb-4 w-72 sm:w-80 h-[480px] bg-white rounded-[2.5rem] shadow-2xl border border-[#324339]/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">

                    <div className="bg-[#324339] p-5 text-white flex justify-between items-center shrink-0">
                        <div className="text-left">
                            <h3 className="font-serif italic text-base m-0 text-white leading-tight">Asistente Esencia</h3>
                            <p className="text-[9px] uppercase tracking-widest opacity-60 m-0 text-white font-bold">Experto en Joyería</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/60 hover:text-white transition-all p-1"
                            aria-label="Cerrar chat"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 bg-[#FDFBF9]">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[90%] p-3 px-4 rounded-[1.5rem] text-[12px] shadow-sm overflow-hidden ${msg.isBot
                                    ? 'bg-white text-[#324339] border border-[#324339]/5'
                                    : 'bg-[#A86447] text-white'
                                    }`}>
                                    <div className="markdown-container text-left">
                                        <ReactMarkdown>
                                            {msg.text || ""}
                                        </ReactMarkdown>
                                    </div>

                                    {msg.isBot && msg.recommendedProducts?.length > 0 && (
                                        <div className="mt-3 pt-2 border-t border-[#324339]/5">
                                            <p className="text-[9px] uppercase tracking-tighter opacity-50 mb-2 font-bold">Piezas sugeridas:</p>
                                            {msg.recommendedProducts.map(p => (
                                                <ChatProductCard key={p.id} product={p} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 px-4 rounded-[1.5rem] shadow-sm border border-[#324339]/5">
                                    <Loader2 size={14} className="animate-spin text-[#A86447]" />
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2 shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Tu consulta..."
                            className="flex-grow bg-[#FDFBF9] border-none rounded-full px-4 py-2 text-[13px] focus:ring-1 focus:ring-[#A86447] outline-none"
                        />
                        <button type="submit" className="bg-[#324339] text-white p-2.5 rounded-full hover:bg-[#A86447] transition-all shrink-0">
                            <Send size={14} />
                        </button>
                    </form>
                </div>
            )}

            <div className={`w-full flex ${isOpen ? 'justify-end' : 'justify-start'}`}>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-14 h-14 bg-[#324339] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all active:scale-95"
                    aria-label={isOpen ? "Cerrar asistente" : "Abrir asistente"}
                >
                    {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
                </button>
            </div>
        </div>
    );
}

ChatProductCard.propTypes = {
    product: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        name: PropTypes.string.isRequired,
        photo: PropTypes.string,
        price: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
    }).isRequired
};