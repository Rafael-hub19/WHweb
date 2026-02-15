// ================================================
// CONFIGURACIÓN
// ================================================
const API_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost/api'
  : '/api';

// ================================================
// VARIABLES GLOBALES
// ================================================
let selectedTime = null;

// ================================================
// INICIALIZACIÓN
// ================================================
document.addEventListener('DOMContentLoaded', function() {
  console.log('🚀 Inicializando solicitudes.js...');
  
  initMenuHamburguesa();
  initCartBadge();
  initTabs(); // CRITICAL - Esta función estaba mal
  initFormCotizacion();
  initFormCita();
  initSeguimiento();
  initMedidasField();
  setMinDate();
  autocompletarDatos();
});

// ================================================
// MENÚ HAMBURGUESA (CRITICAL - FALTABA)
// ================================================
function initMenuHamburguesa() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
      console.log('Menú:', isOpen ? 'ABIERTO' : 'CERRADO');
    });

    document.addEventListener('click', function(e) {
      if (!menuToggle.contains(e.target) && !navLinks.contains(e.target)) {
        navLinks.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
}

// ================================================
// CART BADGE
// ================================================
function initCartBadge() {
  const cartBadge = document.getElementById('cartCount');
  if (!cartBadge) return;

  const carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  const totalItems = carrito.reduce((sum, item) => sum + (item.cantidad || 0), 0);
  
  cartBadge.textContent = totalItems;
  cartBadge.style.display = totalItems > 0 ? 'inline-block' : 'none';
}

// ================================================
// TABS (CRITICAL - CORREGIDO)
// ================================================
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  console.log('Tabs buttons encontrados:', tabButtons.length);
  console.log('Tabs contents encontrados:', tabContents.length);

  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      const targetTab = this.getAttribute('data-tab');
      console.log('Tab clickeado:', targetTab);

      // Remover active de todos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Activar el seleccionado
      this.classList.add('active');
      const targetContent = document.getElementById(`tab-${targetTab}`);
      
      if (targetContent) {
        targetContent.classList.add('active');
        console.log('✅ Tab activado:', targetTab);
      } else {
        console.error('❌ No se encontró tab-content para:', targetTab);
      }
    });
  });
}

// ================================================
// FORMULARIO DE COTIZACIÓN
// ================================================
function initFormCotizacion() {
  const form = document.getElementById('formCotizacion');
  if (!form) {
    console.log('⚠️ Formulario de cotización no encontrado');
    return;
  }

  console.log('✅ Formulario de cotización inicializado');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const datos = {
      nombre_cliente: formData.get('nombre'),
      correo: formData.get('email'),
      telefono: formData.get('telefono'),
      ciudad: formData.get('ciudad') || null,
      tipo_producto: formData.get('tipoMueble'),
      tiene_medidas: formData.get('tieneMedidas'),
      medidas: formData.get('medidas') || null,
      descripcion: formData.get('descripcion'),
      presupuesto_estimado: formData.get('presupuesto') || null,
      urgencia: formData.get('urgencia') || null,
      necesita_instalacion: formData.get('instalacion') || null,
      referencia: formData.get('referencia') || null
    };

    // Validación
    if (!datos.nombre_cliente || !datos.correo || !datos.telefono || !datos.tipo_producto || !datos.descripcion) {
      showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    if (!isValidEmail(datos.correo)) {
      showAlert('Por favor ingresa un correo válido', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Enviando...';

    try {
      // Simular envío (reemplazar con API real)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showAlert('✅ ¡Cotización enviada exitosamente! Te contactaremos pronto.', 'success');
      
      // Guardar en localStorage
      localStorage.setItem('nombre_cliente', datos.nombre_cliente);
      localStorage.setItem('correo_cliente', datos.correo);
      localStorage.setItem('telefono_cliente', datos.telefono);
      
      form.reset();
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al enviar cotización. Intenta nuevamente.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// ================================================
// FORMULARIO DE CITA
// ================================================
function initFormCita() {
  const form = document.getElementById('formCita');
  if (!form) {
    console.log('⚠️ Formulario de cita no encontrado');
    return;
  }

  console.log('✅ Formulario de cita inicializado');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!selectedTime) {
      showAlert('Por favor selecciona una hora', 'error');
      return;
    }

    const formData = new FormData(form);
    const fechaSeleccionada = formData.get('fecha');
    const fechaHora = `${fechaSeleccionada} ${selectedTime}:00`;

    const datos = {
      nombre_cliente: formData.get('nombre'),
      correo: formData.get('email'),
      telefono: formData.get('telefono'),
      direccion: formData.get('direccion'),
      fecha_hora_preferida: fechaHora,
      motivo: 'Visita técnica para medición',
      notas: `Horario seleccionado: ${selectedTime}`
    };

    if (!datos.nombre_cliente || !datos.correo || !datos.telefono || !datos.direccion) {
      showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    if (!isValidEmail(datos.correo)) {
      showAlert('Por favor ingresa un correo válido', 'error');
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Agendando...';

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      showAlert('✅ ¡Cita agendada exitosamente! Recibirás confirmación pronto.', 'success');
      
      localStorage.setItem('nombre_cliente', datos.nombre_cliente);
      localStorage.setItem('correo_cliente', datos.correo);
      localStorage.setItem('telefono_cliente', datos.telefono);
      
      form.reset();
      selectedTime = null;
      document.querySelectorAll('.time-slot').forEach(slot => {
        slot.classList.remove('selected');
      });
      
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (error) {
      console.error('Error:', error);
      showAlert('Error al agendar cita. Intenta nuevamente.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// ================================================
// SELECCIÓN DE HORA (FUNCIÓN GLOBAL)
// ================================================
function selectTime(element) {
  if (element.classList.contains('unavailable')) {
    return;
  }

  document.querySelectorAll('.time-slot').forEach(slot => {
    slot.classList.remove('selected');
  });

  element.classList.add('selected');
  selectedTime = element.textContent.trim();
  
  console.log('Hora seleccionada:', selectedTime);
}

// ================================================
// SEGUIMIENTO (FUNCIÓN GLOBAL)
// ================================================
function initSeguimiento() {
  const trackingResult = document.getElementById('trackingResult');
  if (trackingResult) {
    trackingResult.style.display = 'none';
  }
}

function trackOrder() {
  const trackingNumber = document.getElementById('trackingNumber')?.value.trim();
  const trackingResult = document.getElementById('trackingResult');

  if (!trackingNumber) {
    showAlert('Por favor ingresa un número de seguimiento', 'error');
    return;
  }

  const regex = /^WH-\d{4}-\d{6}$/;
  if (!regex.test(trackingNumber)) {
    showAlert('Formato inválido. Usa: WH-YYYY-NNNNNN (ej: WH-2025-001234)', 'error');
    return;
  }

  if (trackingResult) {
    trackingResult.style.display = 'block';
    showAlert('✅ Solicitud encontrada', 'success');
    trackingResult.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

// ================================================
// MOSTRAR/OCULTAR CAMPO MEDIDAS
// ================================================
function initMedidasField() {
  const selectMedidas = document.getElementById('tieneMedidas');
  const medidasField = document.getElementById('medidasField');

  if (selectMedidas && medidasField) {
    selectMedidas.addEventListener('change', (e) => {
      if (e.target.value === 'no') {
        medidasField.style.display = 'none';
        medidasField.querySelector('input').required = false;
      } else {
        medidasField.style.display = 'block';
        medidasField.querySelector('input').required = e.target.value === 'si';
      }
    });
  }
}

// ================================================
// FECHA MÍNIMA (MAÑANA)
// ================================================
function setMinDate() {
  const fechaCita = document.getElementById('fechaCita');
  
  if (fechaCita) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = tomorrow.toISOString().split('T')[0];
    fechaCita.min = minDate;
  }
}

// ================================================
// SISTEMA DE ALERTAS
// ================================================
function showAlert(message, type = 'info') {
  const alertDiv = document.getElementById('alertMessage');
  
  if (!alertDiv) {
    // Crear alerta flotante si no existe el div
    const alert = document.createElement('div');
    alert.className = `alert-floating alert-${type}`;
    alert.textContent = message;
    alert.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 15px 25px;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
      color: white;
      border-radius: 8px;
      z-index: 10000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(alert);
    
    setTimeout(() => {
      alert.remove();
    }, 4000);
    return;
  }

  alertDiv.textContent = message;
  alertDiv.className = `alert alert-${type} show`;

  setTimeout(() => {
    alertDiv.classList.remove('show');
  }, 5000);
}

// ================================================
// VALIDACIONES
// ================================================
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isValidPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  return cleaned.length === 10;
}

// ================================================
// AUTO-COMPLETAR DATOS GUARDADOS
// ================================================
function autocompletarDatos() {
  const nombreGuardado = localStorage.getItem('nombre_cliente');
  const correoGuardado = localStorage.getItem('correo_cliente');
  const telefonoGuardado = localStorage.getItem('telefono_cliente');

  if (!nombreGuardado) return;

  // Formulario cotización
  const formCot = document.getElementById('formCotizacion');
  if (formCot) {
    const inputNombre = formCot.querySelector('input[name="nombre"]');
    const inputCorreo = formCot.querySelector('input[name="email"]');
    const inputTelefono = formCot.querySelector('input[name="telefono"]');
    
    if (inputNombre && !inputNombre.value) inputNombre.value = nombreGuardado;
    if (inputCorreo && !inputCorreo.value) inputCorreo.value = correoGuardado;
    if (inputTelefono && !inputTelefono.value) inputTelefono.value = telefonoGuardado;
  }

  // Formulario cita
  const formCita = document.getElementById('formCita');
  if (formCita) {
    const inputNombre = formCita.querySelector('input[name="nombre"]');
    const inputCorreo = formCita.querySelector('input[name="email"]');
    const inputTelefono = formCita.querySelector('input[name="telefono"]');
    
    if (inputNombre && !inputNombre.value) inputNombre.value = nombreGuardado;
    if (inputCorreo && !inputCorreo.value) inputCorreo.value = correoGuardado;
    if (inputTelefono && !inputTelefono.value) inputTelefono.value = telefonoGuardado;
  }
}

console.log('✅ solicitudes.js cargado correctamente');
