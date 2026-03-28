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

  // ── Dropdown "Mi cuenta" ──────────────────────────────────────────
  const cuentaDropdown    = document.getElementById('cuentaDropdown');
  const cuentaDropdownBtn = document.getElementById('cuentaDropdownBtn');
  if (!cuentaDropdown || !cuentaDropdownBtn) return;

  cuentaDropdownBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    const isMobile = window.matchMedia('(max-width: 900px)').matches;
    if (isMobile) {
      const isOpen = cuentaDropdown.classList.toggle('open');
      cuentaDropdownBtn.setAttribute('aria-expanded', isOpen);
    }
    // En desktop el hover CSS ya lo abre
  });

  // Cerrar al hacer click en ítem
  cuentaDropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', function () {
      cuentaDropdown.classList.remove('open');
      cuentaDropdownBtn.setAttribute('aria-expanded', 'false');
      closeNav();
    });
  });

  // Cerrar al hacer click fuera
  document.addEventListener('click', function (e) {
    if (!cuentaDropdown.contains(e.target)) {
      cuentaDropdown.classList.remove('open');
      cuentaDropdownBtn.setAttribute('aria-expanded', 'false');
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

// ================================================
// DROPDOWN "MI CUENTA" — actualizar según estado de auth
// ================================================
document.addEventListener('wh:autenticado', function (e) {
  const cliente = e.detail;
  if (!cliente) return;

  // Partículas a ignorar al calcular iniciales — declaradas aquí para que estén disponibles en todo el listener
  const _ptcls = new Set(['de','del','la','las','los','el','y','e','von','van','da','das','dos','di','le','les']);

  // Actualizar botón principal del dropdown
  const btn = document.getElementById('cuentaDropdownBtn');
  if (btn) {
    const iniciales = (cliente.nombre || '?').trim().split(/\s+/).filter(p => p && !_ptcls.has(p.toLowerCase()))
      .slice(0, 2).map(p => p[0].toUpperCase()).join('');
    const primerNombre = (cliente.nombre || '').trim().split(/\s+/)[0];
    btn.innerHTML = `
      <span style="display:inline-flex;align-items:center;gap:8px;">
        <span style="display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#8b7355;font-size:11px;font-weight:800;color:#fff;flex-shrink:0;">${iniciales}</span>
        <span style="font-size:13px;font-weight:600;">${primerNombre}</span>
      </span>
      <i class="fa-solid fa-chevron-down nav-chevron"></i>`;
  }

  // Actualizar items del dropdown
  const menu = document.getElementById('cuentaDropdownMenu');
  if (menu) {
    menu.innerHTML = `
      <a href="/mi-cuenta" class="dropdown-item" role="menuitem">
        <i class="fa-solid fa-user-circle"></i> Mi cuenta
      </a>
      <div class="dropdown-divider"></div>
      <button class="dropdown-item" role="menuitem" onclick="_authLogout()" style="width:100%;text-align:left;background:none;border:none;cursor:pointer;font-family:inherit;color:#c07070;">
        <i class="fa-solid fa-right-from-bracket" style="color:#c07070;"></i> Cerrar sesión
      </button>`;
  }

  // Actualizar también el botón en la barra inferior móvil
  const mbnUser = document.querySelector('.mobile-bottom-nav .mbn-item:last-child');
  if (mbnUser) {
    const iniciales2 = (cliente.nombre || '?').trim().split(/\s+/).filter(p => p && !_ptcls.has(p.toLowerCase()))
      .slice(0, 2).map(p => p[0].toUpperCase()).join('');
    mbnUser.innerHTML = `<i class="fa-solid fa-user-check"></i><span>${iniciales2}</span>`;
    mbnUser.style.color = '#c9a96e';
  }
});

console.log('[OK] index.js cargado');