/**
 * pago.js - Funcionalidad de Checkout y Pagos
 * Wooden House E-commerce
 */

let carrito = [];
let pedidoId = null;
let stripeInstance = null;
let paypalButtons = null;

const API_URL = '/api';

// Claves públicas (obtenerlas del backend o config)
const STRIPE_PUBLIC_KEY = 'pk_test_TU_CLAVE_AQUI'; // Cambiar por tu clave
const PAYPAL_CLIENT_ID = 'TU_CLIENT_ID_AQUI'; // Cambiar por tu clave

/**
 * Inicializar página de pago
 */
document.addEventListener('DOMContentLoaded', async () => {
  console.log('💳 Checkout Iniciado');
  
  // Cargar carrito
  cargarCarrito();
  
  if (carrito.length === 0) {
    mostrarCarritoVacio();
    return;
  }
  
  // Renderizar resumen
  renderizarResumen();
  
  // Inicializar formulario
  inicializarFormulario();
  
  // Inicializar métodos de pago
  await inicializarStripe();
  await inicializarPayPal();
  
  // Event listeners
  const btnCrearPedido = document.getElementById('btn-crear-pedido');
  if (btnCrearPedido) {
    btnCrearPedido.addEventListener('click', crearPedido);
  }
});

/**
 * Cargar carrito desde localStorage
 */
function cargarCarrito() {
  try {
    const carritoGuardado = localStorage.getItem('wh_carrito');
    if (carritoGuardado) {
      carrito = JSON.parse(carritoGuardado);
    }
  } catch (error) {
    console.error('Error al cargar carrito:', error);
    carrito = [];
  }
}

/**
 * Mostrar mensaje de carrito vacío
 */
function mostrarCarritoVacio() {
  const container = document.querySelector('.checkout-container');
  if (container) {
    container.innerHTML = `
      <div class="carrito-vacio">
        <h2>🛒 Carrito vacío</h2>
        <p>No tienes productos en el carrito</p>
        <a href="catalogo.html" class="btn-primary">Ir al Catálogo</a>
      </div>
    `;
  }
}

/**
 * Renderizar resumen del pedido
 */
function renderizarResumen() {
  const container = document.getElementById('resumen-items');
  
  if (!container) return;
  
  const subtotal = carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
  const envio = subtotal > 5000 ? 0 : 200;
  const total = subtotal + envio;
  
  // Items
  container.innerHTML = carrito.map(item => `
    <div class="resumen-item">
      <span>${item.nombre} x${item.cantidad}</span>
      <span>${formatCurrency(item.precio * item.cantidad)}</span>
    </div>
  `).join('');
  
  // Totales
  document.getElementById('resumen-subtotal').textContent = formatCurrency(subtotal);
  document.getElementById('resumen-envio').textContent = envio === 0 ? 'GRATIS' : formatCurrency(envio);
  document.getElementById('resumen-total').textContent = formatCurrency(total);
}

/**
 * Inicializar formulario de datos de entrega
 */
function inicializarFormulario() {
  const form = document.getElementById('form-checkout');
  
  if (!form) return;
  
  // Autocompletar con datos guardados si existen
  const datosGuardados = localStorage.getItem('wh_datos_entrega');
  if (datosGuardados) {
    const datos = JSON.parse(datosGuardados);
    
    Object.keys(datos).forEach(key => {
      const input = form.querySelector(`[name="${key}"]`);
      if (input) input.value = datos[key];
    });
  }
  
  // Guardar datos al cambiar
  form.addEventListener('change', () => {
    const formData = new FormData(form);
    const datos = Object.fromEntries(formData);
    localStorage.setItem('wh_datos_entrega', JSON.stringify(datos));
  });
}

/**
 * Crear pedido en el backend
 */
async function crearPedido() {
  const form = document.getElementById('form-checkout');
  
  if (!form || !form.checkValidity()) {
    showNotification('❌ Por favor completa todos los campos requeridos', 'error');
    form.reportValidity();
    return;
  }
  
  const loader = showLoader('Creando pedido...');
  
  try {
    const formData = new FormData(form);
    
    // Calcular totales
    const subtotal = carrito.reduce((total, item) => total + (item.precio * item.cantidad), 0);
    const envio = subtotal > 5000 ? 0 : 200;
    const total = subtotal + envio;
    
    // Preparar datos del pedido
    const pedidoData = {
      nombre_completo: formData.get('nombre'),
      correo: formData.get('email'),
      telefono: formData.get('telefono'),
      direccion_entrega: formData.get('direccion'),
      ciudad: formData.get('ciudad'),
      estado: formData.get('estado'),
      codigo_postal: formData.get('cp'),
      notas: formData.get('notas') || '',
      tipo_entrega: formData.get('tipo_entrega') || 'domicilio',
      fecha_estimada: calcularFechaEstimada(),
      productos: carrito.map(item => ({
        producto_id: item.id,
        cantidad: item.cantidad,
        precio_unitario: item.precio
      })),
      subtotal: subtotal,
      costo_envio: envio,
      total: total
    };
    
    // Crear pedido
    const response = await fetch(`${API_URL}/pedidos/crear.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(pedidoData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      pedidoId = data.pedido_id;
      
      // Mostrar métodos de pago
      mostrarMetodosPago();
      
      showNotification('✅ Pedido creado. Selecciona método de pago', 'success');
      
    } else {
      throw new Error(data.error || 'Error al crear pedido');
    }
    
  } catch (error) {
    console.error('Error:', error);
    showNotification(`❌ ${error.message}`, 'error');
  } finally {
    hideLoader();
  }
}

/**
 * Mostrar métodos de pago
 */
function mostrarMetodosPago() {
  const section = document.getElementById('metodos-pago-section');
  if (section) {
    section.style.display = 'block';
    section.scrollIntoView({ behavior: 'smooth' });
  }
  
  // Deshabilitar botón de crear pedido
  const btnCrear = document.getElementById('btn-crear-pedido');
  if (btnCrear) {
    btnCrear.disabled = true;
    btnCrear.textContent = 'Pedido creado ✓';
  }
}

/**
 * Inicializar Stripe
 */
async function inicializarStripe() {
  if (typeof Stripe === 'undefined') {
    console.warn('Stripe.js no cargado');
    return;
  }
  
  try {
    stripeInstance = Stripe(STRIPE_PUBLIC_KEY);
    
    const btnStripe = document.getElementById('btn-pagar-stripe');
    if (btnStripe) {
      btnStripe.addEventListener('click', pagarConStripe);
    }
    
  } catch (error) {
    console.error('Error al inicializar Stripe:', error);
  }
}

/**
 * Pagar con Stripe
 */
async function pagarConStripe() {
  if (!pedidoId) {
    showNotification('❌ Primero crea el pedido', 'error');
    return;
  }
  
  if (!stripeInstance) {
    showNotification('❌ Stripe no disponible', 'error');
    return;
  }
  
  const loader = showLoader('Redirigiendo a Stripe...');
  
  try {
    // Crear sesión de Stripe en el backend
    const response = await fetch(`${API_URL}/pagos/stripe_crear_sesion.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        pedido_id: pedidoId,
        base_url: window.location.origin
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Redirigir a Stripe Checkout
      const { error } = await stripeInstance.redirectToCheckout({
        sessionId: data.session_id
      });
      
      if (error) {
        throw new Error(error.message);
      }
    } else {
      throw new Error(data.error || 'Error al crear sesión de pago');
    }
    
  } catch (error) {
    console.error('Error Stripe:', error);
    showNotification(`❌ ${error.message}`, 'error');
  } finally {
    hideLoader();
  }
}

/**
 * Inicializar PayPal
 */
async function inicializarPayPal() {
  if (typeof paypal === 'undefined') {
    console.warn('PayPal SDK no cargado');
    return;
  }
  
  try {
    paypalButtons = paypal.Buttons({
      createOrder: async (data, actions) => {
        if (!pedidoId) {
          showNotification('❌ Primero crea el pedido', 'error');
          throw new Error('Pedido no creado');
        }
        
        try {
          const response = await fetch(`${API_URL}/pagos/paypal_crear_orden.php`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              pedido_id: pedidoId,
              base_url: window.location.origin
            })
          });
          
          const result = await response.json();
          
          if (!result.success) {
            throw new Error(result.error);
          }
          
          return result.order_id;
          
        } catch (error) {
          console.error('Error:', error);
          showNotification(`❌ ${error.message}`, 'error');
          throw error;
        }
      },
      
      onApprove: async (data, actions) => {
        showLoader('Procesando pago...');
        
        // Redirigir a captura en el servidor
        window.location.href = `${API_URL}/pagos/paypal_capturar.php?token=${data.orderID}&pedido_id=${pedidoId}`;
      },
      
      onCancel: (data) => {
        showNotification('ℹ️ Pago cancelado', 'info');
      },
      
      onError: (err) => {
        console.error('PayPal Error:', err);
        showNotification('❌ Error al procesar el pago con PayPal', 'error');
      }
    });
    
    paypalButtons.render('#paypal-button-container');
    
  } catch (error) {
    console.error('Error al inicializar PayPal:', error);
  }
}

/**
 * Calcular fecha estimada de entrega
 */
function calcularFechaEstimada() {
  const hoy = new Date();
  const fechaEstimada = new Date(hoy.getTime() + (7 * 24 * 60 * 60 * 1000)); // +7 días
  
  return fechaEstimada.toISOString().split('T')[0];
}

/**
 * Validar código postal
 */
function validarCP(cp) {
  return /^\d{5}$/.test(cp);
}

/**
 * Validar teléfono
 */
function validarTelefono(tel) {
  const cleaned = tel.replace(/\D/g, '');
  return cleaned.length === 10;
}

console.log('✅ Pago.js cargado');
