/**
 * solicitudes.js - Wooden House
 * Manejo de Cotizaciones y Citas
 */

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
  initTabs();
  initFormCotizacion();
  initFormCita();
  initSeguimiento();
  initMedidasField();
  initCartBadge();
  initMenuToggle();
  setMinDate();
});

// ================================================
// MENU TOGGLE (RESPONSIVE)
// ================================================
function initMenuToggle() {
  const menuToggle = document.getElementById('menuToggle');
  const navLinks = document.getElementById('navLinks');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('open');
      const isOpen = navLinks.classList.contains('open');
      menuToggle.setAttribute('aria-expanded', isOpen);
    });
  }
}

// ================================================
// CART BADGE
// ================================================
function initCartBadge() {
  const cart = JSON.parse(localStorage.getItem('carrito')) || [];
  const cartCount = document.getElementById('cartCount');
  
  if (cartCount) {
    const totalItems = cart.reduce((sum, item) => sum + (item.cantidad || 0), 0);
    cartCount.textContent = totalItems;
    cartCount.style.display = totalItems > 0 ? 'inline-block' : 'none';
  }
}

// ================================================
// TABS - ALTERNAR ENTRE SECCIONES
// ================================================
function initTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.getAttribute('data-tab');

      // Remover active de todos
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));

      // Activar el seleccionado
      button.classList.add('active');
      const targetContent = document.getElementById(`tab-${targetTab}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }
    });
  });
}

// ================================================
// FORMULARIO DE COTIZACIÓN
// ================================================
function initFormCotizacion() {
  const form = document.getElementById('formCotizacion');
  
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Recopilar datos del formulario
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

    // Validación básica
    if (!datos.nombre_cliente || !datos.correo || !datos.telefono || !datos.tipo_producto || !datos.descripcion) {
      showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    if (!isValidEmail(datos.correo)) {
      showAlert('Por favor ingresa un correo válido', 'error');
      return;
    }

    // Mostrar loader
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Enviando...';

    try {
      const response = await fetch(`${API_URL}/cotizaciones/crear.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      const result = await response.json();

      if (result.success) {
        showAlert('✅ ¡Cotización enviada exitosamente! Te contactaremos pronto.', 'success');
        
        // Guardar datos en localStorage
        localStorage.setItem('nombre_cliente', datos.nombre_cliente);
        localStorage.setItem('correo_cliente', datos.correo);
        localStorage.setItem('telefono_cliente', datos.telefono);
        
        // Limpiar formulario
        form.reset();
        
        // Scroll al mensaje
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showAlert(result.error || 'Error al enviar cotización', 'error');
      }

    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión. Por favor intenta nuevamente.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
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
// FORMULARIO DE CITA
// ================================================
function initFormCita() {
  const form = document.getElementById('formCita');
  
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Validar que se haya seleccionado una hora
    if (!selectedTime) {
      showAlert('Por favor selecciona una hora disponible', 'error');
      return;
    }

    // Recopilar datos del formulario
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

    // Validación básica
    if (!datos.nombre_cliente || !datos.correo || !datos.telefono || !datos.direccion) {
      showAlert('Por favor completa todos los campos requeridos', 'error');
      return;
    }

    if (!isValidEmail(datos.correo)) {
      showAlert('Por favor ingresa un correo válido', 'error');
      return;
    }

    // Mostrar loader
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ Agendando...';

    try {
      const response = await fetch(`${API_URL}/citas/crear.php`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
      });

      const result = await response.json();

      if (result.success) {
        showAlert('✅ ¡Cita agendada exitosamente! Recibirás confirmación pronto.', 'success');
        
        // Guardar datos en localStorage
        localStorage.setItem('nombre_cliente', datos.nombre_cliente);
        localStorage.setItem('correo_cliente', datos.correo);
        localStorage.setItem('telefono_cliente', datos.telefono);
        
        // Limpiar formulario y selección de hora
        form.reset();
        selectedTime = null;
        document.querySelectorAll('.time-slot').forEach(slot => {
          slot.classList.remove('selected');
        });
        
        // Scroll al mensaje
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        showAlert(result.error || 'Error al agendar cita', 'error');
      }

    } catch (error) {
      console.error('Error:', error);
      showAlert('Error de conexión. Por favor intenta nuevamente.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}

// ================================================
// SELECCIÓN DE HORA (GLOBAL PARA HTML)
// ================================================
function selectTime(element) {
  // No permitir seleccionar slots no disponibles
  if (element.classList.contains('unavailable')) {
    return;
  }

  // Remover selección previa
  document.querySelectorAll('.time-slot').forEach(slot => {
    slot.classList.remove('selected');
  });

  // Seleccionar nuevo
  element.classList.add('selected');
  selectedTime = element.textContent.trim();
}

// ================================================
