import logging

from django.conf import settings
from google import genai
from product.models import Product

logger = logging.getLogger(__name__)


class ChatbotService:
    """Servicio de Chatbot para clientes con capacidad de recomendación y consulta legal."""

    def __init__(self):
        self.client = genai.Client(api_key=settings.GEMINI_API_KEY)
        self.model_id = "gemini-flash-latest"

    def _get_catalog_context(self):
        """Recupera productos activos y sus detalles técnicos para alimentar la IA."""
        products = Product.objects.filter(is_active=True)
        context = "CATÁLOGO DE PRODUCTOS:\n"
        for p in products:
            context += (
                f"- {p.name} | {p.price}€ | Material: {p.material} | "
                f"Categoría: {p.category} | Descripción: {p.description} | Stock: {p.stock}\n"
            )
        return context

    def _get_legal_context(self):
        """Proporciona las políticas de la empresa para resolver dudas sobre envíos, devoluciones y garantías."""
        return (
            "TÉRMINOS Y CONDICIONES 'ESENCIA':\n"
            "- Envíos: Gratuitos en compras superiores a 100€. Entrega en 2-4 días hábiles.\n"
            "- Devoluciones: 14 días naturales desde la recepción. El producto debe estar en su estado original.\n"
            "- Garantía: 2 años en todas nuestras piezas contra defectos de fabricación.\n"
            "- Materiales: Usamos oro de 18k, plata de ley 925 y piedras preciosas certificadas.\n"
        )

    def get_response(self, user_message):
        """Gestiona la respuesta al cliente integrando catálogo y marco legal."""
        catalog = self._get_catalog_context()
        legal = self._get_legal_context()

        system_instruction = (
            "Eres el asesor de lujo de 'Esencia'. Responde con calidez y brevedad. "
            "Tu objetivo es recomendar productos del catálogo y resolver dudas sobre envíos o devoluciones. "
            "Si recomiendas algo, hazlo de forma fluida. "
            "AL FINAL de tu respuesta, añade siempre una línea: 'RECOMENDACION: Producto A, Producto B' "
            "usando nombres exactos del catálogo. Si es una duda legal, omite esa línea."
        )

        prompt = f"{system_instruction}\n\nContexto de la empresa:\n{catalog}\n{legal}\n\nCliente: {user_message}"

        try:
            response = self.client.models.generate_content(
                model=self.model_id, contents=prompt
            )
            return response.text
        except Exception as e:
            logger.error(f"Error Chatbot Cliente: {str(e)}")
            return "Nuestra esencia está en mantenimiento. ¿Podrías consultarnos de nuevo en unos instantes?"
