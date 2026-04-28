import React from 'react';

export default function Terms() {
    return (
        <div className="bg-[#FDFBF9] min-h-screen py-20 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-4xl mx-auto shadow-2xl bg-white p-8 md:p-16 rounded-sm border border-gray-100">

                {/* Encabezado Principal */}
                <header className="text-center border-b border-[#A86447]/20 pb-10 mb-10">
                    <h1 className="text-4xl font-serif text-[#324339] italic mb-4">Aviso Legal Unificado</h1>
                    <p className="text-[#A86447] font-bold tracking-widest text-xs uppercase">
                        Términos de Servicio & Política de Protección de Datos
                    </p>
                    <p className="text-gray-400 text-[10px] mt-4 uppercase">Versión 2.1 — Actualizado a 28 de Abril de 2026</p>
                </header>

                <div className="text-[#324339]/90 text-sm leading-relaxed text-justify space-y-10">

                    {/* SECCIÓN 1: CONDICIONES DE USO */}
                    <section>
                        <h2 className="text-xl font-serif text-[#324339] font-bold mb-4 flex items-center gap-2">
                            <span className="text-[#A86447]">01.</span> DISPOSICIONES GENERALES
                        </h2>
                        <p className="mb-4">
                            El presente documento establece las condiciones que regulan el acceso y uso del ecosistema digital de <span className="font-extrabold text-black">Esencia Joyería S.L.</span> (en adelante, "La Empresa"). Al navegar por este sitio o utilizar nuestro asistente virtual, usted adquiere la condición de Usuario, lo cual implica la aceptación plena de estas cláusulas.
                        </p>
                    </section>

                    {/* SECCIÓN 2: PROPIEDAD INTELECTUAL */}
                    <section>
                        <h2 className="text-xl font-serif text-[#324339] font-bold mb-4 flex items-center gap-2">
                            <span className="text-[#A86447]">02.</span> PROPIEDAD INTELECTUAL E INDUSTRIAL
                        </h2>
                        <p>
                            La Empresa es titular única de todos los derechos de explotación de los contenidos, incluyendo pero no limitado a: <span className="font-extrabold text-black">diseños de orfebrería, algoritmos del asistente IA, estructuras de datos y material audiovisual</span>. Queda estrictamente prohibida la extracción de datos (data mining) o la reproducción parcial de las piezas aquí expuestas sin consentimiento expreso por escrito.
                        </p>
                    </section>

                    {/* SECCIÓN 3: POLÍTICA DE PRIVACIDAD (RGPD) */}
                    <section className="bg-[#FDFBF9] p-6 border-l-4 border-[#A86447]">
                        <h2 className="text-xl font-serif text-[#324339] font-bold mb-4 flex items-center gap-2">
                            <span className="text-[#A86447]">03.</span> PROTECCIÓN DE DATOS (RGPD)
                        </h2>
                        <p className="mb-4">
                            En cumplimiento del <span className="font-extrabold text-black">Reglamento (UE) 2016/679</span>, informamos que sus datos personales son tratados bajo las siguientes premisas:
                        </p>
                        <ul className="list-none space-y-3">
                            <li className="flex gap-2">
                                <span className="text-[#A86447]">•</span>
                                <span><span className="font-extrabold text-black">Finalidad:</span> Gestión de pedidos, análisis de solvencia y entrenamiento de modelos de personalización para el asistente IA.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[#A86447]">•</span>
                                <span><span className="font-extrabold text-black">Legitimación:</span> Ejecución de contrato de compraventa y consentimiento explícito en el registro.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[#A86447]">•</span>
                                <span><span className="font-extrabold text-black">Conservación:</span> Los datos se mantendrán durante el plazo legal de 5 años para cumplir con obligaciones fiscales.</span>
                            </li>
                        </ul>
                    </section>

                    {/* SECCIÓN 4: ASISTENCIA POR INTELIGENCIA ARTIFICIAL */}
                    <section>
                        <h2 className="text-xl font-serif text-[#324339] font-bold mb-4 flex items-center gap-2">
                            <span className="text-[#A86447]">04.</span> RESPONSABILIDAD DEL ASISTENTE VIRTUAL
                        </h2>
                        <p>
                            Esencia Joyería pone a disposición del usuario un asesor basado en Inteligencia Artificial. <span className="font-extrabold text-black">Aviso importante:</span> Las recomendaciones generadas por la IA tienen carácter puramente informativo y sugerente. La Empresa no se hace responsable de decisiones de compra basadas exclusivamente en las respuestas del bot, ni garantiza que la disponibilidad de stock mencionada sea exacta al 100% en tiempo real.
                        </p>
                    </section>

                    {/* SECCIÓN 5: DERECHO DE DESISTIMIENTO */}
                    <section>
                        <h2 className="text-xl font-serif text-[#324339] font-bold mb-4 flex items-center gap-2">
                            <span className="text-[#A86447]">05.</span> CONDICIONES DE COMPRA
                        </h2>
                        <p>
                            El Usuario dispone de <span className="font-extrabold text-black">14 días naturales</span> para ejercer su derecho de desistimiento. No obstante, según el Art. 103 de la LGCU, este derecho quedará anulado en piezas de joyería <span className="font-extrabold text-black">personalizadas, grabadas o fabricadas bajo pedido específico</span>.
                        </p>
                    </section>

                    {/* SECCIÓN 6: TECNOLOGÍAS DE SEGUIMIENTO */}
                    <section>
                        <h2 className="text-xl font-serif text-[#324339] font-bold mb-4 flex items-center gap-2">
                            <span className="text-[#A86447]">06.</span> COOKIES Y SEGUIMIENTO
                        </h2>
                        <p>
                            Utilizamos dispositivos de almacenamiento y recuperación de datos para garantizar la persistencia de la sesión y el análisis del "Buyer Journey". El usuario puede configurar su navegador para rechazar estas tecnologías, asumiendo que la funcionalidad del asistente de IA podría verse degradada.
                        </p>
                    </section>

                    <footer className="mt-16 pt-10 border-t border-gray-100 text-center">
                        <p className="text-[10px] text-gray-400 uppercase">
                            Esencia Joyería S.L. — Todos los derechos reservados — 2026
                        </p>
                    </footer>
                </div>
            </div>
        </div>
    );
}