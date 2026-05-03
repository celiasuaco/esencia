import random

from locust import HttpUser, between, tag, task


class EsenciaProUser(HttpUser):
    wait_time = between(0.5, 3)

    token = None
    headers = {}

    def on_start(self):
        """
        Se ejecuta al inicio de cada usuario.
        Intenta loguearse para obtener el token JWT necesario para rutas protegidas.
        """
        payload = {"email": "cliente1@test.com", "password": "cliente123"}
        with self.client.post(
            "/api/auth/login/", json=payload, catch_response=True
        ) as response:
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("access") or data.get("token")
                if self.token:
                    self.headers = {"Authorization": f"Bearer {self.token}"}
                else:
                    response.failure(
                        "Login exitoso pero no se encontró el token en la respuesta"
                    )
            else:
                response.failure(
                    f"Fallo de login: {response.status_code} - {response.text}"
                )

    @tag("lectura")
    @task(10)
    def flujo_navegacion(self):
        """Navegación pública: Showcase y Catálogo filtrado"""
        self.client.get("/api/", name="GET /api/ (Showcase)")

        categorias = ["ANILLO", "COLLAR", "PENDIENTE"]
        cat = random.choice(categorias)
        self.client.get(
            f"/api/products/?category={cat}", name="GET /api/products/?category=[cat]"
        )

    @tag("critico")
    @task(5)
    def ver_detalles_aleatorios(self):
        """Detalle de producto: Ruta generada por el DefaultRouter de product"""
        product_id = random.randint(1, 30)
        self.client.get(f"/api/products/{product_id}/", name="GET /api/products/[id]/")

    @tag("escritura")
    @task(3)
    def gestion_carrito(self):
        """Uso del carrito: Requiere autenticación"""
        if self.token:
            product_id = random.randint(1, 10)
            payload = {"product_id": product_id, "quantity": 1}
            self.client.post(
                "/api/cart/add/",
                json=payload,
                headers=self.headers,
                name="POST /api/cart/add/",
            )
            self.client.get("/api/cart/", headers=self.headers, name="GET /api/cart/")

    @tag("perfil")
    @task(2)
    def ver_historial_pedidos(self):
        """Pedidos: Ruta generada por el DefaultRouter de order"""
        if self.token:
            self.client.get(
                "/api/orders/", headers=self.headers, name="GET /api/orders/"
            )

    @tag("admin")
    @task(1)
    def dashboard_stats(self):
        """Dashboard Admin: Ruta pesada para el servidor"""
        if self.token:
            self.client.get(
                "/api/dashboard/",
                headers=self.headers,
                name="GET /api/dashboard/ (Admin Stats)",
            )
