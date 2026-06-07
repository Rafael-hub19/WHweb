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
| Autenticación | Firebase Auth SDK v10 modular (dynamic import) |
| Base de datos RT | Firebase Firestore SDK v10 compat |
| Almacenamiento | Firebase Storage SDK v10 compat |
| Cloud Functions | Firebase Functions v2 (Node.js 22) |
| Pasarela 1 | Stripe JS v3 + PHP vía cURL |
| Pasarela 2 | PayPal JS SDK v5 + REST API v2 |
| Correos | SMTP directo desde PHP (Brevo/Gmail compatible) |
| Iconos | Font Awesome 6.5.1 (cdnjs.cloudflare.com) |
| Exportación Excel | SheetJS (xlsx) 0.20.3 — genera archivos `.xlsx` reales |
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
│   ├── login.php                    # Redirige a /inicio; AuthModal maneja el login
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── .htaccess                    # URLs limpias + CSP estricta + HTTPS + caché + compresión
│   ├── admin/
│   │   └── panel_administrador.php  # Panel completo del administrador
│   ├── empleado/
│   │   └── panel_empleado.php       # Panel del empleado
│   └── assets/
│       ├── css/
│       │   ├── variables.css        # Variables globales — paleta ámbar premium
│       │   ├── styles.css           # Estilos compartidos (header, footer, nav)
│       │   ├── animations.css       # Animaciones, reveal, skeleton, lightbox
│       │   ├── index.css
│       │   ├── catalogo.css
│       │   ├── carrito.css          # Incluye estilos del selector de fechas
│       │   ├── pago.css
│       │   ├── solicitudes.css      # Incluye decision cards y status badges
│       │   ├── login.css
│       │   ├── detalle_producto.css
│       │   ├── panel_administrador.css
│       │   ├── panel_empleado.css
│       │   ├── modal-auth.css       # Modal de login/registro + barra móvil inferior
│       │   ├── mi-cuenta.css        # Estilos del portal del cliente
│       │   └── terminos.css
│       ├── js/
│       │   ├── utils.js             # Funciones compartidas
│       │   ├── firebase-config.js   # Inicialización Firebase (Auth+Firestore+Storage)
│       │   ├── event-delegation.js  # Delegación central de eventos + lightbox de imágenes
│       │   ├── page-init.js         # Inicialización (alertas, Escape modal, URL params)
│       │   ├── animations.js        # IntersectionObserver scroll-reveal + ripple
│       │   ├── index.js             # Inicio (FAQ, animaciones)
│       │   ├── catalogo.js          # Carga de productos, filtros y carrito
│       │   ├── detalle_producto.js  # Galería, tabs, agregar al carrito
│       │   ├── carrito.js           # Gestión del carrito (sessionStorage)
│       │   ├── checkout.js          # Selector de fechas y validación
│       │   ├── pago.js              # Stripe Elements + PayPal Buttons
│       │   ├── solicitudes.js       # Cotizaciones, citas y seguimiento (tabs)
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
├── .htaccess                        # Redirige a HTTPS + bloquea carpetas internas
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
| `/seguimiento` | `public/solicitudes.php` |
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

```bash
# Desplegar solo las reglas de seguridad (sin funciones ni hosting)
cd firebase
firebase deploy --only firestore:rules,storage
```

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

## Seguridad y mejoras de producción (2026-06-07)

### CSP sin `unsafe-inline` en `script-src`

El CSP en `public/.htaccess` ya **no tiene `'unsafe-inline'` en `script-src`**. Toda ejecución de scripts inline está bloqueada por política. Las consecuencias que se resolvieron:

- **`modal-auth.js`:** todos los `onclick`/`onsubmit` del HTML del modal reemplazados con `addEventListener` en `_initCamposModal()`. Afectados: botón ×, form login, form registro, links de tab, botón continuar, reenviar verificación, mi cuenta, cerrar sesión, mini menú y banner de verificación.
- **`catalogo.js`:** filtros de categoría usan `data-cat-filter`, paginación usa `data-call + data-args`, botones de carrito se enlazan con `addEventListener` post-render; `onerror` en imágenes reemplazado por `data-img-fallback`.
- **`detalle_producto.js`:** thumbnails sin `onclick` — manejados por `event-delegation.js` via `.thumb[data-idx]`.

> **Regla para código nuevo:** No usar `onclick=`, `onsubmit=`, `onerror=` ni ningún handler inline. Usar `data-call`, `data-cat-filter`, `data-dismiss`, `data-auth-action`, o `addEventListener` desde JS externo.

### HTTPS redirect — corrección de ERR_TOO_MANY_REDIRECTS

El servidor usa un proxy/CDN (Cloudflare/Nginx) que termina SSL antes de Apache. La redirección HTTPS anterior causaba un loop infinito porque Apache siempre veía `HTTPS=off`.

**Corrección (`.htaccess` raíz y `public/.htaccess`):**
```apache
RewriteCond %{HTTPS} off
RewriteCond %{HTTP:X-Forwarded-Proto} !=https
RewriteCond %{HTTP_HOST} !^localhost$ [NC]
RewriteCond %{HTTP_HOST} !^127\.0\.0\.1$
RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
```
La segunda condición verifica el header `X-Forwarded-Proto` del proxy; si el proxy ya indica HTTPS, no redirige.

### Rate limits más estrictos

`api/auth.php`:
- Login de personal: 5 intentos / 15 min
- Login de clientes: 5 intentos / 15 min
- Registro de clientes: 3 intentos / 15 min

### Validación de URLs de imágenes (productos)

`api/productos.php` — función `validarUrlImagen()` que verifica:
- Esquema `https` obligatorio
- Host en lista blanca: `firebasestorage.googleapis.com`, `storage.googleapis.com`, `*.firebasestorage.app`
- Máximo 2 048 caracteres

### Firebase Storage rules — lista explícita de MIME

`firebase/storage.rules` — en lugar de `image/.*` (que permitía SVG como vector XSS), ahora lista explícita:
```
['image/jpeg', 'image/png', 'image/webp', 'image/gif']
```

### Firebase Firestore rules — validación de campos

`firebase/firestore.rules` — el `allow create` valida estructura, tipos y longitudes:
- `titulo`: string, máximo 200 caracteres
- `mensaje`: string, máximo 1 000 caracteres

> **Nota arquitectónica:** el backend PHP usa la REST API de Firestore con API key (no Admin SDK), por lo que `read` y `create` no pueden requerir `request.auth != null` sin romper las notificaciones.

---

## Mejoras visuales y UX (2026-06-07)

### Sistema de animaciones global (`animations.css` + `animations.js`)

- **Scroll-reveal:** clases `.wh-reveal`, `.wh-reveal-left`, `.wh-reveal-right`, `.wh-reveal-zoom` activadas por `IntersectionObserver` con umbral 0.12.
- **Hover lift:** `.wh-lift` (8 px) y `.wh-lift-sm` (4 px) aplicados automáticamente a tarjetas y botones.
- **Ripple:** `.wh-btn-ripple` en botones de acción.
- **Skeleton loading:** `.wh-skeleton` para estados de carga.
- **Keyframes:** `wh-fade-up`, `wh-fade-in`, `wh-slide-left`, `wh-slide-right`, `wh-zoom-in`, `wh-pulse-border`, `wh-shimmer`, `wh-bounce-in`, `wh-float`.
- Respeta `prefers-reduced-motion`.

### Lightbox de imágenes

Al hacer clic en cualquier imagen con `data-lightbox`:
- Se abre un overlay oscuro con la imagen en tamaño completo.
- **Scroll para zoom** (0.5× a 4×) sobre la imagen.
- Cierre con clic fuera, botón × o tecla Escape.
- Activado en: imágenes del catálogo (`data-lightbox` generado en `catalogo.js`) e imagen principal del detalle de producto (asignado en `mostrarProducto()`).
- Lógica en `event-delegation.js`, CSS en `animations.css`.

### Pago — pasarelas directas

`public/pago.php`: eliminados los cards de selección de método de pago. Las pasarelas de Stripe y PayPal aparecen directamente con cabeceras visuales y logos de tarjetas. Credenciales inyectadas via `<div data-*>` (CSP-safe).

### Solicitudes — diferenciación cotización vs cita

`public/solicitudes.php`: tres tarjetas de decisión al inicio:
- Dorada: "Ya sé lo que quiero → Cotización" (precio sin visita, respuesta en 24 h)
- Azul: "Necesito asesoría presencial → Visita a domicilio" (medición y consejo)
- Verde: "Ya envié una solicitud → Seguimiento"

### Status badges de alta visibilidad

Reemplazado el patrón `background: ${color}30` (19% de opacidad, invisible sobre fondos oscuros) por clases CSS con fondos sólidos y texto claro:

| Clase | Uso |
|-------|-----|
| `.status-pending` / `.st-pendiente` | Pendiente |
| `.status-progress` / `.st-pagado` | Pagado / En proceso |
| `.status-producing` / `.st-en_produccion` | En producción |
| `.status-ready` / `.st-listo` | Listo |
| `.status-completed` / `.st-completada` | Completado / Entregado |
| `.status-cancelled` / `.st-cancelado` | Cancelado |
| `.status-new` / `.st-nueva` | Nueva |
| `.status-replied` / `.st-respondida` | Respondida |
| `.status-active` | Activo (clientes registrados) |

### Menú móvil — items sin recorte

`modal-auth.css`: `.mobile-bottom-nav-inner` con `overflow: hidden`, `.mbn-item` con `max-width: 20%` y text ellipsis. Por debajo de 360 px se ocultan las etiquetas de texto y solo se muestran los íconos.

### Tooltips de ayuda (`.wh-help`)

Agregados en `panel_administrador.php` y `panel_empleado.php` para las KPI cards de "Ventas del Mes", "Pedidos Totales", "Citas Hoy" y "Pedidos Pendientes". CSS de tooltips incluido directamente en los CSS de paneles (no dependen de `styles.css`).

### Inicio simplificado

`public/index.php`: "¿Por qué elegirnos?" reducida de 6 a 3 tarjetas; "Proceso de trabajo" simplificado de 5 a 4 pasos.

---

## Limpieza de código (2026-05-15)

Eliminados comentarios redundantes (WHAT) de todos los archivos del proyecto — JS, PHP, API y plantillas HTML. Se conservaron únicamente: separadores de sección, restricciones de seguridad no obvias, invariantes de concurrencia y comportamientos contraintuitivos de Firebase/navegador.

---

## Correcciones de bugs críticos (v9 — 2026-05-14)

### Bug 1 — Sesión del cliente se cerraba al navegar

**Causa:** `SESSION_IDLE_TIMEOUT` estaba en 120 segundos.

**Corrección (`includes/config.php`):** Cambiado a 900 segundos (15 minutos).

### Bug 2 — Correo de confirmación de pedido se enviaba dos veces

**Causa:** `stripe_confirm` y `stripe_webhook` llegaban casi simultáneamente y ambos enviaban el correo.

**Corrección (`api/pagos.php`):** `UPDATE ... WHERE notificacion_enviada = 0` atómico. Solo el proceso que modifica 1 fila envía el correo. Mismo patrón aplicado a los 4 puntos de notificación.

### Bug 3 — Datos del checkout correspondían a un cliente anterior

**Causa:** `prefillSiLogueado()` no sobreescribía los valores de `localStorage` del cliente anterior.

**Corrección (`public/assets/js/checkout.js`):** Los campos de identidad (nombre, correo, teléfono) siempre se sobreescriben con los datos del cliente autenticado.

### Bugs 4–6 — Contaminación de sesiones entre cliente y empleado

**Causa:** `session_destroy()` destruía ambas sesiones; clave `_login_time` compartida.

**Corrección (`includes/auth.php`):**
- Claves de sesión separadas: `_usuario_login_time` y `_cliente_login_time`.
- Funciones `_destruirSesionCliente()` y `_destruirSesionPersonal()` que eliminan solo sus propias claves.

### Bug 7 — Validación de teléfono en "Mi cuenta" bloqueaba guardado

**Corrección (`public/assets/js/mi-cuenta.js`):** Condición reescrita con precedencia correcta de operadores.

---

## Mejoras de UX y exportación real (v8 — 2026-04-23)

### Exportación real .xlsx en reportes del admin

`exportReportXLSX()` genera un archivo `.xlsx` real con 4 hojas (Resumen, Productos, Cotizaciones, Citas) vía SheetJS 0.20.3.

### Logo clickeable + widget guía flotante "¿Cómo comprar?"

- Logo envuelto en `<a href="/inicio">` en todas las páginas.
- Botón flotante fijo que abre un modal con 4 pasos del proceso de compra (inicio y catálogo).

### Navegación más descriptiva

- "Solicitudes" → **"Cotización y Citas"** con subtítulo.
- Links con atributos `title` en toda la navegación.

### Login simplificado con acceso a registro de clientes

- Removido el checkbox "Recordarme".
- Botón **"Regístrate aquí"** que redirige a `/inicio?registro=1`.
- `AuthModal.openRegistro()` abre el modal directamente en la pestaña de registro.

---

## Correcciones y mejoras (v5 — 2026-03-17)

### Sincronización de datos de contacto al perfil del cliente

Al completar un pedido/cotización/cita, los datos ingresados se guardan en la tabla `clientes` automáticamente.

### Vinculación correcta de `cliente_id`

`credentials: 'same-origin'` agregado a los fetch de POST en `solicitudes.js` para que la cookie de sesión PHP llegue al servidor.

### Badge "Cliente registrado" en paneles

Si el registro tiene `cliente_id`, aparece badge verde en el modal de detalle de cotizaciones y citas.

### Email de confirmación de pago PayPal

Los campos `metodo_pago`, `referencia_pago` y `fecha_pago` se asignan antes de llamar a `notificarNuevoPedido` en el bloque `paypal_capturar`.

---

## Seguridad y correcciones críticas (v7 — 2026-03-27)

### Guardas de acceso server-side en páginas protegidas

- `pago.php` — verifica `$_SESSION['cliente_id']` y `$_SESSION['cliente_email_verified']`.
- `solicitudes.php` — convertida a PHP para validar sesión antes de emitir HTML.

### Timeout de inactividad de sesión (15 minutos)

`SESSION_IDLE_TIMEOUT = 900` + timeout absoluto de 2 horas. `_last_activity` se actualiza en cada petición.

### Cookie de sesión expira al cerrar el navegador

`lifetime = 0` — session cookie, eliminada automáticamente al cerrar el navegador.

### Verificación de correo requerida para agregar al carrito

`agregarAlCarrito()` bloquea si `AuthModal.isAuthenticated() && !AuthModal.isEmailVerified()`.

### Usuario de base de datos con permisos mínimos

```sql
CREATE USER IF NOT EXISTS 'whapp_user'@'%' IDENTIFIED BY 'TuContraseñaSegura123!';
GRANT SELECT, INSERT, UPDATE, DELETE ON wooden_house.* TO 'whapp_user'@'%';
FLUSH PRIVILEGES;
```

---

## Correcciones de responsivo y UX móvil (v6 — 2026-03-27)

### Catálogo — grid corregido

- `> 768 px` — `auto-fill, minmax(260px, 1fr)`
- `≤ 768 px` — `repeat(2, 1fr)`
- `≤ 480 px` — `1fr` columna única

### Barra de navegación móvil reforzada

`position: fixed !important` con `transform: translateZ(0)` en su propia capa de composición.

---

## Mejoras de UX y diseño responsivo (v4 — 2026-03-14)

### Mini-menú de cuenta con logout visible

Al autenticarse, el botón "Mi cuenta" muestra avatar con iniciales + chevron. Click abre un popover con nombre, correo, link "Mi cuenta" y botón "Cerrar sesión".

### Navegación móvil — barra inferior fija

5 íconos fijos en la parte inferior: Inicio, Catálogo, Cotización, Carrito, Mi cuenta. Visible en `≤ 900 px`.

---

## Correcciones de bugs aplicadas (v3 — 2026-03-12)

### Login empleado: 404 en primer intento

**Corrección:** Cookie de sesión sin atributo `domain` en localhost/IP.

### CSS/JS inline

Extraído CSS de `terminos.php` a `terminos.css`. Script de auth de `carrito-checkout.php` movido a `checkout.js`.

---

## Correcciones de Seguridad aplicadas (v2)

### Validación de imágenes reales por magic bytes

`panel_administrador.js` — verificación del tipo MIME y de los primeros 12 bytes antes de subir (JPEG, PNG, WebP, GIF).

### Sanitización de todos los campos de usuario

`solicitudes.js` — `sanitizeName()`, `sanitizeText()`, `sanitizePhone()`, `sanitizeDescription()`.

### CSRF Token y sesiones fantasma

`_destruirSesion()` elimina la cookie `XSRF-TOKEN` y regenera el ID de sesión.

### Campo honeypot anti-bot

Formularios de cotización y cita con campo oculto (`position:absolute; left:-9999px`). Si el campo tiene valor, el backend responde con éxito falso sin guardar nada.

---

## Seguridad — .htaccess

### `/public/.htaccess` — Content Security Policy

`script-src` sin `'unsafe-inline'`. Todos los handlers inline han sido eliminados del código JS.

| Directiva | Dominios clave permitidos |
|-----------|--------------------------|
| `script-src` | gstatic.com, firebaseapp.com, stripe.com, paypal.com, jsdelivr.net, cdnjs |
| `style-src` | `'unsafe-inline'`, fonts.googleapis.com, cdnjs |
| `connect-src` | *.firebaseio.com, **wss://*.firebaseio.com**, firestore.googleapis.com, www.googleapis.com, identitytoolkit.googleapis.com, securetoken.googleapis.com, accounts.google.com, api.stripe.com, api-m.paypal.com |
| `frame-src` | js.stripe.com, paypal.com, woodenhouse-898de.firebaseapp.com, accounts.google.com |
| `img-src` | firebasestorage.googleapis.com, paypalobjects.com, blob:, data: |
| `worker-src` | 'self' blob: |

> **`wss://*.firebaseio.com`** es crítico para que Firestore Realtime funcione (WebSocket).
> **`woodenhouse-898de.firebaseapp.com`** en `frame-src` y `script-src` es requerido por Firebase Auth.

### `/.htaccess` — Raíz del proyecto

- HTTPS redirect con detección de proxy (`X-Forwarded-Proto`) para evitar loops en servidores con SSL termination.
- Bloquea acceso a: `includes/`, `database/`, `logs/`, `firebase/`, `.git/`.

---

## Funcionalidades implementadas

### Frontend público
- Página de inicio: hero, 3 razones, 4 pasos del proceso, proyectos y FAQ
- Catálogo con filtro por categoría, búsqueda en tiempo real, ordenamiento y **lightbox de zoom** en imágenes
- Detalle de producto con galería (thumbnails sin onclick), especificaciones en tabs, selector de cantidad, **zoom de imagen principal** y productos relacionados
- Carrito con selector de semanas de entrega basado en disponibilidad real de la API
- Proceso de pago: Stripe Elements (tarjeta) + PayPal Smart Buttons, pasarelas mostradas directamente
- Seguimiento de pedidos/cotizaciones/citas por token sin necesidad de login
- Formularios de cotización y cita diferenciados con tarjetas de decisión guía

### Sistema de cuentas de cliente
- Registro e inicio de sesión con Firebase Auth (modular SDK v10, dynamic import)
- **Verificación de correo** con polling automático cada 4 s; banner persistente hasta confirmar
- Modal de autenticación contextual con event listeners (100% CSP-compatible, sin handlers inline)
- **Sugerencia de login no bloqueante** en solicitudes y carrito
- Portal "Mi Cuenta": historial de pedidos, perfil editable, estadísticas
- Vinculación automática de pedidos/cotizaciones/citas a la cuenta

### Panel Administrador *(auto-polling 30s)*
- Dashboard con KPIs, gráficas de ventas/estados y 8 acciones rápidas
- Gestión completa de pedidos, cotizaciones y citas con status badges de alta visibilidad
- Gestión de productos (CRUD + galería Firebase Storage + especificaciones)
- Gestión de empleados (Firebase Auth + MySQL)
- Reportes avanzados exportables a `.xlsx` real (SheetJS) y PDF
- Clientes registrados: historial, total gastado, pedidos y cotizaciones
- **Ofertas & Marketing:** CRUD de descuentos y cupones con vigencia y usos máximos

### Panel Empleado *(auto-polling 30s)*
- Vista de pedidos con timeline de 4 etapas
- Citas y cotizaciones con cambio de estado inline
- Calendario interactivo sincronizado con la API
- Notificaciones en tiempo real desde Firestore

### Sistema de notificaciones
- Escritura en Firestore al crear pedidos/cotizaciones/citas
- Listener en tiempo real en los paneles (sin recarga)
- Email automático al admin vía SMTP PHP
- Cloud Function `onNuevaNotificacion` como sistema complementario

### Seguridad
- `script-src` sin `'unsafe-inline'` — toda ejecución inline bloqueada por CSP
- HTTPS forzado con detección de proxy/CDN (`X-Forwarded-Proto`)
- Rate limiting: 3–5 intentos por 15 min en autenticación, 5/min en formularios públicos
- Tokens JWT de Firebase verificados en cada llamada a la API PHP
- Headers de seguridad HTTP completos (CSP, HSTS, X-Frame-Options, etc.)
- Firestore Rules con validación de estructura, tipos y longitudes
- Storage Rules con lista explícita de MIME types (sin SVG)
- Validación de URLs de imágenes: solo HTTPS + hosts de Firebase Storage en lista blanca
- Validación de imágenes por magic bytes en el panel administrador
- Sanitización completa de campos en JS y PHP
- Campo honeypot anti-bot en formularios públicos
- Session timeout absoluto (2h) y por inactividad (15 min)
- Usuario de BD con permisos mínimos (SELECT/INSERT/UPDATE/DELETE únicamente)

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
- El carrito persiste en `sessionStorage` con la clave `wh_carrito`
- Los paneles de admin y empleado requieren sesión activa de Firebase Auth
- **Los clientes usan la misma Firebase Auth** pero se almacenan en tabla `clientes`, no en `usuarios_personal`
- Las sesiones PHP distinguen entre personal (`usuario_id`, `usuario_rol`) y clientes (`cliente_id`, `cliente_rol`)
- `AuthModal.open(callback)` — abre el modal de auth desde cualquier página; `AuthModal.openRegistro()` lo abre en la pestaña de registro
- `event-delegation.js` maneja todos los eventos del sitio via `data-*` attributes — incluir en toda página nueva
- `animations.js` aplica automáticamente clases de reveal a tarjetas y botones via `IntersectionObserver`
- La sección "Proyectos Realizados" del index está hardcodeada en `index.php`
- Los logs del servidor se guardan en `logs/` (ignorado en `.gitignore`)
- El `firebase/` completo está **fuera de `public/`** — no es accesible desde el navegador
