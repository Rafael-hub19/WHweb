/**
 * catalogo.js - Funcionalidad del Catálogo de Productos
 * Wooden House E-commerce
 */

let productos = [];
let categorias = [];
let filtroActual = {
  categoria: null,
  busqueda: '',
  ordenar: 'recientes'
};

const API_URL = '/api';

/**
 * Inicializar catálogo
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('📦 Catálogo Iniciado');
  
  await cargarCategorias();
  await cargarProductos();
  
  inicializarFiltros();
  inicializarBusqueda();
});

/**
 * Cargar categorías desde la API
 */
async function cargarCategorias() {
  try {
    const response = await fetch(`${API_URL}/catalogo/categorias_listar.php`);
    const data = await response.json();
    
    if (data.success) {
      categorias = data.categorias || [];
      renderizarCategorias();
    }
  } catch (error) {
    console.error('Error al cargar categorías:', error);
    showNotification('❌ Error al cargar categorías', 'error');
  }
}

/**
 * Cargar productos desde la API
 */
async function cargarProductos() {
  const loader = showLoader('Cargando productos...');
  
  try {
    let url = `${API_URL}/catalogo/productos_listar.php?activo=1`;
    
    // Agregar filtro de categoría si existe
    if (filtroActual.categoria) {
      url += `&categoria_id=${filtroActual.categoria}`;
    }
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success) {
      productos = data.productos || [];
      aplicarFiltrosLocales();
      renderizarProductos();
    } else {
      showNotification('❌ Error al cargar productos', 'error');
    }
    
  } catch (error) {
    console.error('Error al cargar productos:', error);
    showNotification('❌ Error de conexión', 'error');
  } finally {
    hideLoader();
  }
}

/**
 * Renderizar categorías
 */
function renderizarCategorias() {
  const container = document.getElementById('categorias-filtro');
  
  if (!container) return;
  
  container.innerHTML = `
    <button 
      class="categoria-btn ${!filtroActual.categoria ? 'active' : ''}" 
      onclick="filtrarPorCategoria(null)"
    >
      Todas
    </button>
    ${categorias.map(cat => `
      <button 
        class="categoria-btn ${filtroActual.categoria === cat.id ? 'active' : ''}" 
        onclick="filtrarPorCategoria(${cat.id})"
      >
        ${cat.nombre}
      </button>
    `).join('')}
  `;
}

/**
 * Renderizar productos
 */
function renderizarProductos() {
  const container = document.getElementById('productos-grid');
  
  if (!container) return;
  
  if (productos.length === 0) {
    container.innerHTML = `
      <div class="no-productos">
        <p>📦 No se encontraron productos</p>
        <button onclick="limpiarFiltros()" class="btn-secondary">Limpiar filtros</button>
      </div>
    `;
    return;
  }
  
  container.innerHTML = productos.map(producto => `
    <div class="producto-card">
      <div class="producto-imagen">
        ${producto.imagen_principal 
          ? `<img src="${producto.imagen_principal}" alt="${producto.nombre}" loading="lazy">`
          : '<div class="placeholder-imagen">📦</div>'
        }
        ${producto.stock_disponible <= 0 
          ? '<div class="badge-agotado">Agotado</div>'
          : producto.stock_disponible < 5
            ? '<div class="badge-pocas">¡Pocas unidades!</div>'
            : ''
        }
      </div>
      
      <div class="producto-info">
        <h3>${producto.nombre}</h3>
        <p class="producto-descripcion">${producto.descripcion_corta || ''}</p>
        
        <div class="producto-footer">
          <p class="producto-precio">${formatCurrency(producto.precio)}</p>
          
          ${producto.stock_disponible > 0 
            ? `<button 
                class="btn-agregar" 
                onclick="agregarAlCarritoDesdeCard(${producto.id}, '${producto.nombre.replace(/'/g, "\\'")}', ${producto.precio}, '${producto.imagen_principal || ''}')"
              >
                Agregar 🛒
              </button>`
            : '<button class="btn-agotado" disabled>Agotado</button>'
          }
        </div>
        
        <a href="detalle_producto.html?id=${producto.id}" class="btn-ver-detalle">
          Ver detalles
        </a>
      </div>
    </div>
  `).join('');
  
  // Actualizar contador
  const contador = document.getElementById('productos-count');
  if (contador) {
    contador.textContent = `${productos.length} producto${productos.length !== 1 ? 's' : ''}`;
  }
}

/**
 * Filtrar por categoría
 */
async function filtrarPorCategoria(categoriaId) {
  filtroActual.categoria = categoriaId;
  
  // Actualizar botones
  document.querySelectorAll('.categoria-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');
  
  await cargarProductos();
}

/**
 * Inicializar filtros
 */
function inicializarFiltros() {
  const selectOrden = document.getElementById('ordenar-por');
  
  if (selectOrden) {
    selectOrden.addEventListener('change', (e) => {
      filtroActual.ordenar = e.target.value;
      aplicarFiltrosLocales();
      renderizarProductos();
    });
  }
}

/**
 * Inicializar búsqueda
 */
function inicializarBusqueda() {
  const inputBusqueda = document.getElementById('buscar-producto');
  const btnBuscar = document.getElementById('btn-buscar');
  
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', debounce((e) => {
      filtroActual.busqueda = e.target.value.toLowerCase();
      aplicarFiltrosLocales();
      renderizarProductos();
    }, 300));
  }
  
  if (btnBuscar) {
    btnBuscar.addEventListener('click', () => {
      filtroActual.busqueda = inputBusqueda.value.toLowerCase();
      aplicarFiltrosLocales();
      renderizarProductos();
    });
  }
}

/**
 * Aplicar filtros locales (búsqueda y ordenamiento)
 */
function aplicarFiltrosLocales() {
  let productosFiltrados = [...productos];
  
  // Filtro de búsqueda
  if (filtroActual.busqueda) {
    productosFiltrados = productosFiltrados.filter(p => 
      p.nombre.toLowerCase().includes(filtroActual.busqueda) ||
      (p.descripcion_corta && p.descripcion_corta.toLowerCase().includes(filtroActual.busqueda))
    );
  }
  
  // Ordenamiento
  switch (filtroActual.ordenar) {
    case 'precio-asc':
      productosFiltrados.sort((a, b) => a.precio - b.precio);
      break;
    case 'precio-desc':
      productosFiltrados.sort((a, b) => b.precio - a.precio);
      break;
    case 'nombre':
      productosFiltrados.sort((a, b) => a.nombre.localeCompare(b.nombre));
      break;
    case 'recientes':
    default:
      // Dejar en orden de la API (más recientes primero)
      break;
  }
  
  productos = productosFiltrados;
}

/**
 * Limpiar filtros
 */
function limpiarFiltros() {
  filtroActual = {
    categoria: null,
    busqueda: '',
    ordenar: 'recientes'
  };
  
  const inputBusqueda = document.getElementById('buscar-producto');
  const selectOrden = document.getElementById('ordenar-por');
  
  if (inputBusqueda) inputBusqueda.value = '';
  if (selectOrden) selectOrden.value = 'recientes';
  
  cargarProductos();
}

/**
 * Agregar producto al carrito desde card
 */
function agregarAlCarritoDesdeCard(id, nombre, precio, imagen) {
  // Usar función global de app.js si existe
  if (typeof agregarAlCarrito === 'function') {
    agregarAlCarrito({
      id: id,
      nombre: nombre,
      precio: precio,
      imagen: imagen,
      cantidad: 1
    });
  } else {
    // Fallback: guardar en localStorage directamente
    try {
      const carrito = JSON.parse(localStorage.getItem('wh_carrito') || '[]');
      
      const existente = carrito.find(item => item.id === id);
      
      if (existente) {
        existente.cantidad += 1;
      } else {
        carrito.push({
          id: id,
          nombre: nombre,
          precio: precio,
          imagen: imagen,
          cantidad: 1
        });
      }
      
      localStorage.setItem('wh_carrito', JSON.stringify(carrito));
      
      // Actualizar badge
      const count = carrito.reduce((total, item) => total + item.cantidad, 0);
      const badge = document.querySelector('.cart-badge');
      if (badge) {
        badge.textContent = count;
        badge.style.display = 'inline-block';
      }
      
      showNotification(`✅ ${nombre} agregado al carrito`, 'success');
      
    } catch (error) {
      console.error('Error:', error);
      showNotification('❌ Error al agregar al carrito', 'error');
    }
  }
}

// Exponer funciones globalmente
window.filtrarPorCategoria = filtrarPorCategoria;
window.limpiarFiltros = limpiarFiltros;
window.agregarAlCarritoDesdeCard = agregarAlCarritoDesdeCard;

console.log('✅ Catalogo.js cargado');
