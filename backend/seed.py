import os
import secrets
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


# --- FUNCIONES AUXILIARES ---
def secure_choice(sequence):
    """Selecciona un elemento aleatorio de forma segura."""
    return secrets.choice(sequence)


def secure_randint(min_val, max_val):
    """Genera un entero aleatorio seguro entre min y max (incluidos)."""
    return min_val + secrets.randbelow(max_val - min_val + 1)


def secure_uniform(min_val, max_val):
    """Genera un float aleatorio seguro entre min y max."""
    # Generamos un factor entre 0 y 1 con alta precisión
    factor = secrets.randbelow(1000000) / 1000000.0
    return min_val + (factor * (max_val - min_val))


def secure_sample(population, k):
    """Selecciona k elementos únicos de una población de forma segura."""
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

    # --- 1. CREAR ADMINISTRADOR ---
    if not User.objects.filter(role="ADMIN").exists():
        User.objects.create_superuser(
            username="admin",
            email="admin@esencia.com",
            password="adminpassword123",  # NOSONAR: Contraseña de ejemplo para desarrollo
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
        nombre = f"{secure_choice(['Anillo', 'Collar', 'Pendientes', 'Pulsera'])} {fake.word().capitalize()} {secure_choice(['Eterno', 'Gala', 'Minimal', 'Luxury', 'Esencia'])}"

        # Precio y Stock generados con funciones seguras
        precio_val = secure_uniform(25.0, 450.0)
        stock_val = secure_randint(5, 50)

        prod, created = Product.objects.get_or_create(
            name=nombre,
            defaults={
                "description": fake.sentence(nb_words=12),
                "price": Decimal(precio_val).quantize(Decimal("0.00")),
                "stock": stock_val,
                "category": secure_choice(categorias),
                "material": secure_choice(materiales),
                "is_active": True,
            },
        )
        productos.append(prod)
    print(f"✅ {len(productos)} Productos creados")

    # --- 4. CREAR 10 PEDIDOS ---
    estados = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

    for _ in range(10):
        cliente = secure_choice(clientes)

        pedido = Order.objects.create(
            user=cliente,
            address=fake.address(),
            status=secure_choice(estados),
            placed_at=fake.date_time_between(
                start_date="-30d", end_date="now", tzinfo=None
            ),
        )

        # Añadir entre 1 y 4 productos a cada pedido usando la función de sample segura
        num_items = secure_randint(1, 4)
        productos_pedido = secure_sample(productos, num_items)

        for p in productos_pedido:
            OrderItem.objects.create(
                order=pedido,
                product=p,
                quantity=secure_randint(1, 2),
                price_at_purchase=p.price,
            )

    print("✅ 10 Pedidos con sus desgloses creados")
    print("✨ Seeder finalizado. ¡La base de datos está lista!")


if __name__ == "__main__":
    run_seeder()
