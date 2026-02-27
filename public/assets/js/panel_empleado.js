// ================== UTILIDADES ==================
function openModal(id){ document.getElementById(id)?.classList.add('active'); }
function closeModal(id){ document.getElementById(id)?.classList.remove('active'); }

function showNotification(message, type='info'){
  document.querySelectorAll('.notification').forEach(n => n.remove());
  const icons = { success: 'fa-circle-check', error: 'fa-circle-xmark', info: 'fa-circle-info', warning: 'fa-triangle-exclamation' };
  const notif = document.createElement('div');
  notif.className = `notification ${type}`;
  notif.innerHTML = `<i class="fa-solid ${icons[type] || 'fa-circle-info'}" style="margin-right:8px;"></i>${message}`;
  document.body.appendChild(notif);
  const delay = type === 'error' ? 5000 : 3500;
  setTimeout(() => {
    notif.style.cssText += ';opacity:0;transform:translateX(120%);transition:all .3s ease';
    setTimeout(() => notif.remove(), 350);
  }, delay);
}

function escapeHtml(str){
  return String(str || '')
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}

// ================== MENÚ HAMBURGUESA (MÓVIL) ==================
const menuToggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');
const navClose = document.getElementById('navClose');

function setMenuOpen(open){
  navLinks.classList.toggle('open', open);
  menuToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
}

menuToggle?.addEventListener('click', () => {
  setMenuOpen(!navLinks.classList.contains('open'));
});

navClose?.addEventListener('click', () => setMenuOpen(false));

document.addEventListener('click', (e) => {
  if (navLinks.classList.contains('open')) {
    const inside = e.target.closest('#navLinks') || e.target.closest('#menuToggle');
    if (!inside) setMenuOpen(false);
  }
  const notifPanel = document.getElementById('notifPanel');
  if (notifPanel?.classList.contains('open')) {
    const insideN = e.target.closest('#notifPanel') || e.target.closest('#notifBtn');
    if (!insideN) closeNotifPanel();
  }
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    setMenuOpen(false);
    closeNotifPanel();
    document.querySelectorAll('.modal.active').forEach(m => m.classList.remove('active'));
  }
});

navLinks?.addEventListener('click', (e) => {
  const a = e.target.closest('a[data-section]');
  if(!a) return;
  e.preventDefault();
  const section = a.dataset.section;
  showSection(section);
  setMenuOpen(false);
  navLinks.querySelectorAll('a').forEach(x => x.classList.remove('active'));
  a.classList.add('active');
});

// ================== NAVEGACIÓN ==================
function showSection(section){
  document.querySelectorAll('.content-section').forEach(s => s.classList.add('hidden'));
  const target = document.getElementById(section + '-section');
  if (target) target.classList.remove('hidden');

  document.querySelectorAll('.sidebar-item').forEach(item => item.classList.remove('active'));
  document.querySelectorAll('.sidebar-item').forEach(item => {
    const onclick = item.getAttribute('onclick') || '';
    if (onclick.includes(`showSection('${section}'`)) item.classList.add('active');
  });

  // Guardar sección actual para auto-polling inteligente
  window._currentSection = section;

  if(section === 'inventario'){  bootstrapInventoryFromTableIfEmpty(); renderInventory(); }
  if(section === 'calendario'){  buildCalendar(); renderNext7(); }
  if(section === 'dashboard'){   refreshKpisFromPedidosTable(); renderActivity(); refreshKpisAPI(); }
  if(section === 'pedidos')      cargarPedidosEmpleadoAPI();
  if(section === 'citas')        cargarCitasAPI();
  if(section === 'cotizaciones') cargarCotizacionesAPI();
}

// ================== MODALES: click fuera ==================
document.querySelectorAll('.modal').forEach(modal => {
  modal.addEventListener('click', function(e){
    if(e.target === this) this.classList.remove('active');
  });
});

// ================== NOTIFICACIONES (PANEL) ==================
const notifBtn = document.getElementById('notifBtn');
const notifPanel = document.getElementById('notifPanel');
const notifBody = document.getElementById('notifBody');
const notifDot = document.getElementById('notifDot');

const NOTIF_KEY = 'wh_emp_notifs';
const NOTIF_UNREAD_KEY = 'wh_emp_notifs_unread';

function getNotifs(){ return JSON.parse(localStorage.getItem(NOTIF_KEY) || '[]'); }
function saveNotifs(list){ localStorage.setItem(NOTIF_KEY, JSON.stringify(list)); }

function setUnread(on){
  localStorage.setItem(NOTIF_UNREAD_KEY, on ? '1' : '0');
  notifDot?.classList.toggle('on', on);
}
function getUnread(){ return localStorage.getItem(NOTIF_UNREAD_KEY) === '1'; }

function renderNotifPanel(){
  const list = getNotifs().slice(0, 12);
  if(!list.length){
    notifBody.innerHTML = '<div style="color: var(--muted); font-size: 12px;">Sin notificaciones.</div>';
    return;
  }
  notifBody.innerHTML = list.map(n => `
    <div class="notif-item">
      <div class="t">${escapeHtml(n.title)}</div>
      <div class="m">${escapeHtml(n.meta || '')}</div>
      <div style="color: var(--muted); font-size: 11px;">${escapeHtml(n.at)}</div>
    </div>
  `).join('');
}

function openNotifPanel(){
  renderNotifPanel();
  notifPanel?.classList.add('open');
}
function closeNotifPanel(){
  notifPanel?.classList.remove('open');
}

notifBtn?.addEventListener('click', () => {
  notifPanel?.classList.contains('open') ? closeNotifPanel() : openNotifPanel();
});

function pushNotif(title, meta){
  const list = getNotifs();
  list.unshift({ title, meta, at: new Date().toLocaleString('es-MX') });
  saveNotifs(list);
  setUnread(true);
  renderNotifPanel();
}

function markNotifAsRead(){
  setUnread(false);
  showNotification('<i class="fa-solid fa-check"></i> Notificaciones marcadas como leídas', 'success');
}

// ================== DASH: ACTIVIDAD RECIENTE ==================
const ACT_KEY = 'wh_emp_activity';
function getActivity(){ return JSON.parse(localStorage.getItem(ACT_KEY) || '[]'); }
function saveActivity(list){ localStorage.setItem(ACT_KEY, JSON.stringify(list)); }

function addActivity(title, meta){
  const list = getActivity();
  list.unshift({ title, meta, at: new Date().toLocaleString('es-MX') });
  saveActivity(list.slice(0, 20));
}

// ── FIX ICONOS: usar innerHTML para el título (permite <i> tags) ──
function renderActivity(){
  const box = document.getElementById('activityList');
  if(!box) return;

  const list = getActivity();
  if(!list.length){
    box.innerHTML = `
      <div class="activity-item">
        <div class="t"><i class="fa-solid fa-clipboard-list"></i> Sin actividad reciente</div>
        <div class="m">Cuando actualices pedidos/inventario aparecerán aquí.</div>
      </div>`;
    return;
  }

  // title usa innerHTML directamente (contiene <i> de FontAwesome)
  // meta y at sí se escapan porque son datos del usuario
  box.innerHTML = list.slice(0, 8).map(a => `
    <div class="activity-item">
      <div class="t">${a.title}</div>
      <div class="m">${escapeHtml(a.meta || '')}</div>
      <div class="m" style="color:var(--muted);font-size:11px;">${escapeHtml(a.at)}</div>
    </div>
  `).join('');
}

function seedActivityDemo(){
  addActivity('<i class="fa-solid fa-box"></i> Pedido #002 actualizado', 'Estado: En proceso → Instalación');
  addActivity('<i class="fa-solid fa-cubes"></i> Inventario MAT-003', 'Salida (-2) | consumo_producción');
  addActivity('<i class="fa-solid fa-calendar-days"></i> Evento agregado', 'Cita con Ana Martínez');
  pushNotif('Pedido #002 listo para instalación', 'Revisar cita y confirmar horario');
  renderActivity();
  showNotification('Demo agregada', 'success');
}

// ================== KPIs desde tabla pedidos ==================
function refreshKpisFromPedidosTable(){
  const rows = document.querySelectorAll('#pedidosTable tr');
  let pendientes = 0;
  rows.forEach(r => { if(r.dataset.status === 'pending') pendientes++; });
  const el = document.getElementById('kpiPendientes');
  if(el) el.textContent = String(pendientes);
}

// ================== PEDIDOS: FILTROS ==================
function filterTable(filter, ev){
  document.querySelectorAll('#pedidos-section .filter-btn').forEach(btn => btn.classList.remove('active'));
  ev?.target?.classList?.add('active');

  const rows = document.querySelectorAll('#pedidosTable tr');
  rows.forEach(row => {
    row.style.display = (filter === 'all' || row.dataset.status === filter) ? '' : 'none';
  });
}

// ================== PEDIDOS: DETALLE + TIMELINE ==================
let currentPedidoRow = null;

function fmtMoney(n){
  const num = Number(n || 0);
  return '$' + num.toLocaleString('es-MX');
}
function fmtISOtoDMY(iso){
  if(!iso) return '—';
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${String(y).slice(-2)}`;
}

function timelineStageFromStatus(status){
  if(status === 'pending') return 1;
  if(status === 'progress') return 2;
  if(status === 'install') return 3;
  if(status === 'completed') return 4;
  return 1;
}

function renderPedidoTimeline(stage){
  const steps = [
    { key:1, label:'Recibido' },
    { key:2, label:'En proceso' },
    { key:3, label:'Instalación' },
    { key:4, label:'Completado' }
  ];
  const box = document.getElementById('pTimeline');
  box.innerHTML = steps.map(s => {
    const done = s.key < stage;
    const active = s.key === stage;
    return `
      <div class="step ${done ? 'done' : ''} ${active ? 'active' : ''}">
        <span class="dot"></span>
        ${s.label}
      </div>
    `;
  }).join('');
}

function viewPedidoFromRow(btn){
  const tr = btn.closest('tr');
  if(!tr) return;
  currentPedidoRow = tr;

  const id = tr.dataset.id;
  const cliente = tr.dataset.cliente;
  const producto = tr.dataset.producto;
  const entrega = tr.dataset.entrega;
  const total = tr.dataset.total;
  const status = tr.dataset.status;

  document.getElementById('pDetId').textContent = '#' + id;
  document.getElementById('pDetCliente').textContent = cliente;
  document.getElementById('pDetProducto').textContent = producto;
  document.getElementById('pDetEntrega').textContent = fmtISOtoDMY(entrega);
  document.getElementById('pDetTotal').textContent = fmtMoney(total);

  renderPedidoTimeline(timelineStageFromStatus(status));
  openModal('pedidoModal');
}

function openUpdateFromRow(btn){
  const tr = btn.closest('tr');
  if(!tr) return;
  currentPedidoRow = tr;
  openUpdateWithRow(tr);
}

function openUpdateFromPedidoModal(){
  closeModal('pedidoModal');
  if(currentPedidoRow) openUpdateWithRow(currentPedidoRow);
}

function openUpdateWithRow(tr){
  const id = tr.dataset.id;
  const entrega = tr.dataset.entrega || '';
  const status = tr.dataset.status || 'pending';

  document.getElementById('uId').textContent = '#' + id;
  document.getElementById('uEntrega').value = entrega;
  document.getElementById('uNotas').value = '';
  document.getElementById('uStatus').value = status;

  openModal('updatePedidoModal');
}

function statusLabel(status){
  if(status === 'pending') return 'Pendiente';
  if(status === 'progress') return 'En Proceso';
  if(status === 'install') return 'Instalación';
  if(status === 'completed') return 'Completado';
  return 'Pendiente';
}

function statusBadgeClass(status){
  if(status === 'pending') return 'status-pending';
  if(status === 'progress') return 'status-progress';
  if(status === 'install') return 'status-progress';
  if(status === 'completed') return 'status-completed';
  return 'status-pending';
}

function applyPedidoUpdate(){
  if(!currentPedidoRow) return;

  const newStatus = document.getElementById('uStatus').value;
  const newEntrega = document.getElementById('uEntrega').value;
  const notas = document.getElementById('uNotas').value.trim();

  const id = currentPedidoRow.dataset.id;

  currentPedidoRow.dataset.status = newStatus;
  if(newEntrega) currentPedidoRow.dataset.entrega = newEntrega;

  const tds = currentPedidoRow.querySelectorAll('td');
  if(tds[3] && newEntrega) tds[3].textContent = fmtISOtoDMY(newEntrega);
  if(tds[4]){
    const cls = statusBadgeClass(newStatus);
    tds[4].innerHTML = `<span class="status-badge ${cls}">${statusLabel(newStatus)}</span>`;
  }

  const meta = `Estado: ${statusLabel(newStatus)}${newEntrega ? ' | Entrega: ' + fmtISOtoDMY(newEntrega) : ''}${notas ? ' | Nota: ' + notas : ''}`;
  addActivity(`<i class="fa-solid fa-box"></i> Pedido #${id} actualizado`, meta);
  pushNotif(`Pedido #${id} actualizado`, meta);

  closeModal('updatePedidoModal');
  showNotification('<i class="fa-solid fa-check"></i> Pedido actualizado', 'success');

  refreshKpisFromPedidosTable();
  renderActivity();
}

// ================== INVENTARIO ==================
const INV_ITEMS_KEY = 'wh_raw_inventory_items';
const INV_LOG_KEY = 'wh_raw_inventory_log';
let invFilterMode = 'all';

function bootstrapInventoryFromTableIfEmpty(){
  const saved = JSON.parse(localStorage.getItem(INV_ITEMS_KEY) || 'null');
  if(saved && Array.isArray(saved) && saved.length) return;

  const items = [];
  document.querySelectorAll('#inventoryTable tr').forEach(tr => items.push(rowToItem(tr)));
  localStorage.setItem(INV_ITEMS_KEY, JSON.stringify(items));
  localStorage.setItem(INV_LOG_KEY, JSON.stringify([]));
}

function rowToItem(tr){
  const tds = tr.querySelectorAll('td');
  return {
    id: tr.dataset.id,
    name: tds[0].textContent.trim(),
    category: tds[1].textContent.trim(),
    unit: tds[2].textContent.trim(),
    stock: parseInt(tr.querySelector('.stock-cell')?.textContent,10) || 0,
    min: parseInt(tr.querySelector('.min-cell')?.textContent,10) || 0,
    location: tr.querySelector('.loc-cell')?.textContent.trim() || '-',
    supplier: tr.querySelector('.sup-cell')?.textContent.trim() || '-',
    cost: parseFloat((tr.querySelector('.cost-cell')?.textContent || '0').replace(/[^\d.]/g,'')) || 0
  };
}

function getItems(){ return JSON.parse(localStorage.getItem(INV_ITEMS_KEY) || '[]'); }
function saveItems(items){ localStorage.setItem(INV_ITEMS_KEY, JSON.stringify(items)); }

function logMovement(entry){
  const log = JSON.parse(localStorage.getItem(INV_LOG_KEY) || '[]');
  log.unshift({ ...entry, at: new Date().toLocaleString('es-MX') });
  localStorage.setItem(INV_LOG_KEY, JSON.stringify(log));
}

function renderInventory(){
  const tbody = document.getElementById('inventoryTable');
  if(!tbody) return;

  const search = (document.getElementById('invSearch')?.value || '').trim().toLowerCase();
  const items = getItems();

  tbody.innerHTML = '';

  items.forEach(item => {
    const isLow = item.stock <= item.min;

    if(invFilterMode === 'low' && !isLow) return;
    if(invFilterMode === 'ok' && isLow) return;

    const searchable = `${item.name} ${item.category} ${item.id} ${item.supplier}`.toLowerCase();
    if(search && !searchable.includes(search)) return;

    const statusText = isLow ? 'Bajo' : 'OK';
    const statusClass = isLow ? 'status-pending' : 'status-completed';

    const tr = document.createElement('tr');
    tr.dataset.id = item.id;
    tr.innerHTML = `
      <td>${escapeHtml(item.name)}</td>
      <td>${escapeHtml(item.category)}</td>
      <td>${escapeHtml(item.unit)}</td>
      <td class="stock-cell">${item.stock}</td>
      <td class="min-cell">${item.min}</td>
      <td class="loc-cell">${escapeHtml(item.location)}</td>
      <td class="sup-cell">${escapeHtml(item.supplier)}</td>
      <td class="cost-cell">$${Number(item.cost).toLocaleString('es-MX')}</td>
      <td><span class="status-badge ${statusClass}">${statusText}</span></td>
      <td><button class="btn btn-secondary btn-small" onclick="openStockModal('${item.id}')">Actualizar</button></td>
    `;
    tbody.appendChild(tr);
  });
}

function setInvFilter(mode, ev){
  invFilterMode = mode;
  document.querySelectorAll('#inventario-section .filter-btn').forEach(btn => btn.classList.remove('active'));
  ev?.target?.classList?.add('active');
  renderInventory();
}
function filterInventory(){ renderInventory(); }

function openAddItemModal(){
  const set = (id,val)=>{ const el=document.getElementById(id); if(el) el.value=val; };
  set('newName',''); set('newUnit',''); set('newLocation',''); set('newSupplier',''); set('newCost','');
  set('newStock',0); set('newMin',0);
  document.getElementById('newCategory').value = 'Tableros';
  openModal('addItemModal');
}

function addInventoryItem(){
  const name = document.getElementById('newName').value.trim();
  const category = document.getElementById('newCategory').value.trim();
  const unit = document.getElementById('newUnit').value.trim();
  const stock = parseInt(document.getElementById('newStock').value,10) || 0;
  const min = parseInt(document.getElementById('newMin').value,10) || 0;
  const location = document.getElementById('newLocation').value.trim() || '-';
  const supplier = document.getElementById('newSupplier').value.trim() || '-';
  const cost = parseFloat(document.getElementById('newCost').value) || 0;

  if(!name || !unit){
    showNotification('Falta nombre y/o unidad del insumo', 'error');
    return;
  }

  const items = getItems();
  const id = 'MAT-' + String(Date.now()).slice(-6);

  items.unshift({ id, name, category, unit, stock, min, location, supplier, cost });
  saveItems(items);
  logMovement({ type:'alta_insumo', id, name, delta: stock, reason:'alta_inicial' });

  addActivity('<i class="fa-solid fa-cubes"></i> Insumo agregado', `${id} | ${name} | Stock inicial: ${stock}`);
  pushNotif('Insumo agregado', `${id} | ${name}`);

  closeModal('addItemModal');
  renderInventory();
  showNotification('<i class="fa-solid fa-check"></i> Insumo agregado', 'success');
  renderActivity();
}

function openStockModal(id){
  const items = getItems();
  const item = items.find(x => x.id === id);
  if(!item) return;

  document.getElementById('stockId').value = item.id;
  document.getElementById('stockName').value = item.name;
  document.getElementById('stockCurrent').value = item.stock;
  document.getElementById('stockMovement').value = 'entrada';
  document.getElementById('stockQty').value = '';
  document.getElementById('stockReason').value = 'compra_proveedor';
  openModal('stockModal');
}

function applyStockChange(){
  const id = document.getElementById('stockId').value.trim();
  const movement = document.getElementById('stockMovement').value;
  const qty = parseInt(document.getElementById('stockQty').value,10);
  const reason = document.getElementById('stockReason').value;

  if(!id) return;
  if(!qty || qty <= 0){
    showNotification('Pon una cantidad válida', 'error');
    return;
  }

  const items = getItems();
  const idx = items.findIndex(x => x.id === id);
  if(idx < 0) return;

  const current = items[idx].stock;

  if(movement === 'ajuste'){
    const nextAdj = Math.max(0, qty);
    const realDelta = nextAdj - current;
    items[idx].stock = nextAdj;
    saveItems(items);
    logMovement({ type:'ajuste', id, name: items[idx].name, delta: realDelta, reason });

    closeModal('stockModal');
    renderInventory();
    showNotification('<i class="fa-solid fa-check"></i> Ajuste guardado', 'success');

    addActivity('<i class="fa-solid fa-cubes"></i> Ajuste de inventario', `${id} | Δ ${realDelta} | ${reason}`);
    pushNotif('Ajuste inventario', `${id} | Δ ${realDelta} | ${reason}`);
    renderActivity();
    return;
  }

  let delta = qty;
  if(movement === 'salida') delta = -qty;

  const next = Math.max(0, current + delta);
  const realDelta = next - current;

  items[idx].stock = next;
  saveItems(items);
  logMovement({ type:'movimiento', id, name: items[idx].name, delta: realDelta, reason });

  closeModal('stockModal');
  renderInventory();
  showNotification('<i class="fa-solid fa-check"></i> Movimiento guardado', 'success');

  addActivity('<i class="fa-solid fa-cubes"></i> Movimiento de inventario', `${id} | Δ ${realDelta} | ${reason}`);
  pushNotif('Movimiento inventario', `${id} | Δ ${realDelta} | ${reason}`);
  renderActivity();
}

function syncAutoInventory(){
  const items = getItems();
  const queue = JSON.parse(localStorage.getItem('wh_material_consumption_queue') || '[]');

  if(!queue.length){
    const sample = [
      { id:'MAT-001', qty:1, reason:'auto:orden_produccion' },
      { id:'MAT-002', qty:4, reason:'auto:orden_produccion' }
    ];
    localStorage.setItem('wh_material_consumption_queue', JSON.stringify(sample));
    showNotification('Cola simulada creada.\nVuelve a presionar Auto-actualizar.', 'info');
    return;
  }

  queue.forEach(c => {
    const idx = items.findIndex(x => x.id === c.id);
    if(idx >= 0){
      const cur = items[idx].stock;
      const next = Math.max(0, cur - (c.qty || 0));
      const delta = next - cur;
      items[idx].stock = next;
      logMovement({ type:'auto', id:c.id, name: items[idx].name, delta, reason: c.reason || 'auto' });
      addActivity('<i class="fa-solid fa-cubes"></i> Auto-actualizar inventario', `${c.id} | Δ ${delta} | ${c.reason || 'auto'}`);
    }
  });

  saveItems(items);
  localStorage.setItem('wh_material_consumption_queue', JSON.stringify([]));
  renderInventory();
  showNotification('↻ Inventario auto-actualizado', 'success');
  pushNotif('Inventario auto-actualizado', 'Se aplicaron consumos simulados');
  renderActivity();
}

function viewInventoryLog(){
  const log = JSON.parse(localStorage.getItem(INV_LOG_KEY) || '[]');
  if(!log.length){
    showNotification('No hay movimientos todavía', 'info');
    return;
  }
  const preview = log.slice(0, 10).map(x => {
    const d = x.delta ?? 0;
    const sign = d > 0 ? '+' : '';
    return `${x.at} | ${x.id} | ${sign}${d} | ${x.reason || x.type}`;
  }).join('\n');
  alert('Historial de inventario (últimos 10 movimientos):\n\n' + preview);
}

// ================== CALENDARIO ==================
const CAL_KEY = 'wh_emp_calendar_events';
const DOW = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];

let calCursor = new Date();
let selectedDateISO = null;

function getCalEvents(){ return JSON.parse(localStorage.getItem(CAL_KEY) || '[]'); }
function saveCalEvents(events){ localStorage.setItem(CAL_KEY, JSON.stringify(events)); }

function isoDate(d){
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth()+1).padStart(2,'0');
  const day = String(x.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function fmtMonthTitle(d){
  const m = d.toLocaleString('es-MX', { month:'long' });
  return m.charAt(0).toUpperCase() + m.slice(1) + ' ' + d.getFullYear();
}

function mondayIndex(jsDay){ return (jsDay + 6) % 7; }

function buildCalendar(){
  document.getElementById('calTitle').textContent = fmtMonthTitle(calCursor);

  const calDow = document.getElementById('calDow');
  calDow.innerHTML = '';
  DOW.forEach(d => {
    const el = document.createElement('div');
    el.className = 'cal-dow';
    el.textContent = d;
    calDow.appendChild(el);
  });

  const grid = document.getElementById('calGrid');
  grid.innerHTML = '';

  const year = calCursor.getFullYear();
  const month = calCursor.getMonth();

  const first = new Date(year, month, 1);
  const startOffset = mondayIndex(first.getDay());
  const start = new Date(year, month, 1 - startOffset);

  const events = getCalEvents();
  const todayISO = isoDate(new Date());

  for(let i=0; i<42; i++){
    const day = new Date(start);
    day.setDate(start.getDate() + i);

    const cellMonth = day.getMonth();
    const isMuted = cellMonth !== month;

    const dayISO = isoDate(day);
    const dayEvents = events.filter(e => e.date === dayISO).slice(0,3);

    const cell = document.createElement('div');
    cell.className = 'cal-day' + (isMuted ? ' muted' : '');
    cell.innerHTML = `
      <div class="num">${day.getDate()}</div>
      <div class="cal-chip">
        ${dayEvents.map(e => `<div class="chip ${e.type}">${escapeHtml(e.time || '')} ${escapeHtml(e.title)}</div>`).join('')}
      </div>
    `;

    cell.addEventListener('click', () => {
      selectedDateISO = dayISO;
      renderDayEvents(dayISO);
      showNotification(`<i class="fa-solid fa-calendar-days"></i> Día seleccionado: ${dayISO}`, 'info');
    });

    if(!selectedDateISO && dayISO === todayISO) selectedDateISO = todayISO;
    grid.appendChild(cell);
  }

  renderDayEvents(selectedDateISO || isoDate(new Date()));
}

function renderDayEvents(dayISO){
  const list = document.getElementById('dayEventsList');
  const title = document.getElementById('selectedDayTitle');
  title.textContent = `Eventos del día (${dayISO})`;

  const events = getCalEvents()
    .filter(e => e.date === dayISO)
    .sort((a,b) => (a.time||'').localeCompare(b.time||''));

  if(!events.length){
    list.innerHTML = `<div style="color: var(--muted);">No hay eventos para este día.</div>`;
    return;
  }

  list.innerHTML = events.map(e => `
    <div class="cal-item">
      <div class="t">${escapeHtml((e.time ? e.time + ' — ' : '') + e.title)}</div>
      <div class="m">${escapeHtml(e.notes || '')}</div>
      <div style="display:flex; gap:8px; margin-top:6px;">
        <button class="btn btn-secondary btn-small" onclick="deleteEvent('${e.id}')">Eliminar</button>
      </div>
    </div>
  `).join('');
}

function renderNext7(){
  const box = document.getElementById('nextEventsList');
  const events = getCalEvents();

  const now = new Date();
  const startISO = isoDate(now);
  const end = new Date(now); end.setDate(end.getDate()+7);
  const endISO = isoDate(end);

  const next = events
    .filter(e => e.date >= startISO && e.date <= endISO)
    .sort((a,b) => (a.date + (a.time||'')).localeCompare(b.date + (b.time||'')))
    .slice(0, 12);

  if(!next.length){
    box.innerHTML = `<div style="color: var(--muted);">No hay eventos próximos.</div>`;
    return;
  }

  box.innerHTML = next.map(e => `
    <div class="cal-item">
      <div class="t">${escapeHtml(e.date)} ${escapeHtml(e.time || '')}</div>
      <div class="m">${escapeHtml(e.title)}</div>
    </div>
  `).join('');
}

function prevMonth(){
  calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth()-1, 1);
  buildCalendar(); renderNext7();
}
function nextMonth(){
  calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth()+1, 1);
  buildCalendar(); renderNext7();
}
function goToday(){
  calCursor = new Date();
  calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth(), 1);
  selectedDateISO = isoDate(new Date());
  buildCalendar(); renderNext7();
}

function openAddEventModal(){
  const d = selectedDateISO || isoDate(new Date());
  document.getElementById('evDate').value = d;
  document.getElementById('evTime').value = '';
  document.getElementById('evType').value = 'cita';
  document.getElementById('evTitle').value = '';
  document.getElementById('evNotes').value = '';
  openModal('addEventModal');
}

function saveCalendarEvent(){
  const date = document.getElementById('evDate').value;
  const time = document.getElementById('evTime').value;
  const type = document.getElementById('evType').value;
  const title = document.getElementById('evTitle').value.trim();
  const notes = document.getElementById('evNotes').value.trim();

  if(!date || !title){
    showNotification('Falta fecha y/o título del evento', 'error');
    return;
  }

  const events = getCalEvents();
  const id = 'EV-' + String(Date.now()).slice(-8);

  events.push({ id, date, time, type, title, notes });
  saveCalEvents(events);

  closeModal('addEventModal');
  selectedDateISO = date;
  buildCalendar();
  renderNext7();
  showNotification('<i class="fa-solid fa-check"></i> Evento guardado', 'success');

  addActivity('<i class="fa-solid fa-calendar-days"></i> Evento agregado', `${date} ${time || ''} | ${title}`);
  pushNotif('Evento agregado', `${date} ${time || ''} | ${title}`);
  renderActivity();
}

function deleteEvent(id){
  const events = getCalEvents().filter(e => e.id !== id);
  saveCalEvents(events);
  buildCalendar();
  renderNext7();
  showNotification('Evento eliminado', 'info');
}

// ================== FORM DUMMIES ==================
function saveCita(){ closeModal('nuevaCita'); showNotification('<i class="fa-solid fa-check"></i> Cita agendada (demo)', 'success'); }
function saveCotizacion(){ closeModal('nuevaCotizacion'); showNotification('<i class="fa-solid fa-check"></i> Cotización creada (demo)', 'success'); }

// ================== INIT (primer DOMContentLoaded) ==================
document.addEventListener('DOMContentLoaded', () => {
  if(document.getElementById('inventoryTable')){
    bootstrapInventoryFromTableIfEmpty();
    renderInventory();
  }

  const calSaved = getCalEvents();
  if(!calSaved.length){
    const demo = [
      { id:'EV-00000001', date:'2026-02-05', time:'10:00', type:'cita', title:'Cita con Ana Martínez', notes:'Visita para instalación' },
      { id:'EV-00000002', date:'2026-02-06', time:'14:00', type:'cot', title:'Cotización Pedro Sánchez', notes:'Revisar medidas y materiales' }
    ];
    saveCalEvents(demo);
  }

  setUnread(getUnread());
  refreshKpisFromPedidosTable();

  setTimeout(() => showNotification('Bienvenido', 'success'), 400);

  // ── FIX MENSAJE DE DEBUG: Guardar sin iconos en addActivity, el render los pone ──
  // addActivity ya recibe el título con <i> tag y renderActivity lo muestra con innerHTML
  if(!getActivity().length){
    cargarNombreEmpleado();
    addActivity('<i class="fa-solid fa-circle-check"></i> Panel empleado inicializado', 'Acceso limitado: ver/actualizar pedidos y citas.');
  }
  renderActivity();
});

// =============================================================
// API LAYER - Empleado (conexión real a backend)
// =============================================================

const API_BASE = '/api';

async function getAuthToken() {
  try {
    if (typeof firebaseAuth !== 'undefined' && firebaseAuth?.currentUser) {
      return await firebaseAuth.currentUser.getIdToken(false);
    }
    return sessionStorage.getItem('wh_firebase_token') || '';
  } catch(e) { return ''; }
}

async function apiFetch(url, options = {}) {
  options.headers = options.headers || {};
  options.credentials = 'same-origin';
  const token = await getAuthToken();
  if (token) options.headers['Authorization'] = 'Bearer ' + token;
  options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
  const res = await fetch(url, options);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) {
    if (res.status === 401 || res.status === 403) throw new Error('Sesión expirada. Recarga la página.');
    throw new Error('Error servidor HTTP ' + res.status);
  }
  return res.json();
}

// ── FIX LOGOUT: usar replace() y flag sessionStorage para que login.js no auto-redirija ──
async function logout() {
  if (!confirm('¿Cerrar sesión?')) return;
  // Detener auto-polling antes de salir
  if (window._autoRefreshInterval) clearInterval(window._autoRefreshInterval);
  try {
    if (typeof firebaseAuth !== 'undefined') await firebaseAuth.signOut();
  } catch(e) {}
  await fetch('/api/auth.php?action=logout', { method: 'POST', credentials: 'same-origin' }).catch(() => {});
  sessionStorage.setItem('wh_just_logged_out', '1'); // login.js lee esto y no auto-redirige
  sessionStorage.removeItem('wh_firebase_token');
  sessionStorage.removeItem('wh_usuario');
  window.location.replace('/login?logout=1');
}

// ── Pedidos ───────────────────────────────────────────────────
async function cargarPedidosEmpleadoAPI() {
  const tbody = document.getElementById('pedidosTable');
  if (!tbody) return;
  try {
    const data = await apiFetch(`${API_BASE}/pedidos.php?limit=30`);
    if (!data.success) return;

    const labMap = { pendiente:'Pendiente', pagado:'Pagado', en_produccion:'En Producción', listo:'Listo', entregado:'Entregado', cancelado:'Cancelado' };
    const clsMap = { pendiente:'status-pending', pagado:'status-progress', en_produccion:'status-progress', listo:'status-info', entregado:'status-completed', cancelado:'status-disabled' };

    tbody.innerHTML = (data.pedidos || []).map(p => `
      <tr data-status="${p.estado}" data-id="${p.id}">
        <td>${p.numero_pedido}</td>
        <td>${escapeHtml(p.nombre_cliente)}</td>
        <td>${p.correo_cliente}</td>
        <td>${p.fecha_estimada || '—'}</td>
        <td><span class="status-badge ${clsMap[p.estado] || ''}">${labMap[p.estado] || p.estado}</span></td>
        <td style="color:var(--accent);font-weight:800;">$${parseFloat(p.total||0).toLocaleString('es-MX')}</td>
        <td>
          <select class="form-select" style="width:140px;" onchange="actualizarEstadoPedidoEmp(${p.id}, this.value)">
            ${['pendiente','pagado','en_produccion','listo','entregado'].map(s =>
              `<option value="${s}" ${s===p.estado?'selected':''}>${labMap[s]}</option>`
            ).join('')}
          </select>
        </td>
      </tr>
    `).join('');
  } catch(e) { console.error('Pedidos API error:', e); }
}

async function actualizarEstadoPedidoEmp(id, estado) {
  try {
    const data = await apiFetch(`${API_BASE}/pedidos.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
    if (data.success) showNotification('<i class="fa-solid fa-circle-check"></i> Estado actualizado', 'success');
    else showNotification('<i class="fa-solid fa-xmark"></i> ' + (data.error || 'Error'), 'error');
  } catch(e) { showNotification('<i class="fa-solid fa-xmark"></i> Error de conexión', 'error'); }
}

// ── Citas ─────────────────────────────────────────────────────
async function cargarCitasAPI() {
  const tbody = document.querySelector('#citas-section table tbody');
  if (!tbody) return;
  try {
    const data = await apiFetch(`${API_BASE}/citas.php?limit=30`);
    if (!data.success) return;

    const clsMap = { nueva:'status-pending', confirmada:'status-progress', completada:'status-completed', cancelada:'status-disabled' };
    tbody.innerHTML = (data.citas || []).map(c => `
      <tr>
        <td>${c.numero_cita}</td>
        <td>${escapeHtml(c.nombre_cliente)}</td>
        <td>${c.fecha_cita}</td>
        <td>${c.rango_horario || '—'}</td>
        <td>${c.tipo}</td>
        <td><span class="status-badge ${clsMap[c.estado]||''}">${c.estado}</span></td>
        <td>
          <button class="btn btn-secondary btn-small" onclick="confirmarCita(${c.id})">Confirmar</button>
          <button class="btn btn-secondary btn-small" onclick="completarCita(${c.id})">Completar</button>
        </td>
      </tr>
    `).join('');
  } catch(e) { console.error('Citas API error:', e); }
}

async function confirmarCita(id) {
  const data = await apiFetch(`${API_BASE}/citas.php?id=${id}`, { method:'PUT', body: JSON.stringify({ estado: 'confirmada' }) });
  if (data.success) { showNotification('<i class="fa-solid fa-circle-check"></i> Cita confirmada', 'success'); cargarCitasAPI(); }
}
async function completarCita(id) {
  const data = await apiFetch(`${API_BASE}/citas.php?id=${id}`, { method:'PUT', body: JSON.stringify({ estado: 'completada' }) });
  if (data.success) { showNotification('<i class="fa-solid fa-circle-check"></i> Cita completada', 'success'); cargarCitasAPI(); }
}

// ── Cotizaciones ──────────────────────────────────────────────
async function cargarCotizacionesAPI() {
  const tbody = document.querySelector('#cotizaciones-section table tbody');
  if (!tbody) return;
  try {
    const data = await apiFetch(`${API_BASE}/cotizaciones.php?limit=30`);
    if (!data.success) return;
    const clsMap = { nueva:'status-pending', en_revision:'status-progress', respondida:'status-completed', cerrada:'status-disabled' };
    tbody.innerHTML = (data.cotizaciones || []).map(c => `
      <tr>
        <td>${c.numero_cotizacion}</td>
        <td>${escapeHtml(c.nombre_cliente)}</td>
        <td>${escapeHtml(c.tipo_mueble || '—')}</td>
        <td>${c.rango_presupuesto || '—'}</td>
        <td><span class="status-badge ${clsMap[c.estado]||''}">${c.estado}</span></td>
        <td>
          <select class="form-select" style="width:130px;" onchange="actualizarCotizacion(${c.id}, this.value)">
            ${['nueva','en_revision','respondida','cerrada'].map(s =>
              `<option value="${s}" ${s===c.estado?'selected':''}>${s}</option>`
            ).join('')}
          </select>
        </td>
      </tr>
    `).join('');
  } catch(e) { console.error('Cotizaciones API error:', e); }
}

async function actualizarCotizacion(id, estado) {
  const data = await apiFetch(`${API_BASE}/cotizaciones.php?id=${id}`, { method:'PUT', body: JSON.stringify({ estado }) });
  if (data.success) showNotification('<i class="fa-solid fa-circle-check"></i> Cotización actualizada', 'success');
}

// ── KPIs dashboard ────────────────────────────────────────────
async function cargarNombreEmpleado() {
  try {
    const data = await apiFetch(`${API_BASE}/auth.php?action=perfil`);
    if (data.success && data.usuario) {
      const el = document.getElementById('empNombreHeader');
      if (el) el.textContent = data.usuario.nombre_completo || data.usuario.correo || 'Empleado';
    }
  } catch(e) { /* silencioso */ }
}

async function refreshKpisAPI() {
  try {
    const data = await apiFetch(`${API_BASE}/reportes.php?tipo=resumen`);
    if (!data.success) return;
    const el = document.getElementById('kpiPendientes');
    if (el) el.textContent = data.pedidos_pendientes || 0;
  } catch(e) {}
}

// ── AUTO-POLLING cada 30 segundos ────────────────────────────
// Refresca la sección visible automáticamente sin que el empleado tenga que hacerlo manual
function _autoRefresh() {
  const section = window._currentSection || 'dashboard';
  if (section === 'pedidos')           cargarPedidosEmpleadoAPI();
  else if (section === 'citas')        cargarCitasAPI();
  else if (section === 'cotizaciones') cargarCotizacionesAPI();
  else if (section === 'dashboard')    refreshKpisAPI();
}

// ── INIT (segundo DOMContentLoaded - API layer) ───────────────
document.addEventListener('DOMContentLoaded', () => {
  // Verificar auth con Firebase
  if (typeof firebaseAuth !== 'undefined') {
    let initialized = false;
    firebaseAuth.onAuthStateChanged(user => {
      if (!initialized) { initialized = true; return; } // ignorar primer disparo al cargar
      if (!user) window.location.href = '/login?logout=1';
    });
  }

  setTimeout(cargarNombreEmpleado, 200);
  setTimeout(refreshKpisAPI, 400);
  showSection('dashboard');

  // Iniciar auto-polling
  window._currentSection = 'dashboard';
  window._autoRefreshInterval = setInterval(_autoRefresh, 30000);

  // Pausar polling cuando la pestaña no está visible (ahorra requests innecesarios)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      clearInterval(window._autoRefreshInterval);
    } else {
      // Al volver a la pestaña, refrescar inmediatamente y reiniciar ciclo
      _autoRefresh();
      window._autoRefreshInterval = setInterval(_autoRefresh, 30000);
    }
  });
});

window.actualizarEstadoPedidoEmp = actualizarEstadoPedidoEmp;
window.confirmarCita  = confirmarCita;
window.completarCita  = completarCita;
window.actualizarCotizacion = actualizarCotizacion;