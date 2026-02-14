/**
 * Funciones Utilitarias - Wooden House
 * Helpers reutilizables en toda la aplicación
 */

/**
 * Formatea un número como moneda MXN
 */
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN'
  }).format(amount);
}

/**
 * Formatea una fecha
 */
function formatDate(date) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(date));
}

/**
 * Valida un email
 */
function isValidEmail(email) {
  const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
  return regex.test(email);
}

/**
 * Valida un teléfono mexicano
 */
function isValidPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
}

/**
 * Sanitiza un string para prevenir XSS
 */
function sanitize(str) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return String(str).replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Debounce function
 */
function debounce(func, wait = 300) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Obtiene un parámetro de la URL
 */
function getURLParameter(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

/**
 * Scroll suave a un elemento
 */
function scrollToElement(selector) {
  const element = document.querySelector(selector);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  }
}

/**
 * Muestra una notificación temporal
 */
function showNotification(message, type = 'info', duration = 5000) {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.cssText = `
    position: fixed;
    top: 90px;
    right: 20px;
    min-width: 300px;
    max-width: 400px;
    padding: 20px;
    background: #2d2d2d;
    border: 2px solid ${type === 'success' ? '#4a8b5a' : type === 'error' ? '#8b4a4a' : '#4a7c8b'};
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.4);
    z-index: 3000;
    animation: slideIn 0.3s ease;
  `;
  notification.innerHTML = `
    <p style="color: #e0e0e0; margin: 0;">${sanitize(message)}</p>
    <button onclick="this.parentElement.remove()" style="position: absolute; top: 10px; right: 10px; background: transparent; color: #a0a0a0; border: none; font-size: 18px; cursor: pointer;">&times;</button>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, duration);
}

/**
 * Muestra un loader
 */
function showLoader(message = 'Cargando...') {
  const loader = document.createElement('div');
  loader.id = 'global-loader';
  loader.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;
  loader.innerHTML = `
    <div style="width: 40px; height: 40px; border: 4px solid #4a4a4a; border-top-color: #8b7355; border-radius: 50%; animation: spin 0.8s linear infinite;"></div>
    <p style="color: white; margin-top: 20px;">${sanitize(message)}</p>
  `;

  document.body.appendChild(loader);
  return loader;
}

/**
 * Oculta el loader
 */
function hideLoader() {
  const loader = document.getElementById('global-loader');
  if (loader) {
    loader.remove();
  }
}

/**
 * Actualiza el badge del carrito
 */
function updateCartBadge(count) {
  const badge = document.querySelector('.cart-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline-block' : 'none';
  }
}

// Agregar estilos de animación
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }
`;
document.head.appendChild(style);
