// ── Wooden House — Checkout ───────────────────────────────────────
const estado = {
    items:       [],
    tipoEntrega: 'recoger',
    instalacion: false,
    semana:      null,
    costos: { envio: 500, instalacion: 1500 },
};

const FORM_KEY = 'wh_checkout_form';

// ── Sanitización de campos de usuario ────────────────────────────
/** Escapa HTML — inserta texto en DOM de forma segura */
function escHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/** Nombre: solo letras, números, acentos y puntuación básica */
function sanitizeName(val, max = 150) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>/g, '')
    .replace(/[^a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9 .,'\-]/g, '')
    .substring(0, max).trim();
}

/** Email: solo caracteres válidos de RFC, sin SQL injection */
function sanitizeEmail(val) {
  if (typeof val !== 'string') return '';
  return val.trim().toLowerCase()
    .replace(/[^a-z0-9._%+\-@]/g, '')
    .substring(0, 150);
}

/** Teléfono: solo dígitos, espacios y separadores */
function sanitizePhone(val) {
  if (typeof val !== 'string') return '';
  return val.replace(/[^0-9\s+\-().]/g, '').substring(0, 20).trim();
}

/** Texto general: bloquea HTML y caracteres SQL peligrosos */
function sanitizeText(val, max = 300) {
  if (typeof val !== 'string') return '';
  return val
    .replace(/<[^>]*>/g, '')
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .replace(/['";`\\]/g, '')
    .substring(0, max).trim();
}

/** Código postal: solo dígitos */
function sanitizeCP(val) {
  if (typeof val !== 'string') return '';
  return val.replace(/\D/g, '').substring(0, 6);
}

/** Email válido: formato RFC básico + sin SQL chars */
function isEmailValido(email) {
  if (typeof email !== 'string') return false;
  const clean = email.trim().toLowerCase();
  if (/['";`\\]/.test(clean)) return false;
  return /^[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$/.test(clean);
}

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cargarItemsCarrito();
    renderizarItems();
    restaurarFormulario();
    prefillSiLogueado();

    if (!localStorage.getItem(FORM_KEY)) seleccionarEntrega('recoger', false);

    actualizarTotales();
    cargarFechasDisponibles();

    ['clienteNombre','clienteTelefono','clienteCorreo','clienteDireccion','clienteCiudad','clienteCP','clienteNotas']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.addEventListener('input', guardarFormulario); el.addEventListener('change', guardarFormulario); }
        });

    // Validación visual en tiempo real
    initValidacionCampos();

    const cpInput = document.getElementById('clienteCP');
    if (cpInput) {
        let debounceTimer;
        cpInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            if (cpInput.value.length === 5) debounceTimer = setTimeout(() => cargarFechasDisponibles(), 600);
        });
    }
});


// ── Validación visual en tiempo real ─────────────────────────────
function initValidacionCampos() {
    // Nombre: bloquear caracteres peligrosos mientras escribe
    const nombre = document.getElementById('clienteNombre');
    if (nombre) {
        nombre.addEventListener('input', function () {
            this.value = this.value.replace(/[<>"'`;\\]/g, '');
        });
    }

    // Teléfono: solo caracteres válidos
    const tel = document.getElementById('clienteTelefono');
    if (tel) {
        tel.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9\s+\-().]/g, '');
        });
        tel.addEventListener('blur', function () {
            const val = this.value.trim();
            if (val && !isValidPhone(val)) {
                this.style.borderColor = '#8b4a4a';
                mostrarErrorCampo(this, 'Mínimo 10 dígitos');
            } else if (val) {
                this.style.borderColor = '#3d6b47';
                limpiarErrorCampo(this);
            }
        });
        tel.addEventListener('input', function () { limpiarErrorCampo(this); this.style.borderColor = ''; });
    }

    // Email: validar al salir del campo + bloquear caracteres inválidos mientras escribe
    const correo = document.getElementById('clienteCorreo');
    if (correo) {
        correo.addEventListener('input', function () {
            // Bloquear caracteres que nunca pueden ser parte de un email válido
            this.value = this.value.replace(/[^a-zA-Z0-9._%+\-@]/g, '');
            limpiarErrorCampo(this);
            this.style.borderColor = '';
        });
        correo.addEventListener('blur', function () {
            const val = this.value.trim();
            if (val && !isEmailValido(sanitizeEmail(val))) {
                this.style.borderColor = '#8b4a4a';
                mostrarErrorCampo(this, 'Correo electrónico inválido. Ejemplo: nombre@dominio.com');
            } else if (val) {
                this.style.borderColor = '#3d6b47';
                limpiarErrorCampo(this);
            }
        });
    }

    // Confirmar correo: no pegar, verificar que coincida
    const correoConfirm = document.getElementById('clienteCorreoConfirm');
    if (correoConfirm) {
        correoConfirm.addEventListener('paste', (e) => e.preventDefault());
        correoConfirm.addEventListener('input', function () {
            this.value = this.value.replace(/[^a-zA-Z0-9._%+\-@]/g, '');
            limpiarErrorCampo(this);
            this.style.borderColor = '';
        });
        correoConfirm.addEventListener('blur', function () {
            const original = sanitizeEmail(document.getElementById('clienteCorreo')?.value || '');
            const confirm  = sanitizeEmail(this.value);
            if (!confirm) return;
            if (confirm !== original) {
                this.style.borderColor = '#8b4a4a';
                mostrarErrorCampo(this, 'Los correos no coinciden');
            } else {
                this.style.borderColor = '#3d6b47';
                limpiarErrorCampo(this);
            }
        });
    }

    // Dirección y ciudad: bloquear inyección
    ['clienteDireccion','clienteCiudad'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', function () {
            this.value = this.value.replace(/[<>"'`;\\]/g, '');
        });
    });

    // CP: solo dígitos
    const cp = document.getElementById('clienteCP');
    if (cp) cp.addEventListener('input', function () {
        this.value = this.value.replace(/\D/g, '').substring(0, 6);
    });

    // Notas: bloquear tags HTML
    const notas = document.getElementById('clienteNotas');
    if (notas) notas.addEventListener('input', function () {
        this.value = this.value.replace(/<[^>]*>/g, '').replace(/[`\\]/g, '');
    });
}

function mostrarErrorCampo(input, msg) {
    limpiarErrorCampo(input);
    const err = document.createElement('div');
    err.className = 'field-error-checkout';
    err.style.cssText = 'color:#e74c3c;font-size:12px;margin-top:4px;font-weight:500;';
    err.textContent = msg;
    input.parentNode.appendChild(err);
}

function limpiarErrorCampo(input) {
    const prev = input.parentNode?.querySelector('.field-error-checkout');
    if (prev) prev.remove();
}

// ── Persistencia del formulario ───────────────────────────────────
function guardarFormulario() {
    // Guardar datos ya sanitizados en localStorage para prevenir XSS almacenado
    const datos = {
        nombre:      sanitizeName(document.getElementById('clienteNombre')?.value    || ''),
        telefono:    sanitizePhone(document.getElementById('clienteTelefono')?.value  || ''),
        correo:      sanitizeEmail(document.getElementById('clienteCorreo')?.value    || ''),
        direccion:   sanitizeText(document.getElementById('clienteDireccion')?.value || '', 250),
        ciudad:      sanitizeText(document.getElementById('clienteCiudad')?.value    || '', 100),
        cp:          sanitizeCP(document.getElementById('clienteCP')?.value           || ''),
        notas:       sanitizeText(document.getElementById('clienteNotas')?.value      || '', 500),
        tipoEntrega: estado.tipoEntrega,
        instalacion: estado.instalacion,
    };
    localStorage.setItem(FORM_KEY, JSON.stringify(datos));
}

function restaurarFormulario() {
    try {
        const raw = localStorage.getItem(FORM_KEY);
        if (!raw) return;
        const datos = JSON.parse(raw);
        const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
        set('clienteNombre',    datos.nombre);
        set('clienteTelefono',  datos.telefono);
        set('clienteCorreo',    datos.correo);
        set('clienteDireccion', datos.direccion);
        set('clienteCiudad',    datos.ciudad);
        set('clienteCP',        datos.cp);
        set('clienteNotas',     datos.notas);
        if (datos.tipoEntrega) seleccionarEntrega(datos.tipoEntrega, false);
        if (typeof datos.instalacion === 'boolean') seleccionarInstalacion(datos.instalacion);
    } catch { /* silent */ }
}

// ── Pre-llenado para usuarios logueados ───────────────────────────
async function prefillSiLogueado() {
    try {
        let cliente = null;
        if (window.AuthModal && typeof AuthModal.getCliente === 'function') {
            cliente = AuthModal.getCliente();
        }
        if (!cliente && window.AuthModal && typeof AuthModal.verificar === 'function') {
            cliente = await AuthModal.verificar();
        }
        if (!cliente) {
            _mostrarSugerenciaLoginCheckout();
            document.addEventListener('wh:autenticado', function onAuth() {
                document.removeEventListener('wh:autenticado', onAuth);
                const s = document.getElementById('loginSuggestCheckout');
                if (s) s.remove();
                prefillSiLogueado();
            }, { once: true });
            return;
        }

        const set = (id, val) => {
            const el = document.getElementById(id);
            if (el && val && !el.value) { el.value = val; el.setAttribute('data-prefilled', '1'); }
        };
        set('clienteNombre',   cliente.nombre   || cliente.displayName || '');
        set('clienteCorreo',   cliente.email    || '');
        set('clienteTelefono', cliente.telefono || '');
        // Sync confirm email field if present
        const correoEl   = document.getElementById('clienteCorreo');
        const confirmEl  = document.getElementById('clienteCorreoConfirm');
        if (confirmEl && correoEl && correoEl.value && !confirmEl.value) {
            confirmEl.value = correoEl.value;
            confirmEl.setAttribute('data-prefilled', '1');
        }
        // Persist to localStorage so guardarFormulario keeps it
        guardarFormulario();
    } catch (e) { /* silent */ }
}

// ── Carrito ───────────────────────────────────────────────────────
function cargarItemsCarrito() {
    try {
        const raw = sessionStorage.getItem('wh_carrito');
        estado.items = raw ? JSON.parse(raw) : [];
    } catch { estado.items = []; }
}

function renderizarItems() {
    const cont  = document.getElementById('carritoItems');
    const resum = document.getElementById('resumenItems');
    if (!cont) return;

    if (estado.items.length === 0) {
        cont.innerHTML = `
            <div style="text-align:center;padding:40px;color:#888;">
                <div style="font-size:48px;margin-bottom:16px;"><i class="fa-solid fa-cart-shopping"></i></div>
                <p>Tu carrito está vacío.</p>
                <a href="/catalogo" class="btn-checkout" style="display:inline-block;margin-top:16px;text-decoration:none;">Ver catálogo</a>
            </div>`;
        if (resum) resum.innerHTML = '';
        document.getElementById('btnCheckout')?.setAttribute('disabled', 'disabled');
        return;
    }

    cont.innerHTML = estado.items.map((item, i) => `
        <div class="cart-item" data-id="${item.id}">
            <div class="cart-item-image">
                ${item.imagen
                    ? `<img src="${item.imagen}" alt="${esc(item.nombre)}" style="width:100%;height:100%;object-fit:cover;border-radius:8px;">`
                    : '<i class="fa-solid fa-couch"></i>'}
            </div>
            <div class="cart-item-details">
                <div class="cart-item-name">${esc(item.nombre)}</div>
                <div class="cart-item-specs" style="color:#a0a0a0;font-size:13px;margin:6px 0;">
                    ${item.categoria ? `<strong>Categoría:</strong> ${esc(item.categoria)}<br>` : ''}
                    ${item.material  ? `<strong>Material:</strong> ${esc(item.material)}<br>`  : ''}
                </div>
                <div class="cart-item-footer">
                    <div class="cart-item-price">${fmt(item.precio)} c/u</div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <button class="btn-remove" style="padding:4px 10px;font-size:16px;" onclick="cambiarCantidadItem(${i}, -1)">−</button>
                            <span style="min-width:24px;text-align:center;font-weight:700;">${item.cantidad}</span>
                            <button class="btn-remove" style="padding:4px 10px;font-size:16px;" onclick="cambiarCantidadItem(${i}, 1)">+</button>
                        </div>
                        <button class="btn-remove" onclick="eliminarItemCarrito(${i})" title="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            <div style="text-align:right;min-width:90px;font-weight:700;color:#8b7355;">
                ${fmt(item.precio * item.cantidad)}
            </div>
        </div>`).join('');

    if (resum) {
        resum.innerHTML = estado.items.map(item => `
            <div class="summary-item">
                <span>${esc(item.nombre)} ×${item.cantidad}</span>
                <span>${fmt(item.precio * item.cantidad)}</span>
            </div>`).join('');
    }
}

function cambiarCantidadItem(idx, delta) {
    const item = estado.items[idx];
    if (!item) return;
    const nueva = item.cantidad + delta;
    if (nueva <= 0) { eliminarItemCarrito(idx); return; }
    if (nueva > 99) return;
    item.cantidad = nueva;
    sessionStorage.setItem('wh_carrito', JSON.stringify(estado.items));
    renderizarItems();
    actualizarTotales();
    cargarFechasDisponibles(); // recalcular disponibilidad al cambiar cantidad
}

function eliminarItemCarrito(idx) {
    const item = estado.items[idx];
    if (!item || !confirm(`\u00bfEliminar "${item.nombre}" del carrito?`)) return;
    estado.items.splice(idx, 1);
    sessionStorage.setItem('wh_carrito', JSON.stringify(estado.items));
    // Si el carrito quedó vacío, limpiar todos los datos guardados
    if (estado.items.length === 0) {
        sessionStorage.removeItem('wh_carrito');
        sessionStorage.removeItem('wh_checkout');
        localStorage.removeItem(FORM_KEY);
        localStorage.removeItem('wh_checkout_form');
        localStorage.removeItem('wh_delivery');
        localStorage.removeItem('wh_cliente');
        localStorage.removeItem('wh_descuento');
        ['clienteNombre','clienteTelefono','clienteCorreo','clienteCorreoConfirm','clienteDireccion','clienteCiudad','clienteCP','clienteNotas']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el) { el.value = ''; el.style.borderColor = ''; }
                const err = el?.parentNode?.querySelector('.field-error-checkout');
                if (err) err.remove();
            });
    }
    renderizarItems();
    actualizarTotales();
    cargarFechasDisponibles(); // recalcular disponibilidad al eliminar
}

// Vaciar todo el carrito
function confirmarVaciarCarrito() {
    if (!estado.items.length) return;
    if (!confirm('¿Vaciar el carrito? Se eliminarán todos los productos y tus datos del formulario.')) return;
    estado.items = [];
    // Limpiar todo el storage
    sessionStorage.removeItem('wh_carrito');
    sessionStorage.removeItem('wh_checkout');
    localStorage.removeItem(FORM_KEY);
    localStorage.removeItem('wh_checkout_form');
    localStorage.removeItem('wh_delivery');
    localStorage.removeItem('wh_cliente');
    localStorage.removeItem('wh_descuento');
    localStorage.removeItem('wh_carrito_backup');
    // Limpiar campos del formulario visibles en el DOM (incluyendo confirmación de correo)
    ['clienteNombre','clienteTelefono','clienteCorreo','clienteCorreoConfirm','clienteDireccion','clienteCiudad','clienteCP','clienteNotas']
        .forEach(id => {
            const el = document.getElementById(id);
            if (el) { el.value = ''; el.style.borderColor = ''; }
            // Limpiar mensajes de error asociados al campo
            const err = el?.parentNode?.querySelector('.field-error-checkout');
            if (err) err.remove();
        });
    renderizarItems();
    actualizarTotales();
    showToast('Carrito y datos del formulario vaciados', 'success');
}

// ── Opciones de entrega e instalación ────────────────────────────
function seleccionarEntrega(tipo, recargarFechas = true) {
    estado.tipoEntrega = tipo;

    const cardEnvio   = document.getElementById('optionEnvio');
    const cardRecoger = document.getElementById('optionRecoger');
    cardEnvio?.classList.toggle('selected', tipo === 'envio');
    cardRecoger?.classList.toggle('selected', tipo === 'recoger');

    const radioEnvio   = cardEnvio?.querySelector('input[type="radio"]');
    const radioRecoger = cardRecoger?.querySelector('input[type="radio"]');
    if (radioEnvio)   radioEnvio.checked   = (tipo === 'envio');
    if (radioRecoger) radioRecoger.checked = (tipo === 'recoger');

    const secDir   = document.getElementById('seccionDireccion');
    const lineaEnv = document.getElementById('lineaEnvio');
    if (secDir)   secDir.style.display   = tipo === 'envio' ? '' : 'none';
    if (lineaEnv) lineaEnv.style.display = tipo === 'envio' ? '' : 'none';

    actualizarTotales();
    guardarFormulario();
    if (recargarFechas) setTimeout(() => cargarFechasDisponibles(), 100);
}

function seleccionarInstalacion(conInstalacion) {
    estado.instalacion = conInstalacion;

    const cardSin = document.getElementById('optionSinInstalacion');
    const cardCon = document.getElementById('optionConInstalacion');
    const linea   = document.getElementById('lineaInstalacion');

    cardSin?.classList.toggle('selected', !conInstalacion);
    cardCon?.classList.toggle('selected',  conInstalacion);

    const radioSin = cardSin?.querySelector('input[type="radio"]');
    const radioCon = cardCon?.querySelector('input[type="radio"]');
    if (radioSin) radioSin.checked = !conInstalacion;
    if (radioCon) radioCon.checked =  conInstalacion;

    if (linea) linea.style.display = conInstalacion ? '' : 'none';

    actualizarTotales();
    guardarFormulario();
}

function actualizarTotales() {
    const subtotal       = estado.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const totalMuebles   = estado.items.reduce((s, i) => s + i.cantidad, 0); // suma de todas las cantidades
    const costoEnvio     = estado.tipoEntrega === 'envio' ? estado.costos.envio : 0;
    const costoInstUnit  = estado.costos.instalacion; // $1,500 por mueble
    const costoInst      = estado.instalacion ? costoInstUnit * totalMuebles : 0;

    const el      = document.getElementById('totalFinal');
    const elEnvio = document.getElementById('totalEnvio');
    const elInstTotal = document.getElementById('costoInstalacionTotal');
    const elInstLabel = document.getElementById('labelInstalacionQty');
    const elInstPrecio = document.getElementById('precioInstalacionLabel');
    const elNota  = document.getElementById('notaInstalacion');

    if (el)      el.textContent = fmt(subtotal + costoEnvio + costoInst);
    if (elEnvio) elEnvio.textContent = costoEnvio > 0 ? fmt(costoEnvio) : 'Gratis';

    // Actualizar resumen de instalación con desglose por cantidad
    if (elInstTotal) elInstTotal.textContent = fmt(costoInst);
    if (elInstLabel && totalMuebles > 1) {
        elInstLabel.textContent = `× ${totalMuebles} muebles`;
    } else if (elInstLabel) {
        elInstLabel.textContent = '';
    }
    // Precio en la tarjeta de opción
    if (elInstPrecio) {
        elInstPrecio.textContent = totalMuebles > 1
            ? `+ ${fmt(costoInstUnit)} × ${totalMuebles} = ${fmt(costoInst)}`
            : `+ ${fmt(costoInstUnit)}`;
    }
    if (elNota) {
        elNota.innerHTML = totalMuebles > 1
            ? `<i class="fa-solid fa-circle-info"></i> ${fmt(costoInstUnit)} por mueble · ${totalMuebles} muebles = <strong style="color:#8b7355;">${fmt(costoInst)}</strong>`
            : `<i class="fa-solid fa-circle-info"></i> ${fmt(costoInstUnit)} por mueble`;
    }
}

// ── Fechas disponibles (API) ──────────────────────────────────────
async function cargarFechasDisponibles() {
    const grid = document.getElementById('semanasGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="fecha-loading"><i class="fa-solid fa-spinner fa-spin"></i> Consultando disponibilidad...</div>';

    try {
        const cp          = document.getElementById('clienteCP')?.value.trim() || '';
        const totalMuebles = estado.items.reduce((s, i) => s + i.cantidad, 0);
        const params = new URLSearchParams({
            tipo_entrega: estado.tipoEntrega || 'envio',
            cp,
            cantidad: totalMuebles || 1, // cuántos lugares necesita este pedido
        });
        const res    = await fetch('/api/disponibilidad.php?' + params.toString());
        const data   = await res.json();

        if (!data.success || !data.dias || data.dias.length === 0) {
            grid.innerHTML = renderFallback(); return;
        }

        renderizarDias(data.dias, data.fecha_sugerida);

        if (data.fecha_sugerida) {
            const card = grid.querySelector(`.dia-card[data-fecha="${data.fecha_sugerida}"], .semana-card[data-fecha="${data.fecha_sugerida}"]`);
            if (card) seleccionarDia(card);
        }
    } catch {
        grid.innerHTML = renderFallback();
    }
}

function renderizarDias(dias, fechaSugerida) {
    const grid = document.getElementById('semanasGrid');
    grid.innerHTML = dias.map(d => {
        const necesarios = d.lugares_necesarios || 1;
        if (!d.disponible) {
            // Distinguir entre "sin lugares" y "no alcanza para este pedido"
            const msg = d.lugares_libres === 0
                ? 'Taller lleno'
                : `Solo ${d.lugares_libres} lugar${d.lugares_libres===1?'':'es'} libre${d.lugares_libres===1?'':'s'} (necesitas ${necesarios})`;
            return `<div class="semana-card agotada" title="${msg}">
                <div class="semana-etiqueta">${d.etiqueta}</div>
                <span class="semana-badge" style="background:rgba(192,57,43,0.12);color:#c0392b;">No disponible</span>
                <div class="semana-slots" style="color:#666;">${d.lugares_libres} de ${d.lugares_total} libres</div>
            </div>`;
        }
        const color = d.nivel === 'lleno' ? '#c0392b' : d.nivel === 'medio' ? '#e67e22' : '#27ae60';
        const nivel = d.nivel === 'lleno' ? 'Últimos lugares' : d.nivel === 'medio' ? 'Disponible' : 'Amplia disponibilidad';
        const esSugerida = d.fecha === fechaSugerida;
        const esZona     = d.misma_zona && !esSugerida;
        return `
        <div class="semana-card${esSugerida ? ' recomendada' : esZona ? ' misma-zona' : ''}"
             data-fecha="${d.fecha}" data-etiqueta="${d.etiqueta}"
             onclick="seleccionarDia(this)">
            ${esSugerida ? '<div class="badge-recomendada">Fecha sugerida</div>' : ''}
            ${esZona     ? '<div class="badge-recomendada" style="background:#2980b9;">Tu zona</div>' : ''}
            <div class="semana-etiqueta">${d.etiqueta}</div>
            <span class="semana-badge" style="background:rgba(${hexToRgb(color)},0.15);color:${color};">${nivel}</span>
            <div class="semana-slots">${d.lugares_libres} de ${d.lugares_total} lugares</div>
        </div>`;
    }).join('');
}

function seleccionarDia(el) {
    document.querySelectorAll('.dia-card.seleccionada, .semana-card.seleccionada')
        .forEach(c => c.classList.remove('seleccionada'));
    el.classList.add('seleccionada');

    const fecha    = el.dataset.fecha;
    const etiqueta = el.dataset.etiqueta;

    estado.semana = { semana_inicio: fecha, semana_fin: fecha, etiqueta, fecha_sugerida: fecha };

    document.getElementById('semanaSeleccionada').value = fecha;
    document.getElementById('fechaSugerida').value      = fecha;

    const box   = document.getElementById('fechaResumenBox');
    const texto = document.getElementById('fechaResumenTexto');
    if (box && texto) { texto.textContent = etiqueta; box.style.display = 'block'; }
}

function seleccionarSemana(el) { seleccionarDia(el); }

function renderFallback() {
    const hoy    = new Date();
    const dias   = [];
    const meses  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const dNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    let fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() + 2);
    let encontrados = 0;
    while (encontrados < 10) {
        const dow = fecha.getDay();
        if (dow > 0 && dow < 6) {
            const ymd = fecha.toISOString().slice(0, 10);
            dias.push({ ymd, etq: `${dNames[dow]} ${fecha.getDate()} ${meses[fecha.getMonth()]}` });
            encontrados++;
        }
        fecha.setDate(fecha.getDate() + 1);
    }
    return `<div class="semanas-grid">
        ${dias.map((d, i) => `
        <div class="semana-card${i === 0 ? ' recomendada' : ''}"
             data-fecha="${d.ymd}" data-etiqueta="${d.etq}"
             onclick="seleccionarDia(this)">
            ${i === 0 ? '<div class="badge-recomendada">Fecha sugerida</div>' : ''}
            <div class="semana-etiqueta">${d.etq}</div>
            <span class="semana-badge">Estimado</span>
        </div>`).join('')}
    </div>`;
}

// ── Validación y envío ────────────────────────────────────────────
function procederAlPago() {
    if (estado.items.length === 0)   { showToast('Tu carrito está vacío', 'error'); return; }
    if (!estado.semana)              { showToast('Por favor selecciona una fecha de entrega', 'error'); document.getElementById('semanasGrid')?.scrollIntoView({ behavior:'smooth', block:'center' }); return; }

    // Leer y sanitizar TODOS los campos antes de validar
    const nombre   = sanitizeName(document.getElementById('clienteNombre')?.value    || '');
    const telefono = sanitizePhone(document.getElementById('clienteTelefono')?.value  || '');
    const correo   = sanitizeEmail(document.getElementById('clienteCorreo')?.value    || '');

    const correoConfirmVal = sanitizeEmail(document.getElementById('clienteCorreoConfirm')?.value || '');

    if (!nombre   || nombre.length < 3)      { showToast('Ingresa tu nombre completo (mínimo 3 caracteres)', 'error'); document.getElementById('clienteNombre')?.focus();    return; }
    if (!telefono || !isValidPhone(telefono)) { showToast('Ingresa un teléfono válido de 10 dígitos', 'error');         document.getElementById('clienteTelefono')?.focus(); return; }
    if (!correo   || !isEmailValido(correo))  { showToast('Ingresa un correo electrónico válido (ej: nombre@dominio.com)', 'error'); document.getElementById('clienteCorreo')?.focus(); return; }
    if (!correoConfirmVal || correoConfirmVal !== correo) { showToast('Los correos electrónicos no coinciden. Verifícalos.', 'error'); document.getElementById('clienteCorreoConfirm')?.focus(); return; }

    if (estado.tipoEntrega === 'envio') {
        const dir = sanitizeText(document.getElementById('clienteDireccion')?.value || '', 250);
        const ciu = sanitizeText(document.getElementById('clienteCiudad')?.value    || '', 100);
        const cp  = sanitizeCP(document.getElementById('clienteCP')?.value           || '');
        if (!dir)       { showToast('Ingresa la dirección de entrega',  'error'); document.getElementById('clienteDireccion')?.focus(); return; }
        if (!ciu)       { showToast('Ingresa la ciudad',                'error'); document.getElementById('clienteCiudad')?.focus();    return; }
        if (cp.length < 4) { showToast('Ingresa el código postal',     'error'); document.getElementById('clienteCP')?.focus();        return; }
    }

    const subtotal   = estado.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const costoEnvio = estado.tipoEntrega === 'envio' ? estado.costos.envio : 0;
    const totalMuebles = estado.items.reduce((s, i) => s + i.cantidad, 0);
    const costoInst  = estado.instalacion ? estado.costos.instalacion * totalMuebles : 0;

    const dirEnvio = estado.tipoEntrega === 'envio'
        ? sanitizeText(`${document.getElementById('clienteDireccion')?.value.trim()}, ${document.getElementById('clienteCiudad')?.value.trim()}, Jal. CP ${document.getElementById('clienteCP')?.value.trim()}`, 400)
        : null;

    const payload = {
        items:               estado.items,
        nombre_cliente:      nombre,
        correo_cliente:      correo,
        telefono_cliente:    telefono,
        tipo_entrega:        estado.tipoEntrega,
        incluye_instalacion: estado.instalacion ? 1 : 0,
        fecha_estimada:      estado.semana.fecha_sugerida,
        semana_etiqueta:     estado.semana.etiqueta,
        direccion_envio:     dirEnvio,
        cp_envio:     estado.tipoEntrega === 'envio' ? sanitizeCP(document.getElementById('clienteCP')?.value    || '') : '',
        ciudad_envio: estado.tipoEntrega === 'envio' ? sanitizeText(document.getElementById('clienteCiudad')?.value || '', 100) : '',
        notas:        sanitizeText(document.getElementById('clienteNotas')?.value || '', 500) || null,
        subtotal, costo_envio: costoEnvio, costo_instalacion: costoInst,
        total: subtotal + costoEnvio + costoInst,
        // Anti-bot: honeypot — always empty for real users
        _hp:     document.querySelector('[name="_hp"]')?.value      || '',
        website: document.querySelector('[name="website"]')?.value  || '',
        url:     document.querySelector('[name="url"]')?.value      || '',
    };

    sessionStorage.setItem('wh_checkout', JSON.stringify(payload));
    window.location.href = '/pago';
}

// ── Utilidades ────────────────────────────────────────────────────
function fmt(n) {
    return new Intl.NumberFormat('es-MX', { style:'currency', currency:'MXN', minimumFractionDigits:0 }).format(n);
}
function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function hexToRgb(hex) {
    return `${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)}`;
}
function showToast(msg, tipo = 'info') {
    if (typeof showNotification === 'function') { showNotification(msg, tipo); return; }
    const div = Object.assign(document.createElement('div'), {
        textContent: msg,
        style: `position:fixed;bottom:30px;right:30px;z-index:9999;padding:14px 22px;border-radius:10px;font-size:14px;font-weight:600;background:${tipo==='error'?'#c0392b':'#8b7355'};color:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.4);`,
    });
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3500);
}

// ── Sugerencia de login para usuarios no logueados ────────────────
function _mostrarSugerenciaLoginCheckout() {
    if (document.getElementById('loginSuggestCheckout')) return;
    // Insertar antes del primer campo de datos del cliente
    const ancla = document.getElementById('clienteNombre')?.closest('.form-group') ||
                  document.getElementById('clienteNombre')?.closest('section') ||
                  document.querySelector('.checkout-form, .checkout-section');
    if (!ancla) return;
    const div = document.createElement('div');
    div.id = 'loginSuggestCheckout';
    div.className = 'login-suggest-card';
    div.innerHTML = `
      <div class="login-suggest-icon"><i class="fa-solid fa-bolt"></i></div>
      <div class="login-suggest-text">
        <strong>¿Ya tienes cuenta?</strong>
        Inicia sesión y llenamos tus datos automáticamente.
      </div>
      <button type="button" class="login-suggest-btn"
              onclick="AuthModal.open()">Iniciar sesión</button>
      <button type="button" class="login-suggest-close"
              onclick="this.closest('.login-suggest-card').remove()"
              aria-label="Cerrar sugerencia">
        <i class="fa-solid fa-xmark"></i>
      </button>`;
    ancla.parentNode.insertBefore(div, ancla);
}

// ── Exports ───────────────────────────────────────────────────────
window.seleccionarEntrega     = seleccionarEntrega;
window.seleccionarInstalacion = seleccionarInstalacion;
window.seleccionarSemana      = seleccionarSemana;
window.seleccionarDia         = seleccionarDia;
window.procederAlPago         = procederAlPago;
window.cambiarCantidadItem    = cambiarCantidadItem;
window.eliminarItemCarrito    = eliminarItemCarrito;

// ── Interceptor de autenticación ──────────────────────────────────
// Requiere que el cliente esté autenticado antes de proceder al pago
document.addEventListener('DOMContentLoaded', function () {
    const _origProceder = window.procederAlPago;
    if (typeof _origProceder !== 'function') return;
    window.procederAlPago = function () {
        if (AuthModal.isAuthenticated()) {
            _origProceder();
        } else {
            AuthModal.requireAuth(function () {
                _origProceder();
            }, 'Inicia sesión para completar tu compra');
        }
    };
});

window.confirmarVaciarCarrito = confirmarVaciarCarrito;