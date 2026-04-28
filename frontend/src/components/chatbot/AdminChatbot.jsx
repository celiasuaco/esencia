import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, Send, Loader2, BarChart3 } from 'lucide-react';
import { chatbotService } from '../../services/chatbotService'; // Necesitaremos crear este servicio
import ReactMarkdown from 'react-markdown';
import PropTypes from 'prop-types';

export default function AdminChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 'admin-welcome',
            text: "Panel de Control IA activado. ¿Qué métrica deseas consultar hoy?",
            isBot: true
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll
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
        const userMsgId = `${Date.now()}-admin`;

        setInput("");
        setMessages(prev => [...prev, { id: userMsgId, text: userMsg, isBot: false }]);
        setIsLoading(true);

        try {
            // Llamada al nuevo endpoint de administración
            const data = await chatbotService.askAdmin(userMsg);

            setMessages(prev => [...prev, {
                id: `${Date.now()}-bot`,
                text: data.response || "No he podido procesar los datos internos.",
                isBot: true
            }]);
        } catch (error) {
            console.error("Error en el bot de admin:", error);

            const isQuotaError = error.response?.status === 429 || error.message?.includes('429');
            const errorText = isQuotaError
                ? "⚠️ Se ha alcanzado el límite de consultas diarias de la IA. Por favor, inténtalo de nuevo más tarde o revisa tu plan."
                : "Error de conexión con el servidor de métricas.";

            setMessages(prev => [...prev, {
                id: `${Date.now()}-error`,
                text: errorText,
                isBot: true
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans flex flex-col items-end max-w-full">
            {isOpen && (
                <div className="mb-4 w-[calc(100vw-2rem)] sm:w-96 h-[500px] max-h-[80vh] bg-[#1e293b] rounded-2xl shadow-2xl border border-slate-700 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
                    {/* Header Técnico */}
                    <div className="bg-[#0f172a] p-4 text-white flex justify-between items-center shrink-0 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                            <ShieldCheck size={18} className="text-emerald-400" />
                            <div className="text-left">
                                <h3 className="text-sm font-bold m-0 leading-tight">Admin Intel</h3>
                                <p className="text-[10px] text-slate-400 uppercase tracking-widest m-0">Análisis de Negocio</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-slate-400 hover:text-white transition-all"
                            aria-label="Cerrar analista"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Chat Content */}
                    <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 bg-[#0f172a]">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[85%] p-3 px-4 rounded-xl text-[13px] break-words overflow-hidden ${msg.isBot
                                    ? 'bg-slate-800 text-slate-200 border border-slate-700'
                                    : 'bg-emerald-600 text-white'
                                    }`}>
                                    <div className="text-left prose prose-invert prose-sm max-w-none break-words">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                                    <Loader2 size={16} className="animate-spin text-emerald-400" />
                                </div>
                            </div>
                        )}
                    </div>
                    {!isLoading && messages.length === 1 && (
                        <div className="px-4 pb-5 flex flex-wrap gap-2 w-full box-border">
                            {['Ventas este mes', 'Stock crítico', 'Top 10 vendidos'].map(sugerencia => (
                                <button
                                    key={sugerencia}
                                    onClick={() => setInput(sugerencia)}
                                    /* Añadimos whitespace-nowrap para que el texto de un botón no se parta a la mitad */
                                    className="text-[10px] bg-slate-800/50 text-slate-400 border border-slate-700 px-2 py-1.5 rounded-full hover:border-emerald-500 hover:text-emerald-300 transition-all active:scale-95 whitespace-nowrap"
                                >
                                    {sugerencia}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Formulario */}
                    <form onSubmit={handleSendMessage} className="p-3 bg-[#1e293b] border-t border-slate-700 flex gap-2">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Consultar stock, ventas o pedidos..."
                            className="flex-grow bg-[#0f172a] border border-slate-700 text-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-1 focus:ring-emerald-500 outline-none placeholder:text-slate-500"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-emerald-600 text-white p-2.5 rounded-lg hover:bg-emerald-500 transition-all disabled:opacity-50"
                        >
                            <Send size={16} />
                        </button>
                    </form>
                </div>
            )}

            {/* Botón Flotante (Alineado a la derecha en el Admin Panel) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-14 h-14 bg-[#0f172a] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 border border-slate-700 transition-all active:scale-95 group"
                aria-label="Asistente de administración"
            >
                {isOpen ? <X size={24} /> : <BarChart3 size={24} className="group-hover:text-emerald-400 transition-colors" />}
            </button>
        </div>
    );
}