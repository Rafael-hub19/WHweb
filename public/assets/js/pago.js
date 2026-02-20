// =============================================================
// Wooden House - Pago.js (Stripe SDK + PayPal SDK)
// Conectado a API PHP real
// =============================================================

const API_BASE = '/api';

let stripe, cardElement;
let pedidoCreado = null;
let metodoPago   = 'card';
let orderData    = null;

initMenuHamburguesa();
document.addEventListener('DOMContentLoaded', () => {
  cargarResumen();
  initMetodosPago();
  // Stripe se inicia después de cargar el resumen (necesita saber si hay pedido)
});

// ============================================================
// RESUMEN DEL PEDIDO
// ============================================================
function cargarResumen() {
  const carrito      = JSON.parse(localStorage.getItem('wh_carrito') || '[]');
  const deliveryData = JSON.parse(localStorage.getItem('wh_delivery') || '{}');

  if (!carrito.length) {
    document.getElementById('noticeBox').style.display = 'block';
    document.getElementById('btnStripe')?.setAttribute('disabled', true);
    return;
  }

  const subtotal     = carrito.reduce((s, i) => s + (i.precio * i.cantidad), 0);
  const envio        = deliveryData.tipo === 'domicilio' ? 500 : 0;
  const instalacion  = deliveryData.instalacion ? 1000 : 0;
  const descuento    = parseFloat(localStorage.getItem('wh_descuento') || '0');
  const total        = subtotal + envio + instalacion - descuento;

  setText('subtotalDisplay',    formatCurrency(subtotal));
  setText('shippingDisplay',    formatCurrency(envio));
  setText('totalDisplay',       `<strong>${formatCurrency(total)}</strong>`);

  if (instalacion > 0) {
    document.getElementById('installationLine').style.display = 'flex';
    setText('installationDisplay', formatCurrency(instalacion));
  }
  if (descuento > 0) {
    document.getElementById('discountLine').style.display = 'flex';
    setText('discountDisplay', '-' + formatCurrency(descuento));
  }

  // Resumen de items
  const itemsEl = document.getElementById('cart-items-summary');
  if (itemsEl) {
    itemsEl.innerHTML = carrito.map(i => `
      <div class="summary-item">
        <span>${i.nombre} × ${i.cantidad}</span>
        <span>${formatCurrency(i.precio * i.cantidad)}</span>
      </div>
    `).join('');
  }

  orderData = { carrito, deliveryData, subtotal, envio, instalacion, descuento, total };

  // Inicializar SDKs con los datos del pedido
  initStripe();
  initPayPal();
}

// ============================================================
// STRIPE
// ============================================================
function initStripe() {
  const STRIPE_PK = 'pk_test_REEMPLAZAR_CON_TU_CLAVE_PUBLICA'; // ← Reemplazar en .env

  if (!window.Stripe) { console.warn('Stripe SDK no cargado'); return; }

  stripe = Stripe(STRIPE_PK);
  const elements = stripe.elements({
    locale: 'es',
    appearance: {
      theme: 'night',
      variables: { colorPrimary: '#8b6914', fontFamily: 'Arial, sans-serif' }
    }
  });

  cardElement = elements.create('card', {
    style: {
      base: { fontSize: '16px', color: '#fff', '::placeholder': { color: '#aaa' } }
    }
  });

  const cardEl = document.getElementById('card-element');
  if (cardEl) {
    cardElement.mount('#card-element');
    cardElement.on('ready', () => {
      const btn = document.getElementById('btnStripe');
      if (btn) btn.disabled = false;
    });
    cardElement.on('change', (e) => {
      const errEl = document.getElementById('card-errors');
      if (errEl) errEl.textContent = e.error ? e.error.message : '';
    });
  }

  const btnStripe = document.getElementById('btnStripe');
  if (btnStripe) {
    btnStripe.addEventListener('click', pagarConStripe);
  }
}

async function pagarConStripe() {
  if (!orderData || !pedidoCreado) {
    // Crear el pedido primero si no existe
    pedidoCreado = await crearPedidoEnBD();
    if (!pedidoCreado) return;
  }

  const btn = document.getElementById('btnStripe');
  const spinner = document.getElementById('stripeSpinner');
  btn.disabled  = true;
  if (spinner) spinner.style.display = 'inline-block';

  try {
    // 1. Crear Payment Intent en backend
    const intentRes  = await fetch(`${API_BASE}/pagos.php?action=stripe_intent`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ pedido_id: pedidoCreado.pedido_id }),
    });
    const intentData = await intentRes.json();
    if (!intentData.success) throw new Error(intentData.error || 'Error al iniciar pago');

    const clientSecret = intentData.client_secret;

    // 2. Confirmar con Stripe JS SDK
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement }
    });

    if (result.error) throw new Error(result.error.message);

    // 3. Confirmar con backend
    const confirmRes  = await fetch(`${API_BASE}/pagos.php?action=stripe_confirm`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({
        payment_intent_id: result.paymentIntent.id,
        pedido_id:         pedidoCreado.pedido_id,
      }),
    });
    const confirmData = await confirmRes.json();

    if (confirmData.success) {
      irAConfirmacion();
    } else {
      throw new Error(confirmData.error || 'Error confirmando pago');
    }

  } catch (err) {
    console.error('Stripe error:', err);
    showError(err.message || 'Error en el pago. Intenta nuevamente.');
    btn.disabled = false;
    if (spinner) spinner.style.display = 'none';
  }
}

// ============================================================
// PAYPAL
// ============================================================
function initPayPal() {
  if (!window.paypal) { console.warn('PayPal SDK no cargado'); return; }

  paypal.Buttons({
    style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },

    createOrder: async (data, actions) => {
      // Crear pedido en BD si no existe
      if (!pedidoCreado) {
        pedidoCreado = await crearPedidoEnBD();
        if (!pedidoCreado) throw new Error('No se pudo crear el pedido');
      }
      // Crear orden PayPal en backend
      const res  = await fetch(`${API_BASE}/pagos.php?action=paypal_orden`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pedido_id: pedidoCreado.pedido_id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error PayPal');
      return data.order_id;
    },

    onApprove: async (data, actions) => {
      try {
        const res  = await fetch(`${API_BASE}/pagos.php?action=paypal_capturar`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ order_id: data.orderID, pedido_id: pedidoCreado?.pedido_id }),
        });
        const result = await res.json();
        if (result.success) {
          irAConfirmacion();
        } else {
          throw new Error(result.error || 'Error al capturar pago PayPal');
        }
      } catch (err) {
        showError(err.message || 'Error en el pago PayPal');
      }
    },

    onError: (err) => {
      console.error('PayPal error:', err);
      showError('Error en PayPal. Por favor intenta nuevamente.');
    },

    onCancel: () => {
      showError('Pago cancelado. Puedes intentarlo nuevamente.', 'warning');
    },

  }).render('#paypal-button-container');
}

// ============================================================
// CREAR PEDIDO EN BD
// ============================================================
async function crearPedidoEnBD() {
  if (!orderData) return null;

  const clienteData = JSON.parse(localStorage.getItem('wh_cliente') || '{}');
  if (!clienteData.nombre || !clienteData.correo) {
    showError('Faltan datos del cliente. Regresa al carrito.');
    return null;
  }

  try {
    const body = {
      nombre_cliente:     clienteData.nombre,
      correo_cliente:     clienteData.correo,
      telefono_cliente:   clienteData.telefono || '',
      tipo_entrega:       orderData.deliveryData.tipo || 'sucursal',
      direccion_envio:    orderData.deliveryData.direccion || '',
      incluye_instalacion: !!orderData.deliveryData.instalacion,
      items:              orderData.carrito.map(i => ({ producto_id: i.id, cantidad: i.cantidad })),
      descuento:          orderData.descuento || 0,
    };

    const res  = await fetch(`${API_BASE}/pedidos.php`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.error || 'Error creando pedido');

    // Guardar datos del pedido creado
    localStorage.setItem('wh_pedido_creado', JSON.stringify(data));
    return data;

  } catch (err) {
    console.error('Error creando pedido:', err);
    showError('Error al registrar pedido: ' + err.message);
    return null;
  }
}

// ============================================================
// MÉTODOS DE PAGO - TOGGLE
// ============================================================
function initMetodosPago() {
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      metodoPago = opt.dataset.method;

      document.getElementById('stripe-section').style.display = metodoPago === 'card' ? 'block' : 'none';
      document.getElementById('paypal-section').style.display = metodoPago === 'paypal' ? 'block' : 'none';
    });
  });
}

// ============================================================
// CONFIRMACIÓN
// ============================================================
function irAConfirmacion() {
  const pedido = JSON.parse(localStorage.getItem('wh_pedido_creado') || 'null') || pedidoCreado;
  // Limpiar carrito
  localStorage.removeItem('wh_carrito');
  localStorage.removeItem('wh_delivery');
  localStorage.removeItem('wh_cliente');
  localStorage.removeItem('wh_descuento');

  // Redirigir a solicitudes con token de seguimiento
  if (pedido?.token_seguimiento) {
    window.location.href = `solicitudes.php?token=${pedido.token_seguimiento}&pedido=${pedido.numero_pedido}`;
  } else {
    window.location.href = '/solicitudes?pago=exitoso';
  }
}

// ============================================================
// HELPERS
// ============================================================
function setText(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function formatCurrency(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));
}

function showError(msg, type = 'error') {
  const errEl = document.getElementById('card-errors');
  if (errEl) { errEl.textContent = msg; return; }
  alert(msg);
}

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

