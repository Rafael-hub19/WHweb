// Configuración de la API
const API_BASE_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost/api'
  : '/api';

// Estado global de la aplicación
const AppState = {
  usuario: null,
  carrito: [],
  carritoTotal: 0,
  carritoCount: 0
};

/**
 * Inicializar aplicación cuando carga el DOM
 */
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 Wooden House App Iniciada');
  
  // Cargar estado del carrito desde localStorage
  cargarCarritoDesdeStorage();
  
  // Actualizar badge del carrito
  actualizarBadgeCarrito();
  
  // Verificar sesión de usuario
  verificarSesion();
  
  // Inicializar menú móvil si existe
  inicializarMenuMovil();
});

/**
 * Cargar carrito desde localStorage
 */
function cargarCarritoDesdeStorage() {
  try {
    const carritoGuardado = localStorage.getItem('wh_carrito');
    if (carritoGuardado) {
      AppState.carrito = JSON.parse(carritoGuardado);
      calcularTotalesCarrito();
    }
  } catch (error) {
    console.error('Error al cargar carrito:', error);
    AppState.carrito = [];
  }
}

/**
 * Guardar carrito en localStorage
 */
function guardarCarritoEnStorage() {
  try {
    localStorage.setItem('wh_carrito', JSON.stringify(AppState.carrito));
  } catch (error) {
    console.error('Error al guardar carrito:', error);
  }
}

/**
 * Calcular totales del carrito
 */
function calcularTotalesCarrito() {
  AppState.carritoCount = AppState.carrito.reduce((total, item) => total + item.cantidad, 0);
  AppState.carritoTotal = AppState.carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
}

/**
 * Actualizar badge del carrito en el header
 */
function actualizarBadgeCarrito() {
  const badge = document.getElementById('cartCount') || document.querySelector('.cart-badge');
  if (badge) {
    badge.textContent = AppState.carritoCount;
    badge.style.display = AppState.carritoCount > 0 ? 'inline-block' : 'none';
  }
}

/**
 * Agregar producto al carrito
 */
function agregarAlCarrito(producto) {
  // Verificar si el producto ya está en el carrito
  const existente = AppState.carrito.find(item => item.id === producto.id);
  
  if (existente) {
    existente.cantidad += producto.cantidad || 1;
  } else {
    AppState.carrito.push({
      id: producto.id,
      nombre: producto.nombre,
      precio: producto.precio,
      cantidad: producto.cantidad || 1,
      imagen: producto.imagen || null
    });
  }
  
  calcularTotalesCarrito();
  guardarCarritoEnStorage();
  actualizarBadgeCarrito();
  
  showNotification(`✅ ${producto.nombre} agregado al carrito`, 'success');
}

/**
 * Eliminar producto del carrito
 */
function eliminarDelCarrito(productoId) {
  const index = AppState.carrito.findIndex(item => item.id === productoId);
  
  if (index !== -1) {
    const producto = AppState.carrito[index];
    AppState.carrito.splice(index, 1);
    
    calcularTotalesCarrito();
    guardarCarritoEnStorage();
    actualizarBadgeCarrito();
    
    showNotification(`🗑️ ${producto.nombre} eliminado del carrito`, 'info');
    return true;
  }
  
  return false;
}

/**
 * Actualizar cantidad de un producto en el carrito
 */
function actualizarCantidadCarrito(productoId, nuevaCantidad) {
  const producto = AppState.carrito.find(item => item.id === productoId);
  
  if (producto) {
    if (nuevaCantidad <= 0) {
      return eliminarDelCarrito(productoId);
    }
    
    producto.cantidad = nuevaCantidad;
    calcularTotalesCarrito();
    guardarCarritoEnStorage();
    actualizarBadgeCarrito();
    return true;
  }
  
  return false;
}

/**
 * Vaciar carrito completamente
 */
function vaciarCarrito() {
  AppState.carrito = [];
  AppState.carritoCount = 0;
  AppState.carritoTotal = 0;
  
  guardarCarritoEnStorage();
  actualizarBadgeCarrito();
  
  showNotification('🗑️ Carrito vaciado', 'info');
}

/**
 * Obtener carrito actual
 */
function obtenerCarrito() {
  return {
    items: AppState.carrito,
    total: AppState.carritoTotal,
    count: AppState.carritoCount
  };
}

/**
 * Verificar sesión de usuario
 */
async function verificarSesion() {
  try {
    const token = localStorage.getItem('wh_token');
    
    if (!token) {
      AppState.usuario = null;
      return false;
    }
    
    const response = await fetch(`${API_BASE_URL}/usuarios/me.php`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      AppState.usuario = data.usuario;
      return true;
    } else {
      // Token inválido, limpiar
      localStorage.removeItem('wh_token');
      AppState.usuario = null;
      return false;
    }
    
  } catch (error) {
    console.error('Error al verificar sesión:', error);
    return false;
  }
}

/**
 * Cerrar sesión
 */
function cerrarSesion() {
  localStorage.removeItem('wh_token');
  AppState.usuario = null;
  
  showNotification('👋 Sesión cerrada', 'info');
  
  // Redirigir a login después de 1 segundo
  setTimeout(() => {
    window.location.href = '/login.html';
  }, 1000);
}

/**
 * Inicializar menú móvil (hamburguesa)
 */
function inicializarMenuMovil() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  
  if (!menuToggle || !navLinks) return;
  
  menuToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', isOpen);
    menuToggle.textContent = isOpen ? '✕' : '☰';
  });
  
  // Cerrar menú al hacer click en un link
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      if (navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        menuToggle.textContent = '☰';
      }
    });
  });
}

/**
 * Hacer request a la API
 */
async function apiRequest(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  // Agregar token si existe
  const token = localStorage.getItem('wh_token');
  if (token) {
    defaultOptions.headers['Authorization'] = `Bearer ${token}`;
  }
  
  const finalOptions = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...(options.headers || {})
    }
  };
  
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, finalOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `Error ${response.status}`);
    }
    
    return data;
    
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// Exportar funciones globales
window.WoodenHouse = {
  // Estado
  getState: () => AppState,
  
  // Carrito
  agregarAlCarrito,
  eliminarDelCarrito,
  actualizarCantidadCarrito,
  vaciarCarrito,
  obtenerCarrito,
  
  // Usuario
  verificarSesion,
  cerrarSesion,
  getUsuario: () => AppState.usuario,
  
  // API
  apiRequest
};

console.log('✅ Wooden House App Ready');
