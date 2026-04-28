import google.generativeai as genai
from django.conf import settings
from product.models import Product


class ChatbotService:
    def __init__(self):
        # Configuramos Gemini con tu API Key del .env
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel("models/gemini-flash-latest")

    def _get_catalog_context(self):
        """Recupera los productos y los convierte en texto para Gemini"""
        products = Product.objects.filter(is_active=True)
        context = "Catálogo de Joyería Esencia:\n"

        for p in products:
            context += (
                f"- Producto: {p.name}, Precio: {p.price}€, "
                f"Material: {p.material}, Categoría: {p.category}, "
                f"Descripción: {p.description}, Stock: {p.stock} unidades.\n"
            )
        return context

    def get_response(self, user_message):
        """Envía el catálogo + pregunta a Gemini"""
        catalog = self._get_catalog_context()

        system_instruction = (
            "Eres el asesor de lujo de 'Esencia'. Responde con elegancia y brevedad. "
            "Cuando recomiendes productos, hazlo de forma natural en el texto. "
            "AL FINAL de tu respuesta, añade una línea oculta con este formato: "
            "RECOMENDACION: Nombre del Producto 1, Nombre del Producto 2. "
            "Usa exactamente los nombres que aparecen en el catálogo."
        )

        prompt = f"{system_instruction}{catalog}\n\nCliente: {user_message}\nAsistente:"

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except Exception as e:
            return f"Lo siento, estoy teniendo un problema técnico. ¿Podrías repetirme la pregunta? (Error: {str(e)})"
