/**
 * checkout.js — Lógica completa del carrito-checkout
 * 
 * Responsabilidades:
 *  1. Renderizar los items del carrito desde localStorage
 *  2. Calcular totales según tipo de entrega e instalación
 *  3. Cargar semanas disponibles DESDE LA API (BD real)
 *  4. Validar el formulario antes de pasar a pago
 *  5. Guardar datos del pedido en sessionStorage para pago.html
 */

// ── Estado del checkout ───────────────────────────────────────────
const estado = {
    items:          [],
    tipoEntrega:    'envio',      // 'envio' | 'recoger'
    instalacion:    false,
    semana:         null,         // { semana_inicio, semana_fin, etiqueta, fecha_sugerida }
    costos: {
        envio:        500,
        instalacion:  1500,
    },
};

// ── Init ──────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    cargarItemsCarrito();
    renderizarItems();
    actualizarTotales();
    cargarSemanasDisponibles();
});

// ================================================================
// CARRITO — Items desde localStorage
// ================================================================

function cargarItemsCarrito() {
    try {
        const raw = localStorage.getItem('wh_carrito');
        estado.items = raw ? JSON.parse(raw) : [];
    } catch {
        estado.items = [];
    }
}

function renderizarItems() {
    const cont = document.getElementById('carritoItems');
    const resum = document.getElementById('resumenItems');
    if (!cont) return;

    if (estado.items.length === 0) {
        cont.innerHTML = `
            <div style="text-align:center;padding:40px;color:#888;">
                <div style="font-size:48px;margin-bottom:16px;"><i class="fa-solid fa-cart-shopping"></i></div>
                <p>Tu carrito está vacío.</p>
                <a href="/catalogo" class="btn-checkout" style="display:inline-block;margin-top:16px;text-decoration:none;">
                    Ver catálogo
                </a>
            </div>`;
        if (resum) resum.innerHTML = '';
        document.getElementById('btnCheckout')?.setAttribute('disabled', 'disabled');
        return;
    }

    // Items principales
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
                    ${item.material  ? `<strong>Material:</strong> ${esc(item.material)}<br>` : ''}
                </div>
                <div class="cart-item-footer">
                    <div class="cart-item-price">${fmt(item.precio)} c/u</div>
                    <div style="display:flex;align-items:center;gap:10px;">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <button class="btn-remove" style="padding:4px 10px;font-size:16px;"
                                onclick="cambiarCantidadItem(${i}, -1)">−</button>
                            <span style="min-width:24px;text-align:center;font-weight:700;">
                                ${item.cantidad}
                            </span>
                            <button class="btn-remove" style="padding:4px 10px;font-size:16px;"
                                onclick="cambiarCantidadItem(${i}, 1)">+</button>
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
        </div>
    `).join('');

    // Resumen en sidebar
    if (resum) {
        resum.innerHTML = estado.items.map(item => `
            <div class="summary-item">
                <span>${esc(item.nombre)} ×${item.cantidad}</span>
                <span>${fmt(item.precio * item.cantidad)}</span>
            </div>
        `).join('');
    }
}

function cambiarCantidadItem(idx, delta) {
    const item = estado.items[idx];
    if (!item) return;
    const nueva = item.cantidad + delta;
    if (nueva <= 0) {
        eliminarItemCarrito(idx);
        return;
    }
    if (nueva > 99) return;
    item.cantidad = nueva;
    localStorage.setItem('wh_carrito', JSON.stringify(estado.items));
    renderizarItems();
    actualizarTotales();
}

function eliminarItemCarrito(idx) {
    const item = estado.items[idx];
    if (!item) return;
    if (!confirm(`¿Eliminar "${item.nombre}" del carrito?`)) return;
    estado.items.splice(idx, 1);
    localStorage.setItem('wh_carrito', JSON.stringify(estado.items));
    renderizarItems();
    actualizarTotales();
}

// ================================================================
// OPCIONES — Entrega e Instalación
// ================================================================

function seleccionarEntrega(tipo) {
    estado.tipoEntrega = tipo;

    document.getElementById('optionEnvio')?.classList.toggle('selected', tipo === 'envio');
    document.getElementById('optionRecoger')?.classList.toggle('selected', tipo === 'recoger');

    // Mostrar/ocultar sección de dirección y línea de envío
    const secDir   = document.getElementById('seccionDireccion');
    const lineaEnv = document.getElementById('lineaEnvio');
    if (secDir)   secDir.style.display  = tipo === 'envio' ? '' : 'none';
    if (lineaEnv) lineaEnv.style.display = tipo === 'envio' ? '' : 'none';

    actualizarTotales();
}

function seleccionarInstalacion(conInstalacion) {
    estado.instalacion = conInstalacion;

    const optSin = document.getElementById('optionSinInstalacion');
    const optCon = document.getElementById('optionConInstalacion');
    const linea  = document.getElementById('lineaInstalacion');

    if (conInstalacion) {
        optSin?.classList.remove('selected');
        optCon?.classList.add('selected');
        if (optCon) optCon.querySelector('input').checked = true;
        if (linea) linea.style.display = '';
    } else {
        optCon?.classList.remove('selected');
        optSin?.classList.add('selected');
        if (optSin) optSin.querySelector('input').checked = true;
        if (linea) linea.style.display = 'none';
    }
    actualizarTotales();
}

function actualizarTotales() {
    const subtotal     = estado.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const costoEnvio   = estado.tipoEntrega === 'envio' ? estado.costos.envio : 0;
    const costoInst    = estado.instalacion ? estado.costos.instalacion : 0;
    const total        = subtotal + costoEnvio + costoInst;

    const el = document.getElementById('totalFinal');
    if (el) el.textContent = fmt(total);

    const elEnvio = document.getElementById('totalEnvio');
    if (elEnvio) elEnvio.textContent = costoEnvio > 0 ? fmt(costoEnvio) : 'Gratis';
}

// ================================================================
// FECHAS — Carga de semanas disponibles desde la API
// ================================================================

async function cargarSemanasDisponibles() {
    const grid = document.getElementById('semanasGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="fecha-loading">Consultando disponibilidad en tiempo real</div>';

    try {
        const res  = await fetch('/api/disponibilidad.php');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        if (!data.success) throw new Error(data.error || 'Error de API');

        // Actualizar label de días de fabricación
        const diasEl = document.getElementById('diasFabLabel');
        if (diasEl) diasEl.textContent = data.dias_fabricacion;

        renderizarSemanas(data.semanas);

    } catch (err) {
        console.error('Disponibilidad API:', err);
        grid.innerHTML = `
            <div class="fecha-error">
                <i class="fa-solid fa-triangle-exclamation"></i> No se pudo cargar la disponibilidad. 
                <a href="#" onclick="cargarSemanasDisponibles();return false;"
                   style="color:#e74c3c;font-weight:bold;">Reintentar</a>
                <br><small style="opacity:.7;margin-top:4px;display:block;">
                    Podrás seleccionar una fecha estimada manualmente.
                </small>
            </div>
            ${renderFallback()}`;
    }
}

function renderizarSemanas(semanas) {
    const grid = document.getElementById('semanasGrid');
    if (!grid) return;

    if (!semanas || semanas.length === 0) {
        grid.innerHTML = `
            <div class="fecha-error">
                <i class="fa-solid fa-clipboard-list"></i> No hay semanas disponibles en este momento.<br>
                <small>Contáctanos al <strong>33 1705 4017</strong> para coordinar tu entrega.</small>
            </div>`;
        return;
    }

    grid.innerHTML = semanas.map(s => {
        if (s.disponible) {
            const pct   = Math.round((s.slots_ocupados / s.slots_total) * 100);
            const nivel = pct >= 75 ? 'Últimos lugares' : pct >= 50 ? 'Disponible' : 'Amplia disponibilidad';
            const color = pct >= 75 ? '#e67e22' : '#8b7355';

            return `
            <div class="semana-card"
                 data-inicio="${s.semana_inicio}"
                 data-fin="${s.semana_fin}"
                 data-etiqueta="${s.etiqueta}"
                 data-sugerida="${s.fecha_sugerida}"
                 onclick="seleccionarSemana(this)">
                <div class="semana-etiqueta">${s.etiqueta}</div>
                <span class="semana-badge" style="background:rgba(${hexToRgb(color)},0.15);color:${color};">
                    ${nivel}
                </span>
                <div class="semana-slots">
                    ${s.slots_disponibles} de ${s.slots_total} lugares
                </div>
            </div>`;
        } else {
            return `
            <div class="semana-card agotada" title="${s.motivo || 'No disponible'}">
                <div class="semana-etiqueta">${s.etiqueta}</div>
                <span class="semana-badge" style="background:rgba(192,57,43,0.12);color:#c0392b;">
                    ${s.motivo === 'Taller cerrado' ? 'Taller cerrado' : 'Sin lugares'}
                </span>
                <div class="semana-slots" style="color:#666;">0 lugares</div>
            </div>`;
        }
    }).join('');
}

function seleccionarSemana(el) {
    // Quitar selección previa
    document.querySelectorAll('.semana-card.seleccionada').forEach(c => c.classList.remove('seleccionada'));
    el.classList.add('seleccionada');

    // Guardar en estado
    estado.semana = {
        semana_inicio: el.dataset.inicio,
        semana_fin:    el.dataset.fin,
        etiqueta:      el.dataset.etiqueta,
        fecha_sugerida:el.dataset.sugerida,
    };

    // Actualizar campos ocultos
    document.getElementById('semanaSeleccionada').value = estado.semana.semana_inicio;
    document.getElementById('fechaSugerida').value      = estado.semana.fecha_sugerida;

    // Mostrar en resumen
    const box   = document.getElementById('fechaResumenBox');
    const texto = document.getElementById('fechaResumenTexto');
    if (box && texto) {
        texto.textContent = estado.semana.etiqueta;
        box.style.display = 'block';
    }
}

/** Fallback manual si la API falla */
function renderFallback() {
    const hoy     = new Date();
    const opciones = [];
    for (let w = 3; w <= 10; w++) {
        const lunes = new Date(hoy);
        // Avanzar al próximo lunes + w semanas
        lunes.setDate(hoy.getDate() + (7 - hoy.getDay() + 1) % 7 + w * 7);
        const viernes = new Date(lunes);
        viernes.setDate(lunes.getDate() + 4);

        const etq  = formatFecha(lunes) + ' – ' + formatFecha(viernes);
        const ini  = lunes.toISOString().slice(0, 10);
        const fin  = viernes.toISOString().slice(0, 10);
        const sug  = new Date(lunes); sug.setDate(lunes.getDate() + 2);
        opciones.push({ ini, fin, sug: sug.toISOString().slice(0, 10), etq });
    }

    return `<div class="semanas-grid" style="margin-top:12px;">
        ${opciones.map(o => `
        <div class="semana-card"
             data-inicio="${o.ini}" data-fin="${o.fin}"
             data-etiqueta="${o.etq}" data-sugerida="${o.sug}"
             onclick="seleccionarSemana(this)">
            <div class="semana-etiqueta">${o.etq}</div>
            <span class="semana-badge">Estimado</span>
        </div>`).join('')}
    </div>`;
}

// ================================================================
// VALIDACIÓN Y ENVÍO A PAGO
// ================================================================

function procederAlPago() {
    if (estado.items.length === 0) {
        showToast('Tu carrito está vacío', 'error');
        return;
    }

    if (!estado.semana) {
        showToast('Por favor selecciona una semana de entrega', 'error');
        document.getElementById('semanasGrid')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    // Validar campos del formulario
    const nombre   = document.getElementById('clienteNombre')?.value.trim();
    const telefono = document.getElementById('clienteTelefono')?.value.trim();
    const correo   = document.getElementById('clienteCorreo')?.value.trim();

    if (!nombre || nombre.length < 3) {
        showToast('Ingresa tu nombre completo', 'error');
        document.getElementById('clienteNombre')?.focus();
        return;
    }
    if (!telefono || telefono.replace(/\D/g, '').length < 10) {
        showToast('Ingresa un teléfono válido (10 dígitos)', 'error');
        document.getElementById('clienteTelefono')?.focus();
        return;
    }
    if (!correo || !correo.includes('@')) {
        showToast('Ingresa un correo electrónico válido', 'error');
        document.getElementById('clienteCorreo')?.focus();
        return;
    }

    // Dirección solo si es envío
    if (estado.tipoEntrega === 'envio') {
        const dir  = document.getElementById('clienteDireccion')?.value.trim();
        const ciu  = document.getElementById('clienteCiudad')?.value.trim();
        const cp   = document.getElementById('clienteCP')?.value.trim();
        if (!dir) { showToast('Ingresa la dirección de entrega', 'error'); document.getElementById('clienteDireccion')?.focus(); return; }
        if (!ciu) { showToast('Ingresa la ciudad', 'error'); document.getElementById('clienteCiudad')?.focus(); return; }
        if (!cp || cp.length < 4) { showToast('Ingresa el código postal', 'error'); document.getElementById('clienteCP')?.focus(); return; }
    }

    // ── Todo válido: armar payload para pago.html ─────────────────
    const subtotal   = estado.items.reduce((s, i) => s + i.precio * i.cantidad, 0);
    const costoEnvio = estado.tipoEntrega === 'envio' ? estado.costos.envio : 0;
    const costoInst  = estado.instalacion ? estado.costos.instalacion : 0;

    const payload = {
        items:            estado.items,
        nombre_cliente:   nombre,
        correo_cliente:   correo,
        telefono_cliente: telefono,
        tipo_entrega:     estado.tipoEntrega,
        incluye_instalacion: estado.instalacion ? 1 : 0,
        fecha_estimada:   estado.semana.fecha_sugerida,
        semana_etiqueta:  estado.semana.etiqueta,
        direccion_envio:  estado.tipoEntrega === 'envio'
            ? `${document.getElementById('clienteDireccion')?.value.trim()}, ${document.getElementById('clienteCiudad')?.value.trim()}, Jal. CP ${document.getElementById('clienteCP')?.value.trim()}`
            : null,
        notas:            document.getElementById('clienteNotas')?.value.trim() || null,
        subtotal,
        costo_envio:      costoEnvio,
        costo_instalacion:costoInst,
        total:            subtotal + costoEnvio + costoInst,
    };

    sessionStorage.setItem('wh_checkout', JSON.stringify(payload));
    window.location.href = '/pago';
}

// ================================================================
// UTILIDADES
// ================================================================

function fmt(n) {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(n);
}

function esc(str) {
    return String(str ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatFecha(d) {
    const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    return `${d.getDate()} ${meses[d.getMonth()]}`;
}

function hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
}

function showToast(msg, tipo = 'info') {
    // Usar la función global si existe, si no crear una simple
    if (typeof showNotification === 'function') {
        showNotification(msg, tipo);
        return;
    }
    const div = Object.assign(document.createElement('div'), {
        textContent: msg,
        style: `position:fixed;bottom:30px;right:30px;z-index:9999;
                padding:14px 22px;border-radius:10px;font-size:14px;font-weight:600;
                background:${tipo === 'error' ? '#c0392b' : '#8b7355'};
                color:#fff;box-shadow:0 4px 16px rgba(0,0,0,0.4);
                animation:slideIn .3s ease;`,
    });
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3500);
}

// Exponer para el HTML inline
window.seleccionarEntrega  = seleccionarEntrega;
window.seleccionarInstalacion = seleccionarInstalacion;
window.seleccionarSemana   = seleccionarSemana;
window.procederAlPago      = procederAlPago;
window.cambiarCantidadItem = cambiarCantidadItem;
window.eliminarItemCarrito = eliminarItemCarrito;