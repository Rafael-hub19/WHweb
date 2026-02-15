// ================================================
// CONFIGURACIÓN
// ================================================
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost/api'
  : '/api';

// Stripe - REEMPLAZAR CON TU CLAVE PÚBLICA
const STRIPE_PUBLIC_KEY = 'pk_test_TU_CLAVE_PUBLICA_AQUI';
const stripe = Stripe(STRIPE_PUBLIC_KEY);
const elements = stripe.elements();

// Variables globales
let cardElement;
let currentMethod = 'card';
let orderData = null;

// ================================================
// INICIALIZACIÓN
// ================================================
document.addEventListener('DOMContentLoaded', function() {
  loadOrderData();
  initPaymentMethods();
  initStripe();
  initPayPal();
});

// ================================================
// CARGAR DATOS DEL PEDIDO
// ================================================
function loadOrderData() {
  // Cargar datos del localStorage (desde carrito)
  const cart = JSON.parse(localStorage.getItem('carrito')) || [];
  const deliveryData = JSON.parse(localStorage.getItem('deliveryData')) || {};
  
  if (cart.length === 0) {
    document.getElementById('noticeBox').style.display = 'block';
    return;
  }

  // Calcular totales
  const subtotal = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  const shipping = deliveryData.deliveryType === 'domicilio' ? 500 : 0;
  const installation = deliveryData.installation ? 1000 : 0;
  const discount = parseFloat(localStorage.getItem('discount')) || 0;
  const total = subtotal + shipping + installation - discount;

  // Actualizar resumen
  document.getElementById('subtotalDisplay').textContent = '$' + subtotal.toFixed(2);
  document.getElementById('shippingDisplay').textContent = '$' + shipping.toFixed(2);
  document.getElementById('totalDisplay').textContent = '$' + total.toFixed(2);

  if (installation > 0) {
    document.getElementById('installationLine').style.display = 'flex';
    document.getElementById('installationDisplay').textContent = '$' + installation.toFixed(2);
  }

  if (discount > 0) {
    document.getElementById('discountLine').style.display = 'flex';
    document.getElementById('discountDisplay').textContent = '-$' + discount.toFixed(2);
  }

  // Guardar datos del pedido
  orderData = {
    items: cart,
    subtotal,
    shipping,
    installation,
    discount,
    total,
    delivery: deliveryData
  };
}

// ================================================
// MÉTODOS DE PAGO - ALTERNAR
// ================================================
function initPaymentMethods() {
  const paymentOptions = document.querySelectorAll('.payment-option');

  paymentOptions.forEach(option => {
    option.addEventListener('click', function() {
      const method = this.getAttribute('data-method');
      selectPaymentMethod(method);
    });
  });
}

function selectPaymentMethod(method) {
  currentMethod = method;

  // Actualizar selección visual
  document.querySelectorAll('.payment-option').forEach(opt => {
    opt.classList.remove('selected');
  });
  document.querySelector(`[data-method="${method}"]`).classList.add('selected');

  // Mostrar/ocultar formularios
  const cardInfo = document.getElementById('cardInfo');
  const paypalInfo = document.getElementById('paypalInfo');

  if (method === 'card') {
    cardInfo.classList.add('active');
    paypalInfo.classList.remove('active');
  } else if (method === 'paypal') {
    paypalInfo.classList.add('active');
    cardInfo.classList.remove('active');
  }
}

// ================================================
// STRIPE - INICIALIZACIÓN
// ================================================
function initStripe() {
  // Crear elemento de tarjeta
  cardElement = elements.create('card', {
    style: {
      base: {
        color: '#e0e0e0',
        fontFamily: '"Segoe UI", sans-serif',
        fontSmoothing: 'antialiased',
        fontSize: '16px',
        '::placeholder': {
          color: '#a0a0a0'
        }
      },
      invalid: {
        color: '#ff4444',
        iconColor: '#ff4444'
      }
    }
  });

  cardElement.mount('#card-element');

  // Escuchar errores
  cardElement.on('change', function(event) {
    const displayError = document.getElementById('card-errors');
    if (event.error) {
      displayError.textContent = event.error.message;
    } else {
      displayError.textContent = '';
    }
  });

  // Botón de pago
  const submitButton = document.getElementById('submit-stripe');
  if (submitButton) {
    submitButton.addEventListener('click', handleStripePayment);
  }
}

// ================================================
// STRIPE - PROCESAR PAGO
// ================================================
async function handleStripePayment(e) {
  e.preventDefault();

  if (!orderData) {
    alert('Error: No hay datos del pedido');
    return;
  }

  const submitButton = document.getElementById('submit-stripe');
  submitButton.disabled = true;
  submitButton.textContent = '⏳ Procesando...';

  try {
    // 1. Crear Payment Intent en el backend
    const response = await fetch(`${API_URL}/pagos/tarjeta_crear_sesion.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Math.round(orderData.total * 100), // En centavos
        currency: 'mxn',
        order_data: orderData
      })
    });

    const { clientSecret } = await response.json();

    // 2. Confirmar el pago con Stripe
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement
      }
    });

    if (error) {
      // Error al procesar pago
      document.getElementById('card-errors').textContent = error.message;
      submitButton.disabled = false;
      submitButton.textContent = '🔒 Pagar Ahora';
    } else if (paymentIntent.status === 'succeeded') {
      // Pago exitoso
      await registerPayment({
        method: 'stripe',
        transaction_id: paymentIntent.id,
        amount: orderData.total,
        status: 'completed',
        order_data: orderData
      });

      // Limpiar carrito y redirigir
      localStorage.removeItem('carrito');
      window.location.href = 'confirmacion.html?payment=' + paymentIntent.id;
    }

  } catch (error) {
    console.error('Error:', error);
    document.getElementById('card-errors').textContent = 'Error al procesar el pago. Intenta nuevamente.';
    submitButton.disabled = false;
    submitButton.textContent = '🔒 Pagar Ahora';
  }
}

// ================================================
// PAYPAL - INICIALIZACIÓN
// ================================================
function initPayPal() {
  if (!orderData) return;

  // Verificar que PayPal SDK esté cargado
  if (typeof paypal === 'undefined') {
    console.error('PayPal SDK no está cargado');
    return;
  }

  paypal.Buttons({
    createOrder: function(data, actions) {
      return actions.order.create({
        purchase_units: [{
          amount: {
            currency_code: 'MXN',
            value: orderData.total.toFixed(2)
          },
          description: 'Pedido Wooden House'
        }]
      });
    },
    onApprove: async function(data, actions) {
      const order = await actions.order.capture();

      // Registrar pago exitoso
      await registerPayment({
        method: 'paypal',
        transaction_id: order.id,
        amount: orderData.total,
        status: 'completed',
        order_data: orderData,
        paypal_data: order
      });

      // Limpiar carrito y redirigir
      localStorage.removeItem('carrito');
      window.location.href = 'confirmacion.html?payment=' + order.id;
    },
    onError: function(err) {
      console.error('Error PayPal:', err);
      alert('Error al procesar el pago con PayPal. Intenta nuevamente.');
    }
  }).render('#paypal-button-container');
}

// ================================================
// REGISTRAR PAGO EN BASE DE DATOS
// ================================================
async function registerPayment(paymentData) {
  try {
    const response = await fetch(`${API_URL}/pagos/registrar.php`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });

    const result = await response.json();
    
    if (!result.success) {
      console.error('Error al registrar pago:', result.error);
    }

    return result;

  } catch (error) {
    console.error('Error al registrar pago:', error);
  }
}

// ================================================
// CÓDIGOS PROMOCIONALES
// ================================================
function applyPromoCode() {
  const code = document.getElementById('promoCode').value.trim().toUpperCase();

  const promoCodes = {
    'WOODEN10': 0.10,      // 10% descuento
    'BIENVENIDO': 0.05     // 5% descuento
  };

  if (promoCodes[code]) {
    const discountPercent = promoCodes[code];
    const discount = orderData.subtotal * discountPercent;
    
    // Actualizar total
    orderData.discount = discount;
    orderData.total = orderData.subtotal + orderData.shipping + orderData.installation - discount;

    // Actualizar UI
    document.getElementById('discountLine').style.display = 'flex';
    document.getElementById('discountDisplay').textContent = '-$' + discount.toFixed(2);
    document.getElementById('totalDisplay').textContent = '$' + orderData.total.toFixed(2);

    // Guardar en localStorage
    localStorage.setItem('discount', discount);

    alert(`✅ Código "${code}" aplicado! Descuento de ${(discountPercent * 100)}%`);
  } else {
    alert('❌ Código promocional inválido');
  }
}

console.log('✅ pago.js cargado correctamente');