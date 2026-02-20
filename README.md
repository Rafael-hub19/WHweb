# Wooden House — Sitio Web

Plataforma web completa para la venta y gestión de muebles de baño a medida.  
Incluye catálogo con carrito, proceso de pago, cotizaciones, panel de administrador y panel de empleado.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Backend | PHP 8+ |
| Base de datos | MySQL / MariaDB |
| Autenticación | Firebase Auth (SDK v9 compat) |
| Almacenamiento de imágenes | Firebase Storage |
| Iconos | Font Awesome 6.5.1 |
| Servidor | Apache con mod_rewrite |

---

## Estructura del proyecto

```
Wooden House/
├── public/                        # Raíz pública (document root del servidor)
│   ├── index.php                  # Página de inicio
│   ├── catalogo.php               # Catálogo de productos
│   ├── detalle_producto.php       # Detalle de un producto
│   ├── carrito-checkout.php       # Carrito + selección de fecha
│   ├── pago.php                   # Proceso de pago
│   ├── solicitudes.php            # Cotizaciones y citas
│   ├── login.php                  # Autenticación de personal
│   ├── .htaccess                  # URLs limpias (mod_rewrite)
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── admin/
│   │   └── panel_administrador.php
│   ├── empleado/
│   │   └── panel_empleado.php
│   └── assets/
│       ├── css/
│       │   ├── variables.css      # Variables globales (colores, fuentes)
│       │   ├── styles.css         # Estilos compartidos (header, footer, nav)
│       │   ├── index.css
│       │   ├── catalogo.css
│       │   ├── carrito.css        # Incluye estilos del selector de fechas
│       │   ├── pago.css
│       │   ├── solicitudes.css
│       │   ├── login.css
│       │   ├── detalle_producto.css
│       │   ├── panel_administrador.css
│       │   └── panel_empleado.css
│       └── js/
│           ├── app.js             # Utilidades globales y carrito
│           ├── utils.js           # Funciones compartidas
│           ├── firebase-config.js # Inicialización Firebase
│           ├── index.js           # Inicio (FAQ, animaciones)
│           ├── catalogo.js        # Carga de productos y filtros
│           ├── detalle_producto.js# Galería, tabs, agregar al carrito
│           ├── carrito.js         # Gestión del carrito
│           ├── checkout.js        # Selector de fechas y validación
│           ├── pago.js            # Proceso de pago
│           ├── solicitudes.js     # Cotizaciones y citas (tabs)
│           ├── login.js           # Autenticación Firebase
│           ├── panel_administrador.js
│           └── panel_empleado.js
│
├── api/                           # Endpoints REST (PHP)
│   ├── _helpers.php               # Funciones comunes de API
│   ├── auth.php                   # Verificación de tokens Firebase
│   ├── productos.php              # CRUD productos + imágenes + specs
│   ├── categorias.php             # CRUD categorías
│   ├── pedidos.php                # CRUD pedidos
│   ├── disponibilidad.php         # Fechas disponibles según capacidad
│   ├── capacidad.php              # Gestión de slots de producción (admin)
│   ├── cotizaciones.php
│   ├── citas.php
│   ├── empleados.php
│   ├── notificaciones.php
│   ├── pagos.php
│   ├── reportes.php
│   ├── calendario.php
│   └── .htaccess                  # Bloqueo de acceso directo
│
├── includes/                      # Helpers PHP del servidor
│   ├── config.php                 # Configuración general
│   ├── db.php                     # Conexión MySQL (PDO)
│   ├── auth.php                   # Utilidades de sesión
│   ├── functions.php
│   ├── notifications.php
│   ├── stripe.php
│   └── paypal.php
│
├── database/
│   ├── schema.sql                 # Estructura completa de tablas
│   └── seed.sql                   # Datos de prueba + festivos 2026
│
├── firebase/
│   ├── firebase.json
│   ├── firestore.rules
│   ├── storage.rules
│
├── logs/                          # Logs del servidor (ignorados en Git)
├── .env.example                   # Plantilla de variables de entorno
├── .gitignore
└── README.md
```

---

## URLs del sitio (URLs limpias)

| URL visible | Archivo real |
|-------------|-------------|
| `/` o `/inicio` | `public/index.php` |
| `/catalogo` | `public/catalogo.php` |
| `/detalle/42` | `public/detalle_producto.php?id=42` |
| `/carrito` | `public/carrito-checkout.php` |
| `/pago` | `public/pago.php` |
| `/solicitudes` | `public/solicitudes.php` |
| `/login` | `public/login.php` |
| `/admin/` | `public/admin/panel_administrador.php` |
| `/empleado/` | `public/empleado/panel_empleado.php` |

> Requiere Apache con `mod_rewrite` activo y `AllowOverride All` en la configuración del servidor.

---

## Base de datos — Tablas principales

| Tabla | Descripción |
|-------|-------------|
| `categorias` | Categorías de productos |
| `productos` | Productos con precio, stock y etiqueta |
| `imagenes_producto` | Galería de imágenes por producto (Firebase Storage URLs) |
| `especificaciones_producto` | Specs técnicas clave-valor por producto |
| `pedidos` | Pedidos de clientes con fecha estimada de entrega |
| `capacidad_produccion` | Slots de producción y entrega por semana |
| `dias_bloqueados` | Festivos y cierres del taller |
| `citas` | Citas agendadas |
| `cotizaciones` | Solicitudes de cotización |
| `empleados` | Personal registrado |
| `notificaciones` | Sistema de notificaciones internas |

### Inicializar la base de datos

```sql
-- 1. Crear la base de datos
CREATE DATABASE wooden_house CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 2. Ejecutar el schema
mysql -u usuario -p wooden_house < database/schema.sql

-- 3. Cargar datos de prueba + festivos 2026
mysql -u usuario -p wooden_house < database/seed.sql
```

---

## Sistema de disponibilidad de fechas

El carrito consulta disponibilidad real antes de mostrar fechas de entrega:

- `GET /api/disponibilidad.php` — devuelve semanas disponibles según capacidad configurada y pedidos existentes
- `GET|POST|PUT|DELETE /api/capacidad.php` — gestión de slots por semana (solo admin)
- La tabla `capacidad_produccion` define cuántos pedidos entran por semana
- La tabla `dias_bloqueados` contiene festivos y cierres (Semana Santa, etc.)
- Si la API falla, el checkout calcula 8 semanas estimadas como fallback

---

## Configuración inicial

### 1. Variables de entorno

Copiar `.env.example` a `.env` y completar:

```env
DB_HOST=localhost
DB_NAME=wooden_house
DB_USER=tu_usuario
DB_PASS=tu_contraseña

FIREBASE_PROJECT_ID=tu-proyecto
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=...
FIREBASE_STORAGE_BUCKET=...
```

### 2. Firebase

- Crear proyecto en [Firebase Console](https://console.firebase.google.com)
- Habilitar **Authentication** (correo/contraseña + Google)
- Habilitar **Storage** para imágenes de productos
- Actualizar `public/assets/js/firebase-config.js` con las credenciales del proyecto

### 3. Servidor Apache

```apache
# En httpd.conf o el VirtualHost del proyecto
<Directory "/ruta/al/proyecto/public">
    AllowOverride All
</Directory>
```

Asegurarse de que `mod_rewrite` esté activo:
```bash
a2enmod rewrite
service apache2 restart
```

---

## Funcionalidades implementadas

### Frontend público
- Página de inicio con sección hero, servicios, proceso, proyectos realizados y FAQ
- Catálogo con filtro por categoría, búsqueda en tiempo real y ordenamiento
- Detalle de producto con galería, especificaciones en tabs y selector de cantidad
- Carrito con selector de semanas de entrega basado en disponibilidad real
- Proceso de pago con validación completa
- Formulario de cotizaciones y citas con tabs

### Panel Administrador
- Gestión de productos (CRUD + imágenes + especificaciones)
- Gestión de pedidos y cambio de estado
- Gestión de empleados
- Gestión de capacidad de producción por semana
- Reportes y estadísticas

### Panel Empleado
- Vista de pedidos asignados
- Actualización de estados
- Calendario de citas

### Seguridad
- Tokens Firebase verificados en cada llamada a la API
- Rate limiting en endpoints críticos
- Headers de seguridad HTTP (CSP, X-Frame-Options, etc.)
- CORS configurado
- Archivos sensibles bloqueados vía `.htaccess`
- Todo el CSS/JS separado del HTML (sin código embebido)

---

## Requisitos del servidor

- PHP 8.0 o superior
- MySQL 5.7+ o MariaDB 10.4+
- Apache 2.4+ con `mod_rewrite`
- Extensiones PHP: `pdo`, `pdo_mysql`, `json`, `mbstring`

---

## Notas de desarrollo

- Los iconos usan **Font Awesome 6.5.1** (CDN) — no hay emojis en el código
- El menú hamburguesa está implementado en todos los módulos JS
- El carrito persiste en `localStorage` con la clave `wh_carrito`
- Los paneles de admin y empleado requieren sesión activa de Firebase
- La sección "Proyectos Realizados" del index está hardcodeada en `index.php` — para actualizarla editar directamente ese archivo