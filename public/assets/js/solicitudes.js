// =====================================================
// Wooden House — Solicitudes
// Cotización · Cita · Seguimiento
// =====================================================
const API_URL = '/api';

let selectedTime = null;

document.addEventListener('DOMContentLoaded', function () {
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
  initRealTimeValidation();

  // Pre-llenar datos de contacto si el cliente tiene sesión activa
  prefillContactoSiLogueado();
});

// ── Menú hamburguesa ──────────────────────────────────────────────
function initMenuHamburguesa() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks   = document.getElementById('navLinks');
  if (!menuToggle || !navLinks) return;
  menuToggle.addEventListener('click', function (e) {
    e.preventDefault(); e.stopPropagation();
    navLinks.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });
  document.addEventListener('click', function (e) {
    if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }
  });
}

// ── Cart badge ────────────────────────────────────────────────────
function initCartBadge() {
  const badge = document.getElementById('cartCount');
  if (!badge) return;
  try {
    const carrito = JSON.parse(sessionStorage.getItem('wh_carrito') || '[]');
    const total   = carrito.reduce((s, i) => s + (i.cantidad || 0), 0);
    badge.textContent   = total;
    badge.style.display = total > 0 ? 'inline-block' : 'none';
  } catch { badge.style.display = 'none'; }
}

// ── URL params: tab y seguimiento desde pago ──────────────────────
function checkURLParams() {
  const params = new URLSearchParams(window.location.search);
  const tab    = params.get('tab');
  if (tab) {
    const btn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
    if (btn) btn.click();
  }
  const token  = params.get('token');
  const pedido = params.get('pedido');
  if (token && pedido) {
    const btn = document.querySelector('.tab-btn[data-tab="seguimiento"]');
    if (btn) btn.click();
    const trackInput = document.getElementById('trackingNumber');
    if (trackInput) { trackInput.value = pedido; trackOrder(); }
  }
}

// ── Tabs ──────────────────────────────────────────────────────────
function initTabs() {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      this.classList.add('active');
      const target = document.getElementById('tab-' + this.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// ── Validación en tiempo real (feedback visual por campo) ─────────
function initRealTimeValidation() {
  // Email: mostrar feedback al salir del campo
  document.querySelectorAll('input[type="email"]').forEach(input => {
    input.addEventListener('blur', function () {
      const val = this.value.trim();
      if (!val) return;
      if (!isValidEmail(val)) {
        this.style.borderColor = '#8b4a4a';
        showFieldError(this, 'Correo electrónico inválido. Ejemplo: nombre@dominio.com');
      } else {
        this.style.borderColor = '#3d6b47';
        clearFieldError(this);
      }
    });
    input.addEventListener('input', function () {
      // Bloquear caracteres que no pueden estar en un email
      this.value = this.value.replace(/[^a-zA-Z0-9._%+\-@]/g, '');
      // Limpiar error mientras escribe
      clearFieldError(this);
      this.style.borderColor = '';
    });
  });

  // Teléfono: solo permitir caracteres válidos mientras escribe
  document.querySelectorAll('input[type="tel"]').forEach(input => {
    input.addEventListener('input', function () {
      // Eliminar caracteres no permitidos en tiempo real
      this.value = this.value.replace(/[^0-9\s+\-().]/g, '');
    });
    input.addEventListener('blur', function () {
      const val = this.value.trim();
      if (!val) return;
      if (!isValidPhone(val)) {
        this.style.borderColor = '#8b4a4a';
        showFieldError(this, 'Ingresa al menos 10 dígitos');
      } else {
        this.style.borderColor = '#3d6b47';
        clearFieldError(this);
      }
    });
  });

  // Nombre: bloquear caracteres de inyección mientras escribe
  document.querySelectorAll('input[name="nombre"]').forEach(input => {
    input.addEventListener('input', function () {
      // Eliminar caracteres peligrosos en tiempo real (SQL, HTML, scripts)
      this.value = this.value.replace(/[<>"'`;\\]/g, '');
    });
  });

  // Dirección y ciudad: bloquear caracteres de inyección
  document.querySelectorAll('input[name="direccion"], input[name="ciudad"]').forEach(input => {
    input.addEventListener('input', function () {
      this.value = this.value.replace(/[<>"'`;\\]/g, '');
    });
  });

  // Confirmar correo: bloquear pegar y verificar coincidencia
  document.querySelectorAll('input[name="emailConfirm"]').forEach(input => {
    input.addEventListener('paste', (e) => e.preventDefault());
    input.addEventListener('input', function () {
      this.value = this.value.replace(/[^a-zA-Z0-9._%+\-@]/g, '');
      clearFieldError(this);
      this.style.borderColor = '';
    });
    input.addEventListener('blur', function () {
      const emailField = this.closest('form')?.querySelector('input[name="email"]');
      const original = emailField?.value.trim().toLowerCase() || '';
      const confirm  = this.value.trim().toLowerCase();
      if (!confirm) return;
      if (confirm !== original) {
        this.style.borderColor = '#8b4a4a';
        showFieldError(this, 'Los correos no coinciden');
      } else {
        this.style.borderColor = '#3d6b47';
        clearFieldError(this);
      }
    });
  });

  // Textareas: solo permitir letras, números, acentos y puntuación básica
  document.querySelectorAll('textarea').forEach(area => {
    area.addEventListener('input', function () {
      this.value = this.value
        .replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9 \n\r.,;:!?()\-\/°%@]/g, '');
    });
  });
}

function showFieldError(input, msg) {
  clearFieldError(input);
  const err = document.createElement('div');
  err.className = 'field-error-msg';
  err.style.cssText = 'color:#e74c3c;font-size:12px;margin-top:5px;font-weight:500;';
  err.textContent = msg;
  input.parentNode.appendChild(err);
}

function clearFieldError(input) {
  const prev = input.parentNode.querySelector('.field-error-msg');
  if (prev) prev.remove();
}

// ── Formulario Cotización ─────────────────────────────────────────
function initFormCotizacion() {
  const form = document.getElementById('formCotizacion');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const fd = new FormData(form);

    // Recoger y sanitizar TODOS los campos
    const datos = {
      nombre_cliente:        sanitizeName(fd.get('nombre') || ''),
      correo_cliente:        sanitizeEmail(fd.get('email') || ''),
      telefono_cliente:      sanitizePhone(fd.get('telefono') || ''),
      modelo_mueble:           sanitizeText(fd.get('modeloMueble') || '', 100),
      descripcion_solicitud: sanitizeDescription(fd.get('descripcion') || ''),
      tiene_medidas:         fd.get('tieneMedidas') === 'si' ? 1 : 0,
      medidas:               sanitizeDescription(fd.get('medidas') || '', 500),
      rango_presupuesto:     sanitizeText(fd.get('presupuesto') || '', 50),
      requiere_instalacion:  fd.get('instalacion') === 'si' ? 1 : 0,
      ciudad:                sanitizeText(fd.get('ciudad') || '', 100),
      urgencia:              sanitizeText(fd.get('urgencia') || '', 50),
      instalacion:           sanitizeText(fd.get('instalacion') || '', 30),
      // Anti-bot honeypot fields (always empty for real users)
      _hp:     fd.get('_hp')      || '',
      website: fd.get('website')  || '',
      url:     fd.get('url')      || '',
    };

    // Validaciones obligatorias
    if (!datos.nombre_cliente) {
      showAlert('Por favor ingresa tu nombre completo', 'error'); return;
    }
    if (!datos.correo_cliente) {
      showAlert('Por favor ingresa tu correo electrónico', 'error'); return;
    }
    if (!isValidEmail(datos.correo_cliente)) {
      showAlert('El correo electrónico no es válido. Ejemplo: nombre@dominio.com', 'error'); return;
    }
    const emailConfirmCot = sanitizeEmail(fd.get('emailConfirm') || '');
    if (!emailConfirmCot || emailConfirmCot !== datos.correo_cliente) {
      showAlert('Los correos electrónicos no coinciden. Verifícalos e intenta nuevamente.', 'error');
      document.querySelector('#formCotizacion [name="emailConfirm"]')?.focus();
      return;
    }
    if (!datos.telefono_cliente) {
      showAlert('Por favor ingresa tu teléfono', 'error'); return;
    }
    if (!isValidPhone(datos.telefono_cliente)) {
      showAlert('El teléfono debe tener al menos 10 dígitos', 'error'); return;
    }
    if (!datos.descripcion_solicitud || datos.descripcion_solicitud.length < 10) {
      showAlert('Por favor describe tu proyecto con al menos 10 caracteres', 'error');
      document.querySelector('[name="descripcion"]')?.focus();
      return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled    = true;
    btn.innerHTML   = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

    try {
      const res  = await fetch(`${API_URL}/cotizaciones.php`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(datos),
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
      btn.disabled  = false;
      btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> Enviar Solicitud de Cotización';
    }
  });
}

// ── Formulario Cita ───────────────────────────────────────────────
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

    // Recoger y sanitizar TODOS los campos
    const datos = {
      nombre_cliente:   sanitizeName(fd.get('nombre') || ''),
      correo_cliente:   sanitizeEmail(fd.get('email') || ''),
      telefono_cliente: sanitizePhone(fd.get('telefono') || ''),
      direccion:        sanitizeText(fd.get('direccion') || '', 200),
      fecha_cita:       fechaSeleccionada,
      rango_horario:    selectedTime,
      tipo:             'medicion',
      notas:            sanitizeDescription(fd.get('notas') || '', 500),
      // Anti-bot honeypot fields
      _hp:     fd.get('_hp')      || '',
      website: fd.get('website')  || '',
      url:     fd.get('url')      || '',
    };

    // Validaciones obligatorias
    if (!datos.nombre_cliente) {
      showAlert('Por favor ingresa tu nombre completo', 'error'); return;
    }
    if (!datos.correo_cliente) {
      showAlert('Por favor ingresa tu correo electrónico', 'error'); return;
    }
    if (!isValidEmail(datos.correo_cliente)) {
      showAlert('El correo electrónico no es válido. Ejemplo: nombre@dominio.com', 'error'); return;
    }
    const emailConfirmCit = sanitizeEmail(fd.get('emailConfirm') || '');
    if (!emailConfirmCit || emailConfirmCit !== datos.correo_cliente) {
      showAlert('Los correos electrónicos no coinciden. Verifícalos e intenta nuevamente.', 'error');
      document.querySelector('#formCita [name="emailConfirm"]')?.focus();
      return;
    }
    if (!datos.telefono_cliente) {
      showAlert('Por favor ingresa tu teléfono', 'error'); return;
    }
    if (!isValidPhone(datos.telefono_cliente)) {
      showAlert('El teléfono debe tener al menos 10 dígitos', 'error'); return;
    }

    const btn = form.querySelector('button[type="submit"]');
    btn.disabled    = true;
    btn.innerHTML   = '<i class="fa-solid fa-spinner fa-spin"></i> Agendando...';

    try {
      const res  = await fetch(`${API_URL}/citas.php`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(datos),
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
      btn.disabled  = false;
      btn.innerHTML = '<i class="fa-solid fa-calendar-check"></i> Confirmar Cita';
    }
  });
}

// ── Slots de horario ──────────────────────────────────────────────
const HORARIOS_NEGOCIO = [
  '9:00 AM','10:00 AM','11:00 AM','12:00 PM',
  '2:00 PM','3:00 PM','4:00 PM','5:00 PM'
];

async function cargarSlotsDisponibles(fecha) {
  const container = document.getElementById('timeSlots');
  if (!container || !fecha) return;

  selectedTime = null;
  container.innerHTML = '<div style="color:#888;font-size:14px;padding:12px;grid-column:1/-1;"><i class="fa-solid fa-spinner fa-spin"></i> Verificando disponibilidad...</div>';

  try {
    const res   = await fetch(`${API_URL}/citas.php?fecha=${encodeURIComponent(fecha)}&limit=50`);
    const data  = await res.json();
    const ocupados = new Set(
      (data.citas || [])
        .filter(c => c.estado !== 'cancelada')
        .map(c => c.rango_horario)
    );

    const fechaObj   = new Date(fecha + 'T12:00:00');
    const diaSemana  = fechaObj.getDay();
    const hoy        = new Date(); hoy.setHours(0, 0, 0, 0);
    const fechaSelec = new Date(fecha + 'T00:00:00');

    if (fechaSelec < hoy) {
      container.innerHTML = '<div style="color:#c62828;font-size:14px;padding:12px;grid-column:1/-1;">No puedes agendar en fechas pasadas.</div>';
      return;
    }
    if (diaSemana === 0 || diaSemana === 6) {
      container.innerHTML = '<div style="color:#c62828;font-size:14px;padding:12px;grid-column:1/-1;">Solo atendemos de lunes a viernes.</div>';
      return;
    }

    container.innerHTML = HORARIOS_NEGOCIO.map(hora => {
      const ocupado = ocupados.has(hora);
      return `<div class="time-slot${ocupado ? ' unavailable' : ''}"${!ocupado ? ` onclick="selectTime(this)"` : ''} title="${ocupado ? 'Horario no disponible' : 'Seleccionar'}">${hora}</div>`;
    }).join('');

    if (HORARIOS_NEGOCIO.length === ocupados.size) {
      container.innerHTML += '<div style="color:#c62828;font-size:13px;padding:6px;grid-column:1/-1;"><i class="fa-solid fa-circle-exclamation"></i> Sin horarios para este día.</div>';
    }
  } catch (e) {
    console.warn('Error cargando slots:', e);
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

// ── Seguimiento ───────────────────────────────────────────────────
function initSeguimiento() {
  const resultBox = document.getElementById('trackingResult');
  if (resultBox) {
    resultBox.style.display = 'none';
    resultBox.innerHTML = '';
  }

  const input = document.getElementById('trackingNumber');
  if (input) {
    // Enter lanza la búsqueda
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); trackOrder(); }
    });
    // Convertir a mayúsculas mientras se escribe y bloquear caracteres raros
    input.addEventListener('input', function () {
      this.value = this.value.toUpperCase().replace(/[^A-Z0-9\-]/g, '');
    });
  }
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
  const regexCita   = /^CIT-\d{4}-\d{6}$/;
  const regexCot    = /^COT-\d{4,}-\d+$/;
  const esPedido    = regexPedido.test(trackingNumber);
  const esCita      = regexCita.test(trackingNumber);
  const esCot       = regexCot.test(trackingNumber);

  if (!esPedido && !esCita && !esCot) {
    showAlert('Formato inválido. Ejemplos: WH-2026-000001 · CIT-2026-000001 · COT-2026-1', 'error');
    return;
  }

  // Estado: buscando
  if (btn) {
    btn.disabled  = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Buscando...';
  }
  if (resultBox) {
    resultBox.style.display = 'none';
    resultBox.innerHTML = '';
  }

  try {
    let endpoint = '';
    if (esPedido)    endpoint = `${API_URL}/pedidos.php?numero=${encodeURIComponent(trackingNumber)}`;
    else if (esCita) endpoint = `${API_URL}/citas.php?numero_cita=${encodeURIComponent(trackingNumber)}`;
    else             endpoint = `${API_URL}/cotizaciones.php?numero=${encodeURIComponent(trackingNumber)}`;

    const res  = await fetch(endpoint);

    // Verificar que la respuesta sea JSON antes de parsear
    const ct = res.headers.get('content-type') || '';
    if (!ct.includes('application/json')) {
      throw new Error('El servidor no respondió correctamente. Intenta más tarde.');
    }

    const data = await res.json();

    if (!data.success || (!data.pedido && !data.cotizacion && !data.cita)) {
      showAlert('No se encontró ninguna solicitud con ese número. Verifica que esté escrito correctamente.', 'error');
      return;
    }

    const item  = data.pedido || data.cotizacion || data.cita;
    const tipo  = data.pedido ? 'Pedido' : data.cita ? 'Cita' : 'Cotización';
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

    const est         = item.estado || 'nueva';
    const label       = estadoLabels[est] || est;
    const color       = estadoColors[est] || '#8b7355';
    const fechaCreada = (item.fecha_creacion || '').substring(0, 10);

    // Timeline para pedidos
    let timelineHtml = '';
    if (data.pedido && est !== 'cancelado') {
      const stages      = ['pendiente','pagado','en_produccion','listo','entregado'];
      const stageLabels = ['Recibido','Pagado','En fab.','Listo','Entregado'];
      const stageIdx    = stages.indexOf(est);
      timelineHtml = `
        <div class="track-timeline">
          <div class="track-timeline-label">Progreso del pedido</div>
          <div class="track-timeline-steps">
            ${stages.map((_s, i) => {
              const done    = i < stageIdx;
              const current = i === stageIdx;
              return `<div class="track-step">
                ${i > 0 ? `<div class="track-step-connector${done || current ? ' done' : ''}"></div>` : ''}
                <div class="track-step-dot${current ? ' current' : done ? ' done' : ''}">
                  ${done ? '✓' : current ? '●' : ''}
                </div>
                <div class="track-step-name${current || done ? ' active' : ''}">${stageLabels[i]}</div>
              </div>`;
            }).join('')}
          </div>
        </div>`;
    }

    // Info grid
    let infoItems = `
      <div class="track-info-item">
        <div class="track-info-label">Cliente</div>
        <div class="track-info-value">${escapeHtml(item.nombre_cliente || '—')}</div>
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
          <div class="track-info-value" style="color:#8b7355;font-size:16px;">
            ${new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN' }).format(item.total)}
          </div>
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
          <div class="track-info-value">${escapeHtml(item.rango_horario)}</div>
        </div>`;
      const tipoLabels = { medicion:'Medición', instalacion:'Instalación', otro:'Otro' };
      infoItems += `
        <div class="track-info-item">
          <div class="track-info-label">Tipo</div>
          <div class="track-info-value">${tipoLabels[item.tipo] || escapeHtml(item.tipo) || '—'}</div>
        </div>`;
    }

    if (data.cotizacion) {
      if (item.modelo_mueble) infoItems += `
        <div class="track-info-item">
          <div class="track-info-label">Tipo de mueble</div>
          <div class="track-info-value">${escapeHtml(item.modelo_mueble)}</div>
        </div>`;
    }

    // Mostrar resultado
    if (resultBox) {
      resultBox.innerHTML = `
        <div class="track-result-card">
          <div class="track-result-header">
            <div>
              <div class="track-tipo">${tipo}</div>
              <div class="track-folio">${escapeHtml(folio)}</div>
            </div>
            <span class="track-status-badge" style="background:${color}30;color:${color};border:1px solid ${color}50;">
              ${escapeHtml(label)}
            </span>
          </div>
          <div class="track-result-body">
            ${timelineHtml}
            <div class="track-info-grid">${infoItems}</div>
          </div>
          <div class="track-result-footer">
            <i class="fa-solid fa-envelope"></i>
            ¿Dudas? Escríbenos a <a href="mailto:ventas@muebleswh.com">ventas@muebleswh.com</a>
          </div>
        </div>`;
      resultBox.style.display = 'block';
      resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

  } catch (err) {
    console.error('[seguimiento]', err);
    if (resultBox) { resultBox.innerHTML = ''; resultBox.style.display = 'none'; }
    showAlert(err.message || 'Error al consultar. Por favor intenta más tarde.', 'error');
  } finally {
    if (btn) {
      btn.disabled  = false;
      btn.innerHTML = '<i class="fa-solid fa-search"></i> Buscar';
    }
  }
}

// ── Mostrar/ocultar campo medidas ─────────────────────────────────
function initMedidasField() {
  const sel   = document.getElementById('tieneMedidas');
  const campo = document.getElementById('medidasField');
  if (!sel || !campo) return;
  campo.style.display = 'none';
  sel.addEventListener('change', (e) => {
    const show = e.target.value === 'si';
    campo.style.display = show ? 'block' : 'none';
    const inp = campo.querySelector('input, textarea');
    if (inp) inp.required = show;
  });
}

// ── Fecha mínima cita: mañana ─────────────────────────────────────
function setMinDate() {
  const fechaCita = document.getElementById('fechaCita');
  if (!fechaCita) return;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  fechaCita.min = tomorrow.toISOString().split('T')[0];
}

// ── Alertas ───────────────────────────────────────────────────────
function showAlert(message, type = 'info') {
  const alertDiv = document.getElementById('alertMessage');
  if (alertDiv) {
    alertDiv.className = 'alert ' + type + ' show';
    alertDiv.style.display = 'block';
    alertDiv.innerHTML = message;
    alertDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (type === 'success' || type === 'warning') {
      setTimeout(() => {
        alertDiv.classList.remove('show');
        alertDiv.style.display = 'none';
      }, 7000);
    }
    return;
  }
  // Fallback: toast
  const colors = { success:'#27ae60', error:'#e74c3c', info:'#8b7355', warning:'#f39c12' };
  const toast = document.createElement('div');
  toast.innerHTML = message;
  toast.style.cssText = `position:fixed;top:24px;right:24px;z-index:10000;padding:14px 22px;
    background:${colors[type]||colors.info};color:#fff;border-radius:10px;font-size:14px;
    font-weight:600;box-shadow:0 4px 20px rgba(0,0,0,.4);max-width:380px;line-height:1.5;
    font-family:'Segoe UI',Tahoma,sans-serif;border-left:4px solid rgba(255,255,255,.4);`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
}

// =====================================================
// SANITIZACIÓN Y VALIDACIÓN — aplica a TODOS los campos
// =====================================================

/**
 * Nombre: letras, números, espacios, acentos, puntuación básica.
 * Bloquea: HTML, SQL injection, scripts.
 */
function sanitizeName(val, maxLen = 100) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>/g, '')                            // quitar etiquetas HTML
    .replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9 .,'\-]/g, '') // solo caracteres válidos en nombres
    .substring(0, maxLen)
    .trim();
}

/**
 * Correo electrónico: normalizar y validar.
 * No se eliminan caracteres especiales legítimos del email (@, ., +, -, _).
 * Se elimina todo lo que no es parte de un email válido.
 */
function sanitizeEmail(val) {
  if (typeof val !== 'string') return '';
  return val
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._%+\-@]/g, '') // solo caracteres válidos en emails
    .substring(0, 150);
}

/**
 * Teléfono: solo números, espacios, +, -, paréntesis.
 */
function sanitizePhone(val) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/[^0-9\s+\-().]/g, '')
    .substring(0, 20)
    .trim();
}

/**
 * Texto general (campo corto): bloquea HTML, control chars y caracteres SQL peligrosos.
 * Permite puntuación normal, letras, números, acentos.
 */
function sanitizeText(val, maxLen = 300) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>/g, '')                                    // quitar tags HTML
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')         // chars de control
    .replace(/['";`\\]/g, '')                                   // chars SQL peligrosos
    .substring(0, maxLen)
    .trim();
}

/**
 * Descripción / texto largo: permite más caracteres pero bloquea inyección.
 * Conserva saltos de línea, comas, puntos, etc. — necesarios en descripciones.
 */
function sanitizeDescription(val, maxLen = 1000) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>/g, '')                            // quitar tags HTML
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // chars de control
    .replace(/['";`\\\\]/g, '')                          // chars SQL peligrosos (comillas, backtick, backslash)
    .replace(/;\s*(?:DROP|DELETE|INSERT|UPDATE|SELECT|CREATE|ALTER|EXEC)\b/gi, '') // SQL keywords en inyección
    .substring(0, maxLen)
    .trim();
}

/**
 * Valida correo: formato RFC básico, sin SQL chars.
 */
function isValidEmail(email) {
  if (typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  // Verificar que no tiene caracteres SQL peligrosos
  if (/['";`\\]/.test(clean)) return false;
  // Formato básico: algo@algo.algo
  return /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(clean);
}

/**
 * Valida teléfono: mínimo 10 dígitos.
 */
function isValidPhone(phone) {
  if (typeof phone !== 'string') return false;
  return phone.replace(/\D/g, '').length >= 10;
}

/**
 * Escapa HTML para insertar texto en el DOM de forma segura.
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── Pre-llenado de contacto para clientes con sesión ─────────────
/**
 * Si el cliente tiene sesión activa, oculta la sección de contacto y
 * muestra en su lugar una tarjeta con sus datos ya registrados.
 * Solo se muestran los campos que realmente faltan (p.ej. dirección).
 */
async function prefillContactoSiLogueado() {
  if (typeof AuthModal === 'undefined') return;

  let cliente = AuthModal.getCliente();
  if (!cliente) {
    try { cliente = await AuthModal.verificar(); } catch (_) { /* continuar sin sesión */ }
  }

  // Sin sesión: mostrar sugerencia de login (no bloqueante)
  if (!cliente) {
    _mostrarSugerenciaLogin();
    // Cuando el usuario inicie sesión desde la sugerencia, actualizar el formulario
    document.addEventListener('wh:autenticado', function onAuth(ev) {
      document.removeEventListener('wh:autenticado', onAuth);
      document.querySelectorAll('.login-suggest-card').forEach(c => c.remove());
      prefillContactoSiLogueado();
    }, { once: true });
    return;
  }

  const configs = [
    { formId: 'formCotizacion', sectionTitle: 'Información de Contacto' },
    { formId: 'formCita',       sectionTitle: 'Información de Contacto' },
  ];

  configs.forEach(({ formId }) => {
    const form = document.getElementById(formId);
    if (!form) return;

    // Sección de contacto = primera .form-section del formulario
    const seccion = form.querySelector('.form-section');
    if (!seccion) return;

    // Pre-llenar campos ocultos para que el submit los recoja
    const setVal = (name, val) => {
      const el = form.querySelector(`[name="${name}"]`);
      if (el && val) { el.value = val; el.setAttribute('data-prefilled', '1'); }
    };
    setVal('nombre',       cliente.nombre  || '');
    setVal('email',        cliente.correo  || '');
    setVal('emailConfirm', cliente.correo  || '');
    setVal('telefono',     cliente.telefono || '');

    // Construir tarjeta de sesión
    const inicial   = (cliente.nombre || 'C')[0].toUpperCase();
    const tieneTel  = !!(cliente.telefono);
    const cardHtml  = `
      <div class="sesion-card" id="sesionCard_${formId}">
        <div class="sesion-card-avatar">${escapeHtml(inicial)}</div>
        <div class="sesion-card-info">
          <div class="sesion-card-nombre">${escapeHtml(cliente.nombre || '')}</div>
          <div class="sesion-card-detalle">${escapeHtml(cliente.correo || '')}</div>
          ${tieneTel ? `<div class="sesion-card-detalle">${escapeHtml(cliente.telefono)}</div>` : ''}
        </div>
        <button type="button" class="sesion-card-editar"
                onclick="mostrarCamposContacto('${formId}')">
          <i class="fa-solid fa-pen-to-square"></i> Editar datos
        </button>
      </div>`;

    // Ocultar sección y mostrar card en su lugar
    seccion.style.display = 'none';
    seccion.insertAdjacentHTML('beforebegin', cardHtml);

    // Si no tiene teléfono, mostrar solo ese campo
    if (!tieneTel) {
      const telGroup = seccion.querySelector('[name="telefono"]')?.closest('.form-group');
      if (telGroup) {
        seccion.style.display = '';            // mostrar sección
        seccion.querySelectorAll('.form-group').forEach(g => { g.style.display = 'none'; });
        telGroup.style.display = '';           // solo teléfono visible
        // Actualizar card para indicar que falta el teléfono
        const card = document.getElementById(`sesionCard_${formId}`);
        if (card) {
          const info = card.querySelector('.sesion-card-info');
          if (info) info.insertAdjacentHTML('beforeend',
            '<div class="sesion-card-aviso"><i class="fa-solid fa-circle-exclamation"></i> Completa tu teléfono abajo</div>');
        }
      }
    }
  });
}

/** Muestra la sección completa de contacto y elimina la tarjeta de sesión */
function mostrarCamposContacto(formId) {
  const card = document.getElementById(`sesionCard_${formId}`);
  if (card) card.remove();

  const form = document.getElementById(formId);
  if (!form) return;
  const seccion = form.querySelector('.form-section');
  if (seccion) {
    seccion.style.display = '';
    seccion.querySelectorAll('.form-group').forEach(g => { g.style.display = ''; });
  }
}

/** Muestra una tarjeta de sugerencia de inicio de sesión antes del primer .form-section */
function _mostrarSugerenciaLogin() {
  ['formCotizacion', 'formCita'].forEach(formId => {
    const form = document.getElementById(formId);
    if (!form) return;
    const seccion = form.querySelector('.form-section');
    if (!seccion || document.getElementById(`loginSuggest_${formId}`)) return;
    const html = `
      <div class="login-suggest-card" id="loginSuggest_${formId}">
        <div class="login-suggest-icon"><i class="fa-solid fa-bolt"></i></div>
        <div class="login-suggest-text">
          <strong>¿Ya tienes cuenta?</strong>
          Inicia sesión y llenamos tus datos automáticamente.
        </div>
        <button type="button" class="login-suggest-btn"
                onclick="AuthModal.open()">Iniciar sesión</button>
        <button type="button" class="login-suggest-close"
                onclick="document.getElementById('loginSuggest_${formId}').remove()"
                aria-label="Cerrar sugerencia">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>`;
    seccion.insertAdjacentHTML('beforebegin', html);
  });
}

// Exponer funciones globales requeridas por el HTML
window.selectTime             = selectTime;
window.trackOrder             = trackOrder;
window.cargarSlotsDisponibles = cargarSlotsDisponibles;
window.mostrarCamposContacto  = mostrarCamposContacto;
