
    // =========================
    // Hamburguesa
    // =========================
    const menuToggle = document.getElementById('menuToggle');
    const navLinks = document.getElementById('navLinks');

    menuToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      menuToggle.textContent = isOpen ? '✕' : '☰';
    });

    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        if (navLinks.classList.contains('open')) {
          navLinks.classList.remove('open');
          menuToggle.setAttribute('aria-expanded', 'false');
          menuToggle.textContent = '☰';
        }
      });
    });

    // =========================
    // Badge carrito (demo simple)
    // Si quieres: lee localStorage carrito real
    // =========================
    document.addEventListener('DOMContentLoaded', () => {
      // Si tú guardas algo tipo cartItems:
      // const items = JSON.parse(localStorage.getItem('cartItems') || '[]');
      // document.getElementById('cartCount').textContent = items.length;

      document.getElementById('cartCount').textContent = '0';
    });

    // Variables globales
    let selectedServiceType = '';
    let selectedTimeSlot = '';

    // =========================
    // Tabs (FIX: sin usar event global)
    // =========================
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab, btn));
    });

    function switchTab(tabName, btn) {
      document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

      document.getElementById('tab-' + tabName).classList.add('active');
      btn.classList.add('active');

      hideAlert();
    }

    // =========================
    // Selección de tipo de cita
    // =========================
    function selectService(card, serviceType) {
      document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedServiceType = serviceType;

      const addressField = document.getElementById('direccionField');
      const addressInput = addressField.querySelector('input');

      if (serviceType === 'visita') {
        addressField.style.display = 'block';
        addressInput.required = true;
      } else {
        addressField.style.display = 'none';
        addressInput.required = false;
      }
    }

    // =========================
    // Horarios
    // =========================
    function selectTime(slot) {
      if (slot.classList.contains('unavailable')) return;

      document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
      slot.classList.add('selected');
      selectedTimeSlot = slot.textContent;
    }

    // =========================
    // Formularios
    // =========================
    const formCot = document.getElementById('formCotizacion');
    const formCita = document.getElementById('formCita');

    formCot.addEventListener('submit', (e) => submitCotizacion(e));
    formCita.addEventListener('submit', (e) => submitCita(e));

    function submitCotizacion(event) {
      event.preventDefault();
      const formData = new FormData(event.target);
      const data = Object.fromEntries(formData);

      console.log('Cotización enviada:', data);

      const trackingNumber = 'WH-' + new Date().getFullYear() + '-' +
        Math.floor(Math.random() * 999999).toString().padStart(6, '0');

      showAlert('success',
        `✅ ¡Cotización enviada exitosamente!\n\n` +
        `Tu número de seguimiento es: ${trackingNumber}\n\n` +
        `Nos pondremos en contacto contigo en menos de 24 horas.`
      );

      event.target.reset();
      return false;
    }

    function submitCita(event) {
      event.preventDefault();

      if (!selectedServiceType) {
        showAlert('warning', '⚠️ Por favor selecciona el tipo de cita que deseas agendar.');
        return false;
      }

      if (!selectedTimeSlot) {
        showAlert('warning', '⚠️ Por favor selecciona un horario disponible.');
        return false;
      }

      const formData = new FormData(event.target);
      const data = Object.fromEntries(formData);

      console.log('Cita agendada:', data);

      const trackingNumber = 'WH-' + new Date().getFullYear() + '-' +
        Math.floor(Math.random() * 999999).toString().padStart(6, '0');

      showAlert('success',
        `✅ ¡Cita agendada exitosamente!\n\n` +
        `Número de seguimiento: ${trackingNumber}\n` +
        `Tipo: ${getServiceName(selectedServiceType)}\n` +
        `Horario: ${selectedTimeSlot}\n\n` +
        `Recibirás confirmación por WhatsApp y correo.`
      );

      event.target.reset();
      document.querySelectorAll('.service-card').forEach(c => c.classList.remove('selected'));
      document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
      selectedServiceType = '';
      selectedTimeSlot = '';
      document.getElementById('direccionField').style.display = 'none';

      return false;
    }

    function getServiceName(service) {
      const names = {
        visita: 'Visita Técnica a Domicilio',
        showroom: 'Cita en Showroom',
        virtual: 'Consulta Virtual'
      };
      return names[service] || service;
    }

    // =========================
    // Medidas
    // =========================
    const tieneMedidasSelect = document.getElementById('tieneMedidas');
    tieneMedidasSelect.addEventListener('change', toggleMedidasField);

    function toggleMedidasField() {
      const tieneMedidas = document.getElementById('tieneMedidas').value;
      const medidasField = document.getElementById('medidasField');
      const medidasInput = medidasField.querySelector('input');

      if (tieneMedidas === 'no') {
        medidasField.style.display = 'none';
        medidasInput.required = false;
      } else {
        medidasField.style.display = 'block';
        medidasInput.required = false;
      }
    }

    // =========================
    // Seguimiento
    // =========================
    function trackOrder() {
      const trackingNumber = document.getElementById('trackingNumber').value.trim();

      if (!trackingNumber) {
        showAlert('warning', '⚠️ Por favor ingresa un número de seguimiento.');
        return;
      }

      if (!trackingNumber.match(/^WH-\d{4}-\d{6}$/)) {
        showAlert('error', '❌ Formato inválido. Debe ser: WH-YYYY-NNNNNN');
        return;
      }

      document.getElementById('trackingResult').classList.add('show');
      document.getElementById('resultOrderNumber').value = trackingNumber;

      showAlert('success', '✅ Solicitud encontrada. Mostrando detalles...');
    }

    // =========================
    // Alertas
    // =========================
    function showAlert(type, message) {
      const alertDiv = document.getElementById('alertMessage');
      alertDiv.className = 'alert show ' + type;
      alertDiv.textContent = message;

      setTimeout(() => hideAlert(), 5000);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function hideAlert() {
      const alertDiv = document.getElementById('alertMessage');
      alertDiv.classList.remove('show');
    }

    // =========================
    // Fecha mínima (mañana)
    // =========================
    document.addEventListener('DOMContentLoaded', function() {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const fechaCita = document.getElementById('fechaCita');
      if (fechaCita) fechaCita.min = tomorrowStr;

      toggleMedidasField();
    });
  