// ================================================
// INICIALIZACIÓN
// ================================================
document.addEventListener('DOMContentLoaded', function () {
  initMenu();
  initCartBadge();
  initFAQ();
  initSmoothScroll();
  initVideos();
});

// ================================================
// MENÚ HAMBURGUESA
// ================================================
function initMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;

  menuToggle.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });

  document.addEventListener('click', function (e) {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });

  navLinks.querySelectorAll('a').forEach(item => {
    item.addEventListener('click', function () {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// ================================================
// BADGE DEL CARRITO
// ================================================
function initCartBadge() {
  const cartBadge = document.getElementById('cartCount');
  if (!cartBadge) return;

  const carrito = JSON.parse(sessionStorage.getItem('wh_carrito') || localStorage.getItem('wh_carrito')) || [];
  const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 0), 0);
  cartBadge.textContent = totalItems;
  cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
}

// ================================================
// FAQ ACCORDION
// ================================================
function initFAQ() {}

function toggleFAQ(element) {
  element.classList.toggle('active');
}

// ================================================
// SMOOTH SCROLL
// ================================================
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

// ================================================
// VIDEOS DE PROYECTOS
// ================================================
function initVideos() {
  const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  const cards = document.querySelectorAll('.video-card');
  if (!cards.length) return;

  function pauseAll(exceptVideo = null) {
    cards.forEach(c => {
      const v = c.querySelector('video');
      if (v && v !== exceptVideo) {
        v.pause();
        v.currentTime = 0;
        c.classList.remove('playing');
      }
    });
  }

  cards.forEach(card => {
    const video = card.querySelector('video');
    if (!video) return;

    if (isTouchDevice) {
      // Móvil / tablet: reproducir al tocar, pausar al soltar el dedo
      card.addEventListener('touchstart', function (e) {
        e.preventDefault();
        pauseAll(video);
        video.play().catch(() => {});
        card.classList.add('playing');
      }, { passive: false });

      card.addEventListener('touchend', function () {
        video.pause();
        video.currentTime = 0;
        card.classList.remove('playing');
      });
    } else {
      // Desktop: hover para reproducir/pausar
      card.addEventListener('mouseenter', function () {
        pauseAll(video);
        video.play().catch(() => {});
        card.classList.add('playing');
      });
      card.addEventListener('mouseleave', function () {
        video.pause();
        video.currentTime = 0;
        card.classList.remove('playing');
      });
    }
  });
}

// ================================================
// HELPERS
// ================================================
function formatCurrency(amount) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);
}

function formatDate(dateString) {
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric'
  }).format(new Date(dateString));
}

console.log('[OK] index.js cargado');