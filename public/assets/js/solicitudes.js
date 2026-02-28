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
      fecha_cita:        `${fechaSeleccionada} ${selectedTime}:00`,
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
  const trackingNumber = input?.value.trim();
  const resultBox      = document.getElementById('trackingResult');

  if (!trackingNumber) {
    showAlert('Por favor ingresa un número de pedido o cotización', 'error'); return;
  }

  // Acepta WH-YYYY-NNNNNN (pedido) o COT-YYYY-NNNNNN (cotización)
  const regexPedido = /^WH-\d{4}-\d{6}$/;
  const regexCot    = /^COT-\d{4,}-\d+$/i;

  if (!regexPedido.test(trackingNumber) && !regexCot.test(trackingNumber)) {
    showAlert('Formato inválido. Ejemplo: WH-2025-000001 o COT-2025-000001', 'error'); return;
  }

  try {
    // Intentar buscar como pedido
    const endpoint = regexPedido.test(trackingNumber)
      ? `${API_URL}/pedidos.php?numero=${encodeURIComponent(trackingNumber)}`
      : `${API_URL}/cotizaciones.php?numero=${encodeURIComponent(trackingNumber)}`;

    const res  = await fetch(endpoint);
    const ct   = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) throw new Error('Error al consultar');
    const data = await res.json();

    if (data.success && (data.pedido || data.cotizacion)) {
      const item  = data.pedido || data.cotizacion;
      const tipo  = data.pedido ? 'pedido' : 'cotización';
      const estado = item.estado || 'nueva';
      const estadoLabel = {
        nueva: 'Nueva', pendiente: 'Pendiente', en_proceso: 'En proceso', pagado: 'Pagado',
        fabricando: 'En fabricación', listo: 'Listo para entrega', entregado: 'Entregado',
        en_revision: 'En revisión', respondida: 'Respondida', cerrada: 'Cerrada'
      }[estado] || estado;

      if (resultBox) {
        resultBox.style.display = 'block';
        resultBox.innerHTML = `
          <div style="background:#2d2d2d;border:2px solid #8b7355;border-radius:14px;padding:24px;margin-top:16px;">
            <h3 style="color:#8b7355;margin-bottom:12px;"><i class="fa-solid fa-magnifying-glass"></i> ${tipo.charAt(0).toUpperCase()+tipo.slice(1)} encontrad${tipo==='pedido'?'o':'a'}</h3>
            <div style="display:grid;gap:8px;">
              <p style="color:#e0e0e0;"><strong>Número:</strong> <span style="color:#8b7355;">${item.numero_pedido || item.numero_cotizacion}</span></p>
              <p style="color:#e0e0e0;"><strong>Cliente:</strong> ${item.nombre_cliente}</p>
              <p style="color:#e0e0e0;"><strong>Estado:</strong> <span style="background:rgba(139,115,85,.2);color:#8b7355;padding:3px 10px;border-radius:6px;font-weight:700;">${estadoLabel}</span></p>
              ${item.total ? `<p style="color:#e0e0e0;"><strong>Total:</strong> ${new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(item.total)}</p>` : ''}
              ${item.fecha_estimada ? `<p style="color:#e0e0e0;"><strong>Entrega estimada:</strong> ${item.fecha_estimada}</p>` : ''}
              <p style="color:#e0e0e0;"><strong>Fecha:</strong> ${new Date(item.fecha_creacion).toLocaleDateString('es-MX',{year:'numeric',month:'long',day:'numeric'})}</p>
            </div>
          </div>`;
        showAlert('<i class="fa-solid fa-circle-check"></i> Solicitud encontrada', 'success');
        resultBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      if (resultBox) resultBox.style.display = 'none';
      showAlert('No se encontró ninguna solicitud con ese número. Verifica e intenta de nuevo.', 'error');
    }
  } catch (err) {
    showAlert('Error al consultar. Por favor intenta más tarde.', 'error');
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