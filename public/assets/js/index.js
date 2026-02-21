// ================================================
// MENÚ HAMBURGUESA (CRITICAL - FALTABA COMPLETAMENTE)
// ================================================
document.addEventListener('DOMContentLoaded', function() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Toggle clase 'open'
      navLinks.classList.toggle('open');
      
      // Actualizar aria-expanded
      const isOpen = navLinks.classList.contains('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      
      console.log('Menú hamburguesa:', isOpen ? 'ABIERTO' : 'CERRADO');
    });

    // Cerrar menú al hacer click fuera
    document.addEventListener('click', function(e) {
      if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });

    // Cerrar menú al hacer click en un enlace
    const navItems = navLinks.querySelectorAll('a');
    navItems.forEach(item => {
      item.addEventListener('click', function() {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // Inicializar otras funciones
  initCartBadge();
  initFAQ();
  initSmoothScroll();
});

// ================================================
// BADGE DEL CARRITO
// ================================================
function initCartBadge() {
  const cartBadge = document.getElementById('cartCount');
  if (!cartBadge) return;

  const carrito = JSON.parse(localStorage.getItem('wh_carrito')) || [];
  const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 0), 0);
  
  cartBadge.textContent = totalItems;
  cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
}

// ================================================
// FAQ ACCORDION (CRITICAL - FALTABA LA FUNCIÓN)
// ================================================
function initFAQ() {
  console.log('Inicializando FAQ...');
}

// Función GLOBAL para FAQ (llamada desde HTML onclick)
function toggleFAQ(element) {
  console.log('Toggle FAQ llamado');
  
  // Toggle clase 'active'
  element.classList.toggle('active');
  
  // Log para debug
  const isActive = element.classList.contains('active');
  console.log('FAQ estado:', isActive ? 'ABIERTO' : 'CERRADO');
}

// ================================================
// SMOOTH SCROLL
// ================================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const href = this.getAttribute('href');
      
      // Ignorar # solo
      if (href === '#') return;
      
      e.preventDefault();
      const target = document.querySelector(href);
      
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
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

console.log('[OK] index.js cargado correctamente');
