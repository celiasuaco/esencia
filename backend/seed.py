import os
import random
from decimal import Decimal

import django
from faker import Faker

# Configurar el entorno de Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from authentication.models import User
from order.models import Order, OrderItem
from product.models import Product

fake = Faker(["es_ES"])  # Datos en español


def run_seeder():
    print("🚀 Iniciando Seeder Masivo para Esencia...")

    # --- 1. CREAR ADMINISTRADOR ---
    if not User.objects.filter(role="ADMIN").exists():
        User.objects.create_superuser(
            username="admin",
            email="admin@esencia.com",
            password="adminpassword123",
            full_name="Admin Principal",
            role="ADMIN",
        )
        print("✅ Administrador creado (admin@esencia.com)")

    # --- 2. CREAR 5 CLIENTES ---
    clientes = []
    for i in range(5):
        email = f"cliente{i + 1}@test.com"
        user, created = User.objects.get_or_create(
            email=email,
            defaults={
                "username": f"user_{i + 1}",
                "full_name": fake.name(),
                "role": "CLIENT",
            },
        )
        if created:
            user.set_password("cliente123")
            user.save()
        clientes.append(user)
    print(f"✅ {len(clientes)} Clientes creados/verificados")

    # --- 3. CREAR 30 PRODUCTOS ---
    categorias = ["ANILLO", "COLLAR", "PENDIENTE", "PULSERA"]
    materiales = [
        "Oro 18k",
        "Plata de Ley 925",
        "Oro Rosa",
        "Platino",
        "Acero Quirúrgico",
    ]
    productos = []

    for _ in range(30):
        nombre = f"{random.choice(['Anillo', 'Collar', 'Pendientes', 'Pulsera'])} {fake.word().capitalize()} {random.choice(['Eterno', 'Gala', 'Minimal', 'Luxury', 'Esencia'])}"
        prod, created = Product.objects.get_or_create(
            name=nombre,
            defaults={
                "description": fake.sentence(nb_words=12),
                "price": Decimal(random.uniform(25.0, 450.0)).quantize(Decimal("0.00")),
                "stock": random.randint(5, 50),
                "category": random.choice(categorias),
                "material": random.choice(materiales),
                "is_active": True,
            },
        )
        productos.append(prod)
    print(f"✅ {len(productos)} Productos creados")

    # --- 4. CREAR 10 PEDIDOS ---
    estados = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

    for _ in range(10):
        cliente = random.choice(clientes)
        # El modelo Order genera el tracking_code y gestiona is_paid en su save()
        pedido = Order.objects.create(
            user=cliente,
            address=fake.address(),
            status=random.choice(estados),
            placed_at=fake.date_time_between(
                start_date="-30d", end_date="now", tzinfo=None
            ),
        )

        # Añadir entre 1 y 4 productos a cada pedido
        productos_pedido = random.sample(productos, random.randint(1, 4))
        for p in productos_pedido:
            OrderItem.objects.create(
                order=pedido,
                product=p,
                quantity=random.randint(1, 2),
                price_at_purchase=p.price,  # Foto fija del precio
            )

    print("✅ 10 Pedidos con sus desgloses creados")
    print("✨ Seeder finalizado. ¡La base de datos está lista!")


if __name__ == "__main__":
    run_seeder()
