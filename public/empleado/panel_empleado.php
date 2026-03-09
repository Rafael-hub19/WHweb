<?php
// ── Guardia de autenticación server-side ─────────────────────────
require_once dirname(__DIR__, 2) . "/includes/config.php";
require_once dirname(__DIR__, 2) . "/includes/db.php";
require_once dirname(__DIR__, 2) . "/includes/functions.php";
require_once dirname(__DIR__, 2) . "/includes/auth.php";

$_usuario = sesionActiva();
if (!$_usuario || !in_array($_usuario["rol"], ["administrador", "empleado"], true)) {
    header("Location: /login?redirect=empleado&error=sesion");
    exit;
}
unset($_usuario);
?>

<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico">
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Panel Empleado - Wooden House</title>


  <link rel="stylesheet" href="../assets/css/panel_empleado.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <!-- Bootstrap 5 JS - Solo componentes interactivos (modales, dropdowns). CSS propio de Wooden House tiene prioridad -->
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" crossorigin="anonymous" defer></script>
</head>

<body>
  <!-- HEADER -->
  <div class="header">
    <div class="header-left">
    <button class="menu-toggle" id="menuToggle" aria-label="Abrir menú" aria-expanded="false">
      <i class="fa-solid fa-bars"></i>
    </button>
    <div class="logo">
      <img src="/assets/img/logo-header.png" alt="Wooden House" style="height:80px;">
    </div>
  </div>

    <div class="header-right">
      <button class="icon-btn" id="notifBtn" aria-label="Notificaciones" title="Notificaciones">
        <i class="fa-solid fa-bell"></i>
        <span class="badge-dot" id="notifDot"></span>
      </button>

      <div class="user-info">
        <div class="user-avatar">JP</div>
        <span id="empNombreHeader">Cargando...</span>
        <button class="logout-btn" onclick="logout()">Salir</button>
      </div>
    </div>
  </div>

  <!-- PANEL NOTIFICACIONES -->
  <div class="notif-panel" id="notifPanel">
    <div class="notif-head">
      <span>Notificaciones</span>
      <button class="btn btn-secondary btn-small" onclick="markNotifAsRead()">Marcar leídas</button>
    </div>
    <div class="notif-body" id="notifBody">
      <div style="color: var(--muted); font-size: 12px;">Sin notificaciones.</div>
    </div>
  </div>

  <!-- MENÚ HAMBURGUESA (MÓVIL) -->
  <div class="nav-links" id="navLinks">
    <button class="nav-close" id="navClose" aria-label="Cerrar menú">×</button>
    <div class="nav-title">Panel Empleado</div>

    <a href="#" data-section="dashboard" class="active"><i class="fa-solid fa-chart-bar"></i> Dashboard</a>
    <a href="#" data-section="pedidos"><i class="fa-solid fa-box"></i> Gestión de Pedidos</a>
    <a href="#" data-section="citas"><i class="fa-solid fa-calendar-days"></i> Citas Programadas</a>
    <a href="#" data-section="cotizaciones"><i class="fa-solid fa-briefcase"></i> Cotizaciones</a>
    <a href="#" data-section="calendario"><i class="fa-solid fa-calendar-check"></i> Mi Calendario</a>
  </div>

  <!-- LAYOUT -->
  <div class="container">
    <!-- SIDEBAR (DESKTOP) -->
    <aside class="sidebar" id="sidebarDesktop">
      <div class="sidebar-item active" onclick="showSection('dashboard')">
        <span class="icon"><i class="fa-solid fa-chart-bar"></i></span>
        <span>Dashboard</span>
      </div>

      <div class="sidebar-section">GESTIÓN</div>

      <div class="sidebar-item" onclick="showSection('pedidos')">
        <span class="icon"><i class="fa-solid fa-box"></i></span>
        <span>Gestión de Pedidos</span>
      </div>

      <div class="sidebar-item" onclick="showSection('citas')">
        <span class="icon"><i class="fa-solid fa-calendar-days"></i></span>
        <span>Citas Programadas</span>
      </div>

      <div class="sidebar-item" onclick="showSection('cotizaciones')">
        <span class="icon"><i class="fa-solid fa-briefcase"></i></span>
        <span>Cotizaciones</span>
      </div>

      <div class="sidebar-item" onclick="showSection('calendario')">
        <span class="icon"><i class="fa-solid fa-calendar-check"></i></span>
        <span>Mi Calendario</span>
      </div>
    </aside>

    <!-- MAIN -->
    <main class="main-content">
      <!-- DASHBOARD -->
      <div id="dashboard-section" class="content-section">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Resumen general de actividades</p>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-title">Pedidos Pendientes</div>
            <div class="stat-value" id="kpiPendientes">—</div>
            <div class="stat-subtitle">Requieren atención</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Citas Esta Semana</div>
            <div class="stat-value">8</div>
            <div class="stat-subtitle">5 confirmadas</div>
          </div>
          <div class="stat-card">
            <div class="stat-title">Cotizaciones Activas</div>
            <div class="stat-value">15</div>
            <div class="stat-subtitle">En seguimiento</div>
          </div>
        </div>

        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Actividad Reciente</h2>
            <button class="btn btn-secondary btn-small" onclick="seedActivityDemo()">Demo</button>
          </div>

          <div class="activity-list" id="activityList">
            <div class="activity-item">
              <div class="t"><i class="fa-solid fa-clipboard-list"></i> Panel listo</div>
              <div class="m">Aquí verás cambios recientes (pedidos, citas, inventario).</div>
            </div>
          </div>
        </div>
      </div>

      <!-- PEDIDOS -->
      <div id="pedidos-section" class="content-section hidden">
        <h1 class="page-title">Gestión de Pedidos</h1>
        <p class="page-subtitle">Administra todos los pedidos asignados</p>

        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Pedidos</h2>
          </div>

          <div class="table-container">
            <div class="table-filters">
              <button class="filter-btn active" onclick="filterTable('all', event)">Todos</button>
              <button class="filter-btn" onclick="filterTable('pending', event)">Pendientes</button>
              <button class="filter-btn" onclick="filterTable('progress', event)">En Proceso</button>
              <button class="filter-btn" onclick="filterTable('completed', event)">Completados</button>
            </div>

            <div style="overflow:auto;">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Producto</th>
                    <th>Fecha de Entrega</th>
                    <th>Estado</th>
                    <th>Total</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody id="pedidosTable">
                  <tr><td colspan="7" style="text-align:center;color:#888;padding:20px;">Cargando pedidos...</td></tr>
                </tbody>
              </table>
            </div>

          </div>
        </div>
      </div>

      <!-- CITAS -->
      <div id="citas-section" class="content-section hidden">
        <h1 class="page-title">Citas Programadas</h1>
        <p class="page-subtitle">Gestiona tus citas y reuniones</p>

        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Próximas Citas</h2>
            <button class="btn btn-primary btn-small" onclick="openModal('nuevaCita')">+ Nueva cita</button>
          </div>

          <div class="table-container">
            <div style="overflow:auto;">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Fecha</th>
                    <th>Hora</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ana Maria Martínez Sanchez</td>
                    <td>05/02/26</td>
                    <td>10:00 AM</td>
                    <td>Instalación</td>
                    <td><span class="status-badge status-progress">Confirmada</span></td>
                    <td>
                      <button class="btn btn-secondary btn-small" onclick="showNotification('Ver cita', 'info')">Ver</button>
                      <button class="btn btn-secondary btn-small" onclick="showNotification('Actualizar cita', 'info')">Actualizar</button>
                    </td>
                  </tr>
                  <tr>
                    <td>Juan Pedro Herrera Sanchez</td>
                    <td>06/02/26</td>
                    <td>2:00 PM</td>
                    <td>Visita</td>
                    <td><span class="status-badge status-pending">Pendiente</span></td>
                    <td>
                      <button class="btn btn-secondary btn-small" onclick="showNotification('Ver cita', 'info')">Ver</button>
                      <button class="btn btn-secondary btn-small" onclick="showNotification('Actualizar cita', 'info')">Actualizar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      <!-- COTIZACIONES -->
      <div id="cotizaciones-section" class="content-section hidden">
        <h1 class="page-title">Cotizaciones</h1>
        <p class="page-subtitle">Gestiona cotizaciones y propuestas</p>

        <div class="section">
          <div class="section-header">
            <h2 class="section-title">Cotizaciones Activas</h2>
            <button class="btn btn-primary btn-small" onclick="openModal('nuevaCotizacion')">+ Nueva cotización</button>
          </div>

          <div class="table-container">
            <div style="overflow:auto;">
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Cliente</th>
                    <th>Producto</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>COT-045</td>
                    <td>Juan Pedro Herrera Sanchez</td>
                    <td>Personalizado</td>
                    <td style="color: var(--accent); font-weight:800;">$18,500</td>
                    <td><span class="status-badge status-pending">Pendiente</span></td>
                    <td>
                      <button class="btn btn-secondary btn-small" onclick="showNotification('Ver cotización', 'info')">Ver</button>
                      <button class="btn btn-secondary btn-small" onclick="showNotification('Actualizar cotización', 'info')">Actualizar</button>
                    </td>
                  </tr>
                  <tr>
                    <td>COT-046</td>
                    <td>Laura Torres</td>
                    <td>Toscana</td>
                    <td style="color: var(--accent); font-weight:800;">$15,200</td>
                    <td><span class="status-badge status-progress">En Revisión</span></td>
                    <td>
                      <button class="btn btn-secondary btn-small" onclick="showNotification('Ver cotización', 'info')">Ver</button>
                      <button class="btn btn-secondary btn-small" onclick="showNotification('Actualizar cotización', 'info')">Actualizar</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      <!-- CALENDARIO -->
      <div id="calendario-section" class="content-section hidden">
        <h1 class="page-title">Mi Calendario</h1>
        <p class="page-subtitle">Calendario interactivo (demo): selecciona un día y agrega eventos</p>

        <div class="section">
          <div class="calendar-wrap">
            <div class="calendar-toolbar">
              <div class="cal-title" id="calTitle">—</div>
              <div style="display:flex; gap:8px; flex-wrap:wrap;">
                <button class="btn btn-secondary" onclick="prevMonth()">← Mes</button>
                <button class="btn btn-secondary" onclick="goToday()">Hoy</button>
                <button class="btn btn-secondary" onclick="nextMonth()">Mes →</button>
                <button class="btn btn-primary" onclick="openAddEventModal()">+ Evento</button>
              </div>
            </div>

            <div class="calendar-grid" id="calDow"></div>
            <div class="calendar-grid" id="calGrid"></div>

            <div class="cal-side">
              <div class="cal-list">
                <div class="cal-list-head" id="selectedDayTitle">Eventos del día</div>
                <div class="cal-list-body" id="dayEventsList">
                  <div style="color: var(--muted);">Selecciona un día para ver eventos.</div>
                </div>
              </div>

              <div class="cal-list">
                <div class="cal-list-head">Próximos (7 días)</div>
                <div class="cal-list-body" id="nextEventsList">
                  <div style="color: var(--muted);">—</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </main>
  </div>

  <!-- MODAL: Detalle Pedido (con TIMELINE) -->
  <div class="modal" id="pedidoModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Detalle del Pedido <span id="pDetId" style="color:var(--muted2); font-weight:900;"></span></h3>
        <button class="modal-close" onclick="closeModal('pedidoModal')">×</button>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:10px;">
        <div>
          <div class="form-label">Cliente</div>
          <div style="color:var(--muted2); font-size:13px;" id="pDetCliente">—</div>
        </div>
        <div>
          <div class="form-label">Producto</div>
          <div style="color:var(--muted2); font-size:13px;" id="pDetProducto">—</div>
        </div>
        <div>
          <div class="form-label">Fecha de entrega</div>
          <div style="color:var(--muted2); font-size:13px;" id="pDetEntrega">—</div>
        </div>
        <div>
          <div class="form-label">Total</div>
          <div style="color:var(--accent); font-size:14px; font-weight:900;" id="pDetTotal">—</div>
        </div>
      </div>

      <div class="form-label">Seguimiento (4 etapas)</div>
      <div class="timeline" id="pTimeline"></div>

      <div style="display:flex; gap:8px; justify-content:flex-end; flex-wrap:wrap;">
        <button class="btn btn-secondary" onclick="closeModal('pedidoModal')">Cerrar</button>
        <button class="btn btn-primary" onclick="openUpdateFromPedidoModal()">Actualizar</button>
      </div>
    </div>
  </div>

  <!-- MODAL: Actualizar Pedido -->
  <div class="modal" id="updatePedidoModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Actualizar Pedido <span id="uId" style="color:var(--muted2); font-weight:900;"></span></h3>
        <button class="modal-close" onclick="closeModal('updatePedidoModal')">×</button>
      </div>

      <div class="form-group">
        <label class="form-label">Estado</label>
        <select class="form-select" id="uStatus">
          <option value="pending">Pendiente</option>
          <option value="progress">En proceso</option>
          <option value="install">Instalación</option>
          <option value="completed">Completado</option>
        </select>
        <div style="color:var(--muted); font-size:11px; margin-top:6px;">
          * “Instalación” es una etapa visual del timeline (para cumplir el seguimiento de 4 etapas).
        </div>
      </div>

      <div class="form-group">
        <label class="form-label">Fecha de entrega</label>
        <input type="date" class="form-input" id="uEntrega">
      </div>

      <div class="form-group">
        <label class="form-label">Notas (opcional)</label>
        <textarea class="form-textarea" id="uNotas" placeholder="Ej: Cliente pidió cambio de horario / material..."></textarea>
      </div>

      <button class="btn btn-primary" style="width:100%;" onclick="applyPedidoUpdate()">Guardar cambios</button>
    </div>
  </div>

  <!-- MODAL: Nueva cita -->
  <div class="modal" id="nuevaCita">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Nueva Cita</h3>
        <button class="modal-close" onclick="closeModal('nuevaCita')">×</button>
      </div>
      <div class="form-group">
        <label class="form-label">Cliente</label>
        <input type="text" class="form-input" placeholder="Nombre" />
      </div>
      <div class="form-group">
        <label class="form-label">Fecha</label>
        <input type="date" class="form-input" />
      </div>
      <div class="form-group">
        <label class="form-label">Hora</label>
        <input type="time" class="form-input" />
      </div>
      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select class="form-select">
          <option value="cita">Cita</option>
          <option value="inst">Instalación</option>
        </select>
      </div>
      <button class="btn btn-primary" style="width:100%;" onclick="saveCita()">Agendar</button>
    </div>
  </div>

  <!-- MODAL: Nueva cotización -->
  <div class="modal" id="nuevaCotizacion">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Nueva Cotización</h3>
        <button class="modal-close" onclick="closeModal('nuevaCotizacion')">×</button>
      </div>
      <div class="form-group">
        <label class="form-label">Cliente</label>
        <input type="text" class="form-input" placeholder="Nombre" />
      </div>
      <div class="form-group">
        <label class="form-label">Producto</label>
        <input type="text" class="form-input" placeholder="Descripción" />
      </div>
      <div class="form-group">
        <label class="form-label">Monto</label>
        <input type="number" class="form-input" placeholder="0.00" />
      </div>
      <button class="btn btn-primary" style="width:100%;" onclick="saveCotizacion()">Crear</button>
    </div>
  </div>

  <!-- MODAL: Actualizar stock -->
  <div class="modal" id="stockModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Actualizar Stock</h3>
        <button class="modal-close" onclick="closeModal('stockModal')">×</button>
      </div>

      <div class="form-group">
        <label class="form-label">ID</label>
        <input type="text" class="form-input" id="stockId" readonly />
      </div>

      <div class="form-group">
        <label class="form-label">Insumo</label>
        <input type="text" class="form-input" id="stockName" readonly />
      </div>

      <div class="form-group">
        <label class="form-label">Stock actual</label>
        <input type="number" class="form-input" id="stockCurrent" readonly />
      </div>

      <div class="form-group">
        <label class="form-label">Movimiento</label>
        <select class="form-select" id="stockMovement">
          <option value="entrada">Entrada (+)</option>
          <option value="salida">Salida (-)</option>
          <option value="ajuste">Ajuste (poner stock exacto)</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Cantidad</label>
        <input type="number" class="form-input" id="stockQty" placeholder="Ej: 5" min="1" />
      </div>

      <div class="form-group">
        <label class="form-label">Motivo</label>
        <select class="form-select" id="stockReason">
          <option value="compra_proveedor">Compra proveedor</option>
          <option value="consumo_produccion">Consumo producción</option>
          <option value="merma">Merma / daño</option>
          <option value="devolucion">Devolución</option>
          <option value="ajuste_general">Ajuste general</option>
        </select>
      </div>

      <button class="btn btn-primary" style="width:100%;" onclick="applyStockChange()">Guardar movimiento</button>
    </div>
  </div>

  <!-- MODAL: Agregar insumo -->
  <div class="modal" id="addItemModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Agregar Insumo</h3>
        <button class="modal-close" onclick="closeModal('addItemModal')">×</button>
      </div>

      <div class="form-group">
        <label class="form-label">Nombre del insumo</label>
        <input type="text" class="form-input" id="newName" placeholder="Ej: Corredera telescópica 45cm" />
      </div>

      <div class="form-group">
        <label class="form-label">Categoría</label>
        <select class="form-select" id="newCategory">
          <option value="Tableros">Tableros</option>
          <option value="Herrajes">Herrajes</option>
          <option value="Tornillería">Tornillería</option>
          <option value="Acabados">Acabados</option>
          <option value="Adhesivos">Adhesivos</option>
          <option value="Herramientas">Herramientas</option>
          <option value="Otro">Otro</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Unidad</label>
        <input type="text" class="form-input" id="newUnit" placeholder="pieza, caja, litro, metro, hoja..." />
      </div>

      <div class="form-group">
        <label class="form-label">Stock inicial</label>
        <input type="number" class="form-input" id="newStock" min="0" value="0" />
      </div>

      <div class="form-group">
        <label class="form-label">Stock mínimo</label>
        <input type="number" class="form-input" id="newMin" min="0" value="0" />
      </div>

      <div class="form-group">
        <label class="form-label">Ubicación</label>
        <input type="text" class="form-input" id="newLocation" placeholder="Ej: Almacén A, Estante 2..." />
      </div>

      <div class="form-group">
        <label class="form-label">Proveedor</label>
        <input type="text" class="form-input" id="newSupplier" placeholder="Ej: Herrajes GDL" />
      </div>

      <div class="form-group">
        <label class="form-label">Costo unitario (aprox.)</label>
        <input type="number" class="form-input" id="newCost" placeholder="Ej: 12" min="0" />
      </div>

      <button class="btn btn-primary" style="width:100%;" onclick="addInventoryItem()">Guardar insumo</button>
    </div>
  </div>

  <!-- MODAL: Agregar evento calendario -->
  <div class="modal" id="addEventModal">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">Agregar Evento</h3>
        <button class="modal-close" onclick="closeModal('addEventModal')">×</button>
      </div>

      <div class="form-group">
        <label class="form-label">Fecha</label>
        <input type="date" class="form-input" id="evDate">
      </div>

      <div class="form-group">
        <label class="form-label">Hora</label>
        <input type="time" class="form-input" id="evTime">
      </div>

      <div class="form-group">
        <label class="form-label">Tipo</label>
        <select class="form-select" id="evType">
          <option value="cita">Cita</option>
          <option value="cot">Cotización</option>
          <option value="inst">Instalación</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Título</label>
        <input type="text" class="form-input" id="evTitle" placeholder="Ej: Cita con Ana Martínez">
      </div>

      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea class="form-textarea" id="evNotes" placeholder="Detalles opcionales..."></textarea>
      </div>

      <button class="btn btn-primary" style="width:100%;" onclick="saveCalendarEvent()">Guardar evento</button>
    </div>
  </div>

  
  <!-- Firebase SDK -->
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js"></script>
  <script src="https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore-compat.js"></script>
  <script src="../assets/js/firebase-config.js"></script>
  <script src="../assets/js/panel_empleado.js"></script>
</body>
</html>