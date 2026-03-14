# Wooden House — Sitio Web

Plataforma e-commerce completa para la venta y gestión de muebles de baño a medida.
Incluye catálogo, carrito, cuentas de cliente, proceso de pago, cotizaciones, sistema de ofertas/marketing y paneles de administrador y empleado.

---

## Tecnologías

| Capa | Tecnología |
|------|-----------|
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Utilidades JS | Bootstrap 5.3.3 bundle (solo para compatibilidad; dropdowns y nav son custom CSS/JS) |
| Backend | PHP 8+ |
| Base de datos | MySQL 8 / MariaDB 10.4+ |
| Autenticación | Firebase Auth SDK v10 compat |
| Base de datos RT | Firebase Firestore SDK v10 compat |
| Almacenamiento | Firebase Storage SDK v10 compat |
| Cloud Functions | Firebase Functions v2 (Node.js 20) |
| Pasarela 1 | Stripe JS v3 + PHP vía cURL |
| Pasarela 2 | PayPal JS SDK v5 + REST API v2 |
| Correos | SMTP directo desde PHP (Brevo/Gmail compatible) |
| Iconos | Font Awesome 6.5.1 (cdnjs.cloudflare.com) |
| Servidor | Apache 2.4+ con mod_rewrite |
| Control versiones | Git + GitHub |

---

## Estructura del proyecto

```
Wooden House/
├── public/                          # Raíz pública (DocumentRoot del servidor)
│   ├── index.php                    # Página de inicio
│   ├── catalogo.php                 # Catálogo de productos
│   ├── detalle_producto.php         # Detalle de un producto
│   ├── carrito-checkout.php         # Carrito + selector de fecha de entrega
│   ├── pago.php                     # Proceso de pago (Stripe + PayPal)
│   ├── solicitudes.php              # Cotizaciones, citas y seguimiento
│   ├── mi-cuenta.php                # Portal del cliente registrado (pedidos, perfil)
│   ├── login.php                    # Autenticación de personal (Firebase)
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── .htaccess                    # URLs limpias + CSP + caché + compresión
│   ├── admin/
│   │   └── panel_administrador.php  # Panel completo del administrador
│   ├── empleado/
│   │   └── panel_empleado.php       # Panel del empleado
│   └── assets/
│       ├── css/
│       │   ├── variables.css        # Variables globales — paleta ámbar premium
│       │   ├── styles.css           # Estilos compartidos (header, footer, nav)
│       │   ├── index.css
│       │   ├── catalogo.css
│       │   ├── carrito.css          # Incluye estilos del selector de fechas
│       │   ├── pago.css
│       │   ├── solicitudes.css
│       │   ├── login.css
│       │   ├── detalle_producto.css
│       │   ├── panel_administrador.css
│       │   ├── panel_empleado.css
│       │   ├── modal-auth.css       # Modal de login/registro de clientes
│       │   ├── mi-cuenta.css        # Estilos del portal del cliente
│       │   └── terminos.css         # Estilos de la página de términos y condiciones
│       ├── js/
│       │   ├── app.js               # Utilidades globales y carrito
│       │   ├── utils.js             # Funciones compartidas
│       │   ├── firebase-config.js   # Inicialización Firebase (Auth+Firestore+Storage)
│       │   ├── index.js             # Inicio (FAQ, animaciones)
│       │   ├── catalogo.js          # Carga de productos y filtros
│       │   ├── detalle_producto.js  # Galería, tabs, agregar al carrito
│       │   ├── carrito.js           # Gestión del carrito (localStorage)
│       │   ├── checkout.js          # Selector de fechas y validación
│       │   ├── pago.js              # Stripe Elements + PayPal Buttons
│       │   ├── solicitudes.js       # Cotizaciones, citas y seguimiento (tabs)
│       │   ├── login.js             # Autenticación Firebase
│       │   ├── panel_administrador.js  # Panel admin con auto-polling 30s
│       │   ├── panel_empleado.js    # Panel empleado con auto-polling 30s
│       │   ├── modal-auth.js        # Modal de autenticación de clientes (Firebase)
│       │   └── mi-cuenta.js         # Lógica del portal del cliente
│       └── img/
│           ├── logo-header.png
│           └── logo-login.png
│
├── api/                             # Endpoints REST (PHP)
│   ├── _helpers.php                 # Funciones comunes de API (auth, sanitize, JSON)
│   ├── auth.php                     # Verificación tokens Firebase JWT (personal + clientes)
│   ├── clientes.php                 # CRUD clientes registrados (e-commerce)
│   ├── ofertas.php                  # CRUD ofertas, descuentos y códigos promo
│   ├── productos.php                # CRUD productos + imágenes + especificaciones
│   ├── categorias.php               # CRUD categorías
│   ├── pedidos.php                  # CRUD pedidos + cambio de estado
│   ├── disponibilidad.php           # Fechas disponibles según capacidad real
│   ├── capacidad.php                # Gestión de slots de producción (admin)
│   ├── cotizaciones.php             # CRUD cotizaciones
│   ├── citas.php                    # CRUD citas y calendario
│   ├── empleados.php                # CRUD empleados (Firebase Auth + MySQL)
│   ├── notificaciones.php           # Notificaciones vía Firestore REST
│   ├── pagos.php                    # Stripe + PayPal: crear, capturar, webhooks
│   ├── reportes.php                 # Reportes: resumen, pedidos, productos, ingresos, clientes
│   ├── calendario.php               # Disponibilidad del calendario de citas
│   └── .htaccess                    # CORS + bloqueo de acceso directo + preflight OPTIONS
│
├── includes/                        # Helpers PHP del servidor
│   ├── config.php                   # Constantes de configuración (lee .env)
│   ├── db.php                       # Conexión MySQL (PDO singleton)
│   ├── auth.php                     # Verificación de token Firebase + sesión PHP
│   ├── functions.php                # Helpers generales (sanitize, logs, Firestore)
│   ├── notifications.php            # Envío de emails SMTP + escritura en Firestore
│   ├── stripe.php                   # Wrapper de la API de Stripe vía cURL
│   └── paypal.php                   # Wrapper de la API de PayPal + verificación de webhooks
│
├── database/
│   ├── schema.sql                   # Estructura completa de tablas (14 tablas)
│   └── seed.sql                     # Datos de prueba + festivos 2026
│
├── firebase/
│   ├── firebase.json                # Configuración: Firestore, Storage, Functions, Hosting, Emulators
│   ├── firestore.rules              # Reglas de seguridad Firestore (colección notificaciones)
│   ├── firestore.indexes.json       # Índices compuestos para consultas ordenadas
│   ├── storage.rules                # Reglas de seguridad Storage (imágenes de productos)
│   └── functions/
│       ├── package.json             # Dependencias (firebase-admin, firebase-functions, nodemailer)
│       └── index.js                 # 5 Cloud Functions:
│                                    #   · onNuevaNotificacion  — trigger Firestore → email al admin
│                                    #   · enviarConfirmacionPedido    — HTTP callable
│                                    #   · enviarConfirmacionCotizacion — HTTP callable
│                                    #   · enviarConfirmacionCita       — HTTP callable
│                                    #   · limpiarNotificacionesAntiguas — scheduled (cada 24h)
│
├── logs/                            # Logs del servidor (excluidos de Git)
├── .htaccess                        # Bloqueo de carpetas internas sensibles
├── .env                             # Variables de entorno (excluido de Git)
├── .env.example                     # Plantilla de variables de entorno
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
| `/mi-cuenta` | `public/mi-cuenta.php` |
| `/terminos` | `public/terminos.php` |
| `/admin/` | `public/admin/panel_administrador.php` |
| `/empleado/` | `public/empleado/panel_empleado.php` |

> Requiere Apache con `mod_rewrite` activo y `AllowOverride All`.

---

## Base de datos — Tablas

| Tabla | Descripción |
|-------|-------------|
| `usuarios_personal` | Admins y empleados (espejo de Firebase Auth) |
| `clientes` | Clientes registrados en la tienda (Firebase Auth) |
| `ofertas` | Descuentos, cupones y promociones de marketing |
| `categorias` | Categorías de productos |
| `productos` | Productos con precio, stock y etiqueta |
| `imagenes_producto` | Galería de imágenes por producto (URLs de Firebase Storage) |
| `especificaciones_producto` | Specs técnicas clave-valor por producto |
| `pedidos` | Pedidos con token de seguimiento y fecha estimada |
| `detalle_pedido` | Líneas de cada pedido (productos + cantidades) |
| `pagos` | Registro de transacciones Stripe y PayPal |
| `cotizaciones` | Solicitudes de cotización de clientes |
| `citas` | Citas agendadas (medición e instalación) |
| `capacidad_produccion` | Slots de producción y entrega por semana |
| `dias_bloqueados` | Festivos y cierres del taller |
| `carritos_guardados` | Recuperación de carritos abandonados |

### Inicializar la base de datos

```bash
# 1. Crear la base de datos
mysql -u root -p -e "CREATE DATABASE wooden_house CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Crear estructura
mysql -u usuario -p wooden_house < database/schema.sql

# 3. Cargar datos de prueba + festivos 2026
mysql -u usuario -p wooden_house < database/seed.sql
```

---

## Sistema de disponibilidad de fechas

El carrito consulta disponibilidad real antes de mostrar semanas de entrega:

- `GET /api/disponibilidad.php` — devuelve semanas disponibles según capacidad y pedidos existentes
- `GET|POST|PUT|DELETE /api/capacidad.php` — gestión de slots por semana (solo admin)
- La tabla `capacidad_produccion` define cuántos pedidos caben por semana
- La tabla `dias_bloqueados` contiene festivos y cierres (Semana Santa, etc.)
- Si la API falla, el checkout calcula 8 semanas estimadas como fallback

---

## Auto-actualización en tiempo real (Paneles)

Tanto el panel de administrador como el de empleado se actualizan **automáticamente cada 30 segundos** sin necesidad de recargar la página:

- La función `_autoRefreshAdmin()` / `_autoRefresh()` detecta la sección visible y recarga solo esos datos
- El polling se **pausa** automáticamente cuando la pestaña no está activa (visibilitychange)
- Al **volver a la pestaña** se dispara una actualización inmediata y se reinicia el ciclo
- El intervalo se **cancela en logout** para no dejar procesos huérfanos

| Sección | Función que se refresca |
|---------|------------------------|
| Dashboard | `refreshKPIsFromAPI()` |
| Pedidos | `cargarPedidosAPI()` |
| Catálogo | `cargarProductosAPI()` + `renderCatalogo()` |
| Empleados | `cargarEmpleadosAPI()` |
| Reportes | `cargarReportesAPI()` |
| Citas | `renderCalendar()` |

---

## Configuración inicial

### 1. Variables de entorno

Copiar `.env.example` a `.env` y completar:

```env
# Base de datos
DB_HOST=localhost
DB_NAME=wooden_house
DB_USER=tu_usuario
DB_PASS=tu_contraseña

# Firebase (backend PHP)
FIREBASE_PROJECT_ID=woodenhouse-898de
FIREBASE_API_KEY=...
FIREBASE_AUTH_DOMAIN=woodenhouse-898de.firebaseapp.com
FIREBASE_STORAGE_BUCKET=woodenhouse-898de.firebasestorage.app

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# PayPal
PAYPAL_CLIENT_ID=...
PAYPAL_CLIENT_SECRET=...
PAYPAL_WEBHOOK_ID=...          # Registrar endpoint en developer.paypal.com primero
PAYPAL_MODE=sandbox            # Cambiar a 'live' en producción

# Email SMTP (Brevo, Gmail, etc.)
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=tu@correo.com
SMTP_PASS=tu_smtp_password
EMAIL_FROM=noreply@woodenhouse.com.mx
EMAIL_FROM_NAME=Wooden House
ADMIN_EMAIL=contacto@woodenhouse.com.mx
```

### 2. Firebase — Consola web

1. Crear proyecto en [Firebase Console](https://console.firebase.google.com)
2. Habilitar **Authentication** → Correo/contraseña
   - Al registrarse, el sistema envía automáticamente un correo de verificación vía `sendEmailVerification()`
3. Habilitar **Firestore** → Modo producción → desplegar `firebase/firestore.rules`
4. Habilitar **Storage** → desplegar `firebase/storage.rules`
5. Actualizar `public/assets/js/firebase-config.js` con las credenciales del proyecto

### 3. Firebase Cloud Functions (opcional, mejora correos)

```bash
npm install -g firebase-tools
cd firebase
firebase login
firebase use woodenhouse-898de

# Configurar variables de entorno de las Functions
firebase functions:config:set \
  smtp.host="smtp-relay.brevo.com" \
  smtp.port="587" \
  smtp.user="tu@correo.com" \
  smtp.pass="tu_password" \
  email.from="noreply@woodenhouse.com.mx" \
  email.from_name="Wooden House" \
  email.admin="contacto@woodenhouse.com.mx"

# Desplegar
firebase deploy --only functions
```

> **Nota:** Los correos automáticos ya funcionan vía SMTP directo desde PHP (`includes/notifications.php`). Las Cloud Functions son un sistema complementario de notificaciones en tiempo real.

### 4. PayPal Webhook

1. Ir a [developer.paypal.com](https://developer.paypal.com) → My Apps & Credentials → tu app → **Webhooks**
2. Agregar URL: `https://tudominio.com/api/pagos.php?action=paypal_webhook`
3. Seleccionar eventos: `PAYMENT.CAPTURE.COMPLETED`, `PAYMENT.CAPTURE.DENIED`, `PAYMENT.CAPTURE.REFUNDED`, `CHECKOUT.ORDER.VOIDED`
4. Copiar el **Webhook ID** generado al `.env` como `PAYPAL_WEBHOOK_ID`

### 5. Stripe Webhook

1. Ir a [dashboard.stripe.com](https://dashboard.stripe.com) → Developers → Webhooks
2. Agregar URL: `https://tudominio.com/api/pagos.php?action=stripe_webhook`
3. Seleccionar eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`, `charge.refunded`
4. Copiar el **Signing Secret** al `.env` como `STRIPE_WEBHOOK_SECRET`

### 6. Servidor Apache

```apache
# En httpd.conf o el VirtualHost — apuntar DocumentRoot a /public
<VirtualHost *:443>
    DocumentRoot "/ruta/al/proyecto/Wooden House/public"
    ServerName woodenhouse.com.mx

    <Directory "/ruta/al/proyecto/Wooden House/public">
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

```bash
# Habilitar módulos necesarios
a2enmod rewrite headers expires deflate
service apache2 restart
```

---

## Correcciones de bugs aplicadas (v3 — 2026-03-12)

### Login empleado: 404 en primer intento

**Causa:** PHP generaba la cookie de sesión con `domain=.localhost`. Los navegadores modernos rechazan cookies con ese dominio (tratado como TLD), por lo que la sesión creada en `/api/auth.php` no llegaba al panel del empleado.
**Corrección (`includes/config.php`):** Si el host es `localhost` o una IP, la cookie de sesión se crea sin atributo `domain` (el navegador usa el hostname actual automáticamente).

### Guard de paneles redirigía a 404

**Causa:** Cuando la sesión falla, el guard de `panel_empleado.php` y `panel_administrador.php` hacía `Location: /public/login.php`, URL que no existe (la raíz web es `public/`).
**Corrección:** Cambiado a `Location: /login` (URL limpia definida en `.htaccess`).

### CSS/JS inline en `terminos.php` y `carrito-checkout.php`

**Corrección:** Extraídas las 102 líneas de CSS inline de `terminos.php` al nuevo archivo `assets/css/terminos.css`. El script inline de auth en `carrito-checkout.php` fue movido al final de `assets/js/checkout.js`.

---

## Correcciones de Seguridad aplicadas (v2)

> Las siguientes vulnerabilidades fueron identificadas por auditoría de infraestructura y corregidas:

### 1. Validación de imágenes reales en el panel administrador
**Vulnerabilidad:** Se podía subir cualquier archivo renombrándolo como `.jpg`.  
**Corrección (`panel_administrador.js`):**
- Verificación del tipo MIME antes de subir (`image/jpeg`, `image/png`, `image/webp`, `image/gif` únicamente).
- Lectura de los **primeros 12 bytes (magic numbers)** del archivo para confirmar que es una imagen auténtica (JPEG = `FF D8 FF`, PNG = `89 50 4E 47`, WebP, GIF).
- Filtrado en `handleImgSelect()` antes de añadir al array de pendientes.

### 2. Sanitización de todos los campos de usuario
**Vulnerabilidad:** Los campos de texto no filtraban caracteres especiales permitiendo inyección SQL potencial.  
**Corrección (`solicitudes.js`, `api/cotizaciones.php`, `api/citas.php`):**
- Funciones JS: `sanitizeName()`, `sanitizeText()`, `sanitizePhone()`, `sanitizeDescription()` que limpian etiquetas HTML, caracteres de control y comillas peligrosas antes de enviar.
- Validación de longitud máxima en todos los campos (nombre: 150 chars, descripción: 2 000 chars, etc.).
- Validación de formato de teléfono en backend (`isValidPhone()`).
- Atributos `maxlength` y `pattern` añadidos a los `<input>` HTML.

### 3. CSRF Token y sesiones fantasma
**Vulnerabilidad:** Al cerrar sesión la cookie de sesión PHP quedaba activa permitiendo re-acceso.  
**Corrección (`includes/auth.php`, `login.php`, `panel_administrador.js`):**
- **Timeout absoluto de 8 horas** desde el login y **timeout de inactividad de 2 horas**.
- `_destruirSesion()` ahora elimina también la cookie `XSRF-TOKEN` y regenera el ID de sesión.
- `login.php` destruye cualquier sesión PHP activa al cargar (especialmente con `?logout=1`).
- El logout en el panel establece el flag `wh_just_logged_out` en `sessionStorage` **antes** de hacer `signOut()` para que `login.js` no auto-redirija.

### 4. Verificación de usuarios reales (Anti-bot)
**Vulnerabilidad:** Bots podían llenar cotizaciones y citas de forma masiva.  
**Corrección (`solicitudes.php`, `api/cotizaciones.php`, `api/citas.php`):**
- **Campo honeypot** oculto con CSS (no visible para humanos, los bots lo llenan) — si el campo tiene valor, el backend responde con éxito falso sin guardar nada.
- **Rate limiting** en los endpoints POST: máximo 5 cotizaciones / 5 citas por minuto por IP.
- El honeypot usa `position:absolute; left:-9999px` para que lectores de pantalla y humanos no lo vean ni lo activen.

---

## Seguridad — .htaccess

### `/public/.htaccess` — Content Security Policy completa

Todos los servicios externos están explícitamente permitidos. Si ves errores CSP en la consola del navegador, verifica que el dominio del error esté incluido en la directiva correspondiente:

| Directiva | Dominios clave permitidos |
|-----------|--------------------------|
| `script-src` | gstatic.com, firebaseapp.com, stripe.com, paypal.com, jsdelivr.net, cdnjs |
| `connect-src` | *.firebaseio.com, **wss://*.firebaseio.com**, firestore.googleapis.com, www.googleapis.com, identitytoolkit.googleapis.com, securetoken.googleapis.com, accounts.google.com, api.stripe.com, api-m.paypal.com |
| `frame-src` | js.stripe.com, paypal.com, **woodenhouse-898de.firebaseapp.com**, accounts.google.com |
| `img-src` | firebasestorage.googleapis.com, paypalobjects.com |
| `worker-src` | 'self' blob: |

> **`wss://*.firebaseio.com`** es crítico para que Firestore Realtime funcione (WebSocket).  
> **`woodenhouse-898de.firebaseapp.com`** en `frame-src` y `script-src` es requerido por Firebase Auth.  
> **`accounts.google.com`** en `connect-src` y `frame-src` es necesario para el refresh de tokens.

### `/api/.htaccess` — CORS y protección

- CORS abierto (`*`) para llamadas del frontend al backend PHP
- Preflight OPTIONS respondido directamente sin llegar a PHP (204)
- Solo métodos GET, POST, PUT, DELETE, OPTIONS permitidos
- Errores PHP suprimidos para no contaminar las respuestas JSON

### `/.htaccess` — Raíz del proyecto

- Bloquea acceso a carpetas internas: `includes/`, `database/`, `logs/`, `firebase/`, `.git/`
- Bloquea archivos sensibles: `.env`, `.sql`, `.log`, `.sh`, etc.

---

## Funcionalidades implementadas

### Frontend público
- Página de inicio: hero, servicios, proceso de fabricación, proyectos y FAQ
- Catálogo con filtro por categoría, búsqueda en tiempo real y ordenamiento
- Detalle de producto con galería, especificaciones en tabs, selector de cantidad y productos relacionados por categoría
- Carrito con selector de semanas de entrega basado en disponibilidad real de la API
- Proceso de pago completo: Stripe Elements (tarjeta) + PayPal Smart Buttons
- Seguimiento de pedidos por número sin necesidad de login
- Formularios de cotización y agendado de citas con tabs

### Sistema de cuentas de cliente
- Registro e inicio de sesión con Firebase Auth (mismo servicio que el personal interno)
- **Verificación de correo:** al registrarse, Firebase envía automáticamente un link de verificación (`sendEmailVerification`); el cliente puede continuar usando la cuenta sin bloquearse
- Modal de autenticación contextual: aparece al hacer clic en "Proceder al pago" o "Enviar solicitud", no al entrar al sitio
- **Sugerencia de login no bloqueante:** en solicitudes y carrito, si el usuario no tiene sesión, aparece una tarjeta dorada opcional *"¿Ya tienes cuenta? Inicia sesión y llenamos tus datos"*. Al autenticarse, la tarjeta desaparece y los campos se pre-llenan solos
- El carrito se conserva durante el proceso de registro/login (sin interrupciones)
- Portal "Mi Cuenta" (`/mi-cuenta`): historial de pedidos, perfil editable, estadísticas
- Los pedidos, cotizaciones y citas quedan vinculados a la cuenta del cliente automáticamente
- **Header nav:** el botón "Mi cuenta" es un dropdown con dos entradas — *Clientes* (modal Auth) y *Personal* (link a `/login`), visible en todos los dispositivos

### Panel Administrador *(auto-polling 30s)*
- Dashboard con KPIs en tiempo real, gráficas de ventas/estados y **8 acciones rápidas**: Pedidos, Citas, Cotizaciones, Catálogo, Empleados, Clientes, Ofertas, Reportes
- Gestión completa de pedidos (listado, filtros por estado, cambio de estado, detalle con timeline)
- Calendario de citas con vista mensual y tabla lista
- Gestión de cotizaciones con cambio de estado y detalle
- Gestión de productos (CRUD + galería Firebase Storage + especificaciones)
- Gestión de empleados (crear/editar en Firebase Auth + MySQL, activar/desactivar)
- Gestión de capacidad de producción por semana
- Reportes avanzados: resumen, pedidos por período, productos más vendidos, ingresos, clientes (exportable CSV/PDF)
- Análisis financiero
- **Clientes Registrados:** lista completa con historial, total gastado, pedidos y cotizaciones por cliente
- **Ofertas & Marketing:** CRUD de descuentos (porcentaje, monto fijo, envío gratis), códigos de cupón con vigencia y usos máximos

### Panel Empleado *(auto-polling 30s)*
- Vista de pedidos asignados con timeline de 4 etapas y actualización de estado
- Citas programadas con carga real desde la API (confirmar / completar)
- Cotizaciones activas con cambio de estado inline (nueva → en revisión → respondida)
- Calendario interactivo sincronizado con citas de la API
- Dashboard KPIs en tiempo real: pedidos pendientes, citas de hoy, cotizaciones nuevas
- Crear citas y cotizaciones directamente desde el panel
- Notificaciones en tiempo real desde Firestore

### Sistema de notificaciones
- Escritura en Firestore al crear pedidos/cotizaciones/citas
- Listener en tiempo real en los paneles (sin recarga)
- Email automático al admin vía SMTP PHP en cada evento nuevo
- Cloud Function `onNuevaNotificacion` como sistema complementario

### Seguridad
- Tokens JWT de Firebase verificados en cada llamada a la API PHP
- Rate limiting en endpoints críticos y en formularios públicos (5 req/min por IP)
- Headers de seguridad HTTP completos (CSP, HSTS, X-Frame-Options, etc.)
- CORS configurado en `/api/.htaccess`
- Archivos sensibles bloqueados en los tres niveles de `.htaccess`
- Firestore Rules: solo personal autenticado puede leer/escribir notificaciones
- Storage Rules: solo usuarios autenticados pueden subir imágenes
- **Validación de imágenes reales** por magic bytes en el panel administrador
- **Sanitización completa** de todos los campos de usuario (JS + PHP)
- **Campo honeypot** anti-bot en formularios de cotización y cita
- **Session timeout** absoluto (8h) y por inactividad (2h) con destrucción completa de cookies
- **CSRF fix:** sesión PHP destruida correctamente en logout

---

## Módulos de la API

| Endpoint | Métodos | Acceso | Descripción |
|----------|---------|--------|-------------|
| `/api/productos.php` | GET POST PUT DELETE | público (GET) / admin | CRUD productos + imágenes |
| `/api/categorias.php` | GET POST PUT DELETE | público (GET) / admin | CRUD categorías |
| `/api/pedidos.php` | GET POST PUT | público (POST) / empleado+ | Crear y gestionar pedidos |
| `/api/disponibilidad.php` | GET | público | Semanas disponibles |
| `/api/capacidad.php` | GET POST PUT DELETE | admin | Slots de producción |
| `/api/cotizaciones.php` | GET POST PUT | público (POST) / empleado+ | Cotizaciones |
| `/api/citas.php` | GET POST PUT DELETE | público (POST) / empleado+ | Citas |
| `/api/pagos.php` | POST | público / webhook | Stripe + PayPal |
| `/api/reportes.php` | GET | admin | Reportes y estadísticas |
| `/api/notificaciones.php` | GET POST PUT | empleado+ | Notificaciones Firestore |
| `/api/empleados.php` | GET POST PUT DELETE | admin | Gestión de personal |
| `/api/calendario.php` | GET | empleado+ | Disponibilidad de citas |
| `/api/auth.php` | POST GET | — | Verificación de tokens (personal + clientes) |
| `/api/clientes.php` | GET PUT | cliente / admin | Perfil y pedidos del cliente |
| `/api/ofertas.php` | GET POST PUT DELETE | público (GET activas) / admin | Ofertas y cupones |

---

## Requisitos del servidor

- **PHP** 8.0 o superior
- **MySQL** 8.0+ o **MariaDB** 10.4+
- **Apache** 2.4+ con módulos: `mod_rewrite`, `mod_headers`, `mod_expires`, `mod_deflate`
- **Extensiones PHP**: `pdo`, `pdo_mysql`, `json`, `mbstring`, `curl`, `openssl`
- **HTTPS** obligatorio en producción (requerido por Firebase Auth, Stripe y PayPal)

---

## Notas de desarrollo

- Los iconos usan **Font Awesome 6.5.1** vía CDN — sin emojis en el código
- **Bootstrap 5.3.3** se carga solo el JS (sin CSS) para no sobreescribir el tema oscuro personalizado
- El carrito persiste en `localStorage` con la clave `wh_carrito`
- Los paneles de admin y empleado requieren sesión activa de Firebase Auth
- **Los clientes usan la misma Firebase Auth** pero se almacenan en tabla `clientes`, no en `usuarios_personal`
- Las sesiones PHP distinguen entre personal (`usuario_id`, `usuario_rol`) y clientes (`cliente_id`, `cliente_rol`)
- El modal de auth del cliente se activa con `AuthModal.open(callback)` desde cualquier página
- La sección "Proyectos Realizados" del index está hardcodeada en `index.php`
- Los logs del servidor se guardan en `logs/` (ignorado en `.gitignore`)
- El `firebase/` completo está **fuera de `public/`** — no es accesible desde el navegador
