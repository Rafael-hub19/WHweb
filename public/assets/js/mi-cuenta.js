/**
 * mi-cuenta.js — Lógica de la página "Mi cuenta"
 */

(function () {
  'use strict';

  const ESTADO_LABELS = {
    pendiente:     'Pendiente',
    pagado:        'Pagado',
    en_produccion: 'En producción',
    listo:         'Listo para entrega',
    entregado:     'Entregado',
    cancelado:     'Cancelado',
  };

  function fmt(monto) {
    return '$' + parseFloat(monto || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function fmtFecha(iso) {
    if (!iso) return '—';
    return new Date(iso.replace(' ', 'T')).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  /* ── Inicialización ────────────────────────────────────────── */
  async function init() {
    const cliente = await AuthModal.verificar();
    document.getElementById('mcLoading').style.display = 'none';

    if (!cliente) {
      document.getElementById('mcNoAuth').style.display = '';
      return;
    }

    document.getElementById('mcContent').style.display = '';
    _renderHeader(cliente);
    _cargarPedidos(cliente.id);
    _rellenarFormPerfil(cliente);
  }

  /* ── Header ────────────────────────────────────────────────── */
  function _renderHeader(c) {
    document.getElementById('mcAvatar').textContent = (c.nombre || 'U')[0].toUpperCase();
    document.getElementById('mcNombre').textContent = c.nombre || '—';
    document.getElementById('mcCorreo').textContent = c.correo || '—';
  }

  /* ── Pedidos ───────────────────────────────────────────────── */
  async function _cargarPedidos() {
    const wrap = document.getElementById('mcPedidosList');
    try {
      const res    = await fetch('/api/clientes.php?action=mis-pedidos', { credentials: 'same-origin' });
      const data   = await res.json();
      if (!data.ok) throw new Error(data.error || 'Error al cargar pedidos');
      const pedidos = data.pedidos || [];

      if (pedidos.length === 0) {
        wrap.innerHTML = `<div class="mc-empty"><i class="fa-solid fa-box-open"></i>Aún no tienes pedidos.<br><a href="/catalogo" style="color:var(--color-primary);margin-top:10px;display:inline-block;">Ver catálogo →</a></div>`;
        return;
      }

      const html = `<div class="mc-pedidos-lista">` +
        pedidos.map(p => {
          const clase = `mc-estado-${p.estado}`;
          return `
          <div class="mc-pedido-card">
            <div>
              <div class="mc-pedido-numero">${p.numero_pedido}</div>
              <div class="mc-pedido-meta">
                <span><i class="fa-solid fa-calendar" style="opacity:.6"></i> ${fmtFecha(p.fecha_creacion)}</span>
                <span><i class="fa-solid fa-box" style="opacity:.6"></i> ${p.cantidad_items || 0} producto(s)</span>
                <span><i class="fa-solid fa-truck" style="opacity:.6"></i> ${p.tipo_entrega === 'recoger' ? 'Recojo en tienda' : 'Envío a domicilio'}</span>
              </div>
              <div style="margin-top:8px;">
                <span class="mc-estado-badge ${clase}">${ESTADO_LABELS[p.estado] || p.estado}</span>
              </div>
            </div>
            <div class="mc-pedido-total">${fmt(p.total)}</div>
          </div>`;
        }).join('') + `</div>`;

      wrap.innerHTML = html;
    } catch (e) {
      wrap.innerHTML = `<div class="mc-empty"><i class="fa-solid fa-triangle-exclamation"></i>${e.message}</div>`;
    }
  }

  /* ── Formulario de perfil ──────────────────────────────────── */
  function _rellenarFormPerfil(c) {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('pfNombre',   c.nombre);
    set('pfTelefono', c.telefono);
    set('pfDireccion',c.direccion);
    set('pfCiudad',   c.ciudad);
    set('pfCP',       c.cp);
  }

  window.mcGuardarPerfil = async function (e) {
    e.preventDefault();
    const alert = document.getElementById('mcPerfilAlert');
    alert.className = 'mc-alert';

    const btn    = document.getElementById('btnGuardarPerfil');
    btn._orig    = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="mc-spinner-sm"></span>Guardando…';

    const cliente = AuthModal.getCliente();
    if (!cliente) { alert.textContent = 'No autenticado.'; alert.className = 'mc-alert error'; btn.innerHTML = btn._orig; btn.disabled = false; return; }

    const csrf = document.cookie.split(';').map(c => c.trim()).find(c => c.startsWith('XSRF-TOKEN='));
    const csrfToken = csrf ? decodeURIComponent(csrf.split('=')[1]) : '';

    const body = {
      nombre:    document.getElementById('pfNombre').value.trim(),
      telefono:  document.getElementById('pfTelefono').value.trim(),
      direccion: document.getElementById('pfDireccion').value.trim(),
      ciudad:    document.getElementById('pfCiudad').value.trim(),
      cp:        document.getElementById('pfCP').value.trim(),
    };

    try {
      const res  = await fetch(`/api/clientes.php?id=${cliente.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}) },
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || 'Error al guardar');
      alert.textContent = '¡Perfil actualizado correctamente!';
      alert.className = 'mc-alert success';
      // Actualizar datos locales
      await AuthModal.verificar();
      const c = AuthModal.getCliente();
      if (c) _renderHeader(c);
    } catch (err) {
      alert.textContent = err.message;
      alert.className = 'mc-alert error';
    } finally {
      btn.innerHTML = btn._orig;
      btn.disabled  = false;
    }
  };

  /* ── Tabs ──────────────────────────────────────────────────── */
  window.mcShowTab = function (tab) {
    document.querySelectorAll('.mc-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.mc-tab-content').forEach(c => c.style.display = 'none');
    const el = document.getElementById('mcTab' + tab.charAt(0).toUpperCase() + tab.slice(1));
    if (el) el.style.display = '';
  };

  /* ── Start ─────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

  // Menú hamburguesa
  document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('menuToggle');
    const nav    = document.getElementById('navLinks');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
      });
    }
  });

})();
