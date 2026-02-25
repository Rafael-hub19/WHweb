/* =========================
       UTIL
    ========================= */
    const $ = (sel, root=document) => root.querySelector(sel);
    const $$ = (sel, root=document) => [...root.querySelectorAll(sel)];

    function escapeHtml(str){
      return String(str ?? '')
        .replaceAll('&','&amp;')
        .replaceAll('<','&lt;')
        .replaceAll('>','&gt;')
        .replaceAll('"','&quot;')
        .replaceAll("'","&#039;");
    }
    function money(n){
      const num = Number(n || 0);
      return num.toLocaleString('es-MX', { style:'currency', currency:'MXN' });
    }
    function parseLines(text){
      return String(text||'')
        .split('\n')
        .map(x => x.trim())
        .filter(Boolean);
    }
    function clamp(n, a, b){ return Math.max(a, Math.min(b, n)); }

    /* =========================
       NAVEGACIÓN / MENÚ
    ========================= */
    const navLinks = $('#navLinks');
    const menuToggle = $('#menuToggle');
    const navClose = $('#navClose');

    function openNav(){
      navLinks.classList.add('open');
      navLinks.setAttribute('aria-hidden','false');
      menuToggle.setAttribute('aria-expanded','true');
    }
    function closeNav(){
      navLinks.classList.remove('open');
      navLinks.setAttribute('aria-hidden','true');
      menuToggle.setAttribute('aria-expanded','false');
    }
    menuToggle.addEventListener('click', () => {
      navLinks.classList.contains('open') ? closeNav() : openNav();
    });
    navClose.addEventListener('click', closeNav);

    document.addEventListener('keydown', (e) => {
      if(e.key === 'Escape') closeNav();
    });
    document.addEventListener('click', (e) => {
      if(!navLinks.classList.contains('open')) return;
      const inside = navLinks.contains(e.target) || menuToggle.contains(e.target);
      if(!inside) closeNav();
    });

    function showSection(section, ev){
      $$('.content-section').forEach(s => s.classList.add('hidden'));
      const el = $('#' + section + '-section');
      if(el) el.classList.remove('hidden');

      // sidebar active
      $$('.sidebar-item').forEach(item => item.classList.remove('active'));
      const sid = ev?.target?.closest?.('.sidebar-item');
      if (sid) sid.classList.add('active');
      else {
        const fallback = document.querySelector(`.sidebar-item[onclick*="${section}"]`);
        if (fallback) fallback.classList.add('active');
      }

      // nav-links active
      $$('#navLinks a').forEach(a => a.classList.remove('active'));
      const navA = document.querySelector(`#navLinks a[data-section="${section}"]`);
      if (navA) navA.classList.add('active');

      closeNav();

      if(section === 'citas')     renderCalendar();
      if(section === 'catalogo')  cargarProductosAPI().then(() => renderCatalogo());
      if(section === 'reportes')  { cargarReportesAPI(); renderReportes(); }
      if(section === 'dashboard') setTimeout(refreshKPIsFromAPI, 100);
      if(section === 'pedidos')   cargarPedidosAPI();
      if(section === 'empleados') cargarEmpleadosAPI();
      refreshKPIs();
    }

    /* =========================
       MODALES
    ========================= */
    function openModal(id){ $('#'+id).classList.add('active'); }
    function closeModal(id){ $('#'+id).classList.remove('active'); }

    $$('.modal').forEach(modal => {
      modal.addEventListener('click', function(e){
        if(e.target === this) this.classList.remove('active');
      });
    });

    /* =========================
       NOTIFICACIONES
    ========================= */
    function showNotification(message, type='info'){
      const notif = document.createElement('div');
      notif.className = `notification ${type}`;
      notif.textContent = message;
      document.body.appendChild(notif);
      setTimeout(() => notif.remove(), 3200);
    }

    function confirmDelete(id){
      if(confirm('¿Eliminar este elemento?')){
        showNotification('<i class="fa-solid fa-check"></i> Elemento eliminado (demo)', 'success');
      }
    }

    function logout(){
      if(confirm('¿Cerrar sesión?')) window.location.href = '/login';
    }

    /* =========================
       TABLA PEDIDOS (filtro demo)
    ========================= */
    function filterTable(filter, ev){
      $$('#pedidos-section .filter-btn').forEach(btn => btn.classList.remove('active'));
      ev?.target?.classList?.add('active');

      const rows = $$('#pedidosTable tr');
      rows.forEach(row => {
        row.style.display = (filter === 'all' || row.dataset.status === filter) ? '' : 'none';
      });
    }

    /* =========================
       CALENDARIO
    ========================= */
    let calYear = 2026;
    let calMonth = 1; // Feb
    const CITA_KEY = 'wh_admin_citas';

    const seedCitas = [
      { id:'C-001', cliente:'Ana Martínez', empleado:'Juan Pérez', date:'2026-02-05', time:'10:00', tipo:'inst', estado:'completed' },
      { id:'C-002', cliente:'Pedro Sánchez', empleado:'María García', date:'2026-02-06', time:'14:00', tipo:'cot', estado:'pending' },
      { id:'C-003', cliente:'Laura Torres', empleado:'Juan Pérez', date:'2026-02-12', time:'12:30', tipo:'cita', estado:'progress' }
    ];
    function getCitas(){
      const raw = localStorage.getItem(CITA_KEY);
      if(!raw){
        localStorage.setItem(CITA_KEY, JSON.stringify(seedCitas));
        return seedCitas;
      }
      try{ return JSON.parse(raw) || []; } catch{ return []; }
    }
    function pad(n){ return String(n).padStart(2,'0'); }
    function monthName(m){
      return ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'][m] || '';
    }
    function fmtDMY(iso){
      const [y,m,d] = iso.split('-');
      return `${d}/${m}/${y.slice(-2)}`;
    }
    function prevMonth(){
      calMonth--;
      if(calMonth < 0){ calMonth = 11; calYear--; }
      renderCalendar();
    }
    function nextMonth(){
      calMonth++;
      if(calMonth > 11){ calMonth = 0; calYear++; }
      renderCalendar();
    }

    function tipoLabel(t){
      if(t==='inst') return 'Instalación';
      if(t==='cot') return 'Cotización';
      return 'Cita';
    }
    function estadoLabel(e){
      if(e==='completed') return 'Confirmada';
      if(e==='progress') return 'En proceso';
      return 'Pendiente';
    }

    function makeDayCell(y, m, d, muted, citas){
      const dateObj = new Date(y, m, d);
      const yy = dateObj.getFullYear();
      const mm = dateObj.getMonth();
      const dd = dateObj.getDate();
      const iso = `${yy}-${pad(mm+1)}-${pad(dd)}`;

      const dayCitas = citas.filter(c => c.date === iso);

      const cell = document.createElement('div');
      cell.className = 'cal-day' + (muted ? ' muted' : '');
      cell.setAttribute('data-date', iso);
      cell.onclick = () => selectDay(iso);

      const chips = dayCitas.slice(0, 2).map(c => {
        return `<div class="chip ${c.tipo}">${escapeHtml(c.time)} • ${escapeHtml(c.cliente)}</div>`;
      }).join('');

      const dots = dayCitas.slice(0, 3).map(c => {
        return `<span class="dot ${c.tipo}"></span>`;
      }).join('');

      cell.innerHTML = `
        <div class="num">${dd}</div>
        <div class="cal-chip">${chips}</div>
        <div class="cal-dots">${dots}</div>
      `;
      return cell;
    }

    function selectDay(iso){
      $$('.cal-day').forEach(x => x.style.outline = 'none');
      const cell = $(`.cal-day[data-date="${iso}"]`);
      if(cell) cell.style.outline = `2px solid ${getComputedStyle(document.documentElement).getPropertyValue('--accent')}`;

      const citas = getCitas().filter(c => c.date === iso).sort((a,b)=>a.time.localeCompare(b.time));
      const head = $('#dayHead');
      const list = $('#dayList');

      if(head) head.textContent = `Citas del ${fmtDMY(iso)}`;
      if(!list) return;
      list.innerHTML = '';

      if(!citas.length){
        list.innerHTML = `
          <div class="cal-item">
            <div class="t">Sin citas</div>
            <div class="m">No hay citas programadas para este día.</div>
          </div>
        `;
        return;
      }

      citas.forEach(c => {
        const el = document.createElement('div');
        el.className = 'cal-item';
        el.innerHTML = `
          <div class="t">${escapeHtml(c.time)} • ${escapeHtml(c.cliente)}</div>
          <div class="m">${escapeHtml(c.empleado)} • ${tipoLabel(c.tipo)} • ${estadoLabel(c.estado)}</div>
        `;
        list.appendChild(el);
      });
    }

    function renderCalendar(){
      const grid = $('#calendarGrid');
      const title = $('#calTitle');
      if(!grid || !title) return;

      title.textContent = `${monthName(calMonth)} ${calYear}`;

      const citas = getCitas();
      const monthStr = pad(calMonth+1);

      const first = new Date(calYear, calMonth, 1);
      const last = new Date(calYear, calMonth+1, 0);
      const daysInMonth = last.getDate();
      const startDow = (first.getDay() + 6) % 7;

      grid.innerHTML = '';

      const prevLast = new Date(calYear, calMonth, 0).getDate();
      for(let i=0;i<startDow;i++){
        const d = prevLast - (startDow - 1 - i);
        const cell = makeDayCell(calYear, calMonth-1, d, true, citas);
        grid.appendChild(cell);
      }

      for(let d=1; d<=daysInMonth; d++){
        const cell = makeDayCell(calYear, calMonth, d, false, citas);
        grid.appendChild(cell);
      }

      while(grid.children.length < 42){
        const idx = grid.children.length - (startDow + daysInMonth);
        const d = idx + 1;
        const cell = makeDayCell(calYear, calMonth+1, d, true, citas);
        grid.appendChild(cell);
      }

      const nextList = $('#nextList');
      if(nextList){
        const next = citas
          .slice()
          .sort((a,b) => (a.date+a.time).localeCompare(b.date+b.time))
          .slice(0, 8);

        nextList.innerHTML = '';
        next.forEach(c => {
          const el = document.createElement('div');
          el.className = 'cal-item';
          el.innerHTML = `
            <div class="t">${escapeHtml(c.cliente)} • ${escapeHtml(c.empleado)}</div>
            <div class="m">${fmtDMY(c.date)} • ${escapeHtml(c.time)} • ${tipoLabel(c.tipo)}</div>
          `;
          nextList.appendChild(el);
        });
        if(!next.length){
          nextList.innerHTML = `<div class="cal-item"><div class="t">Sin citas</div><div class="m">No hay próximas citas registradas.</div></div>`;
        }
      }

      const today = new Date();
      if(today.getFullYear()===calYear && today.getMonth()===calMonth){
        selectDay(`${calYear}-${monthStr}-${pad(today.getDate())}`);
      }else{
        selectDay(`${calYear}-${monthStr}-01`);
      }
    }

    /* =========================
       CATÁLOGO: DATA + CRUD
    ========================= */
    const PROD_KEY = 'wh_admin_productos';
    const VIEW_KEY = 'wh_admin_viewmode'; // cards|table

    function seedProductosIfEmpty(){
      const raw = localStorage.getItem(PROD_KEY);
      if(raw) return;

      const seed = [
        {
          id:'milano',
          sku:'MLN-001',
          nombre:'Milano',
          categoria:'A Piso',
          badge:'Nuevo',
          estado:'activo',
          precio:8500,
          stock:15,
          descCorta:'Diseño minimalista con acabados premium.',
          specsResumen:{
            dimensiones:'120cm x 50cm x 85cm',
            material:'Madera de encino + acabado mate',
            acabado:'', /* <i class="fa-solid fa-circle-check"></i> FIX */
            lavabo:'Cerámica blanca incluida'
          },
          rating:4.8,
          reviews:124,
          descLarga:'Milano combina un diseño moderno con materiales resistentes. Ideal para baños contemporáneos con un toque elegante.',
          features:[
            'Cajones de cierre suave',
            'Herrajes de alta durabilidad',
            'Protección contra humedad',
            'Fácil instalación'
          ],
          specs:[
            { label:'Material', value:'Madera de encino' },
            { label:'Acabado', value:'Mate' },
            { label:'Lavabo', value:'Incluido (cerámica)' },
            { label:'Instalación', value:'Incluida' }
          ],
          imgs:[
            '/img/milano1.jpg',
            '/img/milano2.jpg'
          ]
        },
        {
          id:'venecia',
          sku:'VNC-002',
          nombre:'Venecia',
          categoria:'Flotados',
          badge:'Popular',
          estado:'activo',
          precio:12800,
          stock:8,
          descCorta:'Estilo clásico con detalle artesanal.',
          specsResumen:{
            dimensiones:'140cm x 55cm x 90cm',
            material:'Madera de cedro + barniz satinado',
            acabado:'', /* <i class="fa-solid fa-circle-check"></i> FIX */
            lavabo:'Piedra natural opcional'
          },
          rating:4.6,
          reviews:77,
          descLarga:'Venecia destaca por su estilo clásico y acabados finos. Perfecto para espacios elegantes.',
          features:[
            'Acabado satinado',
            'Espacio amplio de almacenamiento',
            'Resistente a humedad',
            'Opciones de personalización'
          ],
          specs:[
            { label:'Material', value:'Madera de cedro' },
            { label:'Acabado', value:'Satinado' },
            { label:'Lavabo', value:'Opcional' },
            { label:'Garantía', value:'12 meses' }
          ],
          imgs:[]
        }
      ];
      localStorage.setItem(PROD_KEY, JSON.stringify(seed));
    }

    function getProductos(){
      try{
        return JSON.parse(localStorage.getItem(PROD_KEY) || '[]');
      }catch{
        return [];
      }
    }
    function setProductos(list){
      localStorage.setItem(PROD_KEY, JSON.stringify(list));
    }

    function getViewMode(){
      return localStorage.getItem(VIEW_KEY) || 'cards';
    }
    function setViewMode(mode){
      localStorage.setItem(VIEW_KEY, mode);
    }

    function toggleCatalogView(){
      const current = getViewMode();
      const next = current === 'cards' ? 'table' : 'cards';
      setViewMode(next);
      renderCatalogo();
    }

    function normalizeCategory(cat){
      const x = String(cat||'').trim();
      if(!x) return '';
      return x;
    }

    function renderCatalogo(){
      const mode = getViewMode();
      $('#viewModeLabel').textContent = mode === 'cards' ? 'Tarjetas' : 'Tabla';

      $('#catalogCards').classList.toggle('hidden', mode !== 'cards');
      $('#catalogTableWrap').classList.toggle('hidden', mode !== 'table');

      const q = ($('#catSearch')?.value || '').trim().toLowerCase();
      const cat = ($('#catCategory')?.value || '').trim();
      const st = ($('#catStatus')?.value || '').trim();

      let list = getProductos();

      list = list.filter(p => {
        const hay = [p.id, p.sku, p.nombre, p.categoria].join(' ').toLowerCase();
        const okQ = !q || hay.includes(q);
        const okCat = !cat || p.categoria === cat;
        const okSt = !st || p.estado === st;
        return okQ && okCat && okSt;
      });

      if(mode === 'cards'){
        const wrap = $('#catalogCards');
        wrap.innerHTML = '';
        if(!list.length){
          wrap.innerHTML = `<div class="section" style="grid-column:1/-1;">
            <div style="color:var(--muted2); font-size:13px;">No hay productos con esos filtros.</div>
          </div>`;
          return;
        }

        list.forEach(p => {
          const badge = p.badge ? `<div class="cat-badge ${escapeHtml(p.badge)}">${escapeHtml(p.badge)}</div>` : '';
          const dim = p?.specsResumen?.dimensiones || '—';
          const mat = p?.specsResumen?.material || '—';
          const acab = p?.specsResumen?.acabado || '—';
          const lav = p?.specsResumen?.lavabo || '—';

          const card = document.createElement('div');
          card.className = 'cat-card';
          card.innerHTML = `
            <div class="cat-image">${badge}</div>
            <div class="cat-content">
              <div class="cat-title">${escapeHtml(p.nombre)} <span style="color:#bbb; font-size:12px; font-weight:800;">(${escapeHtml(p.categoria)})</span></div>
              <div class="cat-desc">${escapeHtml(p.descCorta || '')}</div>

              <div class="cat-specs">
                <div class="cat-spec"><span>Dimensiones</span><span>${escapeHtml(dim)}</span></div>
                <div class="cat-spec"><span>Material</span><span>${escapeHtml(mat)}</span></div>
                <div class="cat-spec"><span>Acabado</span><span>${escapeHtml(acab)}</span></div>
                <div class="cat-spec"><span>Lavabo</span><span>${escapeHtml(lav)}</span></div>
              </div>

              <div class="cat-footer">
                <div class="cat-price">${money(p.precio)}</div>
                <div class="cat-actions">
                  <button class="btn btn-secondary btn-small" onclick="openProductoDetalle('${escapeHtml(p.id)}')">Ver detalle</button>
                  <button class="btn btn-secondary btn-small" onclick="openProductoModal('edit','${escapeHtml(p.id)}')"><i class="fa-solid fa-pen"></i></button>
                  <button class="btn btn-danger btn-small" onclick="deleteProducto('${escapeHtml(p.id)}')"><i class="fa-solid fa-trash"></i></button>
                </div>
              </div>

              <div style="margin-top:10px; font-size:11px; color:#aaa;">
                ID: <b style="color:#fff;">${escapeHtml(p.id)}</b> • SKU: <b style="color:#fff;">${escapeHtml(p.sku)}</b> • Stock: <b style="color:#fff;">${escapeHtml(p.stock)}</b> •
                <span class="status-badge ${p.estado==='activo'?'status-completed':'status-disabled'}">${p.estado==='activo'?'Activo':'Inactivo'}</span>
              </div>
            </div>
          `;
          wrap.appendChild(card);
        });
      }

      if(mode === 'table'){
        const body = $('#catalogTableBody');
        body.innerHTML = '';
        if(!list.length){
          body.innerHTML = `<tr><td colspan="8" style="color:var(--muted);">No hay productos con esos filtros.</td></tr>`;
          return;
        }
        list.forEach(p => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${escapeHtml(p.id)}</td>
            <td>${escapeHtml(p.sku)}</td>
            <td>${escapeHtml(p.nombre)}</td>
            <td>${escapeHtml(p.categoria)}</td>
            <td style="color:var(--accent); font-weight:900;">${money(p.precio)}</td>
            <td>${escapeHtml(p.stock)}</td>
            <td><span class="status-badge ${p.estado==='activo'?'status-completed':'status-disabled'}">${p.estado==='activo'?'Activo':'Inactivo'}</span></td>
            <td>
              <button class="btn btn-secondary btn-small" onclick="openProductoDetalle('${escapeHtml(p.id)}')">Ver</button>
              <button class="btn btn-secondary btn-small" onclick="openProductoModal('edit','${escapeHtml(p.id)}')"><i class="fa-solid fa-pen"></i></button>
              <button class="btn btn-danger btn-small" onclick="deleteProducto('${escapeHtml(p.id)}')"><i class="fa-solid fa-trash"></i></button>
            </td>
          `;
          body.appendChild(tr);
        });
      }

      refreshKPIs();
    }

    async function openProductoModal(mode, id=''){
      $('#p_mode').value = mode;
      $('#p_key').value = id || '';
      const isEdit = mode === 'edit';

      $('#productoModalTitle').textContent = isEdit ? 'Editar Producto' : 'Nuevo Producto';

      // Resetear estado de imágenes
      window._imgFilesPending = [];
      window._imgUrlsCurrent  = [];
      const urlsInput = document.getElementById('p_imgs_urls');
      if (urlsInput) urlsInput.value = '';
      const previewList = document.getElementById('imgPreviewList');
      if (previewList) previewList.innerHTML = '';
      const fileInput = document.getElementById('p_imgs_file');
      if (fileInput) fileInput.value = '';

      const clear = (x) => { const el = $('#'+x); if(el) el.value = ''; };
      [
        'p_id','p_sku','p_nombre','p_categoria','p_badge','p_estado','p_precio','p_stock',
        'p_dim','p_mat','p_acab','p_lav','p_descCorta','p_descLarga','p_rating','p_reviews','p_features','p_specs'
      ].forEach(clear);

      if(isEdit){
        const p = getProductos().find(x => x.id === id);
        if(!p){
          showNotification('No se encontró el producto para editar', 'error');
          return;
        }
        $('#p_id').value = p.id || '';
        $('#p_sku').value = p.sku || '';
        $('#p_nombre').value = p.nombre || '';
        $('#p_categoria').value = normalizeCategory(p.categoria) || '1';
        $('#p_badge').value = p.badge || '';
        $('#p_estado').value = p.estado || 'activo';
        $('#p_precio').value = Number(p.precio || 0);
        $('#p_stock').value = Number(p.stock || 0);

        $('#p_dim').value = p?.specsResumen?.dimensiones || '';
        $('#p_mat').value = p?.specsResumen?.material || '';
        $('#p_acab').value = p?.specsResumen?.acabado || '';
        $('#p_lav').value = p?.specsResumen?.lavabo || '';
        $('#p_descCorta').value = p.descCorta || '';

        $('#p_descLarga').value = p.descLarga || '';
        $('#p_rating').value = p.rating ?? '';
        $('#p_reviews').value = p.reviews ?? '';
        $('#p_features').value = (p.features || []).join('\n');
        $('#p_specs').value = (p.specs || []).map(s => `${s.label}: ${s.value}`).join('\n');
        // Cargar imágenes existentes del producto desde API
        const imgUrls = p.imgs || [];
        const urlsInput = document.getElementById('p_imgs_urls');
        if (urlsInput) urlsInput.value = imgUrls.join('\n');
        renderImgPreviews();

        $('#p_id').disabled = true;
        $('#p_id').style.opacity = .7;
      }else{
        $('#p_id').disabled = false;
        $('#p_id').style.opacity = 1;
        $('#p_categoria').value = apiCategorias.length ? String(apiCategorias[0].id) : '1';
        $('#p_estado').value = 'activo';
      }

      openModal('productoModal');
    }

    function validateProductoPayload(payload, isEdit=false){
      const req = (v) => String(v||'').trim().length > 0;

      if(!req(payload.id)) return 'Falta ID (slug)';
      if(!req(payload.sku)) return 'Falta SKU';
      if(!req(payload.nombre)) return 'Falta Nombre';
      if(!req(payload.categoria)) return 'Falta Categoría';
      if(!isFinite(payload.precio) || payload.precio <= 0) return 'Precio inválido';
      if(!Number.isFinite(payload.stock) || payload.stock < 0) return 'Stock inválido';

      if(!req(payload.specsResumen?.dimensiones)) return 'Faltan Dimensiones (resumen)';
      if(!req(payload.specsResumen?.material)) return 'Falta Material (resumen)';
      if(!req(payload.specsResumen?.lavabo)) return 'Falta Lavabo (resumen)';
      if(!req(payload.descCorta)) return 'Falta Descripción corta';
      if(!req(payload.descLarga)) return 'Falta Descripción larga';

      return '';
    }

    async function saveProductoFull(){
      const mode   = $('#p_mode').value;
      const isEdit = mode === 'edit';
      const oldId  = $('#p_key').value;

      // Armar payload base
      const payload = {
        mode,
        id:       isEdit ? oldId : String($('#p_id').value || '').trim(),
        nombre:   String($('#p_nombre').value || '').trim(),
        categoria_id: parseInt($('#p_categoria').value || 0),
        badge:    String($('#p_badge').value || '').trim(),
        estado:   String($('#p_estado').value || 'activo').trim(),
        precio:   Number($('#p_precio').value || 0),
        stock:    Number($('#p_stock').value || 0),
        descCorta: String($('#p_descCorta').value || '').trim(),
        specsResumen: {
          dimensiones: String($('#p_dim').value || '').trim(),
          material:    String($('#p_mat').value || '').trim(),
          acabado:     String($('#p_acab').value || '').trim(),
          lavabo:      String($('#p_lav').value || '').trim(),
        },
        descLarga: String($('#p_descLarga').value || '').trim(),
        features:  parseLines($('#p_features').value),
        specs: parseLines($('#p_specs').value).map(line => {
          const idx = line.indexOf(':');
          if (idx === -1) return { label: line, value: '' };
          return { label: line.slice(0, idx).trim(), value: line.slice(idx+1).trim() };
        }),
      };

      // Validaciones básicas
      if (!payload.nombre)        { showNotification('<i class="fa-solid fa-xmark"></i> Falta el nombre', 'error'); return; }
      if (!payload.categoria_id)  { showNotification('<i class="fa-solid fa-xmark"></i> Falta la categoría', 'error'); return; }
      if (payload.precio <= 0)    { showNotification('<i class="fa-solid fa-xmark"></i> Precio inválido', 'error'); return; }
      if (!payload.descLarga)     { showNotification('<i class="fa-solid fa-xmark"></i> Falta descripción larga', 'error'); return; }

      // ── Subir imágenes pendientes a Firebase Storage ──────────
      const btnGuardar = document.querySelector('#productoModal .btn-primary');
      if (btnGuardar) { btnGuardar.disabled = true; btnGuardar.textContent = 'Guardando...'; }

      try {
        // Subir archivos nuevos pendientes
        if (window._imgFilesPending && window._imgFilesPending.length > 0) {
          showNotification('<i class="fa-solid fa-cloud-arrow-up"></i> Subiendo imágenes...', 'info');
          const urls = await subirImagenesFirebase(window._imgFilesPending, payload.nombre);
          // Agregar a las URLs ya guardadas
          const existentes = (document.getElementById('p_imgs_urls')?.value || '')
            .split('').map(u => u.trim()).filter(Boolean);
          window._imgUrlsCurrent = [...existentes, ...urls];
          document.getElementById('p_imgs_urls').value = window._imgUrlsCurrent.join('');
          window._imgFilesPending = [];
        }

        payload.imgs = (document.getElementById('p_imgs_urls')?.value || '')
          .split('').map(u => u.trim()).filter(Boolean);

        await saveProductoAPI(payload);
        closeModal('productoModal');
        window._imgUrlsCurrent = [];
        window._imgFilesPending = [];

      } catch(e) {
        showNotification('<i class="fa-solid fa-xmark"></i> Error: ' + e.message, 'error');
      } finally {
        if (btnGuardar) { btnGuardar.disabled = false; btnGuardar.textContent = 'Guardar'; }
      }
    }

    // ── Subir imágenes a Firebase Storage ─────────────────────────
    async function subirImagenesFirebase(files, nombreProducto) {
      if (!firebaseStorage) throw new Error('Firebase Storage no disponible');

      const progress  = document.getElementById('imgUploadProgress');
      const bar       = document.getElementById('imgProgressBar');
      const label     = document.getElementById('imgProgressLabel');
      if (progress) progress.style.display = 'block';

      const urls   = [];
      const slug   = nombreProducto.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30);
      const ts     = Date.now();

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 2 * 1024 * 1024) {
          showNotification(`<i class="fa-solid fa-xmark"></i> "${file.name}" supera 2 MB, se omite`, 'error');
          continue;
        }
        const ext  = file.name.split('.').pop().toLowerCase();
        const path = `productos/${slug}-${ts}-${i}.${ext}`;
        const ref  = firebaseStorage.ref(path);

        if (bar) bar.style.width = Math.round(((i) / files.length) * 100) + '%';
        if (label) label.textContent = `Subiendo ${i+1} de ${files.length}...`;

        const snap = await ref.put(file);
        const url  = await snap.ref.getDownloadURL();
        urls.push(url);
      }

      if (bar) bar.style.width = '100%';
      if (label) label.textContent = 'Listo';
      setTimeout(() => { if (progress) progress.style.display = 'none'; }, 1500);

      return urls;
    }

    // ── Manejar selección de archivos ──────────────────────────────
    function handleImgSelect(files) {
      if (!window._imgFilesPending) window._imgFilesPending = [];
      window._imgFilesPending = [...window._imgFilesPending, ...Array.from(files)];
      renderImgPreviews();
    }

    function handleImgDrop(event) {
      event.preventDefault();
      document.getElementById('imgDropZone').style.background = '#1a1a1a';
      handleImgSelect(event.dataTransfer.files);
    }

    function renderImgPreviews() {
      const list = document.getElementById('imgPreviewList');
      if (!list) return;

      const existentes = (document.getElementById('p_imgs_urls')?.value || '')
        .split('').map(u => u.trim()).filter(Boolean);

      const pendientes = (window._imgFilesPending || []).map(f => ({
        src: URL.createObjectURL(f),
        label: f.name,
        tipo: 'nuevo'
      }));

      const todas = [
        ...existentes.map((url, i) => ({ src: url, label: `Imagen ${i+1}`, tipo: 'guardada', url })),
        ...pendientes
      ];

      if (todas.length === 0) { list.innerHTML = ''; return; }

      list.innerHTML = todas.map((img, i) => `
        <div style="position:relative;width:80px;height:80px;">
          <img src="${img.src}" style="width:80px;height:80px;object-fit:cover;border-radius:8px;border:2px solid ${i===0?'#8b7355':'#444'};"
               title="${i===0?'Principal':img.label}">
          ${i===0?'<span style="position:absolute;bottom:2px;left:2px;background:#8b7355;color:#fff;font-size:9px;padding:1px 4px;border-radius:3px;">Principal</span>':''}
          ${img.tipo==='guardada'?`<button onclick="eliminarImgGuardada(${i})" style="position:absolute;top:2px;right:2px;background:#cc3333;border:none;color:#fff;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer;padding:0;">×</button>`:''}
          ${img.tipo==='nuevo'?`<button onclick="eliminarImgPendiente(${i-existentes.length})" style="position:absolute;top:2px;right:2px;background:#cc3333;border:none;color:#fff;border-radius:50%;width:18px;height:18px;font-size:11px;cursor:pointer;padding:0;">×</button>`:''}
        </div>
      `).join('');
    }

    function eliminarImgGuardada(idx) {
      const urls = (document.getElementById('p_imgs_urls')?.value || '')
        .split('').map(u => u.trim()).filter(Boolean);
      urls.splice(idx, 1);
      document.getElementById('p_imgs_urls').value = urls.join('');
      renderImgPreviews();
    }

    function eliminarImgPendiente(idx) {
      if (window._imgFilesPending) window._imgFilesPending.splice(idx, 1);
      renderImgPreviews();
    }

    function deleteProducto(id){
      if(!confirm('¿Eliminar este producto?')) return;
      const list = getProductos().filter(p => p.id !== id);
      setProductos(list);
      renderCatalogo();
      showNotification('<i class="fa-solid fa-check"></i> Producto eliminado', 'success');
    }

    let _detailCurrentId = '';
    function openProductoDetalle(id){
      const p = getProductos().find(x => x.id === id);
      if(!p){
        showNotification('No se encontró el producto', 'error');
        return;
      }
      _detailCurrentId = id;

      $('#detalleModalTitle').textContent = `Detalle: ${p.nombre} (${p.id})`;

      const stockText = 'Fabricación bajo pedido';
      const ratingTxt = (p.rating ? `${p.rating.toFixed(1)} <i class="fa-solid fa-star"></i>` : '—');
      const reviewsTxt = (p.reviews ? `(${p.reviews} reseñas)` : '');

      const featuresHTML = (p.features || []).length
        ? (p.features || []).map(f => `<div class="detail-pill"><span>${escapeHtml(f)}</span><span><i class="fa-solid fa-check"></i></span></div>`).join('')
        : `<div class="detail-pill"><span>Sin features registradas</span><span>—</span></div>`;

      const specsHTML = (p.specs || []).length
        ? (p.specs || []).map(s => `<div class="kv"><span>${escapeHtml(s.label)}</span><b>${escapeHtml(s.value)}</b></div>`).join('')
        : `<div class="kv"><span>Especificaciones</span><b>—</b></div>`;

      const imgsCount = (p.imgs || []).length;

      $('#detalleBody').innerHTML = `
        <div class="detail-wrap">
          <div class="detail-card">
            <div class="detail-media">Galería (placeholder) • ${imgsCount} imagen(es) guardada(s)</div>
            <div class="detail-body">
              <div class="detail-title">${escapeHtml(p.nombre)}</div>
              <div class="detail-meta">${escapeHtml(p.categoria)} • ${escapeHtml(p.badge || 'Sin badge')} • ${escapeHtml(stockText)}</div>
              <div class="detail-price">${money(p.precio)}</div>
              <div class="detail-meta">${escapeHtml(ratingTxt)} ${escapeHtml(reviewsTxt)}</div>

              <div class="detail-desc">${escapeHtml(p.descLarga || '')}</div>

              <div class="detail-list">
                ${featuresHTML}
              </div>
            </div>
          </div>

          <div class="detail-side">
            <h4>Ficha técnica</h4>
            <div class="kv"><span>ID</span><b>${escapeHtml(p.id)}</b></div>
            <div class="kv"><span>SKU</span><b>${escapeHtml(p.sku)}</b></div>
            <div class="kv"><span>Estado</span><b>${escapeHtml(p.estado)}</b></div>
            <div class="kv"><span>Stock</span><b>${escapeHtml(p.stock)}</b></div>

            <div style="margin-top:10px;"></div>
            <h4>Especificaciones</h4>
            ${specsHTML}

            <div style="margin-top:10px;"></div>
            <h4>Resumen para Catálogo</h4>
            <div class="kv"><span>Dimensiones</span><b>${escapeHtml(p?.specsResumen?.dimensiones || '—')}</b></div>
            <div class="kv"><span>Material</span><b>${escapeHtml(p?.specsResumen?.material || '—')}</b></div>
            <div class="kv"><span>Lavabo</span><b>${escapeHtml(p?.specsResumen?.lavabo || '—')}</b></div>
            <small>Nota: por ahora sin imágenes reales.</small>
          </div>
        </div>
      `;

      openModal('productoDetalleModal');
    }

    function detailEditFromModal(){
      closeModal('productoDetalleModal');
      if(_detailCurrentId) openProductoModal('edit', _detailCurrentId);
    }

    /* =========================
       REPORTES
    ========================= */
    const SALES_KEY = 'wh_admin_sales';
    const QUOTES_KEY = 'wh_admin_quotes';

    function seedDemoSales(){
      const productos = getProductos();
      if(!productos.length){
        showNotification('Primero crea productos', 'error');
        return;
      }

      const randomPick = () => productos[Math.floor(Math.random()*productos.length)];
      const now = new Date();
      const sales = [];
      for(let i=0;i<18;i++){
        const d = new Date(now.getFullYear(), now.getMonth(), clamp(now.getDate()-Math.floor(Math.random()*25), 1, 28));
        const itemsCount = 1 + Math.floor(Math.random()*3);
        const items = [];
        let total = 0;
        for(let k=0;k<itemsCount;k++){
          const p = randomPick();
          const qty = 1 + Math.floor(Math.random()*2);
          const price = Number(p.precio || 0);
          total += qty*price;
          items.push({ productId:p.id, qty, price });
        }
        sales.push({ idVenta:'V-'+String(Date.now()+i).slice(-6), date:d.toISOString().slice(0,10), items, total:Math.round(total) });
      }
      localStorage.setItem(SALES_KEY, JSON.stringify(sales));

      const quotes = [];
      for(let i=0;i<22;i++){
        const r = Math.random();
        const status = r < .45 ? 'pendiente' : (r < .75 ? 'convertida' : 'cancelada');
        quotes.push({ idCot:'COT-'+String(100+i), status });
      }
      localStorage.setItem(QUOTES_KEY, JSON.stringify(quotes));

      showNotification('<i class="fa-solid fa-check"></i> Datos demo generados para reportes', 'success');
      renderReportes();
      refreshKPIs();
    }

    function getSales(){
      try{ return JSON.parse(localStorage.getItem(SALES_KEY) || '[]'); } catch { return []; }
    }
    function getQuotes(){
      try{ return JSON.parse(localStorage.getItem(QUOTES_KEY) || '[]'); } catch { return []; }
    }

    function computeTopProducts(){
      const productos = getProductos();
      const index = Object.fromEntries(productos.map(p => [p.id, p]));
      const agg = {};
      getSales().forEach(s => {
        (s.items||[]).forEach(it => {
          const id = it.productId;
          if(!agg[id]) agg[id] = { productId:id, units:0, revenue:0 };
          agg[id].units += Number(it.qty||0);
          agg[id].revenue += Number(it.qty||0)*Number(it.price||0);
        });
      });
      return Object.values(agg)
        .sort((a,b) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(x => ({...x, name: index[x.productId]?.nombre || x.productId}));
    }

    function computeKpis(){
      const sales = getSales();
      const total = sales.reduce((sum,s)=>sum+Number(s.total||0),0);
      const orders = sales.length;
      const ticket = orders ? total/orders : 0;

      const quotes = getQuotes();
      const qTotal = quotes.length;
      const qConv = quotes.filter(q=>q.status==='convertida').length;
      const conv = qTotal ? (qConv/qTotal)*100 : 0;

      const citas = getCitas();
      const counts = { inst:0, cot:0, cita:0 };
      citas.forEach(c => { counts[c.tipo] = (counts[c.tipo]||0)+1; });
      const max = Math.max(1, counts.inst+counts.cot+counts.cita);
      const pct = {
        inst: (counts.inst/max)*100,
        cot: (counts.cot/max)*100,
        cita: (counts.cita/max)*100,
      };

      return { total, orders, ticket, conv, counts, pct };
    }

    function renderReportes(){
      const k = computeKpis();
      $('#repVentas').textContent = money(k.total);
      $('#repOrdenes').textContent = String(k.orders);
      $('#repTicket').textContent = money(k.ticket);
      $('#repConv').textContent = `${k.conv.toFixed(0)}%`;

      $('#barInst').style.width = `${k.pct.inst.toFixed(0)}%`;
      $('#barCot').style.width = `${k.pct.cot.toFixed(0)}%`;
      $('#barCita').style.width = `${k.pct.cita.toFixed(0)}%`;

      const top = computeTopProducts();
      const body = $('#repTopBody');
      body.innerHTML = '';

      if(!top.length){
        body.innerHTML = `<tr><td colspan="4" style="color:var(--muted);">No hay ventas aún. Usa “Generar datos demo”.</td></tr>`;
        return;
      }

      top.forEach(x => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td>${escapeHtml(x.name)}</td>
          <td>${escapeHtml(x.productId)}</td>
          <td>${escapeHtml(x.units)}</td>
          <td style="color:var(--accent); font-weight:900;">${money(x.revenue)}</td>
        `;
        body.appendChild(tr);
      });
    }

    function exportReportCSV(){
      const k = computeKpis();
      const top = computeTopProducts();

      const lines = [];
      lines.push(['Reporte','Wooden House'].join(','));
      lines.push(['Ventas', k.total].join(','));
      lines.push(['Ordenes', k.orders].join(','));
      lines.push(['TicketPromedio', k.ticket].join(','));
      lines.push(['ConversionCotizaciones', k.conv.toFixed(2)+'%'].join(','));
      lines.push('');
      lines.push(['TopProductos','ID','Unidades','Ingresos'].join(','));

      top.forEach(t => {
        lines.push([
          `"${String(t.name).replaceAll('"','""')}"`,
          `"${String(t.productId).replaceAll('"','""')}"`,
          t.units,
          t.revenue
        ].join(','));
      });

      const csv = lines.join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_wooden_house_${new Date().toISOString().slice(0,10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showNotification('<i class="fa-solid fa-check"></i> CSV exportado (Excel)', 'success');
    }

    function printReportPDF(){
      showSection('reportes');
      setTimeout(() => {
        window.print();
        showNotification('Tip: en imprimir elige “Guardar como PDF”', 'info');
      }, 250);
    }

    /* =========================
       KPIs DASHBOARD
    ========================= */
    function refreshKPIs(){
      const productos = getProductos();
      $('#kpiProductos').textContent = String(productos.length);

      const low = productos.filter(p => Number(p.stock||0) <= 5).length;
      $('#kpiStockLow').textContent = low ? `<i class="fa-solid fa-triangle-exclamation"></i> ${low} bajo stock` : 'Stock OK';

      const k = computeKpis();
      $('#kpiVentasMes').textContent = money(k.total);
      $('#kpiVentasHint').textContent = k.orders ? `Órdenes: ${k.orders} • Ticket: ${money(k.ticket)}` : 'Sin ventas registradas';

      $('#kpiPedidos').textContent = String(3);
      $('#kpiClientes').textContent = String(21);
    }

    // =========================
    // Charts (Canvas) - DEMO
    // =========================
    function drawBars(canvasId, values, labels){
      const c = document.getElementById(canvasId);
      if(!c) return;
      const ctx = c.getContext('2d');
      const w = c.width = c.clientWidth * (window.devicePixelRatio || 1);
      const h = c.height = (Number(c.getAttribute('height')) || 120) * (window.devicePixelRatio || 1);
      ctx.clearRect(0,0,w,h);

      const pad = 18*(window.devicePixelRatio||1);
      const max = Math.max(...values, 1);
      const bw = (w - pad*2) / values.length;

      ctx.globalAlpha = 0.25;
      ctx.strokeStyle = '#999';
      ctx.lineWidth = 1*(window.devicePixelRatio||1);
      for(let i=0;i<4;i++){
        const y = pad + (h-pad*2)*(i/3);
        ctx.beginPath(); ctx.moveTo(pad,y); ctx.lineTo(w-pad,y); ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8b7355';
      ctx.fillStyle = accent;

      values.forEach((v,i)=>{
        const bh = (h-pad*2) * (v/max);
        const x = pad + i*bw + (bw*0.18);
        const y = h - pad - bh;
        const rw = bw*0.64;
        ctx.globalAlpha = 0.9;
        roundRect(ctx, x, y, rw, bh, 10*(window.devicePixelRatio||1));
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      ctx.fillStyle = '#cfcfcf';
      ctx.font = `${12*(window.devicePixelRatio||1)}px system-ui, -apple-system, Segoe UI, Roboto`;
      ctx.textAlign = 'center';
      labels.forEach((t,i)=>{
        const x = pad + i*bw + bw/2;
        ctx.fillText(t, x, h - (4*(window.devicePixelRatio||1)));
      });
    }

    function drawDonut(canvasId, parts, labels){
      const c = document.getElementById(canvasId);
      if(!c) return;
      const ctx = c.getContext('2d');
      const w = c.width = c.clientWidth * (window.devicePixelRatio || 1);
      const h = c.height = (Number(c.getAttribute('height')) || 120) * (window.devicePixelRatio || 1);
      ctx.clearRect(0,0,w,h);

      const cx = w/2, cy = h/2;
      const r = Math.min(w,h)*0.33;
      const lw = r*0.55;
      const total = parts.reduce((a,b)=>a+b,0) || 1;

      const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#8b7355';
      const muted = getComputedStyle(document.documentElement).getPropertyValue('--border').trim() || '#3c3c3c';

      const colors = [accent, muted, '#6f6f6f', '#9a9a9a'];
      let ang = -Math.PI/2;

      parts.forEach((p,i)=>{
        const a = (p/total) * Math.PI*2;
        ctx.beginPath();
        ctx.strokeStyle = colors[i % colors.length];
        ctx.lineWidth = lw;
        ctx.lineCap = 'round';
        ctx.arc(cx, cy, r, ang, ang+a);
        ctx.stroke();
        ang += a;
      });

      ctx.fillStyle = '#e0e0e0';
      ctx.font = `${16*(window.devicePixelRatio||1)}px system-ui, -apple-system, Segoe UI, Roboto`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${total} pedidos`, cx, cy);
    }

    function roundRect(ctx, x, y, w, h, r){
      const rr = Math.min(r, w/2, h/2);
      ctx.beginPath();
      ctx.moveTo(x+rr, y);
      ctx.arcTo(x+w, y, x+w, y+h, rr);
      ctx.arcTo(x+w, y+h, x, y+h, rr);
      ctx.arcTo(x, y+h, x, y, rr);
      ctx.arcTo(x, y, x+w, y, rr);
      ctx.closePath();
    }

    function drawDashboardCharts(){
      const ventas = [1200, 1800, 900, 2100, 1500, 2600, 2300];
      const labels = ['L','M','M','J','V','S','D'];
      drawBars('chartVentas', ventas, labels);
      const total = ventas.reduce((a,b)=>a+b,0);
      const meta1 = document.getElementById('chartVentasMeta');
      if(meta1) meta1.textContent = `Total semana: $${total.toLocaleString('es-MX')}`;

      const estados = [6, 9, 4];
      drawDonut('chartEstados', estados, ['Pendiente','En Proceso','Completado']);
      const meta2 = document.getElementById('chartEstadosMeta');
      if(meta2) meta2.textContent = `Pendientes: ${estados[0]} · Proceso: ${estados[1]} · Completados: ${estados[2]}`;
    }

    window.addEventListener('resize', () => {
      clearTimeout(window.__whChartTimer);
      window.__whChartTimer = setTimeout(drawDashboardCharts, 120);
    });

    document.addEventListener('DOMContentLoaded', () => {
      seedProductosIfEmpty();
      renderCalendar();
      renderCatalogo();
      renderReportes();
      refreshKPIs();
      drawDashboardCharts();
      setTimeout(() => showNotification('Bienvenido, Administrador', 'success'), 450);
    });
  
// =============================================================
// API LAYER - Conexión real al backend PHP
// Reemplaza las funciones simuladas de localStorage
// =============================================================

const API_BASE = '/api';

/**
 * Obtener Firebase token para llamadas a API autenticadas
 */
async function getAuthToken() {
  try {
    if (typeof firebaseAuth !== 'undefined' && firebaseAuth?.currentUser) {
      return await firebaseAuth.currentUser.getIdToken(true);
    }
    // Fallback: sessionStorage
    return sessionStorage.getItem('wh_firebase_token') || '';
  } catch (e) { return ''; }
}

/**
 * Fetch autenticado
 */
async function apiFetch(url, options = {}) {
  const token = await getAuthToken();
  options.headers = options.headers || {};
  if (token) options.headers['Authorization'] = 'Bearer ' + token;
  options.headers['Content-Type'] = options.headers['Content-Type'] || 'application/json';
  const res = await fetch(url, options);
  return res.json();
}

/**
 * Logout con Firebase
 */
async function logoutAdmin() {
  if (!confirm('¿Cerrar sesión?')) return;
  try {
    if (typeof logoutFirebase === 'function') await logoutFirebase();
    else if (typeof firebaseAuth !== 'undefined') await firebaseAuth.signOut();
  } catch(e) {}
  await fetch('/api/auth.php?action=logout', { method: 'POST' });
  window.location.href = '/login';
}

// ============================================================
// KPIs - Cargar desde API real
// ============================================================
async function refreshKPIsFromAPI() {
  try {
    const data = await apiFetch(`${API_BASE}/reportes.php?tipo=resumen`);
    if (!data.success) return;

    const r = data;
    // Ventas del mes
    const ventasEl = document.getElementById('kpiVentasMes');
    if (ventasEl) ventasEl.textContent = new Intl.NumberFormat('es-MX', {style:'currency',currency:'MXN'}).format(r.ingresos_mes || 0);

    // Pedidos
    const pedEl = document.getElementById('kpiPedidos');
    if (pedEl) pedEl.textContent = r.total_pedidos || 0;

    // Clientes (proxy: pedidos totales únicos)
    const cliEl = document.getElementById('kpiClientes');
    if (cliEl) cliEl.textContent = r.total_pedidos || 0;

    // Productos
    const prodEl = document.getElementById('kpiProductos');
    if (prodEl) prodEl.textContent = r.productos_activos || 0;

    const hintEl = document.getElementById('kpiVentasHint');
    if (hintEl) hintEl.textContent = `${r.pedidos_mes || 0} pedidos este mes`;

    const stockEl = document.getElementById('kpiStockLow');
    if (stockEl) stockEl.textContent = `${r.pedidos_pendientes || 0} pendientes`;

  } catch (e) { console.warn('KPIs API error:', e); }
}

// Llamar al cargar dashboard
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(refreshKPIsFromAPI, 500);
});

// ============================================================
// CATÁLOGO - Conectar a API real
// ============================================================
let apiProductos = [];
let apiCategorias = [];

async function cargarProductosAPI() {
  try {
    const [prodData, catData] = await Promise.all([
      apiFetch(`${API_BASE}/productos.php?limit=100&activo=`),
      apiFetch(`${API_BASE}/categorias.php?todas=1`),
    ]);

    if (prodData.success) {
      apiProductos = (prodData.productos || []).map(p => ({
        id:          String(p.id),
        nombre:      p.nombre,
        descripcion: p.descripcion || '',
        precio:      parseFloat(p.precio || 0),
        stock:       parseInt(p.stock_disponible || 0),
        categoria:   p.categoria_nombre || '',
        categoria_id:p.categoria_id,
        etiqueta:    p.etiqueta || '',
        estado:      p.activo ? 'activo' : 'inactivo',
        specsResumen:{ dimensiones: '', material: '', acabado: '', lavabo: '' },
        descCorta:   (p.descripcion || '').substring(0, 100),
        descLarga:   p.descripcion || '',
        badge:       p.etiqueta || '',
        imgs:        p.imagen_principal ? [p.imagen_principal] : [],
      }));
    }

    if (catData.success) {
      apiCategorias = catData.categorias || [];
      // Actualizar select de categorías en el modal
      const catSelect = document.getElementById('p_categoria');
      if (catSelect) {
        catSelect.innerHTML = apiCategorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
      }
    }

    return apiProductos;
  } catch (e) {
    console.error('Error cargando productos API:', e);
    return [];
  }
}

// Wrapper: getProductos() ahora usa datos de API si disponibles
const _originalGetProductos = typeof getProductos === 'function' ? getProductos : () => [];
function getProductos() {
  return apiProductos.length > 0 ? apiProductos : _originalGetProductos();
}

// showSection integrado en función principal (ver línea 59)

// ============================================================
// GUARDAR PRODUCTO - Enviar a API real
// ============================================================
async function saveProductoAPI(payload) {
  const isEdit = payload.mode === 'edit';
  const method = isEdit ? 'PUT' : 'POST';
  const url    = isEdit
    ? `${API_BASE}/productos.php?id=${payload.id}`
    : `${API_BASE}/productos.php`;

  // Mapear payload al formato de la API
  const body = {
    nombre:           payload.nombre,
    descripcion:      payload.descLarga || payload.descCorta || '',
    precio_base:      parseFloat(payload.precio || 0),
    stock_disponible: parseInt(payload.stock || 0),
    etiqueta:         payload.badge || payload.etiqueta || null,
    categoria_id:     parseInt(payload.categoria_id || payload.categoria || 1),
    activo:           payload.estado === 'activo' ? 1 : 0,
    imagenes:         (payload.imgs || []).map(url => ({ url })),
    especificaciones: Object.entries(payload.specsResumen || {}).filter(([,v]) => v).map(([k,v]) => ({ clave: k, valor: v })),
  };

  // Agregar specs adicionales si vienen de textarea
  if (payload.specs && payload.specs.length) {
    body.especificaciones = payload.specs.map(s => ({ clave: s.label || s.clave, valor: s.value || s.valor }));
  }

  try {
    const data = await apiFetch(`${url}`, {
      method,
      body: JSON.stringify(body),
    });

    if (data.success) {
      showNotification(`<i class="fa-solid fa-circle-check"></i> Producto ${isEdit ? 'actualizado' : 'creado'} correctamente`, 'success');
      await cargarProductosAPI();
      renderCatalogo();
    } else {
      showNotification('<i class="fa-solid fa-xmark"></i> ' + (data.error || 'Error al guardar'), 'error');
    }
  } catch (e) {
    showNotification('<i class="fa-solid fa-xmark"></i> Error de conexión: ' + e.message, 'error');
  }
}

// ============================================================
// PEDIDOS - Cargar y gestionar desde API
// ============================================================
async function cargarPedidosAPI() {
  const tbody = document.getElementById('pedidosTable');
  if (!tbody) return;

  try {
    const data = await apiFetch(`${API_BASE}/pedidos.php?limit=30`);
    if (!data.success) return;

    const statusMap = {
      pendiente:     'status-pending',
      pagado:        'status-progress',
      en_produccion: 'status-progress',
      listo:         'status-info',
      entregado:     'status-completed',
      cancelado:     'status-disabled',
    };
    const labelMap = {
      pendiente: 'Pendiente', pagado: 'Pagado', en_produccion: 'En Producción',
      listo: 'Listo', entregado: 'Entregado', cancelado: 'Cancelado',
    };

    tbody.innerHTML = (data.pedidos || []).map(p => `
      <tr data-status="${p.estado}" data-id="${p.id}">
        <td>${p.numero_pedido}</td>
        <td>${escapeHtml(p.nombre_cliente)}</td>
        <td>${escapeHtml(p.correo_cliente)}</td>
        <td>${p.fecha_estimada || '—'}</td>
        <td><span class="status-badge ${statusMap[p.estado] || ''}">${labelMap[p.estado] || p.estado}</span></td>
        <td style="color:var(--accent);font-weight:800;">${money(p.total)}</td>
        <td>
          <select class="form-select" style="width:140px;" onchange="actualizarEstadoPedido(${p.id}, this.value)">
            ${['pendiente','pagado','en_produccion','listo','entregado','cancelado'].map(s =>
              `<option value="${s}" ${s === p.estado ? 'selected' : ''}>${labelMap[s]}</option>`
            ).join('')}
          </select>
        </td>
      </tr>
    `).join('');

  } catch(e) { console.error('Pedidos API error:', e); }
}

async function actualizarEstadoPedido(id, estado) {
  try {
    const data = await apiFetch(`${API_BASE}/pedidos.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
    if (data.success) {
      showNotification('<i class="fa-solid fa-circle-check"></i> Estado actualizado', 'success');
    } else {
      showNotification('<i class="fa-solid fa-xmark"></i> ' + (data.error || 'Error'), 'error');
    }
  } catch(e) {
    showNotification('<i class="fa-solid fa-xmark"></i> Error de conexión', 'error');
  }
}

// ============================================================
// EMPLEADOS - API real
// ============================================================
async function cargarEmpleadosAPI() {
  const tbody = document.getElementById('empleadosTable');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:20px;">Cargando...</td></tr>';

  try {
    const data = await apiFetch(`${API_BASE}/empleados.php`);
    if (!data.success) return;

    const empleados = data.empleados || [];
    if (empleados.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#888;padding:20px;">No hay empleados registrados</td></tr>';
      return;
    }

    tbody.innerHTML = empleados.map(e => `
      <tr>
        <td>${e.id}</td>
        <td>${escapeHtml(e.nombre_completo)}</td>
        <td>${escapeHtml(e.correo)}</td>
        <td>${e.rol === 'administrador' ? 'Administrador' : 'Empleado'}</td>
        <td><span class="status-badge ${e.activo ? 'status-completed' : 'status-disabled'}">${e.activo ? 'Activo' : 'Inactivo'}</span></td>
        <td>
          <button class="btn btn-secondary btn-small"
            onclick="abrirEditarEmpleado(${e.id}, '${escapeHtml(e.nombre_completo)}', '${escapeHtml(e.correo)}', '${e.rol}')">
            <i class="fa-solid fa-pen"></i>
          </button>
          <button class="btn btn-danger btn-small" onclick="desactivarEmpleado(${e.id})">
            ${e.activo ? '<i class="fa-solid fa-lock"></i>' : '<i class="fa-solid fa-lock-open"></i>'}
          </button>
        </td>
      </tr>
    `).join('');
  } catch(e) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:#e05;padding:20px;">Error al cargar empleados</td></tr>';
    console.error('Empleados API error:', e);
  }
}

async function desactivarEmpleado(id) {
  if (!confirm('¿Cambiar estado del empleado?')) return;
  const data = await apiFetch(`${API_BASE}/empleados.php?id=${id}`, {
    method: 'DELETE',
  });
  if (data.success) {
    showNotification('<i class="fa-solid fa-circle-check"></i> Empleado actualizado', 'success');
    cargarEmpleadosAPI();
  }
}

// ============================================================
// REPORTES - API real
// ============================================================
async function cargarReportesAPI() {
  try {
    const [resumen, productos] = await Promise.all([
      apiFetch(`${API_BASE}/reportes.php?tipo=resumen`),
      apiFetch(`${API_BASE}/reportes.php?tipo=productos`),
    ]);

    if (resumen.success) {
      setText('repVentas',  money(resumen.ingresos_mes || 0));
      setText('repOrdenes', resumen.pedidos_mes || 0);
      const ticket = resumen.pedidos_mes > 0 ? resumen.ingresos_mes / resumen.pedidos_mes : 0;
      setText('repTicket', money(ticket));
    }

    // Top productos table
    if (productos.success && productos.productos) {
      const tbody = document.querySelector('#reportes-section table tbody');
      if (tbody) {
        tbody.innerHTML = (productos.productos || []).map(p => `
          <tr>
            <td>${escapeHtml(p.nombre_producto)}</td>
            <td>${p.unidades_vendidas || 0}</td>
            <td style="color:var(--accent);font-weight:800;">${money(p.ingresos_generados || 0)}</td>
            <td>${p.num_pedidos || 0}</td>
          </tr>
        `).join('');
      }
    }
  } catch(e) { console.error('Reportes API error:', e); }
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// Cargar al inicio si ya estamos en dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Verificar autenticación
  if (typeof firebaseAuth !== 'undefined') {
    firebaseAuth.onAuthStateChanged(async (user) => {
      if (!user) {
        window.location.href = '/login';
      }
    });
  }
  setTimeout(refreshKPIsFromAPI, 300);
});

window.logoutAdmin              = logoutAdmin;
window.actualizarEstadoPedido   = actualizarEstadoPedido;

// ============================================================
// EMPLEADOS - Crear/editar (Firebase Auth + MySQL)
// ============================================================

async function guardarEmpleado() {
  const mode    = document.getElementById('emp_mode')?.value || 'create';
  const isEdit  = mode === 'edit';
  const empId   = document.getElementById('emp_id')?.value || '';
  const nombre  = document.getElementById('emp_nombre')?.value.trim() || '';
  const correo  = document.getElementById('emp_correo')?.value.trim().toLowerCase() || '';
  const pass    = document.getElementById('emp_password')?.value || '';
  const rol     = document.getElementById('emp_rol')?.value || 'empleado';
  const errBox  = document.getElementById('emp_error');
  const btn     = document.getElementById('emp_btn_guardar');

  const showErr = (msg) => {
    if (errBox) { errBox.textContent = msg; errBox.style.display = 'block'; }
  };
  if (errBox) errBox.style.display = 'none';

  // Validaciones
  if (!nombre) { showErr('Ingresa el nombre completo'); return; }
  if (!correo || !correo.includes('@')) { showErr('Ingresa un correo válido'); return; }
  if (!isEdit && pass.length < 6) { showErr('La contraseña debe tener mínimo 6 caracteres'); return; }

  if (btn) { btn.disabled = true; btn.textContent = isEdit ? 'Guardando...' : 'Creando...'; }

  try {
    if (isEdit) {
      // Solo actualizar datos en MySQL (nombre, correo, rol)
      const data = await apiFetch(`${API_BASE}/empleados.php?id=${empId}`, {
        method: 'PUT',
        body: JSON.stringify({ nombre_completo: nombre, correo, rol }),
      });
      if (!data.success) throw new Error(data.error || 'Error al actualizar');
      showNotification('<i class="fa-solid fa-circle-check"></i> Empleado actualizado', 'success');

    } else {
      // Crear usuario en Firebase Auth desde el navegador
      if (!firebaseAuth) throw new Error('Firebase Auth no disponible');

      // Guardar sesión actual del admin
      const adminUser = firebaseAuth.currentUser;
      if (!adminUser) throw new Error('Sesión expirada, recarga la página');

      // Crear cuenta en Firebase
      const cred = await firebaseAuth.createUserWithEmailAndPassword(correo, pass);
      const nuevoUid = cred.user.uid;

      // Volver a iniciar sesión como admin (Firebase cambia el usuario activo al crear)
      // Usamos el token guardado en session
      const adminToken = sessionStorage.getItem('wh_firebase_token') || '';

      // Guardar en MySQL
      try {
        const data = await apiFetch(`${API_BASE}/empleados.php`, {
          method: 'POST',
          body: JSON.stringify({
            firebase_uid:    nuevoUid,
            nombre_completo: nombre,
            correo,
            rol,
          }),
        });
        if (!data.success) {
          // Si MySQL falla, eliminar el usuario de Firebase para no dejar inconsistencia
          await cred.user.delete();
          throw new Error(data.error || 'Error al guardar en base de datos');
        }
      } catch(mysqlErr) {
        try { await cred.user.delete(); } catch(e2) {}
        throw mysqlErr;
      }

      // Reautenticar al admin (sign out del nuevo usuario, volver al admin)
      await firebaseAuth.signOut();
      // El panel detectará la desconexión y pedirá login nuevamente si no se maneja
      // Para evitar esto, recargamos con el token guardado
      showNotification('<i class="fa-solid fa-circle-check"></i> Empleado creado. Recargando sesión...', 'success');
      setTimeout(() => window.location.reload(), 1500);
      return;
    }

    closeModal('nuevoEmpleado');
    cargarEmpleadosAPI();

  } catch(e) {
    let msg = e.message || 'Error desconocido';
    if (msg.includes('email-already-in-use')) msg = 'Ese correo ya tiene cuenta en el sistema';
    if (msg.includes('weak-password'))        msg = 'Contraseña muy débil (mínimo 6 caracteres)';
    showErr(msg);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = isEdit ? 'Guardar' : 'Crear Empleado'; }
  }
}

function abrirEditarEmpleado(id, nombre, correo, rol) {
  document.getElementById('emp_mode').value    = 'edit';
  document.getElementById('emp_id').value      = id;
  document.getElementById('emp_nombre').value  = nombre;
  document.getElementById('emp_correo').value  = correo;
  document.getElementById('emp_rol').value     = rol;
  document.getElementById('emp_password').value = '';
  document.getElementById('empModalTitle').textContent = 'Editar Empleado';
  const help = document.getElementById('emp_password_help');
  if (help) help.textContent = 'Déjala en blanco para no cambiar la contraseña.';
  const btn = document.getElementById('emp_btn_guardar');
  if (btn) btn.textContent = 'Guardar Cambios';
  const err = document.getElementById('emp_error');
  if (err) err.style.display = 'none';
  openModal('nuevoEmpleado');
}

function abrirNuevoEmpleado() {
  document.getElementById('emp_mode').value    = 'create';
  document.getElementById('emp_id').value      = '';
  document.getElementById('emp_nombre').value  = '';
  document.getElementById('emp_correo').value  = '';
  document.getElementById('emp_password').value = '';
  document.getElementById('emp_rol').value     = 'empleado';
  document.getElementById('empModalTitle').textContent = 'Nuevo Empleado';
  const help = document.getElementById('emp_password_help');
  if (help) help.textContent = 'Mínimo 6 caracteres.';
  const btn = document.getElementById('emp_btn_guardar');
  if (btn) btn.textContent = 'Crear Empleado';
  const err = document.getElementById('emp_error');
  if (err) err.style.display = 'none';
  openModal('nuevoEmpleado');
}

window.desactivarEmpleado       = desactivarEmpleado;
window.guardarEmpleado          = guardarEmpleado;
window.abrirEditarEmpleado      = abrirEditarEmpleado;
window.abrirNuevoEmpleado       = abrirNuevoEmpleado;