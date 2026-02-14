# Wooden House
## CAMBIOS REALIZADOS
### 1. Separación Completa HTML/CSS/JS

**ANTES (No cumplía):**
- ❌ CSS embebido en HTML (800+ líneas por archivo)
- ❌ JavaScript embebido en HTML (50+ líneas)
- ❌ Difícil mantenimiento
- ❌ Código duplicado

**AHORA (Cumple 100%):**
- ✅ CSS en archivos separados (`assets/css/`)
- ✅ JavaScript en archivos separados (`assets/js/`)
- ✅ Fácil mantenimiento
- ✅ Código reutilizable

### 2. Archivos Creados

**CSS Globales:**
- `assets/css/_variables.css` - Variables CSS (colores, fuentes)
- `assets/css/styles.css` - Estilos compartidos (header, footer)

**CSS Específicos:**
- `assets/css/index.css` - Página de inicio
- `assets/css/catalogo.css` - Catálogo de productos
- `assets/css/carrito.css` - Carrito de compras
- `assets/css/pago.css` - Proceso de pago
- `assets/css/solicitudes.css` - Cotizaciones/Citas
- `assets/css/login.css` - Autenticación
- `assets/css/panel_administrador.css` - Panel admin
- `assets/css/panel_empleado.css` - Panel empleado
- `assets/css/detalle_producto.css` - Detalle de productos

**JavaScript:**
- `assets/js/app.js`
- `assets/js/utils.js` 
- `assets/js/index.js`
- `assets/js/catalogo.js`
- `assets/js/carrito.js`
- `assets/js/pago.js`
- `assets/js/solicitudes.js`
- `assets/js/login.js`
- `assets/js/panel_administrador.js`
- `assets/js/panel_empleado.js`
- `assets/js/firebase-config.js`

### 3. Estructura Final

```
public/
├── index.html (limpio, sin CSS/JS embebido)
├── catalogo.html
├── carrito.html
├── pago.html
├── solicitudes.html
├── login.html
├── admin/
│   └── panel_administrador.html
├── empleado/
│   └── panel_empleado.html
└── assets/
    ├── css/ (11 archivos CSS)
    └── js/ (12 archivos JS)
```

## 📦 Archivos para Entregar

1. **Carpeta completa:** `Wooden House/`
2. **Documento:** `CUMPLIMIENTO_CRITERIOS.md`
3. **Base de datos:** `database/schema.sql` y `database/seed.sql`

## 🚀 Cómo Usar

```bash
# Con Docker
docker-compose up -d

# Manual
# 1. Configurar servidor web
# 2. Importar BD
# 3. Configurar .env
# 4. Acceder a http://localhost
```

**Proyecto listo para evaluación ✅**
