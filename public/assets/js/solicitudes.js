// ================================================
// Wooden House - Solicitudes
// ================================================
const API_URL = '/api';

let selectedTime = null;

document.addEventListener('DOMContentLoaded', function() {
  // Limpiar formularios al cargar para evitar que el navegador restaure datos
  document.getElementById('formCotizacion')?.reset();
  document.getElementById('formCita')?.reset();
  selectedTime = null;

  initMenuHamburguesa();
  initCartBadge();
  initTabs();
  initFormCotizacion();
  initFormCita();
  initSeguimiento();
  initMedidasField();
  setMinDate();
  checkURLParams();
});

// ── Menú hamburguesa ─────────────────────────────
function initMenuHamburguesa() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks   = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;
  menuToggle.addEventListener('click', function(e) {
    e.preventDefault(); e.stopPropagation();
    navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });
  document.addEventListener('click', function(e) {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── Cart badge ───────────────────────────────────
function initCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  try {
    const carrito = JSON.parse(sessionStorage.getItem('wh_carrito') || '[]');
    const total   = carrito.reduce((s, i) => s + (i.cantidad || 0), 0);
    badge.textContent  = total;
    badge.style.display = total > 0 ? 'inline-block' : 'none';
  } catch { badge.style.display = 'none'; }
}

// ── URL params: tab activo al llegar ─────────────
function checkURLParams() {
  const params = new URLSearchParams(window.location.search);
  const tab    = params.get('tab');
  if (tab) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    if (btn) btn.click();
  }
  // Si viene de pago exitoso, mostrar seguimiento
  const token  = params.get('token');
  const pedido = params.get('pedido');
  if (token && pedido) {
    const btn = document.querySelector('.tab-btn[data-tab="seguimiento"]');
    if (btn) btn.click();
    const trackInput = document.getElementById('trackingNumber');
    if (trackInput) { trackInput.value = pedido; trackOrder(); }
  }
}

// ── Tabs ─────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const target = document.getElementById('tab-' + this.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// ── Formulario Cotización ────────────────────────
function initFormCotizacion() {
  const form = document.getElementById('formCotizacion');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    const datos = {
      nombre_cliente:       fd.get('nombre')?.trim(),
      correo_cliente:       fd.get('email')?.trim().toLowerCase(),
      telefono_cliente:     fd.get('telefono')?.trim(),
      tipo_mueble:          fd.get('tipoMueble') || '',
      descripcion_solicitud: fd.get('descripcion')?.trim(),
      tiene_medidas:        fd.get('tieneMedidas') === 'si' ? 1 : 0,
      medidas:              fd.get('medidas') || '',
      rango_presupuesto:    fd.get('presupuesto') || '',
      requiere_instalacion: fd.get('instalacion') === 'si' ? 1 : 0,
    };

    if (!datos.nombre_cliente || !datos.correo_cliente || !datos.telefono_cliente || !datos.descripcion_solicitud) {
      showAlert('Por favor completa todos los campos requeridos', 'error'); return;
    }
    if (!isValidEmail(datos.correo_cliente)) {
      showAlert('Ingresa un correo electrónico válido', 'error'); return;
    }
    if (datos.telefono_cliente.replace(/\D/g,'').length < 10) {
      showAlert('Ingresa un teléfono válido de 10 dígitos', 'error'); return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

    try {
      const res  = await fetch(`${API_URL}/cotizaciones.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Error de servidor. Intenta nuevamente.');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al enviar cotización');

      showAlert(
        `<i class="fa-solid fa-circle-check"></i> ¡Cotización enviada! Tu número de seguimiento es <strong>${data.numero_cotizacion}</strong>. Recibirás confirmación en tu correo.`,
        'success'
      );
      form.reset();
      document.getElementById('medidasField')?.setAttribute('style', 'display:none');
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      showAlert(err.message || 'Error al enviar cotización. Intenta nuevamente.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Solicitud de Cotización';
    }
  });
}

// ── Formulario Cita ──────────────────────────────
function initFormCita() {
  const form = document.getElementById('formCita');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedTime) {
      showAlert('Por favor selecciona un horario', 'error'); return;
    }

    const fd = new FormData(form);
    const fechaSeleccionada = fd.get('fecha');

    if (!fechaSeleccionada) {
      showAlert('Por favor selecciona una fecha', 'error'); return;
    }

    const datos = {
      nombre_cliente:    fd.get('nombre')?.trim(),
      correo_cliente:    fd.get('email')?.trim().toLowerCase(),
      telefono_cliente:  fd.get('telefono')?.trim(),
      direccion:         fd.get('direccion')?.trim() || '',
      fecha_cita:        fechaSeleccionada,  // Solo YYYY-MM-DD — el horario va en rango_horario
      rango_horario:     selectedTime,
      tipo:              'medicion',
      notas:             fd.get('notas') || '',
    };

    if (!datos.nombre_cliente || !datos.correo_cliente || !datos.telefono_cliente) {
      showAlert('Por favor completa todos los campos requeridos', 'error'); return;
    }
    if (!isValidEmail(datos.correo_cliente)) {
      showAlert('Ingresa un correo electrónico válido', 'error'); return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Agendando...';

    try {
      const res  = await fetch(`${API_URL}/citas.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) throw new Error('Error de servidor. Intenta nuevamente.');
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Error al agendar cita');

      showAlert(
        `<i class="fa-solid fa-calendar-check"></i> ¡Cita agendada! Tu número de cita es <strong>${data.numero_cita}</strong>. Recibirás confirmación en tu correo.`,
        'success'
      );
      form.reset();
      selectedTime = null;
      document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      showAlert(err.message || 'Error al agendar. Intenta nuevamente.', 'error');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Confirmar Cita';
    }
  });
}

// ── Selección de hora (global para onclick) ──────
// ── Horarios disponibles por fecha (consulta BD real) ──────────
const HORARIOS_NEGOCIO = [
  '9:00 AM','10:00 AM','11:00 AM','12:00 PM',
  '2:00 PM','3:00 PM','4:00 PM','5:00 PM'
];

async function cargarSlotsDisponibles(fecha) {
  const container = document.getElementById('timeSlots');
  if (!container || !fecha) return;

  selectedTime = null;
  container.innerHTML = '<div style="color:var(--muted,#888);font-size:14px;padding:12px;grid-column:1/-1;"><i class="fa-solid fa-spinner fa-spin"></i> Verificando disponibilidad...</div>';

  try {
    // Obtener citas ya agendadas para esa fecha
    const res  = await fetch(`${API_URL}/citas.php?fecha=${fecha}&limit=50`);
    const data = await res.json();
    // Horarios ya ocupados ese día
    const ocupados = new Set(
      (data.citas || [])
        .filter(c => c.estado !== 'cancelada')
        .map(c => c.rango_horario)
    );

    // Verificar si el día es válido (no pasado, no domingo/sábado)
    const fechaObj = new Date(fecha + 'T12:00:00'); // noon para evitar timezone issues
    const diaSemana = fechaObj.getDay(); // 0=dom, 6=sab
    const hoy = new Date(); hoy.setHours(0,0,0,0);
    const fechaSelec = new Date(fecha + 'T00:00:00');

    if (fechaSelec < hoy) {
      container.innerHTML = '<div style="color:#c62828;font-size:14px;padding:12px;grid-column:1/-1;">No puedes agendar en fechas pasadas.</div>';
      return;
    }
    if (diaSemana === 0 || diaSemana === 6) {
      container.innerHTML = '<div style="color:#c62828;font-size:14px;padding:12px;grid-column:1/-1;">Solo atendemos de lunes a viernes. Selecciona otro día.</div>';
      return;
    }

    // Renderizar slots
    const slots = HORARIOS_NEGOCIO.map(hora => {
      const ocupado = ocupados.has(hora);
      return `<div class="time-slot${ocupado ? ' unavailable' : ''}"${!ocupado ? ` onclick="selectTime(this)"` : ''} title="${ocupado ? 'Horario no disponible' : 'Seleccionar este horario'}">${hora}</div>`;
    });

    container.innerHTML = slots.join('');

    const libres = HORARIOS_NEGOCIO.length - ocupados.size;
    if (libres === 0) {
      container.innerHTML += '<div style="color:#c62828;font-size:13px;padding:6px;grid-column:1/-1;"><i class="fa-solid fa-circle-exclamation"></i> No hay horarios disponibles para este día. Selecciona otra fecha.</div>';
    }

  } catch(e) {
    console.warn('Error cargando slots:', e);
    // Fallback: mostrar todos los horarios sin verificación
    container.innerHTML = HORARIOS_NEGOCIO.map(hora =>
      `<div class="time-slot" onclick="selectTime(this)">${hora}</div>`
    ).join('');
  }
}

function selectTime(element) {
  if (element.classList.contains('unavailable')) return;
  document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
  element.classList.add('selected');
  selectedTime = element.textContent.trim().split('\n')[0].trim();
}

// ── Seguimiento ──────────────────────────────────
function initSeguimiento() {
  const trackingResult = document.getElementById('trackingResult');
  if (trackingResult) trackingResult.style.display = 'none';
}

async function trackOrder() {
  const input          = document.getElementById('trackingNumber');
  const trackingNumber = (input?.value || '').trim().toUpperCase();
  const resultBox      = document.getElementById('trackingResult');
  const btn            = document.querySelector('.btn-track');

  if (!trackingNumber) {
    showAlert('Por favor ingresa un número de seguimiento', 'error'); return;
  }

  const regexPedido = /^WH-\d{4}-\d{6}$/;
  const regexCit    = /^CIT-\d{4}-\d{6}$/;
  const regexCot    = /^COT-\d{4,}-\d+$/i;
  const esPedido    = regexPedido.test(trackingNumber);
  const esCita      = regexCit.test(trackingNumber);
  const esCot       = regexCot.test(trackingNumber);

  if (!esPedido && !esCita && !esCot) {
    showAlert('Formato inválido. Usa: WH-2026-000001 (pedido) · CIT-2026-000001 (cita) · COT-2026-000001 (cotización)', 'error');
    return;
  }

  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...'; }
  if (resultBox) resultBox.innerHTML = '';

  try {
    let endpoint = '';
    if (esPedido) endpoint = `${API_URL}/pedidos.php?numero=${encodeURIComponent(trackingNumber)}`;
    else if (esCita) endpoint = `${API_URL}/citas.php?numero_cita=${encodeURIComponent(trackingNumber)}`;
    else endpoint = `${API_URL}/cotizaciones.php?numero=${encodeURIComponent(trackingNumber)}`;

    const res  = await fetch(endpoint);
    const data = await res.json().catch(() => ({}));

    if (!data.success || (!data.pedido && !data.cotizacion && !data.cita)) {
      if (resultBox) resultBox.innerHTML = '';
      showAlert('No se encontró ninguna solicitud con ese número.', 'error');
      return;
    }

    const item = data.pedido || data.cotizacion || data.cita;
    const tipo = data.pedido ? 'Pedido' : data.cita ? 'Cita' : 'Cotización';
    const folio = item.numero_pedido || item.numero_cita || item.numero_cotizacion || trackingNumber;

    const estadoLabels = {
      nueva:'Nueva', pendiente:'Pendiente', pagado:'Pago confirmado',
      en_produccion:'En producción', listo:'Listo para entrega',
      entregado:'Entregado', cancelado:'Cancelado',
      en_revision:'En revisión', respondida:'Respondida', cerrada:'Cerrada',
      confirmada:'Confirmada', completada:'Completada'
    };
    const estadoColors = {
      nueva:'#4a7c8b', pendiente:'#8b7355', pagado:'#4a7c8b',
      en_produccion:'#6d5a8b', listo:'#3d7a5a', entregado:'#4a8b5a',
      cancelado:'#8b4a4a', en_revision:'#8b7355', respondida:'#4a8b5a',
      cerrada:'#555', confirmada:'#4a8b5a', completada:'#3d7a5a'
    };
    const est   = item.estado || 'nueva';
    const label = estadoLabels[est] || est;
    const color = estadoColors[est] || '#8b7355';
    const fechaCreada = (item.fecha_creacion || '').substring(0, 10);

    // Timeline para pedidos
    let timelineHtml = '';
    if (data.pedido && est !== 'cancelado') {
      const stages     = ['pendiente','pagado','en_produccion','listo','entregado'];
      const stageLabels = ['Recibido','Pagado','En fab.','Listo','Entregado'];
      const stageIdx   = stages.indexOf(est);
      timelineHtml = `
        <div class="track-timeline">
          <div class="track-timeline-label">Progreso del pedido</div>
          <div class="track-timeline-steps">
            ${stages.map((s,i) => {
              const done    = i < stageIdx;
              const current = i === stageIdx;
              return `<div class="track-step">
                ${i>0?`<div class="track-step-connector${done||current?' done':''}"></div>`:''}
                <div class="track-step-dot${current?' current':done?' done':''}">
                  ${done?'✓':current?'●':''}
                </div>
                <div class="track-step-name${current||done?' active':''}">${stageLabels[i]}</div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
    }

    // Info extra
    let infoItems = `
      <div class="track-info-item">
        <div class="track-info-label">Cliente</div>
        <div class="track-info-value">${item.nombre_cliente || '—'}</div>
      </div>
      <div class="track-info-item">
        <div class="track-info-label">Registrado</div>
        <div class="track-info-value">${fechaCreada}</div>
      </div>`;

    if (data.pedido) {
      if (item.fecha_estimada) infoItems += `
        <div class="track-info-item">
          <div class="track-info-label">Entrega estimada</div>
          <div class="track-info-value">${item.fecha_estimada}</div>
        </div>`;
      if (item.total) infoItems += `
        <div class="track-info-item">
          <div class="track-info-label">Total</div>
          <div class="track-info-value" style="color:#8b7355;font-size:16px;">${new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(item.total)}</div>
        </div>`;
    }
    if (data.cita) {
      if (item.fecha_cita) infoItems += `
        <div class="track-info-item">
          <div class="track-info-label">Fecha de cita</div>
          <div class="track-info-value">${item.fecha_cita}</div>
        </div>`;
      if (item.rango_horario) infoItems += `
        <div class="track-info-item">
          <div class="track-info-label">Horario</div>
          <div class="track-info-value">${item.rango_horario}</div>
        </div>`;
      const tipoLabels = { medicion:'Medición 📐', instalacion:'Instalación 🔧', otro:'Otro' };
      infoItems += `
        <div class="track-info-item">
          <div class="track-info-label">Tipo</div>
          <div class="track-info-value">${tipoLabels[item.tipo]||item.tipo||'—'}</div>
        </div>`;
    }
    if (data.cotizacion) {
      if (item.tipo_mueble) infoItems += `
        <div class="track-info-item">
          <div class="track-info-label">Tipo de mueble</div>
          <div class="track-info-value">${item.tipo_mueble}</div>
        </div>`;
    }

    if (resultBox) {
      resultBox.innerHTML = `
        <div class="track-result-card">
          <div class="track-result-header">
            <div>
              <div class="track-tipo">${tipo}</div>
              <div class="track-folio">${folio}</div>
            </div>
            <span class="track-status-badge" style="background:${color}30;color:${color};border:1px solid ${color}50;">${label}</span>
          </div>
          <div class="track-result-body">
            ${timelineHtml}
            <div class="track-info-grid">${infoItems}</div>
          </div>
          <div class="track-result-footer">
            <i class="fa-solid fa-envelope"></i>
            ¿Dudas? Escríbenos a <a href="mailto:soporte@muebleswh.com">soporte@muebleswh.com</a>
          </div>
        </div>`;
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  } catch (err) {
    if (resultBox) resultBox.innerHTML = '';
    showAlert('Error al consultar. Por favor intenta más tarde.', 'error');
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<i class="fa-solid fa-search"></i> Buscar'; }
  }
}

// ── Mostrar/Ocultar campo medidas ─────────────────
function initMedidasField() {
  const sel    = document.getElementById('tieneMedidas');
  const campo  = document.getElementById('medidasField');
  if (!sel || !campo) return;
  campo.style.display = 'none';
  sel.addEventListener('change', (e) => {
    const show = e.target.value === 'si';
    campo.style.display = show ? 'block' : 'none';
    const inp = campo.querySelector('input, textarea');
    if (inp) inp.required = show;
  });
}

// ── Fecha mínima para cita (mañana) ──────────────
function setMinDate() {
  const fechaCita = document.getElementById('fechaCita');
  if (!fechaCita) return;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  fechaCita.min = tomorrow.toISOString().split('T')[0];
}

// ── Alertas ───────────────────────────────────────
function showAlert(message, type = 'info') {
  const alertDiv = document.getElementById('alertMessage');

  if (alertDiv) {
    // Remover clases anteriores y aplicar la nueva
    alertDiv.className = 'alert';
    alertDiv.classList.add(type); // .alert.success / .alert.error / .alert.warning
    alertDiv.classList.add('show');
    alertDiv.style.display = 'block'; // asegurar visibilidad
    alertDiv.innerHTML = message;
    alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    // Auto-ocultar éxito y advertencias
    if (type === 'success' || type === 'warning') {
      setTimeout(() => {
        alertDiv.classList.remove('show');
        alertDiv.style.display = 'none';
      }, 7000);
    }
    return;
  }

  // Fallback: toast flotante
  const colors = { success: '#27ae60', error: '#e74c3c', info: '#8b7355', warning: '#f39c12' };
  const bg = colors[type] || colors.info;
  const toast = document.createElement('div');
  toast.innerHTML = message;
  toast.style.cssText = [
    'position:fixed', 'top:24px', 'right:24px', 'z-index:10000', 'padding:14px 22px',
    `background:${bg}`, 'color:#fff', 'border-radius:10px', 'font-size:14px', 'font-weight:600',
    'box-shadow:0 4px 20px rgba(0,0,0,.4)', 'max-width:380px', 'line-height:1.5',
    'border-left:4px solid rgba(255,255,255,.4)'
  ].join(';') + ';';
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
}

// ── Validaciones ──────────────────────────────────
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

window.selectTime  = selectTime;
window.trackOrder  = trackOrder;