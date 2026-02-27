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
  const cards = document.querySelectorAll('.video-card');
  if (!cards.length) return;

  // ── Lazy load: carga el src solo cuando el video entra al viewport ──
  const loadVideo = (card) => {
    const video = card.querySelector('video');
    if (!video) return;
    const source = video.querySelector('source[data-src]');
    if (source && !source.src) {
      source.src = source.dataset.src;
      video.load();
    }
  };

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadVideo(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '300px' });
    cards.forEach(card => observer.observe(card));
  } else {
    cards.forEach(loadVideo);
  }

  // ── Pausa todos excepto el indicado ──
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

  // ── Click/Tap: toggle play/pause (funciona en mobile Y desktop) ──
  cards.forEach(card => {
    const video = card.querySelector('video');
    if (!video) return;

    // Asegurar que el video nunca autoplaye solo
    video.autoplay = false;
    video.removeAttribute('autoplay');

    card.addEventListener('click', function (e) {
      e.preventDefault();
      // Cargar video si todavía no se cargó
      loadVideo(card);
      const isPlaying = card.classList.contains('playing');
      if (isPlaying) {
        video.pause();
        card.classList.remove('playing');
      } else {
        pauseAll(video);
        video.play()
          .then(() => card.classList.add('playing'))
          .catch(() => {
            // En algunos browsers el play falla sin interacción previa - mostrar error silencioso
            card.classList.remove('playing');
          });
      }
    });

    // Cuando termina, quitar el estado playing
    video.addEventListener('ended', () => {
      card.classList.remove('playing');
    });

    // Cuando se pausa externamente, quitar estado
    video.addEventListener('pause', () => {
      card.classList.remove('playing');
    });
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