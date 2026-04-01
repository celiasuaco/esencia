# Esencia: E-commerce de Joyería

![Django](https://img.shields.io/badge/Django-5.0-092e20?style=for-the-badge&logo=django&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge&logo=openai&logoColor=white)
![Stripe](https://img.shields.io/badge/Stripe-Payments-635bff?style=for-the-badge&logo=stripe&logoColor=white)

---

## 📑 Índice
1. [Introducción](#-introducción)
2. [¿Qué es Esencia?](#-qué-es-esencia)
3. [Características Principales](#-características-principales)
4. [Stack Tecnológico](#-stack-tecnológico)
5. [Arquitectura del Sistema](#-arquitectura-del-sistema)
6. [Metodología de Desarrollo](#-metodología-de-desarrollo)
7. [Contribución](#-contribución)
8. [Licencia](#-licencia)

---

## 📖 Introducción
En el mercado actual de artículos de lujo, la digitalización ha dejado de ser una opción para convertirse en una necesidad competitiva. Sin embargo, la venta online de joyería enfrenta un reto único: **replicar la asesoría personalizada** y la confianza de una boutique física. 

Este proyecto nace para resolver ese desafío, fusionando la robustez de un backend empresarial con las capacidades de la Inteligencia Artificial.

---

## 💍 ¿Qué es Esencia?
**Esencia** es una plataforma e-commerce diseñada específicamente para el sector de la joyería. No es solo una tienda virtual; es un ecosistema inteligente que entiende los gustos del cliente y optimiza la carga de trabajo administrativa mediante automatización avanzada.

### ¿Para qué sirve?
* **Para el Cliente:** Proporciona una experiencia donde la búsqueda de la joya perfecta es asistida por un experto virtual disponible 24/7.
* **Para el Negocio:** Centraliza la logística, el inventario y el análisis de datos en una sola herramienta, permitiendo tomar decisiones basadas en patrones reales de venta y mapas de calor geográficos.

---

## ✨ Características Principales

### 🛒 Experiencia de Usuario (B2C)
* **Asistente Virtual con IA:** Chatbot integrado con OpenAI que ofrece recomendaciones basadas en materiales, precios o la ocasión especial que el usuario describa.
* **Búsqueda Avanzada:** Filtrado dinámico por atributos técnicos (quilates, pureza, material) y ordenación inteligente.
* **Checkout de Alta Seguridad:** Integración nativa con Stripe para pagos cifrados y cumplimiento de normativas financieras.
* **Seguimiento en Tiempo Real:** Dashboard para que el cliente consulte el historial y el estado logístico de sus piezas.

### 🛠️ Gestión Administrativa (Backoffice)
* **Panel de Control Inteligente:** Gestión CRUD de inventario con alertas automáticas de stock crítico.
* **Optimización SEO con IA:** Generación automática de descripciones persuasivas y metadatos SEO utilizando modelos de lenguaje de última generación.
* **Analítica de Negocio:** Visualización de ingresos, tendencias de ventas y mapas de calor para identificar zonas de alta demanda.
* **Logística Automatizada:** Gestión de estados de envío con un solo clic.

---

## 💻 Stack Tecnológico

### Backend & Core
* **Python 3.10+**: Lenguaje base por su versatilidad y librerías de IA.
* **Django 5.0**: Framework de alto nivel elegido por su seguridad nativa y su potente ORM.
* **Django Rest Framework (DRF)**: Para la creación de una API robusta y escalable.

### Base de Datos & Caché
* **PostgreSQL**: Motor relacional para garantizar la integridad de las transacciones y clientes.
* **Redis**: Gestión de colas de tareas y caché de alta velocidad.

### Inteligencia Artificial & APIs
* **OpenAI API (GPT-4o)**: Cerebro detrás del asistente virtual y la generación de contenido.
* **Stripe API**: Pasarela de pagos de estándar industrial.

### Frontend
* **Tailwind CSS**: Estilizado basado en utilidades para un diseño responsive y elegante.

---

## 🏗️ Arquitectura del Sistema
El proyecto sigue un patrón **MVT (Model-View-Template)** desacoplado mediante una arquitectura **API-First**. Se prioriza la modularidad dividiendo el sistema en aplicaciones independientes:
1. **Core:** Lógica de negocio y configuración base.
2. **Users:** Gestión de identidades, perfiles y autenticación (JWT).
3. **Products:** Catálogo, atributos técnicos e inventario.
4. **Sales:** Carrito de compra, gestión de órdenes y pasarela de pagos.
5. **AI_Services:** Integración y procesamiento de lenguaje natural con OpenAI.

---

## 📈 Metodología de Desarrollo

Este proyecto se desarrolla bajo la metodología SofIA, utilizando Enterprise Architect para el modelado exhaustivo de requisitos y casos de uso.
* Control de Versiones: Git siguiendo el estándar de Conventional Commits.
* Calidad de Código: Uso de Hooks de Git para validación de mensajes y automatización de tareas de pre-configuración.
* Entorno: Preparado para una futura contenedorización mediante Docker para asegurar la escalabilidad.

---

## 🤝 Contribución

Este es un proyecto académico en el marco de un Trabajo de Fin de Grado (TFG). Si deseas realizar sugerencias:

* Abre un Issue explicando la mejora o el error encontrado.
* Realiza un Fork del proyecto.
* Envía un Pull Request para revisión técnica.

---

## 📄 Licencia

Este proyecto es de propiedad intelectual privada y uso estrictamente académico. Todos los derechos reservados para **Celia - Proyecto Esencia Joyería 2026**.
