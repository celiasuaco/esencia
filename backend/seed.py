import os
import secrets
from datetime import datetime
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

PASSWORD = "admin123"  # NOSONAR


# --- FUNCIONES AUXILIARES SEGURAS ---
def secure_choice(sequence):
    return secrets.choice(sequence)


def secure_randint(min_val, max_val):
    return min_val + secrets.randbelow(max_val - min_val + 1)


def secure_uniform(min_val, max_val):
    factor = secrets.randbelow(1000000) / 1000000.0
    return min_val + (factor * (max_val - min_val))


def secure_sample(population, k):
    list_pop = list(population)
    if k > len(list_pop):
        k = len(list_pop)
    result = []
    for _ in range(k):
        idx = secrets.randbelow(len(list_pop))
        result.append(list_pop.pop(idx))
    return result


# --- SEEDER PRINCIPAL ---
def run_seeder():
    print("🚀 Iniciando Seeder Masivo para Esencia...")

    # --- 0. LIMPIEZA DE BASE DE DATOS ---
    print("🗑️ Limpiando tablas previas...")
    OrderItem.objects.all().delete()
    Order.objects.all().delete()
    Product.objects.all().delete()
    User.objects.filter(is_superuser=False).delete()
    print("✅ Tablas limpias")

    # --- 1. CREAR ADMINISTRADOR ---
    if not User.objects.filter(username="admin").exists():
        User.objects.create_superuser(
            username="admin",
            email="admin@esencia.com",
            password=PASSWORD,
            full_name="Admin Principal",
            role="ADMIN",
        )
        print("✅ Administrador creado (admin@esencia.com)")

    # --- 2. CREAR CLIENTES ---
    clientes = []
    for i in range(10):  # Aumentado a 10 clientes para más variedad
        email = f"cliente{i + 1}@test.com"
        user = User.objects.create(
            email=email,
            username=f"user_{i + 1}",
            full_name=fake.name(),
            role="CLIENT",
        )
        user.set_password("cliente123")
        user.save()
        clientes.append(user)
    print(f"✅ {len(clientes)} Clientes creados")

    # --- 3. CREAR PRODUCTOS ---
    categorias = ["Anillo", "Collar", "Pendientes", "Pulsera"]
    materiales = [
        "Oro 18k",
        "Plata de Ley 925",
        "Oro Rosa",
        "Platino",
        "Acero Quirúrgico",
    ]
    fotos_por_tipo = {
        "Anillo": "products/seed_anillo.jpg",
        "Collar": "products/seed_collar.jpg",
        "Pendientes": "products/seed_pendiente.jpg",
        "Pulsera": "products/seed_pulsera.jpg",
    }

    productos = []
    print("Generando nuevos productos...")
    for i in range(30):
        tipo_joya = secure_choice(categorias)
        nombre = f"{tipo_joya} {fake.word().capitalize()} {secure_choice(['Eterno', 'Gala', 'Minimal', 'Luxury', 'Esencia'])}"
        precio_val = secure_uniform(25.0, 150.0)
        stock_val = secure_randint(10, 100)

        foto_path = fotos_por_tipo.get(tipo_joya) if i % 5 != 0 else None

        prod = Product.objects.create(
            name=nombre,
            description=fake.sentence(nb_words=12),
            price=Decimal(precio_val).quantize(Decimal("0.00")),
            stock=stock_val,
            category=tipo_joya.upper() if tipo_joya != "Pendientes" else "PENDIENTE",
            material=secure_choice(materiales),
            is_active=True,
            photo=foto_path,
        )
        productos.append(prod)
    print(f"✅ {len(productos)} Productos creados")

    # --- 4. CREAR PEDIDOS (30 PEDIDOS CON FECHAS VARIADAS) ---
    estados = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

    # Definimos el rango de fechas: Diciembre 2025 a Marzo 2026
    start_date = datetime(2025, 12, 1)
    end_date = datetime(2026, 3, 31)

    print(f"Generando 30 pedidos entre {start_date.date()} y {end_date.date()}...")

    for _ in range(30):
        cliente = secure_choice(clientes)
        pedido = Order.objects.create(
            user=cliente,
            address=fake.address(),
            status=secure_choice(estados),
            placed_at=fake.date_time_between(
                start_date=start_date, end_date=end_date, tzinfo=None
            ),
        )

        # Añadir entre 1 y 4 productos al pedido
        num_items = secure_randint(1, 4)
        productos_pedido = secure_sample(productos, num_items)

        for p in productos_pedido:
            OrderItem.objects.create(
                order=pedido,
                product=p,
                quantity=secure_randint(1, 2),
                price_at_purchase=p.price,
            )

        pedido.update_totals()

    print("✅ 30 Pedidos creados y totales calculados en DB")
    print("✨ Seeder finalizado con éxito.")


if __name__ == "__main__":
    run_seeder()
