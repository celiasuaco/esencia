import { useState, useEffect, useRef } from 'react';
import { ShieldCheck, X, Send, Loader2, BarChart3 } from "lucide-react";
import { chatbotService } from '../../services/chatbotService';
import ReactMarkdown from 'react-markdown';

export default function AdminChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            id: 'admin-welcome',
            text: "Panel de Inteligencia de Negocio activo. ¿Qué datos deseas analizar hoy?",
            isBot: true
        }
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTo({
                top: scrollRef.current.scrollHeight,
                behavior: 'smooth'
            });
        }
    }, [messages, isLoading]);

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();

        if (!input.trim() || isLoading) return;

        const userMsg = input;
        setInput("");
        setMessages(prev => [...prev, { id: `${Date.now()}-user`, text: userMsg, isBot: false }]);
        setIsLoading(true);

        try {
            const data = await chatbotService.askAdmin(userMsg);

            setMessages(prev => [...prev, {
                id: `${Date.now()}-bot`,
                text: data.response || "Análisis completado sin datos resultantes.",
                isBot: true
            }]);
        } catch (error) {
            const isQuotaError = error.message?.includes('429') || (error.response && error.response.status === 429);

            setMessages(prev => [...prev, {
                id: `${Date.now()}-error`,
                text: isQuotaError
                    ? "⚠️ **Motor de IA saturado.** Se ha excedido la cuota gratuita de Gemini. Por favor, espera un minuto antes de realizar otra consulta estratégica."
                    : "❌ Error en la conexión con el motor analítico. Verifica el estado del servidor backend.",
                isBot: true,
                isError: true
            }]);

            console.error("Chatbot Admin Error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 right-6 z-[9999] font-sans">
            {isOpen && (
                <div className="mb-1 w-62 sm:w-96 h-[450px] bg-white rounded-[2.5rem] shadow-2xl border border-[#324339]/10 flex flex-col overflow-hidden animate-in slide-in-from-bottom-5">

                    <div className="bg-[#0f172a] p-5 text-white flex justify-between items-center shrink-0">
                        <div className="text-left">
                            <div className="flex items-center gap-2">
                                <ShieldCheck size={16} className="text-emerald-400" />
                                <h3 className="font-serif italic text-base m-0 text-white leading-tight">Admin Intel</h3>
                            </div>
                            <p className="text-[9px] uppercase tracking-widest opacity-60 m-0 text-white font-bold">Análisis Estratégico</p>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/60 hover:text-white transition-all p-1"
                        >
                            <X size={18} />
                        </button>
                    </div>

                    <div ref={scrollRef} className="flex-grow p-4 overflow-y-auto space-y-4 bg-[#f8fafc]">
                        {messages.map((msg) => (
                            <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                                <div className={`max-w-[90%] p-3 px-4 rounded-[1.5rem] text-[12px] shadow-sm overflow-hidden ${msg.isBot
                                    ? msg.isError ? 'bg-red-50 text-red-900 border border-red-100' : 'bg-white text-[#1e293b] border border-slate-200'
                                    : 'bg-[#0f172a] text-white'
                                    }`}>
                                    <div className="markdown-container text-left prose prose-sm max-w-none">
                                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-white p-3 px-4 rounded-[1.5rem] shadow-sm border border-slate-200">
                                    <Loader2 size={14} className="animate-spin text-emerald-500" />
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-100 flex gap-2 shrink-0">
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Consultar métricas..."
                            className="flex-grow bg-slate-50 border-none rounded-full px-4 py-2 text-[13px] focus:ring-1 focus:ring-emerald-500 outline-none"
                        />
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="bg-[#0f172a] text-white p-2.5 rounded-full hover:bg-slate-800 transition-all shrink-0 disabled:opacity-50"
                        >
                            <Send size={14} />
                        </button>
                    </form>
                </div>
            )}

            <div className={`w-full flex ${isOpen ? 'justify-end' : 'justify-start'}`}>
                <button
                    onClick={() => {
                        setIsOpen(!isOpen);
                    }}
                    className="w-14 h-14 bg-[#0f172a] text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-105 transition-all active:scale-95 border border-slate-700"
                >
                    {isOpen ? <X size={24} /> : <BarChart3 size={24} />}
                </button>
            </div>
        </div>
    );
}