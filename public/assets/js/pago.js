// ── Wooden House — Pago (Stripe + PayPal) ────────────────────────
const API_BASE = '/api';

let stripe, cardElement;
let pedidoCreado = null;
let metodoPago   = 'card';
let orderData    = null;

initMenuHamburguesa();
document.addEventListener('DOMContentLoaded', () => {
  cargarResumen();
  initMetodosPago();
});

// ── Resumen del pedido ────────────────────────────────────────────
function cargarResumen() {
  let checkout = null;
  try {
    const raw = sessionStorage.getItem('wh_checkout');
    if (raw) checkout = JSON.parse(raw);
  } catch { /* silent */ }

  // Fallback: construir desde sessionStorage/localStorage
  if (!checkout) {
    const carrito      = JSON.parse(sessionStorage.getItem('wh_carrito') || '[]');
    const deliveryData = JSON.parse(localStorage.getItem('wh_delivery') || '{}');
    if (!carrito.length) {
      document.getElementById('noticeBox').style.display = 'block';
      document.getElementById('btnStripe')?.setAttribute('disabled', true);
      return;
    }
    const subtotal    = carrito.reduce((s, i) => s + (i.precio * i.cantidad), 0);
    const envio       = deliveryData.tipo === 'domicilio' ? 500 : 0;
    const instalacion = deliveryData.instalacion ? 1000 : 0;
    const descuento   = parseFloat(localStorage.getItem('wh_descuento') || '0');
    checkout = {
      items: carrito,
      nombre_cliente: '', correo_cliente: '', telefono_cliente: '',
      tipo_entrega:    deliveryData.tipo === 'envio' ? 'envio' : deliveryData.tipo === 'recoger' ? 'recoger' : (deliveryData.tipo || 'envio'),
      direccion_envio: deliveryData.direccion || '',
      incluye_instalacion: deliveryData.instalacion ? 1 : 0,
      subtotal, costo_envio: envio, costo_instalacion: instalacion,
      total: subtotal + envio + instalacion - descuento,
    };
  }

  const { items: carrito, subtotal, costo_envio: envio, costo_instalacion: instalacion, total } = checkout;

  if (!carrito || carrito.length === 0) {
    document.getElementById('noticeBox').style.display = 'block';
    document.getElementById('btnStripe')?.setAttribute('disabled', true);
    return;
  }

  setText('subtotalDisplay',    formatCurrency(subtotal));
  setText('shippingDisplay',    formatCurrency(envio));
  setText('totalDisplay',       `<strong>${formatCurrency(total)}</strong>`);

  if (instalacion > 0) {
    document.getElementById('installationLine').style.display = 'flex';
    setText('installationDisplay', formatCurrency(instalacion));
  }

  const itemsEl = document.getElementById('cart-items-summary');
  if (itemsEl) {
    itemsEl.innerHTML = carrito.map(i => `
      <div class="summary-item">
        <span>${i.nombre} × ${i.cantidad}</span>
        <span>${formatCurrency(i.precio * i.cantidad)}</span>
      </div>`).join('');
  }

  orderData = {
    carrito,
    cliente: {
      nombre:   checkout.nombre_cliente   || '',
      correo:   checkout.correo_cliente   || '',
      telefono: checkout.telefono_cliente || '',
    },
    deliveryData: {
      tipo:        checkout.tipo_entrega       || 'envio',
      direccion:   checkout.direccion_envio    || '',
      cp:          checkout.cp_envio           || '',
      ciudad:      checkout.ciudad_envio       || '',
      instalacion: !!checkout.incluye_instalacion,
    },
    subtotal, envio, instalacion, descuento: 0, total,
  };

  initStripe();
  initPayPal();
}

// ── Stripe ────────────────────────────────────────────────────────
function initStripe() {
  const STRIPE_PK = window.STRIPE_PK || '';
  if (!STRIPE_PK) {
    showError('Error de configuración del pago. Contacta al administrador.');
    return;
  }
  if (!window.Stripe) return;

  stripe = Stripe(STRIPE_PK);
  const elements = stripe.elements({
    locale: 'es',
    appearance: { theme: 'night', variables: { colorPrimary: '#8b6914', fontFamily: 'Arial, sans-serif' } },
  });

  cardElement = elements.create('card', {
    style: { base: { fontSize: '16px', color: '#fff', '::placeholder': { color: '#aaa' } } },
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
  if (btnStripe) btnStripe.addEventListener('click', pagarConStripe);
}

async function pagarConStripe() {
  if (!orderData) {
    showError('No hay datos del pedido. Regresa al carrito e intenta nuevamente.');
    return;
  }
  const btn     = document.getElementById('btnStripe');
  const spinner = document.getElementById('stripeSpinner');
  btn.disabled  = true;
  if (spinner) spinner.style.display = 'inline-block';

  try {
    if (!pedidoCreado) pedidoCreado = await crearPedidoEnBD();

    // 1. Crear Payment Intent
    const intentRes  = await fetch(`${API_BASE}/pagos.php?action=stripe_intent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pedido_id: pedidoCreado.pedido_id }),
    });
    const intentData = await intentRes.json();
    if (!intentData.success) throw new Error(intentData.error || 'Error al iniciar pago');

    // 2. Confirmar con Stripe SDK
    const result = await stripe.confirmCardPayment(intentData.client_secret, {
      payment_method: { card: cardElement },
    });
    if (result.error) throw new Error(result.error.message);

    // 3. Confirmar con backend
    const confirmRes  = await fetch(`${API_BASE}/pagos.php?action=stripe_confirm`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payment_intent_id: result.paymentIntent.id, pedido_id: pedidoCreado.pedido_id }),
    });
    const confirmData = await confirmRes.json();
    if (confirmData.success) {
      irAConfirmacion();
    } else {
      throw new Error(confirmData.error || 'Error confirmando pago');
    }
  } catch (err) {
    showError(err.message || 'Error en el pago. Intenta nuevamente.');
    btn.disabled = false;
    if (spinner) spinner.style.display = 'none';
  }
}

// ── PayPal ────────────────────────────────────────────────────────
function initPayPal() {
  if (!window.paypal) return;

  paypal.Buttons({
    style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },

    createOrder: async (_pp, actions) => {
      try {
        if (!pedidoCreado) pedidoCreado = await crearPedidoEnBD();
        const res  = await fetch(`${API_BASE}/pagos.php?action=paypal_orden`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pedido_id: pedidoCreado.pedido_id }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.error || 'Error al crear orden PayPal');
        return data.order_id;
      } catch (err) {
        showError(err.message || 'No se pudo iniciar el pago con PayPal.');
        throw err;
      }
    },

    onApprove: async (data, actions) => {
      try {
        const res    = await fetch(`${API_BASE}/pagos.php?action=paypal_capturar`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_id: data.orderID, pedido_id: pedidoCreado?.pedido_id }),
        });
        const result = await res.json();
        if (result.success) { irAConfirmacion(); }
        else { throw new Error(result.error || 'Error al capturar pago PayPal'); }
      } catch (err) { showError(err.message || 'Error en el pago PayPal'); }
    },

    onError:  (err) => { showError('Ocurrió un error con PayPal. Por favor intenta nuevamente.'); },
    onCancel: ()    => { showError('Pago cancelado. Puedes intentarlo nuevamente.', 'warning'); },
  }).render('#paypal-button-container');
}

// ── Crear pedido en BD ────────────────────────────────────────────
async function crearPedidoEnBD() {
  if (!orderData) {
    const msg = 'No hay datos del pedido. Regresa al carrito e intenta nuevamente.';
    showError(msg); throw new Error(msg);
  }

  const clienteData = orderData.cliente || {};

  if (!clienteData.nombre) {
    const msg = 'Falta el nombre del cliente. Regresa al carrito y completa tus datos.';
    showError(msg); throw new Error(msg);
  }
  if (!clienteData.correo) {
    const msg = 'Falta el correo del cliente. Regresa al carrito y completa tus datos.';
    showError(msg); throw new Error(msg);
  }

  try {
    const body = {
      nombre_cliente:      clienteData.nombre,
      correo_cliente:      clienteData.correo,
      telefono_cliente:    clienteData.telefono || '',
      tipo_entrega:        orderData.deliveryData.tipo === 'envio' ? 'envio' : orderData.deliveryData.tipo === 'recoger' ? 'recoger' : (orderData.deliveryData.tipo || 'envio'),
      direccion_envio:     orderData.deliveryData.direccion || '',
      cp_envio:            orderData.deliveryData.cp        || '',
      ciudad_envio:        orderData.deliveryData.ciudad    || '',
      incluye_instalacion: !!orderData.deliveryData.instalacion,
      items:               orderData.carrito.map(i => ({ producto_id: i.id, cantidad: i.cantidad })),
      descuento:           orderData.descuento || 0,
    };

    const res  = await fetch(`${API_BASE}/pedidos.php`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || 'Error al registrar pedido en el servidor');

    localStorage.setItem('wh_pedido_creado', JSON.stringify(data));
    return data;
  } catch (err) {
    showError('Error al registrar pedido: ' + err.message);
    throw err;
  }
}

// ── Métodos de pago ───────────────────────────────────────────────
function initMetodosPago() {
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.payment-option').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      metodoPago = opt.dataset.method;
      document.getElementById('stripe-section').style.display  = metodoPago === 'card'   ? 'block' : 'none';
      document.getElementById('paypal-section').style.display  = metodoPago === 'paypal' ? 'block' : 'none';
    });
  });
}

// ── Confirmación ──────────────────────────────────────────────────
function irAConfirmacion() {
  const pedido = JSON.parse(localStorage.getItem('wh_pedido_creado') || 'null') || pedidoCreado;
  sessionStorage.removeItem('wh_checkout');
  sessionStorage.removeItem('wh_carrito');
  localStorage.removeItem('wh_delivery');
  localStorage.removeItem('wh_cliente');
  localStorage.removeItem('wh_descuento');
  localStorage.removeItem('wh_pedido_creado');

  if (pedido?.token_seguimiento) {
    window.location.href = `solicitudes.php?token=${pedido.token_seguimiento}&pedido=${pedido.numero_pedido}`;
  } else {
    window.location.href = '/solicitudes?pago=exitoso';
  }
}

// ── Helpers ───────────────────────────────────────────────────────
function setText(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function formatCurrency(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));
}

function showError(msg, type = 'error') {
  const errEl = document.getElementById('card-errors');
  if (errEl) {
    errEl.textContent = msg;
    errEl.className   = type === 'warning' ? 'card-error warning' : 'card-error';
    errEl.style.display = msg ? 'block' : 'none';
    return;
  }
  alert(msg);
}

// ── Menú hamburguesa ─────────────────────────────────────────────
function initMenuHamburguesa() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks   = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;
  menuToggle.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });
  document.addEventListener('click', function (e) {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}
