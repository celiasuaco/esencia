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


CIUDADES_ESPANOLAS = [
    {"nombre": "Madrid", "lat": 40.4167, "lng": -3.7033},
    {"nombre": "Barcelona", "lat": 41.3851, "lng": 2.1734},
    {"nombre": "Valencia", "lat": 39.4699, "lng": -0.3763},
    {"nombre": "Sevilla", "lat": 37.3891, "lng": -5.9845},
    {"nombre": "Zaragoza", "lat": 41.6488, "lng": -0.8891},
    {"nombre": "Málaga", "lat": 36.7213, "lng": -4.4214},
    {"nombre": "Murcia", "lat": 37.9922, "lng": -1.1307},
    {"nombre": "Palma", "lat": 39.5693, "lng": 2.6502},
    {"nombre": "Bilbao", "lat": 43.2630, "lng": -2.9350},
    {"nombre": "Alicante", "lat": 38.3452, "lng": -0.4810},
    {"nombre": "Valladolid", "lat": 41.6523, "lng": -4.7245},
    {"nombre": "Vigo", "lat": 42.2406, "lng": -8.7207},
]


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

    # --- 4. CREAR PEDIDOS (50 PEDIDOS PARA QUE EL MAPA SE VEA LLENO) ---
    estados = [
        "PAID",
        "SHIPPED",
        "DELIVERED",
    ]
    start_date = datetime(2025, 12, 1)
    end_date = datetime(2026, 3, 31)

    print("Generando 50 pedidos con geolocalización en España...")

    for _ in range(50):
        cliente = secure_choice(clientes)

        ciudad = secure_choice(CIUDADES_ESPANOLAS)
        lat_random = float(ciudad["lat"]) + (secure_uniform(-0.05, 0.05))
        lng_random = float(ciudad["lng"]) + (secure_uniform(-0.05, 0.05))

        pedido = Order.objects.create(
            user=cliente,
            address=f"{fake.street_address()}, {ciudad['nombre']}, España",
            status=secure_choice(estados),
            is_paid=True,
            latitude=Decimal(lat_random).quantize(Decimal("0.000000")),
            longitude=Decimal(lng_random).quantize(Decimal("0.000000")),
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

    print("✅ 50 Pedidos creados con Lat/Lng en España")
    print("✨ Seeder finalizado con éxito.")


if __name__ == "__main__":
    run_seeder()
