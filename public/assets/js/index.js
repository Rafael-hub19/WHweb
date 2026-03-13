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
// MENÚ HAMBURGUESA + DROPDOWN "INICIO"
// ================================================
function initMenu() {
  const menuToggle = document.getElementById('menuToggle');
  const menuIcon   = document.getElementById('menuIcon');
  const navLinks   = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;

  // ── Abrir/cerrar panel hamburguesa ──────────────────────────────
  function openNav() {
    navLinks.classList.add('open');
    menuToggle.setAttribute('aria-expanded', 'true');
    if (menuIcon) { menuIcon.classList.replace('fa-bars', 'fa-xmark'); }
  }
  function closeNav() {
    navLinks.classList.remove('open');
    menuToggle.setAttribute('aria-expanded', 'false');
    if (menuIcon) { menuIcon.classList.replace('fa-xmark', 'fa-bars'); }
  }

  menuToggle.addEventListener('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    navLinks.classList.contains('open') ? closeNav() : openNav();
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', function (e) {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      closeNav();
    }
  });

  // Cerrar con Escape
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  // Cerrar al hacer click en un enlace simple (no el botón dropdown)
  navLinks.querySelectorAll('a.nav-link-item, a.cart-icon, a.dropdown-item').forEach(item => {
    item.addEventListener('click', function () {
      closeNav();
    });
  });

  // ── Dropdown "Inicio" ────────────────────────────────────────────
  const navDropdown = document.getElementById('navDropdown');
  const dropdownBtn = document.getElementById('dropdownBtn');
  if (!navDropdown || !dropdownBtn) return;

  dropdownBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    const isMobile = window.matchMedia('(max-width: 900px)').matches;

    if (isMobile) {
      // En móvil: acordeón
      const isOpen = navDropdown.classList.toggle('open');
      dropdownBtn.setAttribute('aria-expanded', isOpen);
    } else {
      // En desktop: scroll a inicio (el hover ya abre el dropdown por CSS)
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  // Cerrar dropdown al hacer click en un ítem dentro de él
  navDropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', function () {
      navDropdown.classList.remove('open');
      dropdownBtn.setAttribute('aria-expanded', 'false');
      closeNav();
    });
  });

  // Cerrar dropdown desktop al hacer click fuera
  document.addEventListener('click', function (e) {
    if (!navDropdown.contains(e.target)) {
      navDropdown.classList.remove('open');
      dropdownBtn.setAttribute('aria-expanded', 'false');
    }
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

    // Lazy-load: si el <source> tiene data-src, cargar ahora
    const source = video.querySelector('source[data-src]');
    if (source) {
      source.src = source.getAttribute('data-src');
      source.removeAttribute('data-src');
      video.load();
    }

    if (isTouchDevice) {
      // Móvil/tablet: inyectar botón play transparente
      const playBtn = document.createElement('div');
      playBtn.className = 'video-play-btn';
      playBtn.innerHTML = '<svg viewBox="0 0 24 24"><polygon points="5,3 19,12 5,21"/></svg>';
      card.appendChild(playBtn);

      // Tap para reproducir/pausar
      card.addEventListener('click', function (e) {
        e.preventDefault();
        if (card.classList.contains('playing')) {
          video.pause();
          card.classList.remove('playing');
        } else {
          pauseAll(video);
          video.play().catch(() => {});
          card.classList.add('playing');
        }
      });
    } else {
      // Desktop: hover para reproducir/pausar — sin botón de play
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