// =============================================================
// Wooden House - Detalle Producto (conectado a API real)
// =============================================================
const API_BASE = '/api';

let productoActual = null;
let imagenIndex    = 0;

document.addEventListener('DOMContentLoaded', () => {
  initNavHamburger();
  initCartBadge();
  initTabs();
  cargarProducto();
});

// ---- Nav hamburger ----
function initNavHamburger() {
  const toggle = document.getElementById('menuToggle');
  const nav    = document.getElementById('navLinks');
  if (!toggle || !nav) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });
  document.addEventListener('click', (e) => {
    if (!toggle.contains(e.target) && !nav.contains(e.target)) {
      nav.classList.remove('open');
    }
  });
}

// ---- Cart badge ----
function initCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  const carrito = JSON.parse(localStorage.getItem('wh_carrito') || '[]');
  const total = carrito.reduce((s, i) => s + (i.cantidad || 0), 0);
  badge.textContent = total;
  badge.style.display = total > 0 ? 'inline-block' : 'none';
}

// ---- Tabs ----
function initTabs() {
  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      const target = document.getElementById(btn.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// ---- Cargar producto desde API ----
async function cargarProducto() {
  const params    = new URLSearchParams(window.location.search);
  const productId = params.get('id');

  if (!productId) {
    mostrarError();
    return;
  }

  try {
    const res  = await fetch(`${API_BASE}/productos.php?id=${productId}`);
    const data = await res.json();

    if (!data.success || !data.producto) {
      mostrarError();
      return;
    }

    productoActual = data.producto;
    mostrarProducto();
    cargarRelacionados(productoActual.categoria_id, productoActual.id);

  } catch (e) {
    console.error('Error cargando producto:', e);
    mostrarError();
  }
}

// ---- Mostrar producto ----
function mostrarProducto() {
  const p = productoActual;

  // Ocultar loading, mostrar contenido
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('page').style.display = 'block';

  // SEO / Title
  document.title = `${p.nombre} - Wooden House`;
  const breadcrumb = document.getElementById('breadcrumbNombre');
  if (breadcrumb) breadcrumb.textContent = p.nombre;

  // Nombre y categoría
  setText('pNombre', p.nombre);
  const catEl = document.getElementById('pCategoria');
  if (catEl && p.categoria_nombre) {
    catEl.textContent = p.categoria_nombre;
  }

  // Etiqueta
  const etiqEl = document.getElementById('pEtiqueta');
  if (etiqEl && p.etiqueta) {
    etiqEl.textContent = p.etiqueta;
    etiqEl.style.display = 'inline-block';
  }

  // Precio
  setText('pPrecio', formatCurrency(p.precio_base || p.precio));

  // Stock
  // Fabricación bajo pedido — siempre disponible
  const iconEl = document.getElementById('pStockIcon');
  const textEl = document.getElementById('pStockText');
  if (iconEl) iconEl.className = 'fa-solid fa-circle-check';
  if (iconEl) iconEl.style.color = '#4caf50';
  if (textEl) textEl.innerHTML = '<strong>Disponible</strong> · Fabricación bajo pedido';
  if (btn) btn.disabled = false; else if (stock <= 3) {
    if (iconEl) iconEl.textContent = '<i class="fa-solid fa-triangle-exclamation"></i>';
    if (textEl) textEl.innerHTML = `<strong>¡Últimas ${stock} unidades!</strong>`;
    const qtyInput = document.getElementById('cantidad');
    if (qtyInput) qtyInput.max = stock;
  }

  // Descripción
  const descEl = document.getElementById('pDesc');
  if (descEl) descEl.textContent = p.descripcion || '';

  // Especificaciones en tabs
  const specTable = document.getElementById('specTable');
  if (specTable) {
    const specs = p.especificaciones || [];
    if (specs.length > 0) {
      specTable.innerHTML = specs.map(s => `
        <div class="spec-row">
          <span class="spec-key">${escHtml(s.clave || s.nombre || '')}</span>
          <span class="spec-val">${escHtml(s.valor || '')}</span>
        </div>
      `).join('');

      // También mostrar las primeras 4 como features
      const featuresBox = document.getElementById('featuresBox');
      const pFeatures   = document.getElementById('pFeatures');
      if (featuresBox && pFeatures && specs.length > 0) {
        featuresBox.style.display = 'block';
        pFeatures.innerHTML = specs.slice(0, 4).map(s => `
          <div class="feature-item">
            <span class="feature-key"><i class="fa-solid fa-thumbtack"></i> ${escHtml(s.clave || '')}</span>
            <span class="feature-val">${escHtml(s.valor || '')}</span>
          </div>
        `).join('');
      }
    } else {
      specTable.innerHTML = '<p style="color:#888;">No hay especificaciones registradas.</p>';
    }
  }

  // Imágenes
  const imagenes = p.imagenes || [];
  const mainImg  = document.getElementById('mainImage');
  const thumbsEl = document.getElementById('thumbs');
  const placeholder = document.getElementById('imgPlaceholder');

  if (imagenes.length > 0) {
    const primera = imagenes[0]?.url_imagen || '';
    if (mainImg && primera) {
      mainImg.src = primera;
      mainImg.alt = p.nombre;
      mainImg.style.display = 'block';
      if (placeholder) placeholder.style.display = 'none';
    }

    if (thumbsEl && imagenes.length > 1) {
      thumbsEl.innerHTML = imagenes.map((img, idx) => `
        <div class="thumb ${idx === 0 ? 'active' : ''}" onclick="cambiarImagen(${idx}, '${escHtml(img.url_imagen)}')">
          <img src="${escHtml(img.url_imagen)}" alt="Vista ${idx+1}" loading="lazy">
        </div>
      `).join('');
    }
  }

  // Botón agregar al carrito
  const btnAdd = document.getElementById('btnAddCart');
  if (btnAdd && stock > 0) {
    btnAdd.addEventListener('click', agregarAlCarrito);
  }
}

// ---- Cambiar imagen ----
function cambiarImagen(idx, url) {
  imagenIndex = idx;
  const mainImg = document.getElementById('mainImage');
  const placeholder = document.getElementById('imgPlaceholder');
  if (mainImg && url) {
    mainImg.src = url;
    mainImg.style.display = 'block';
    if (placeholder) placeholder.style.display = 'none';
  }
  document.querySelectorAll('.thumb').forEach((t, i) => t.classList.toggle('active', i === idx));
}

// ---- Cambiar cantidad ----
function cambiarCantidad(delta) {
  const input = document.getElementById('cantidad');
  if (!input) return;
  let val = parseInt(input.value || 1) + delta;
  const max = 99; // Fabricación bajo pedido, sin límite de stock
  val = Math.max(1, Math.min(val, max));
  input.value = val;
}

// ---- Agregar al carrito ----
function agregarAlCarrito() {
  if (!productoActual) return;
  const cantidad = parseInt(document.getElementById('cantidad')?.value || 1);
  let carrito = JSON.parse(localStorage.getItem('wh_carrito') || '[]');

  const exist = carrito.find(i => i.id == productoActual.id);
  if (exist) {
    exist.cantidad += cantidad;
  } else {
    carrito.push({
      id:       productoActual.id,
      nombre:   productoActual.nombre,
      precio:   productoActual.precio_base || productoActual.precio,
      imagen:   productoActual.imagenes?.[0]?.url_imagen || '',
      cantidad: cantidad,
    });
  }
  localStorage.setItem('wh_carrito', JSON.stringify(carrito));
  initCartBadge();

  // Mostrar botón ver carrito
  const btn = document.getElementById('btnVerCarrito');
  if (btn) btn.style.display = 'inline-block';

  showToast(`<i class="fa-solid fa-circle-check"></i> ${cantidad}x ${productoActual.nombre} agregado al carrito`);
}

// ---- Cargar productos relacionados ----
async function cargarRelacionados(catId, excludeId) {
  if (!catId) return;
  try {
    const res  = await fetch(`${API_BASE}/productos.php?categoria_id=${catId}&limit=4`);
    const data = await res.json();
    const container = document.getElementById('relacionados');
    if (!container || !data.success) return;

    const items = (data.productos || []).filter(p => p.id != excludeId).slice(0, 4);
    if (!items.length) { container.closest('.related-section').style.display = 'none'; return; }

    container.innerHTML = items.map(p => {
      const img = p.imagen_principal ? `<img src="${escHtml(p.imagen_principal)}" alt="${escHtml(p.nombre)}" loading="lazy">` : '<div class="placeholder-img-small"><i class="fa-solid fa-tree"></i></div>';
      return `
        <a href="detalle/${p.id}" class="related-card">
          <div class="related-img">${img}</div>
          <div class="related-info">
            <div class="related-name">${escHtml(p.nombre)}</div>
            <div class="related-price">${formatCurrency(p.precio)}</div>
          </div>
        </a>
      `;
    }).join('');
  } catch (e) { console.warn('Relacionados no disponibles:', e); }
}

// ---- Helpers ----
function mostrarError() {
  document.getElementById('loadingState').style.display = 'none';
  document.getElementById('errorState').style.display = 'block';
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function escHtml(str) {
  return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatCurrency(n) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(n || 0));
}

function showToast(msg, type = 'success') {
  const toast = document.createElement('div');
  toast.style.cssText = `position:fixed;top:20px;right:20px;padding:14px 20px;background:${type==='success'?'#22c55e':'#ef4444'};color:#fff;border-radius:8px;z-index:10000;font-weight:600;box-shadow:0 4px 12px rgba(0,0,0,.25);`;
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// Globales
window.cambiarImagen   = cambiarImagen;
window.cambiarCantidad = cambiarCantidad;