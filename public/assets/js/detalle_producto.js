// ================================================
// VARIABLES GLOBALES
// ================================================
let productoActual = null;
let imagenActualIndex = 0;

// ================================================
// INICIALIZACIÓN
// ================================================
document.addEventListener('DOMContentLoaded', function() {
  initMenuHamburguesa();
  initCartBadge();
  initTabs();
  initCantidadControls();
  initAgregarCarrito();
  cargarProducto();
});

// ================================================
// MENÚ HAMBURGUESA (CRITICAL)
// ================================================
function initMenuHamburguesa() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });

    // Cerrar al click fuera
    document.addEventListener('click', function(e) {
      if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// ================================================
// BADGE DEL CARRITO
// ================================================
function initCartBadge() {
  const cartBadge = document.getElementById('cartCount');
  if (!cartBadge) return;

  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 0), 0);
  
  cartBadge.textContent = totalItems;
  cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
}

// ================================================
// TABS (CRITICAL - FALTABA COMPLETAMENTE)
// ================================================
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-pane');

  console.log('Tabs encontrados:', tabButtons.length);

  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      console.log('Tab clickeado:', targetTab);

      // Remover active de todos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Activar el clickeado
      this.classList.add('active');
      const targetContent = document.getElementById(targetTab);
      if (targetContent) {
        targetContent.classList.add('active');
        console.log('Tab activado:', targetTab);
      }
    });
  });
}

// ================================================
// CONTROLES DE CANTIDAD
// ================================================
function initCantidadControls() {
  const btnMenos = document.querySelector('.btn-cantidad-menos');
  const btnMas = document.querySelector('.btn-cantidad-mas');
  const inputCantidad = document.getElementById('cantidad');

  if (btnMenos && inputCantidad) {
    btnMenos.addEventListener('click', function() {
      let cantidad = parseInt(inputCantidad.value) || 1;
      if (cantidad > 1) {
        inputCantidad.value = cantidad - 1;
      }
    });
  }

  if (btnMas && inputCantidad) {
    btnMas.addEventListener('click', function() {
      let cantidad = parseInt(inputCantidad.value) || 1;
      const stock = productoActual?.stock_disponible || 100;
      if (cantidad < stock) {
        inputCantidad.value = cantidad + 1;
      }
    });
  }

  if (inputCantidad) {
    inputCantidad.addEventListener('change', function() {
      let valor = parseInt(this.value) || 1;
      const stock = productoActual?.stock_disponible || 100;
      
      if (valor < 1) valor = 1;
      if (valor > stock) valor = stock;
      
      this.value = valor;
    });
  }
}

// ================================================
// CARGAR PRODUCTO
// ================================================
async function cargarProducto() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');

  if (!productId) {
    mostrarError('No se especificó un producto');
    return;
  }

  try {
    // Datos de ejemplo (reemplazar con API real)
    productoActual = {
      id: productId,
      nombre: 'Mueble de Baño Milano Premium',
      precio: 8500,
      descripcion: 'Mueble de baño premium con acabados de lujo',
      stock_disponible: 5,
      categoria: 'Baño',
      imagenes: [
        'https://via.placeholder.com/600x400/8b7355/ffffff?text=Vista+1',
        'https://via.placeholder.com/600x400/8b7355/ffffff?text=Vista+2',
        'https://via.placeholder.com/600x400/8b7355/ffffff?text=Vista+3'
      ],
      especificaciones: [
        { nombre: 'Material', valor: 'MDF enchapado' },
        { nombre: 'Dimensiones', valor: '120 x 45 x 85 cm' },
        { nombre: 'Acabado', valor: 'Blanco mate' },
        { nombre: 'Incluye', valor: 'Lavabo de cerámica' }
      ],
      resenas: [
        {
          autor: 'María González',
          calificacion: 5,
          comentario: 'Excelente calidad, muy satisfecha',
          fecha: '2025-01-15'
        }
      ]
    };

    renderProducto();
    renderEspecificaciones();
    renderResenas();

  } catch (error) {
    console.error('Error:', error);
    mostrarError('Error al cargar el producto');
  }
}

// ================================================
// RENDER PRODUCTO
// ================================================
function renderProducto() {
  if (!productoActual) return;

  // Nombre
  const nombreElement = document.getElementById('producto-nombre');
  if (nombreElement) nombreElement.textContent = productoActual.nombre;

  // Precio
  const precioElement = document.getElementById('producto-precio');
  if (precioElement) {
    precioElement.textContent = formatCurrency(productoActual.precio);
  }

  // Descripción
  const descElement = document.getElementById('producto-descripcion');
  if (descElement) descElement.textContent = productoActual.descripcion;

  // Stock
  const stockElement = document.getElementById('producto-stock');
  if (stockElement) {
    stockElement.textContent = `Stock disponible: ${productoActual.stock_disponible} unidades`;
  }

  // Imagen principal
  const imgElement = document.getElementById('imagen-principal');
  if (imgElement && productoActual.imagenes && productoActual.imagenes.length > 0) {
    imgElement.src = productoActual.imagenes[0];
    imgElement.alt = productoActual.nombre;
  }

  // Miniaturas
  renderMiniaturas();
}

// ================================================
// RENDER MINIATURAS
// ================================================
function renderMiniaturas() {
  const container = document.getElementById('imagenes-miniaturas');
  if (!container || !productoActual.imagenes) return;

  container.innerHTML = '';
  
  productoActual.imagenes.forEach((url, index) => {
    const miniatura = document.createElement('img');
    miniatura.src = url;
    miniatura.alt = `Vista ${index + 1}`;
    miniatura.className = 'miniatura' + (index === 0 ? ' active' : '');
    miniatura.onclick = () => cambiarImagen(index);
    container.appendChild(miniatura);
  });
}

function cambiarImagen(index) {
  imagenActualIndex = index;
  const imgPrincipal = document.getElementById('imagen-principal');
  
  if (imgPrincipal && productoActual.imagenes[index]) {
    imgPrincipal.src = productoActual.imagenes[index];
  }

  // Actualizar miniaturas activas
  document.querySelectorAll('.miniatura').forEach((mini, i) => {
    mini.classList.toggle('active', i === index);
  });
}

// ================================================
// RENDER ESPECIFICACIONES
// ================================================
function renderEspecificaciones() {
  const container = document.getElementById('especificaciones-lista');
  if (!container || !productoActual.especificaciones) return;

  container.innerHTML = productoActual.especificaciones.map(spec => `
    <div class="especificacion-item">
      <strong>${spec.nombre}:</strong> ${spec.valor}
    </div>
  `).join('');
}

// ================================================
// RENDER RESEÑAS
// ================================================
function renderResenas() {
  const container = document.getElementById('resenas-lista');
  if (!container || !productoActual.resenas) return;

  if (productoActual.resenas.length === 0) {
    container.innerHTML = '<p>Aún no hay reseñas para este producto.</p>';
    return;
  }

  container.innerHTML = productoActual.resenas.map(resena => `
    <div class="resena-item">
      <div class="resena-header">
        <strong>${resena.autor}</strong>
        <span class="estrellas">${'⭐'.repeat(resena.calificacion)}</span>
      </div>
      <p>${resena.comentario}</p>
      <small>${formatDate(resena.fecha)}</small>
    </div>
  `).join('');
}

// ================================================
// AGREGAR AL CARRITO
// ================================================
function initAgregarCarrito() {
  const btnAgregar = document.getElementById('btn-agregar-carrito');
  if (!btnAgregar) return;

  btnAgregar.addEventListener('click', function() {
    if (!productoActual) {
      alert('Error: Producto no cargado');
      return;
    }

    const cantidad = parseInt(document.getElementById('cantidad')?.value || 1);
    
    // Obtener carrito actual
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    
    // Buscar si ya existe
    const existente = carrito.find(item => item.id === productoActual.id);
    
    if (existente) {
      existente.cantidad += cantidad;
    } else {
      carrito.push({
        id: productoActual.id,
        nombre: productoActual.nombre,
        precio: productoActual.precio,
        cantidad: cantidad,
        imagen: productoActual.imagenes?.[0] || ''
      });
    }

    // Guardar
    localStorage.setItem('carrito', JSON.stringify(carrito));
    
    // Actualizar badge
    initCartBadge();
    
    // Mostrar mensaje
    mostrarMensaje('✅ Producto agregado al carrito', 'success');
    
    // Opcional: redirigir al carrito
    // setTimeout(() => window.location.href = 'carrito.html', 1000);
  });
}

// ================================================
// HELPERS
// ================================================
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(date);
}

function mostrarMensaje(mensaje, tipo = 'info') {
  // Crear elemento de alerta
  const alert = document.createElement('div');
  alert.className = `alert alert-${tipo}`;
  alert.textContent = mensaje;
  alert.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${tipo === 'success' ? '#4caf50' : '#f44336'};
    color: white;
    border-radius: 8px;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `;
  
  document.body.appendChild(alert);
  
  setTimeout(() => {
    alert.remove();
  }, 3000);
}

function mostrarError(mensaje) {
  mostrarMensaje(mensaje, 'error');
}

console.log('✅ detalle_producto.js cargado correctamente');
