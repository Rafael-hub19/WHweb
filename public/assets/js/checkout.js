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
    cargarFechasDisponibles();

    // Recargar fechas cuando cambia el CP (con debounce)
    const cpInput = document.getElementById('clienteCP');
    if (cpInput) {
        let debounceTimer;
        cpInput.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            if (cpInput.value.length === 5) {
                debounceTimer = setTimeout(() => cargarFechasDisponibles(), 600);
            }
        });
    }
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
    // Recargar fechas al cambiar tipo de entrega
    setTimeout(() => cargarFechasDisponibles(), 100);

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
// FECHAS — Carga de días disponibles desde la API
// ================================================================

async function cargarFechasDisponibles() {
    const grid = document.getElementById('semanasGrid');
    if (!grid) return;

    grid.innerHTML = '<div class="fecha-loading"><i class="fa-solid fa-spinner fa-spin"></i> Consultando disponibilidad en tiempo real...</div>';

    try {
        const cp   = document.getElementById('clienteCP')?.value.trim() || '';
        const tipo = estado.tipoEntrega || 'envio';
        const params = new URLSearchParams({ tipo_entrega: tipo, cp });
        const res  = await fetch('/api/disponibilidad.php?' + params.toString());
        const data = await res.json();

        if (!data.success || !data.dias || data.dias.length === 0) {
            grid.innerHTML = renderFallback();
            return;
        }

        renderizarDias(data.dias, data.fecha_sugerida);

        // Auto-seleccionar el primer día disponible
        if (data.fecha_sugerida) {
            const card = grid.querySelector(`.dia-card[data-fecha="${data.fecha_sugerida}"]`);
            if (card) seleccionarDia(card);
        }

    } catch (err) {
        console.error('Error cargando disponibilidad:', err);
        grid.innerHTML = renderFallback();
    }
}

function renderizarDias(dias, fechaSugerida) {
    const grid = document.getElementById('semanasGrid');

    grid.innerHTML = dias.map(d => {
        if (!d.disponible) {
            return `
            <div class="semana-card agotada" title="Taller lleno este día">
                <div class="semana-etiqueta">${d.etiqueta}</div>
                <span class="semana-badge" style="background:rgba(192,57,43,0.12);color:#c0392b;">Sin lugares</span>
                <div class="semana-slots" style="color:#666;">0 de ${d.lugares_total} lugares</div>
            </div>`;
        }

        const color  = d.nivel === 'lleno' ? '#c0392b'
                     : d.nivel === 'medio' ? '#e67e22'
                     : '#27ae60';
        const nivel  = d.nivel === 'lleno' ? 'Últimos lugares'
                     : d.nivel === 'medio' ? 'Disponible'
                     : 'Amplia disponibilidad';
        const esSugerida = d.fecha === fechaSugerida;
        const esZona     = d.misma_zona && !esSugerida;

        return `
        <div class="semana-card${esSugerida ? ' recomendada' : esZona ? ' misma-zona' : ''}"
             data-fecha="${d.fecha}"
             data-etiqueta="${d.etiqueta}"
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
    // Quitar selección previa
    document.querySelectorAll('.dia-card.seleccionada, .semana-card.seleccionada')
        .forEach(c => c.classList.remove('seleccionada'));
    el.classList.add('seleccionada');

    const fecha   = el.dataset.fecha;
    const etiqueta = el.dataset.etiqueta;

    // Guardar en estado (compatible con campo fechaSugerida existente)
    estado.semana = {
        semana_inicio:  fecha,
        semana_fin:     fecha,
        etiqueta:       etiqueta,
        fecha_sugerida: fecha,
    };

    document.getElementById('semanaSeleccionada').value = fecha;
    document.getElementById('fechaSugerida').value      = fecha;

    // Mostrar en resumen
    const box   = document.getElementById('fechaResumenBox');
    const texto = document.getElementById('fechaResumenTexto');
    if (box && texto) {
        texto.textContent = etiqueta;
        box.style.display = 'block';
    }
}

/** Alias por compatibilidad con código existente */
function seleccionarSemana(el) { seleccionarDia(el); }

/** Fallback si la API no responde */
function renderFallback() {
    const hoy    = new Date();
    const dias   = [];
    const meses  = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    const dNames = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

    let fecha = new Date(hoy);
    fecha.setDate(fecha.getDate() + 2); // mínimo 2 días
    let encontrados = 0;

    while (encontrados < 10) {
        const dow = fecha.getDay();
        if (dow > 0 && dow < 6) { // lun-vie
            const ymd = fecha.toISOString().slice(0, 10);
            const etq = `${dNames[dow]} ${fecha.getDate()} ${meses[fecha.getMonth()]}`;
            dias.push({ ymd, etq });
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
        cp_envio:         estado.tipoEntrega === 'envio' ? (document.getElementById('clienteCP')?.value.trim() || '') : '',
        ciudad_envio:     estado.tipoEntrega === 'envio' ? (document.getElementById('clienteCiudad')?.value.trim() || '') : '',
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