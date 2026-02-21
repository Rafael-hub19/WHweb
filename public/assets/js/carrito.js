let carritoItems = [];
let carritoTotal = 0;

/**
 * Inicializar página del carrito
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('[CARRITO] Carrito de Compras Iniciado');
  
  initMenuHamburguesa();
  cargarCarrito();
  renderizarCarrito();
  actualizarResumen();
  
  // Event listeners
  const btnVaciar = document.getElementById('btn-vaciar-carrito');
  const btnContinuar = document.getElementById('btn-continuar-comprando');
  const btnProceder = document.getElementById('btn-proceder-pago');
  
  if (btnVaciar) {
    btnVaciar.addEventListener('click', confirmarVaciarCarrito);
  }
  
  if (btnContinuar) {
    btnContinuar.addEventListener('click', () => {
      window.location.href = '/catalogo';
    });
  }
  
  if (btnProceder) {
    btnProceder.addEventListener('click', procederAlPago);
  }
});

/**
 * Cargar carrito desde localStorage
 */
function cargarCarrito() {
  try {
    const carritoGuardado = localStorage.getItem('wh_carrito');
    if (carritoGuardado) {
      carritoItems = JSON.parse(carritoGuardado);
    } else {
      carritoItems = [];
    }
  } catch (error) {
    console.error('Error al cargar carrito:', error);
    carritoItems = [];
  }
}

/**
 * Guardar carrito en localStorage
 */
function guardarCarrito() {
  try {
    localStorage.setItem('wh_carrito', JSON.stringify(carritoItems));
    
    // Actualizar badge del header
    if (typeof updateCartBadge === 'function') {
      const count = carritoItems.reduce((total, item) => total + item.cantidad, 0);
      updateCartBadge(count);
    }
  } catch (error) {
    console.error('Error al guardar carrito:', error);
  }
}

/**
 * Renderizar items del carrito
 */
function renderizarCarrito() {
  const container = document.getElementById('carrito-items');
  
  if (!container) return;
  
  if (carritoItems.length === 0) {
    container.innerHTML = `
      <div class="carrito-vacio">
        <div class="empty-cart-icon"><i class="fa-solid fa-cart-shopping"></i></div>
        <h3>Tu carrito está vacío</h3>
        <p>Agrega productos desde nuestro catálogo</p>
        <a href="/catalogo" class="btn-primary">Ver Catálogo</a>
      </div>
    `;
    
    // Ocultar botones de acción
    const accionesEl = document.getElementById('carrito-acciones');
    const resumenEl  = document.getElementById('carrito-resumen');
    if (accionesEl) accionesEl.style.display = 'none';
    if (resumenEl)  resumenEl.style.display  = 'none';
    
    return;
  }
  
  // Mostrar botones de acción
  const accionesEl = document.getElementById('carrito-acciones');
  const resumenEl  = document.getElementById('carrito-resumen');
  if (accionesEl) accionesEl.style.display = 'flex';
  if (resumenEl)  resumenEl.style.display  = 'block';
  
  container.innerHTML = carritoItems.map((item, index) => `
    <div class="carrito-item" data-producto-id="${item.id}">
      <div class="item-imagen">
        ${item.imagen 
          ? `<img src="${item.imagen}" alt="${item.nombre}">`
          : '<div class="placeholder-imagen"><i class="fa-solid fa-box"></i></div>'
        }
      </div>
      
      <div class="item-info">
        <h3>${item.nombre}</h3>
        <p class="item-precio">${formatCurrency(item.precio)} c/u</p>
      </div>
      
      <div class="item-cantidad">
        <button class="btn-cantidad" onclick="cambiarCantidad(${item.id}, -1)">-</button>
        <input 
          type="number" 
          value="${item.cantidad}" 
          min="1" 
          max="99"
          onchange="actualizarCantidad(${item.id}, this.value)"
        >
        <button class="btn-cantidad" onclick="cambiarCantidad(${item.id}, 1)">+</button>
      </div>
      
      <div class="item-subtotal">
        <p class="subtotal-label">Subtotal:</p>
        <p class="subtotal-precio">${formatCurrency(item.precio * item.cantidad)}</p>
      </div>
      
      <button class="btn-eliminar" onclick="eliminarItem(${item.id})" title="Eliminar">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

/**
 * Actualizar resumen del carrito
 */
function actualizarResumen() {
  // Calcular totales
  const subtotal = carritoItems.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  const envio = subtotal > 5000 ? 0 : 200; // Envío gratis en compras mayores a $5000
  const total = subtotal + envio;
  
  carritoTotal = total;
  
  // Actualizar DOM
  const subtotalEl = document.getElementById('resumen-subtotal');
  const envioEl = document.getElementById('resumen-envio');
  const totalEl = document.getElementById('resumen-total');
  
  if (subtotalEl) subtotalEl.textContent = formatCurrency(subtotal);
  if (envioEl) {
    envioEl.textContent = envio === 0 ? 'GRATIS' : formatCurrency(envio);
  }
  if (totalEl) totalEl.textContent = formatCurrency(total);
  
  // Mensaje de envío gratis
  if (subtotal > 0 && subtotal < 5000) {
    const faltante = 5000 - subtotal;
    const mensajeEnvio = document.getElementById('mensaje-envio');
    if (mensajeEnvio) {
      mensajeEnvio.innerHTML = `
        <i class="fa-solid fa-lightbulb"></i> Agrega ${formatCurrency(faltante)} más para obtener <strong>envío GRATIS</strong>
      `;
      mensajeEnvio.style.display = 'block';
    }
  } else if (subtotal >= 5000) {
    const mensajeEnvio = document.getElementById('mensaje-envio');
    if (mensajeEnvio) {
      mensajeEnvio.innerHTML = `
        <i class="fa-solid fa-circle-check"></i> ¡Felicidades! Tienes <strong>envío GRATIS</strong>
      `;
      mensajeEnvio.style.display = 'block';
    }
  }
}

/**
 * Cambiar cantidad de un item (+ o -)
 */
function cambiarCantidad(productoId, delta) {
  const item = carritoItems.find(i => i.id === productoId);
  
  if (item) {
    const nuevaCantidad = item.cantidad + delta;
    
    if (nuevaCantidad > 0 && nuevaCantidad <= 99) {
      item.cantidad = nuevaCantidad;
      guardarCarrito();
      renderizarCarrito();
      actualizarResumen();
    } else if (nuevaCantidad <= 0) {
      eliminarItem(productoId);
    }
  }
}

/**
 * Actualizar cantidad manualmente
 */
function actualizarCantidad(productoId, valor) {
  const cantidad = parseInt(valor);
  
  if (isNaN(cantidad) || cantidad < 1) {
    showNotification('<i class="fa-solid fa-xmark"></i> Cantidad inválida', 'error');
    renderizarCarrito();
    return;
  }
  
  if (cantidad > 99) {
    showNotification('<i class="fa-solid fa-xmark"></i> Cantidad máxima: 99', 'error');
    renderizarCarrito();
    return;
  }
  
  const item = carritoItems.find(i => i.id === productoId);
  
  if (item) {
    item.cantidad = cantidad;
    guardarCarrito();
    renderizarCarrito();
    actualizarResumen();
  }
}

/**
 * Eliminar item del carrito
 */
function eliminarItem(productoId) {
  const item = carritoItems.find(i => i.id === productoId);
  
  if (!item) return;
  
  if (confirm(`¿Eliminar "${item.nombre}" del carrito?`)) {
    carritoItems = carritoItems.filter(i => i.id !== productoId);
    guardarCarrito();
    renderizarCarrito();
    actualizarResumen();
    
    showNotification('<i class="fa-solid fa-trash"></i> Producto eliminado', 'info');
  }
}

/**
 * Confirmar y vaciar carrito
 */
function confirmarVaciarCarrito() {
  if (carritoItems.length === 0) {
    showNotification('[INFO] El carrito ya está vacío', 'info');
    return;
  }
  
  if (confirm('¿Estás seguro de vaciar el carrito? Esta acción no se puede deshacer.')) {
    carritoItems = [];
    guardarCarrito();
    renderizarCarrito();
    actualizarResumen();
    
    showNotification('<i class="fa-solid fa-trash"></i> Carrito vaciado', 'success');
  }
}

/**
 * Proceder al pago
 */
async function procederAlPago() {
  if (carritoItems.length === 0) {
    showNotification('<i class="fa-solid fa-xmark"></i> El carrito está vacío', 'error');
    return;
  }
  
  // Validar stock antes de proceder (opcional)
  const loader = showLoader('Verificando disponibilidad...');
  
  try {
    // Aquí podrías hacer una validación del stock con la API
    // const response = await fetch('/api/carrito/validar.php', {...});
    
    // Simular delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    hideLoader();
    
    // Redirigir a checkout
    window.location.href = '/pago';
    
  } catch (error) {
    hideLoader();
    console.error('Error:', error);
    showNotification('<i class="fa-solid fa-xmark"></i> Error al procesar. Intenta nuevamente.', 'error');
  }
}

/**
 * Obtener datos del carrito para checkout
 */
function obtenerDatosCarrito() {
  const subtotal = carritoItems.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  const envio = subtotal > 5000 ? 0 : 200;
  const total = subtotal + envio;
  
  return {
    items: carritoItems,
    subtotal: subtotal,
    envio: envio,
    total: total,
    count: carritoItems.reduce((total, item) => total + item.cantidad, 0)
  };
}

// Exponer funciones globalmente
window.cambiarCantidad = cambiarCantidad;
window.actualizarCantidad = actualizarCantidad;
window.eliminarItem = eliminarItem;
window.obtenerDatosCarrito = obtenerDatosCarrito;

console.log('[OK] Carrito.js cargado');

// ── Menú hamburguesa ─────────────────────────────────────────────
function initMenuHamburguesa() {
  const menuToggle = document.getElementById("menuToggle");
  const navLinks   = document.getElementById("navLinks");
  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener("click", function (e) {
    e.preventDefault();
    e.stopPropagation();
    navLinks.classList.toggle("open");
    const isOpen = navLinks.classList.contains("open");
    menuToggle.setAttribute("aria-expanded", isOpen);
  });

  // Cerrar al hacer click fuera
  document.addEventListener("click", function (e) {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove("open");
      menuToggle.setAttribute("aria-expanded", "false");
    }
  });
}