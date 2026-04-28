from datetime import datetime

import google.generativeai as genai
from django.conf import settings
from django.db.models import Count, Sum
from django.db.models.functions import ExtractMonth
from order.models import Order, OrderItem
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
        except Exception:
            return "Lo siento, estoy teniendo un problema técnico. ¿Podrías repetirme la pregunta?"


class AdminChatbotService:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel("models/gemini-flash-latest")

    def _get_admin_context(self):
        now = datetime.now()

        # 1. LISTA COMPLETA DE VENTAS POR MES (Año actual)
        sales_data = (
            Order.objects.filter(is_paid=True, placed_at__year=now.year)
            .annotate(month=ExtractMonth("placed_at"))
            .values("month")
            .annotate(revenue=Sum("total_amount"), orders_count=Count("id"))
            .order_by("month")
        )

        months_map = {
            1: "Ene",
            2: "Feb",
            3: "Mar",
            4: "Abr",
            5: "May",
            6: "Jun",
            7: "Jul",
            8: "Ago",
            9: "Sep",
            10: "Oct",
            11: "Nov",
            12: "Dic",
        }

        full_sales_report = "INFORME MENSUAL VENTAS:\n"
        for s in sales_data:
            full_sales_report += f"- {months_map[s['month']]}: {s['revenue']}€ ({s['orders_count']} pedidos)\n"

        # 2. LISTA COMPLETA DE STOCK (Todos los productos)
        all_inventory = Product.objects.all()
        stock_report = "INVENTARIO COMPLETO (Nombre | Stock | Material):\n"
        for p in all_inventory:
            stock_report += f"- {p.name} | {p.stock} uds | {p.material}\n"

        # 3. LISTA COMPLETA DE RANKING DE PRODUCTOS (Por volumen de venta)
        ranking_data = (
            OrderItem.objects.values("product__name")
            .annotate(total_sold=Sum("quantity"))
            .order_by("-total_sold")
        )

        ranking_report = "RANKING TOTAL DE VENTAS POR PRODUCTO:\n"
        for r in ranking_data:
            ranking_report += (
                f"- {r['product__name']}: {r['total_sold']} unidades vendidas\n"
            )

        return f"{full_sales_report}\n{stock_report}\n{ranking_report}"

    def get_admin_response(self, user_message, admin_user):
        if not admin_user.is_staff:
            return "Acceso denegado."

        data_context = self._get_admin_context()

        system_instruction = (
            "Eres el Analista de Datos Senior de Esencia. Tienes acceso a las listas completas de la empresa. "
            "Tu deber es responder consultas específicas utilizando los datos reales proporcionados. "
            "No resumas a menos que se te pida. Si el admin pide 'los 10 más vendidos' o 'stock de todos los productos', "
            "busca en las listas y dáselos. "
            "\n\nDATOS ESTRUCTURADOS DE LA EMPRESA:\n"
            f"{data_context}"
            "\n\nINSTRUCCIONES DE RESPUESTA:"
            "1. Responde con tablas o listas claras si se solicitan muchos datos."
            "2. Usa cifras exactas de las listas proporcionadas."
            "3. Puedes hacer cálculos (ej. sumar stock total o calcular promedio de ventas) si el admin lo pide."
        )

        model = genai.GenerativeModel(
            "models/gemini-flash-latest", system_instruction=system_instruction
        )
        response = model.generate_content(user_message)
        return response.text
