document.addEventListener('DOMContentLoaded', function() {
  const API_BASE = 'http://localhost:5001/api';
  let customerToken = localStorage.getItem('customerToken') || null;
  let customerData = null;
  try {
    customerData = JSON.parse(localStorage.getItem('customerData'));
  } catch (err) {
    customerData = null;
  }
  let currentBookingContext = null;

  const customerInfoCard = document.getElementById('customer-info');
  const customerNameLabel = document.getElementById('customer-name');
  const customerLogoutBtn = document.getElementById('customer-logout');
  const navLoginItem = document.getElementById('nav-login-item');
  const navLoginBtn = document.getElementById('open-auth-modal');
  const navUserItem = document.getElementById('nav-user-item');
  const navUserName = document.getElementById('nav-user-name');
  const navCustomerLogout = document.getElementById('nav-customer-logout');
  const authModal = document.getElementById('auth-modal');
  const closeAuthModalBtn = document.getElementById('close-auth-modal');
  const authTabs = document.querySelectorAll('.auth-tab');
  const loginFormModal = document.getElementById('modal-login-form');
  const registerFormModal = document.getElementById('modal-register-form');
  const roleSwitch = document.getElementById('role-switch');
  const roleButtons = document.querySelectorAll('.role-btn');
  const loginEmailInput = document.getElementById('modal-login-email');
  const loginPasswordInput = document.getElementById('modal-login-password');
  const registerNameInput = document.getElementById('modal-register-name');
  const registerEmailInput = document.getElementById('modal-register-email');
  const registerPasswordInput = document.getElementById('modal-register-password');
  const registerPhoneInput = document.getElementById('modal-register-phone');
  let selectedLoginRole = 'cliente';
  const bookingModal = document.getElementById('booking-modal');
  const bookingForm = document.getElementById('booking-request-form');
  const bookingStartInput = document.getElementById('booking-start');
  const bookingEndInput = document.getElementById('booking-end');
  const bookingEndWrapper = document.getElementById('booking-end-wrapper');
  const bookingPeopleInput = document.getElementById('booking-people');
  const bookingNotesInput = document.getElementById('booking-notes');
  const bookingTotalElement = document.getElementById('booking-total');
  const bookingItemNameElement = document.getElementById('booking-item-name');
  const closeBookingModalBtn = document.getElementById('close-booking-modal');
  const bookingStartLabel = document.querySelector('label[for="booking-start"]');
  const bookingEndLabel = document.querySelector('label[for="booking-end"]');
  const passwordToggleButtons = document.querySelectorAll('.toggle-password');
  const cityFilter = document.getElementById('city-filter');
  let allListings = [];
  const blockedRangesCache = new Map();
  let bookingStartPicker = null;
  let bookingEndPicker = null;

  function updateCustomerPanel() {
    const isLogged = Boolean(customerToken && customerData);
    if (customerInfoCard) {
      customerInfoCard.style.display = isLogged ? 'block' : 'none';
      if (customerNameLabel && isLogged) {
        customerNameLabel.textContent = customerData.nombre;
      }
    }
    if (navUserItem) {
      navUserItem.style.display = isLogged ? 'flex' : 'none';
    }
    if (navLoginItem) {
      navLoginItem.style.display = isLogged ? 'none' : 'inline-block';
    }
    if (navUserName) {
      navUserName.textContent = isLogged ? customerData.nombre : '';
    }
  }

  function setCustomerSession(token, user) {
    customerToken = token;
    customerData = user;
    localStorage.setItem('customerToken', token);
    localStorage.setItem('customerData', JSON.stringify(user));
    updateCustomerPanel();
  }

  function clearCustomerSession() {
    customerToken = null;
    customerData = null;
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerData');
    updateCustomerPanel();
    if (typeof cargarSolicitudesCliente === 'function') {
      cargarSolicitudesCliente();
    }
  }

  function requireCustomerSession() {
    if (!customerToken || !customerData) {
      alert('Debes iniciar sesión como usuario para continuar.');
      openAuthModal('login');
      return false;
    }
    return true;
  }

  function openAuthModal(tab = 'login') {
    if (!authModal) return;
    setAuthTab(tab);
    authModal.classList.add('active');
    authModal.setAttribute('aria-hidden', 'false');
  }

  function closeAuthModal() {
    if (!authModal) return;
    authModal.classList.remove('active');
    authModal.setAttribute('aria-hidden', 'true');
  }

  function setAuthTab(tab) {
    if (!authTabs) return;
    authTabs.forEach((btn) => {
      const isActive = btn.dataset.tab === tab;
      btn.classList.toggle('active', isActive);
      const form = document.querySelector(`.auth-form[data-tab="${btn.dataset.tab}"]`);
      if (form) form.classList.toggle('active', isActive);
    });
    if (roleSwitch) {
      roleSwitch.classList.toggle('hidden', tab !== 'login');
    }
  }

  function setLoginRole(role) {
    selectedLoginRole = role;
    roleButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.role === role);
    });
  }

  function attachPasswordPeek(button) {
    const inputId = button.dataset.target;
    const input = document.getElementById(inputId);
    if (!input) return;

    const showPassword = () => {
      input.type = 'text';
    };
    const hidePassword = () => {
      input.type = 'password';
    };

    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      showPassword();
    });
    button.addEventListener('pointerup', hidePassword);
    button.addEventListener('pointerleave', hidePassword);
    button.addEventListener('pointercancel', hidePassword);
    button.addEventListener('keydown', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        showPassword();
      }
    });
    button.addEventListener('keyup', (event) => {
      if (event.key === ' ' || event.key === 'Enter') {
        hidePassword();
      }
    });
    button.addEventListener('blur', hidePassword);
  }

  if (passwordToggleButtons.length) {
    passwordToggleButtons.forEach(attachPasswordPeek);
  }

  updateCustomerPanel();

  if (navLoginBtn) {
    navLoginBtn.addEventListener('click', () => openAuthModal('login'));
  }

  if (closeAuthModalBtn) {
    closeAuthModalBtn.addEventListener('click', closeAuthModal);
  }

  if (authModal) {
    authModal.addEventListener('click', (event) => {
      if (event.target === authModal) {
        closeAuthModal();
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAuthModal();
    }
  });

  authTabs.forEach((btn) => {
    btn.addEventListener('click', () => setAuthTab(btn.dataset.tab));
  });

  roleButtons.forEach((btn) => {
    btn.addEventListener('click', () => setLoginRole(btn.dataset.role));
  });

  if (customerLogoutBtn) {
    customerLogoutBtn.addEventListener('click', () => {
      clearCustomerSession();
      const reservationsContainer = document.getElementById('reservations-container');
      if (reservationsContainer) {
        reservationsContainer.innerHTML = '';
      }
      const noReservationsMsg = document.getElementById('no-reservations');
      if (noReservationsMsg) noReservationsMsg.style.display = 'block';
    });
  }

  if (navCustomerLogout) {
    navCustomerLogout.addEventListener('click', () => {
      clearCustomerSession();
    });
  }

  // ============================
  // MODAL: LOGIN / REGISTER
  // ============================
  if (loginFormModal) {
    loginFormModal.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = loginEmailInput?.value.trim();
      const password = loginPasswordInput?.value;
      if (!email || !password) {
        alert('Completa tus credenciales.');
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        if (!response.ok) throw new Error('Credenciales inválidas');
        const data = await response.json();
        if (selectedLoginRole === 'admin') {
          if (data.user.role !== 'admin') {
            alert('Esta cuenta no tiene permisos de administrador.');
            return;
          }
          localStorage.setItem('token', data.token);
          closeAuthModal();
          window.location.href = 'admin.html';
          return;
        }
        if (data.user.role === 'admin') {
          alert('Selecciona el modo administrador para esta cuenta.');
          return;
        }
        setCustomerSession(data.token, data.user);
        closeAuthModal();
        cargarSolicitudesCliente();
        alert(`Bienvenido ${data.user.nombre}`);
      } catch (err) {
        console.error('Error en login:', err);
        alert('Error al iniciar sesión: ' + err.message);
      }
    });
  }

  if (registerFormModal) {
    registerFormModal.addEventListener('submit', async (e) => {
      e.preventDefault();
      const nombre = registerNameInput?.value.trim();
      const email = registerEmailInput?.value.trim();
      const password = registerPasswordInput?.value;
      const telefono = registerPhoneInput?.value.trim();
      if (!nombre || !email || !password) {
        alert('Completa todos los campos obligatorios.');
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, email, password, telefono })
        });
        if (!response.ok) throw new Error('No se pudo registrar');
        const data = await response.json();
        setCustomerSession(data.token, data.user);
        closeAuthModal();
        registerFormModal.reset();
        cargarSolicitudesCliente();
        alert('Cuenta creada, ya puedes solicitar reservas.');
      } catch (err) {
        console.error('Error en registro:', err);
        alert('Error al registrar: ' + err.message);
      }
    });
  }

  // ============================
  // FRONT: HABITACIONES (LISTINGS)
  // ============================
  function renderHabitaciones(habitaciones) {
    const roomsContainer = document.getElementById('rooms-container');
    const roomTypeSelect = document.getElementById('room-type');
    if (roomsContainer) roomsContainer.innerHTML = '';
    if (roomTypeSelect) roomTypeSelect.innerHTML = '<option value="">Seleccione una habitación</option>';
    habitaciones.forEach((habitacion) => {
      if (roomsContainer) {
        const roomCard = document.createElement('div');
        roomCard.className = 'room-card';
        roomCard.innerHTML = `
          <div class="room-img">
            <img src="${habitacion.imagen}" alt="${habitacion.nombre}">
          </div>
          <div class="room-info">
            <h3>${habitacion.nombre}</h3>
            <p>${habitacion.descripcion}</p>
            <div class="room-features">
              <span><i class="fas fa-map-marker-alt"></i> ${habitacion.ciudad || 'Sin ciudad'}</span>
              <span><i class="fas fa-user"></i> ${habitacion.capacidad} personas</span>
              <span><i class="fas fa-bed"></i> ${habitacion.camas}</span>
            </div>
            <div class="room-price">
              <div class="services-icons">
                ${(habitacion.servicios || []).map(serv => `<i class="fas fa-check" title="${serv}"></i>`).join('')}
              </div>
              <div class="price">
                $${habitacion.precio_base}<span>/noche base</span>
              </div>
            </div>
            ${Number(habitacion.tarifa_huesped_adicional || 0) > 0
              ? `<p class="room-note">+$${Number(habitacion.tarifa_huesped_adicional).toFixed(2)} por huésped desde ${habitacion.adicional_desde}</p>`
              : ''}
          </div>
        `;
        roomCard.addEventListener('click', () => {
          window.location.href = `listing.html?id=${habitacion.id}`;
        });
        roomsContainer.appendChild(roomCard);
      }
      if (roomTypeSelect) {
        const option = document.createElement('option');
        option.value = habitacion.id;
        option.textContent = `${habitacion.nombre} - $${habitacion.precio_base}/noche`;
        roomTypeSelect.appendChild(option);
      }
    });
  }

  function updateCityFilterOptions(listings) {
    if (!cityFilter) return;
    const cities = Array.from(
      new Set(
        listings
          .map((listing) => (listing.ciudad || '').trim())
          .filter((city) => city.length)
      )
    ).sort((a, b) => a.localeCompare(b));
    const current = cityFilter.value;
    cityFilter.innerHTML = '<option value="">Todas</option>';
    cities.forEach((city) => {
      const option = document.createElement('option');
      option.value = city;
      option.textContent = city;
      cityFilter.appendChild(option);
    });
    if (current) cityFilter.value = current;
  }

  async function cargarHabitaciones() {
    try {
      console.log('Cargando habitaciones desde API');
      const response = await fetch(`${API_BASE}/listings`);
      if (!response.ok) throw new Error('Error al cargar listings: ' + response.statusText);
      allListings = await response.json();
      updateCityFilterOptions(allListings);
      const selectedCity = cityFilter ? cityFilter.value : '';
      const filtered = selectedCity
        ? allListings.filter((listing) => (listing.ciudad || '').trim() === selectedCity)
        : allListings;
      renderHabitaciones(filtered);
    } catch (err) {
      console.error('Error al cargar habitaciones:', err);
      alert('Error al cargar habitaciones: ' + err.message);
    }
  }

  // ============================
  // FRONT: TOURS PÚBLICOS
  // ============================
  async function cargarToursPublicos() {
    const toursContainer = document.getElementById('tours-container');
    if (!toursContainer) return;

    try {
      console.log('Cargando tours públicos desde API');
      const response = await fetch(`${API_BASE}/tours`);
      if (!response.ok) throw new Error('Error al cargar tours: ' + response.statusText);
      const tours = await response.json();
      toursContainer.innerHTML = '';

      tours
        .filter(tour => tour.activo) // solo tours activos
        .forEach(tour => {
          const tourCard = document.createElement('div');
          tourCard.className = 'room-card';
          tourCard.innerHTML = `
            <div class="room-img">
              <img src="${tour.imagen || 'https://via.placeholder.com/400x250?text=Tour'}" alt="${tour.nombre}">
            </div>
            <div class="room-info">
              <h3>${tour.nombre}</h3>
              <p>${tour.descripcion}</p>
              <div class="room-features">
                ${tour.duracion_horas ? `<span><i class="fas fa-clock"></i> ${tour.duracion_horas} horas</span>` : ''}
                ${tour.cupo_maximo ? `<span><i class="fas fa-users"></i> Cupo: ${tour.cupo_maximo} personas</span>` : ''}
              </div>
              <div class="room-price">
                <div class="services-icons">
                  ${(tour.servicios_incluidos || []).map(serv => `<i class="fas fa-check" title="${serv}"></i>`).join('')}
              </div>
              <div class="price">
                $${tour.precio}<span>/tour</span>
              </div>
            </div>
              ${tour.punto_encuentro ? `<p><strong>Punto de encuentro:</strong> ${tour.punto_encuentro}</p>` : ''}
            </div>
          `;
          toursContainer.appendChild(tourCard);
          const infoBlock = tourCard.querySelector('.room-info');
          if (infoBlock) {
            const transferBtn = document.createElement('button');
            transferBtn.type = 'button';
            transferBtn.className = 'btn-secondary transfer-btn';
            transferBtn.textContent = 'Pagar en transferencia';
            transferBtn.addEventListener('click', async () => {
              await openBookingModal({
                tipo: 'tour',
                id: tour.id,
                nombre: tour.nombre,
                precio: tour.precio
              });
            });
            infoBlock.appendChild(transferBtn);
          }
        });
    } catch (err) {
      console.error('Error al cargar tours públicos:', err);
      alert('Error al cargar tours: ' + err.message);
    }
  }

  // ============================
  // FRONT: DETALLE DE LISTING
  // ============================
  async function cargarDetalleListing() {
    const detailContainer = document.getElementById('listing-detail');
    if (!detailContainer) return;
    const params = new URLSearchParams(window.location.search);
    const listingId = params.get('id');
    if (!listingId) {
      detailContainer.innerHTML = '<p>No se encontró el hospedaje solicitado.</p>';
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/listings/${listingId}`);
      if (!response.ok) throw new Error('No se pudo cargar el hospedaje.');
      const listing = await response.json();
      const servicios = (listing.servicios || []).map((serv) => `<li>${serv}</li>`).join('');
      const tarifaExtra =
        Number(listing.tarifa_huesped_adicional || 0) > 0
          ? `+ $${Number(listing.tarifa_huesped_adicional).toFixed(2)} por huésped desde ${listing.adicional_desde}`
          : 'Sin tarifa adicional por huésped';
      detailContainer.innerHTML = `
        <div class="listing-detail-card">
          <div class="listing-detail-media">
            <img src="${listing.imagen}" alt="${listing.nombre}">
          </div>
          <div class="listing-detail-info">
            <h2>${listing.nombre}</h2>
            <p class="listing-detail-city">${listing.ciudad || 'Sin ciudad'}</p>
            <p>${listing.descripcion}</p>
            <div class="listing-detail-meta">
              <span><i class="fas fa-user"></i> ${listing.capacidad} personas</span>
              <span><i class="fas fa-bed"></i> ${listing.camas} camas</span>
            </div>
            <div class="listing-detail-price">
              <strong>$${listing.precio_base}</strong> / noche base
              <div class="listing-detail-extra">${tarifaExtra}</div>
            </div>
            <div class="listing-detail-actions" id="listing-detail-actions"></div>
          </div>
        </div>
        <div class="listing-detail-services">
          <h3>Servicios incluidos</h3>
          <ul>${servicios || '<li>Sin servicios registrados.</li>'}</ul>
        </div>
      `;
      const actions = document.getElementById('listing-detail-actions');
      if (actions) {
        const airbnbBtn = document.createElement('a');
        airbnbBtn.href = listing.airbnb_link || '#';
        airbnbBtn.target = '_blank';
        airbnbBtn.className = 'admin-btn admin-btn-primary';
        airbnbBtn.textContent = 'Reservar en Airbnb';
        const transferBtn = document.createElement('button');
        transferBtn.type = 'button';
        transferBtn.className = 'admin-btn admin-btn-success';
        transferBtn.textContent = 'Pagar en transferencia';
        transferBtn.addEventListener('click', async () => {
          await openBookingModal({
            tipo: 'listing',
            id: listing.id,
            nombre: listing.nombre,
            precio_base: listing.precio_base,
            tarifa_huesped_adicional: listing.tarifa_huesped_adicional,
            adicional_desde: listing.adicional_desde,
            capacidad: listing.capacidad
          });
        });
        actions.appendChild(airbnbBtn);
        actions.appendChild(transferBtn);
      }
    } catch (err) {
      console.error('Error al cargar detalle del hospedaje:', err);
      detailContainer.innerHTML = '<p>Error al cargar el hospedaje.</p>';
    }
  }

  // ============================
  // FRONT: RESERVAS
  // ============================
  async function cargarSolicitudesCliente() {
    const reservationsContainer = document.getElementById('reservations-container');
    const noReservationsMsg = document.getElementById('no-reservations');
    if (!reservationsContainer) return;

    if (!customerToken || !customerData) {
      reservationsContainer.innerHTML = '';
      if (noReservationsMsg) {
        noReservationsMsg.style.display = 'block';
        noReservationsMsg.textContent = 'Inicia sesión para consultar tus solicitudes.';
      }
      return;
    }

    try {
      console.log('Cargando solicitudes del usuario');
      const response = await fetch(`${API_BASE}/booking-requests/mine`, {
        headers: { Authorization: `Bearer ${customerToken}` }
      });
      if (!response.ok) throw new Error('Error al cargar solicitudes: ' + response.statusText);
      const solicitudes = await response.json();
      reservationsContainer.innerHTML = '';
      if (solicitudes.length === 0) {
        if (noReservationsMsg) {
          noReservationsMsg.style.display = 'block';
          noReservationsMsg.textContent = 'Aún no registras solicitudes.';
        }
        return;
      }
      if (noReservationsMsg) noReservationsMsg.style.display = 'none';
      solicitudes.forEach((solicitud) => {
        const startDate = solicitud.fecha_inicio ? new Date(solicitud.fecha_inicio).toLocaleDateString() : 'Pendiente';
        const endDate = solicitud.fecha_fin ? new Date(solicitud.fecha_fin).toLocaleDateString() : '';
        const reservaElement = document.createElement('div');
        reservaElement.className = 'reservation-item';
        reservaElement.innerHTML = `
          <div class="reservation-info">
            <h3>${solicitud.item_nombre}</h3>
            <p><strong>Tipo:</strong> ${solicitud.tipo === 'listing' ? 'Hospedaje' : 'Tour'}</p>
            <p><strong>Fecha:</strong> ${startDate}${endDate ? ' - ' + endDate : ''}</p>
            <p><strong>Personas:</strong> ${solicitud.personas}</p>
            <p><strong>Total:</strong> $${Number(solicitud.monto_estimado || 0).toFixed(2)}</p>
            <span class="status ${solicitud.estado}">${solicitud.estado}</span>
          </div>
        `;
        reservationsContainer.appendChild(reservaElement);
      });
    } catch (err) {
      console.error('Error al cargar solicitudes:', err);
      if (noReservationsMsg) {
        noReservationsMsg.style.display = 'block';
        noReservationsMsg.textContent = 'No pudimos cargar tus solicitudes.';
      }
    }
  }

  // ============================
  // Cálculo de precio
  // ============================
  function calcularTotal(checkIn, checkOut, precioPorNoche) {
    if (!checkIn || !checkOut) return 0;
    const fechaInicio = new Date(checkIn);
    const fechaFin = new Date(checkOut);
    const noches = (fechaFin - fechaInicio) / (1000 * 60 * 60 * 24);
    return noches >= 1 ? noches * precioPorNoche : 0;
  }

  function calcularTarifaPorNoche(listing, personasValue) {
    const base = Number(listing?.precio_base || 0);
    const extra = Number(listing?.tarifa_huesped_adicional || 0);
    const desde = Number(listing?.adicional_desde || 1);
    const adicionales = Math.max(0, personasValue - desde);
    return base + (adicionales * extra);
  }

  function toDateKey(value) {
    if (!value) return null;
    return new Date(`${value}T00:00:00Z`).getTime();
  }

  function isRangeBlocked(startDate, endDate, ranges) {
    if (!startDate || !endDate) return false;
    const start = toDateKey(startDate);
    const end = toDateKey(endDate);
    if (!start || !end || end <= start) return false;
    return ranges.some((range) => {
      const rangeStart = toDateKey(range.start);
      const rangeEnd = toDateKey(range.end);
      if (!rangeStart || !rangeEnd) return false;
      return start < rangeEnd && end > rangeStart;
    });
  }

  async function loadBlockedRanges(listingId) {
    if (!listingId) return [];
    if (blockedRangesCache.has(listingId)) return blockedRangesCache.get(listingId);
    try {
      const response = await fetch(`${API_BASE}/listings/${listingId}/blocked-dates`);
      if (!response.ok) return [];
      const data = await response.json();
      const ranges = Array.isArray(data.ranges) ? data.ranges : [];
      blockedRangesCache.set(listingId, ranges);
      return ranges;
    } catch (err) {
      console.error('Error cargando fechas bloqueadas:', err);
      return [];
    }
  }

  function toIsoDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString().split('T')[0];
  }

  function normalizeDisableRanges(ranges) {
    return ranges
      .map((range) => {
        const start = range.start;
        const endDate = new Date(`${range.end}T00:00:00Z`);
        if (Number.isNaN(endDate.getTime())) return null;
        endDate.setUTCDate(endDate.getUTCDate() - 1);
        const end = toIsoDate(endDate);
        if (!start || !end) return null;
        return { from: start, to: end };
      })
      .filter(Boolean);
  }

  async function openBookingModal(context) {
    if (!requireCustomerSession()) return;
    if (!bookingModal || !context) return;
    const blockedRanges = context.tipo === 'listing'
      ? await loadBlockedRanges(context.id)
      : [];
    currentBookingContext = { ...context, blockedRanges };
    if (bookingItemNameElement) bookingItemNameElement.textContent = context.nombre;
    const today = new Date().toISOString().split('T')[0];
    if (bookingStartLabel) {
      bookingStartLabel.textContent = context.tipo === 'listing' ? 'Fecha de inicio' : 'Fecha del tour';
    }
    if (bookingEndLabel) {
      bookingEndLabel.textContent = 'Fecha de salida';
    }
    if (bookingStartInput) {
      bookingStartInput.value = '';
      bookingStartInput.min = today;
    }
    if (bookingEndInput) {
      bookingEndInput.value = '';
      bookingEndInput.min = today;
      bookingEndInput.required = context.tipo === 'listing';
    }
    if (bookingEndWrapper) {
      bookingEndWrapper.style.display = context.tipo === 'listing' ? 'block' : 'none';
    }
    if (bookingPeopleInput) {
      bookingPeopleInput.value = 1;
      if (context.tipo === 'listing' && context.capacidad) {
        bookingPeopleInput.max = String(context.capacidad);
      } else {
        bookingPeopleInput.removeAttribute('max');
      }
    }
    if (bookingNotesInput) bookingNotesInput.value = '';
    updateBookingTotal();
    if (window.flatpickr && bookingStartInput && bookingEndInput && context.tipo === 'listing') {
      const disabled = normalizeDisableRanges(blockedRanges);
      if (bookingStartPicker) bookingStartPicker.destroy();
      if (bookingEndPicker) bookingEndPicker.destroy();
      bookingStartPicker = window.flatpickr(bookingStartInput, {
        dateFormat: 'Y-m-d',
        minDate: 'today',
        disable: disabled,
        onChange: (selectedDates) => {
          const value = selectedDates[0] ? toIsoDate(selectedDates[0]) : '';
          bookingStartInput.value = value || '';
          if (bookingEndPicker && value) {
            bookingEndPicker.set('minDate', value);
          }
          updateBookingTotal();
        }
      });
      bookingEndPicker = window.flatpickr(bookingEndInput, {
        dateFormat: 'Y-m-d',
        minDate: 'today',
        disable: disabled,
        onChange: (selectedDates) => {
          const value = selectedDates[0] ? toIsoDate(selectedDates[0]) : '';
          bookingEndInput.value = value || '';
          updateBookingTotal();
        }
      });
    }
    bookingModal.style.display = 'flex';
  }

  function closeBookingModal() {
    if (bookingModal) bookingModal.style.display = 'none';
    currentBookingContext = null;
  }

  function buildBookingPayloadFromModal() {
    if (!currentBookingContext) return null;
    const personasValue = parseInt(bookingPeopleInput?.value || '1', 10) || 1;
    const fechaInicio = bookingStartInput?.value;
    const fechaFin = currentBookingContext.tipo === 'listing' ? bookingEndInput?.value : null;
    if (
      currentBookingContext.tipo === 'listing' &&
      currentBookingContext.capacidad &&
      personasValue > currentBookingContext.capacidad
    ) {
      alert(`Este hospedaje tiene una capacidad máxima de ${currentBookingContext.capacidad} huéspedes.`);
      return null;
    }
    if (currentBookingContext.tipo === 'listing' && (!fechaInicio || !fechaFin)) {
      alert('Selecciona las fechas de entrada y salida.');
      return null;
    }
    if (currentBookingContext.tipo === 'tour' && !fechaInicio) {
      alert('Selecciona la fecha del tour.');
      return null;
    }
    if (
      currentBookingContext.tipo === 'listing' &&
      isRangeBlocked(fechaInicio, fechaFin, currentBookingContext.blockedRanges || [])
    ) {
      alert('Las fechas seleccionadas no están disponibles.');
      return null;
    }
    let monto = 0;
    if (currentBookingContext.tipo === 'listing') {
      const tarifaNoche = calcularTarifaPorNoche(currentBookingContext, personasValue);
      monto = calcularTotal(fechaInicio, fechaFin, tarifaNoche);
    } else {
      monto = personasValue * Number(currentBookingContext.precio || 0);
    }
    return {
      tipo: currentBookingContext.tipo,
      itemId: currentBookingContext.id,
      fechaInicio,
      fechaFin,
      personas: personasValue,
      monto: Number(monto.toFixed(2)),
      notas: bookingNotesInput?.value || ''
    };
  }

  function updateBookingTotal() {
    if (!bookingTotalElement) return;
    if (!currentBookingContext) {
      bookingTotalElement.textContent = '$0';
      return;
    }
    const personasValue = parseInt(bookingPeopleInput?.value || '1', 10) || 1;
    let total = 0;
    if (currentBookingContext.tipo === 'listing') {
      if (bookingStartInput?.value && bookingEndInput?.value) {
        if (isRangeBlocked(bookingStartInput.value, bookingEndInput.value, currentBookingContext.blockedRanges || [])) {
          bookingTotalElement.textContent = '$0';
          return;
        }
        const tarifaNoche = calcularTarifaPorNoche(currentBookingContext, personasValue);
        total = calcularTotal(bookingStartInput.value, bookingEndInput.value, tarifaNoche);
      }
    } else {
      total = personasValue * Number(currentBookingContext.precio || 0);
    }
    bookingTotalElement.textContent = `$${Number(total).toFixed(2)}`;
  }

  if (closeBookingModalBtn) {
    closeBookingModalBtn.addEventListener('click', closeBookingModal);
  }

  if (bookingModal) {
    bookingModal.addEventListener('click', (event) => {
      if (event.target === bookingModal) closeBookingModal();
    });
  }

  [bookingStartInput, bookingEndInput, bookingPeopleInput].forEach((input) => {
    if (!input) return;
    input.addEventListener('change', () => {
      if (input === bookingStartInput && bookingEndInput) {
        bookingEndInput.min = bookingStartInput.value;
        if (bookingEndInput.value && bookingEndInput.value < bookingStartInput.value) {
          bookingEndInput.value = bookingStartInput.value;
        }
      }
      if (
        currentBookingContext?.tipo === 'listing' &&
        bookingStartInput?.value &&
        bookingEndInput?.value &&
        isRangeBlocked(bookingStartInput.value, bookingEndInput.value, currentBookingContext.blockedRanges || [])
      ) {
        alert('Las fechas seleccionadas no están disponibles.');
        bookingEndInput.value = '';
      }
      updateBookingTotal();
    });
  });

  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!requireCustomerSession()) return;
      const payload = buildBookingPayloadFromModal();
      if (!payload) return;
      try {
        const response = await fetch(`${API_BASE}/booking-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${customerToken}`
          },
          body: JSON.stringify(payload)
        });
        if (!response.ok) throw new Error('No se pudo enviar la solicitud.');
        await response.json();
        alert('Solicitud enviada. Te notificaremos cuando el administrador la revise.');
        closeBookingModal();
        cargarSolicitudesCliente();
      } catch (err) {
        console.error('Error al enviar solicitud:', err);
        alert('Error al enviar la solicitud: ' + err.message);
      }
    });
  }

  // ============================
  // FRONT: FORMULARIO DE RESERVA
  // ============================
  const reservationForm = document.getElementById('reservation-form');
  if (reservationForm) {
    const roomTypeSelect = document.getElementById('room-type');
    const checkInInput = document.getElementById('check-in');
    const checkOutInput = document.getElementById('check-out');
    const guestsInput = document.getElementById('guests');
    const totalPriceElement = document.getElementById('total-price');
    const reservationDetails = document.getElementById('reservation-details');
    const today = new Date().toISOString().split('T')[0];
    checkInInput.min = today;
    checkOutInput.min = today;
    checkInInput.addEventListener('change', function() {
      checkOutInput.min = this.value;
      if (checkOutInput.value < this.value) {
        checkOutInput.value = this.value;
      }
      actualizarPrecioTotal();
    });
    checkOutInput.addEventListener('change', actualizarPrecioTotal);
    roomTypeSelect.addEventListener('change', actualizarPrecioTotal);
    guestsInput.addEventListener('change', actualizarPrecioTotal);
    async function actualizarPrecioTotal() {
      const habitacionId = parseInt(roomTypeSelect.value);
      if (!habitacionId || !checkInInput.value || !checkOutInput.value) {
        reservationDetails.innerHTML = '<p>Selecciona una habitación para ver los detalles</p>';
        totalPriceElement.textContent = '$0';
        return;
      }
      try {
        console.log('Actualizando precio para habitación:', habitacionId);
        const response = await fetch(`${API_BASE}/listings/${habitacionId}`);
        if (!response.ok) throw new Error('Error al cargar habitación');
        const habitacion = await response.json();
        if (habitacion.capacidad) {
          guestsInput.max = String(habitacion.capacidad);
          if (parseInt(guestsInput.value || '1', 10) > habitacion.capacidad) {
            guestsInput.value = String(habitacion.capacidad);
          }
        }
        const tarifaNoche = calcularTarifaPorNoche(habitacion, parseInt(guestsInput.value || '1', 10));
        const blockedRanges = await loadBlockedRanges(habitacionId);
        if (isRangeBlocked(checkInInput.value, checkOutInput.value, blockedRanges)) {
          totalPriceElement.textContent = '$0';
          alert('Las fechas seleccionadas no están disponibles.');
          return;
        }
        const total = calcularTotal(checkInInput.value, checkOutInput.value, tarifaNoche);
        totalPriceElement.textContent = `$${Number(total).toFixed(2)}`;
        const fechaInicio = new Date(checkInInput.value).toLocaleDateString();
        const fechaFin = new Date(checkOutInput.value).toLocaleDateString();
        reservationDetails.innerHTML = `
          <div class="reservation-room">
            <img src="${habitacion.imagen}" alt="${habitacion.nombre}" style="width:100px; height:auto; border-radius:4px;">
            <div>
              <h4>${habitacion.nombre}</h4>
              <p>${habitacion.camas}</p>
              <p>Capacidad: ${habitacion.capacidad} personas</p>
              <p>Precio por noche: $${Number(tarifaNoche).toFixed(2)}</p>
            </div>
          </div>
          <div class="reservation-dates">
            <p><strong>Check-in:</strong> ${fechaInicio}</p>
            <p><strong>Check-out:</strong> ${fechaFin}</p>
            <p><strong>Huéspedes:</strong> ${guestsInput.value || 1}</p>
          </div>
        `;
      } catch (err) {
        console.error('Error al cargar detalles de habitación:', err);
        alert('Error al cargar detalles de habitación: ' + err.message);
      }
    }
    reservationForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      if (!requireCustomerSession()) return;
      const roomTypeSelect = document.getElementById('room-type');
      const checkInInput = document.getElementById('check-in');
      const checkOutInput = document.getElementById('check-out');
      const guestsInput = document.getElementById('guests');

      const habitacionId = parseInt(roomTypeSelect.value);
      try {
        console.log('Enviando reserva para habitación:', habitacionId);
        const response = await fetch(`${API_BASE}/listings/${habitacionId}`);
        if (!response.ok) throw new Error('Error al cargar habitación');
        const habitacion = await response.json();
        const numHuespedes = parseInt(guestsInput.value) || 1;
        if (numHuespedes > habitacion.capacidad) {
          alert(`Esta habitación tiene una capacidad máxima de ${habitacion.capacidad} huéspedes.`);
          return;
        }
        if (!checkInInput.value || !checkOutInput.value) {
          alert('Por favor selecciona fechas de check-in y check-out.');
          return;
        }
        const tarifaNoche = calcularTarifaPorNoche(habitacion, numHuespedes);
        const blockedRanges = await loadBlockedRanges(habitacionId);
        if (isRangeBlocked(checkInInput.value, checkOutInput.value, blockedRanges)) {
          alert('Las fechas seleccionadas no están disponibles.');
          return;
        }
        const montoCalculado = calcularTotal(checkInInput.value, checkOutInput.value, tarifaNoche);
        const nuevaReserva = {
          tipo: 'listing',
          itemId: habitacionId,
          fechaInicio: checkInInput.value,
          fechaFin: checkOutInput.value,
          personas: numHuespedes,
          monto: Number(montoCalculado.toFixed(2))
        };
        console.log('Creando solicitud de reserva:', nuevaReserva);
        const res = await fetch(`${API_BASE}/booking-requests`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${customerToken}`
          },
          body: JSON.stringify(nuevaReserva)
        });
        if (!res.ok) throw new Error('Error al guardar solicitud');
        reservationForm.reset();
        totalPriceElement.textContent = '$0';
        reservationDetails.innerHTML = '<p>Selecciona una habitación para ver los detalles</p>';
        cargarSolicitudesCliente();
        alert(`Solicitud enviada para ${habitacion.nombre}. Te avisaremos cuando se confirme el pago.`);
      } catch (err) {
        console.error('Error al crear solicitud:', err);
        alert('Error al crear la solicitud: ' + err.message);
      }
    });
  }

  // ============================
  // ADMIN: LOGOUT
  // ============================
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = 'index.html';
      console.log('Sesión cerrada');
    });
  }

  // ============================
  // ADMIN: HOSPEDAJES
  // ============================
  const listingForm = document.getElementById('listing-form');
  const listingsList = document.getElementById('listings-list');
  const adminRequestsList = document.getElementById('requests-list');
  const adminRequestsEmpty = document.getElementById('requests-empty');

  if (adminRequestsList) {
    const renderRequestCard = (request) => {
      const card = document.createElement('div');
      card.className = 'request-card';
      const fechaInicio = request.fecha_inicio ? new Date(request.fecha_inicio).toLocaleDateString() : 'Pendiente';
      const fechaFin = request.fecha_fin ? new Date(request.fecha_fin).toLocaleDateString() : '';
      card.innerHTML = `
        <span class="status ${request.estado}">${request.estado}</span>
        <h4>${request.item_nombre}</h4>
        <p><strong>Tipo:</strong> ${request.tipo === 'listing' ? 'Hospedaje' : 'Tour'}</p>
        <p><strong>Cliente:</strong> ${request.solicitante_nombre || 'Pendiente'} (${request.solicitante_email || '-'})</p>
        <p><strong>Fechas:</strong> ${fechaInicio}${fechaFin ? ' - ' + fechaFin : ''}</p>
        <p><strong>Personas:</strong> ${request.personas}</p>
        <p><strong>Total:</strong> $${Number(request.monto_estimado || 0).toFixed(2)}</p>
        <p><strong>Notas:</strong> ${request.notas || 'Sin notas'}</p>
      `;
      if (request.estado === 'pendiente') {
        const actions = document.createElement('div');
        actions.className = 'actions';
        const approveBtn = document.createElement('button');
        approveBtn.className = 'admin-btn admin-btn-success';
        approveBtn.textContent = 'Aceptar';
        approveBtn.addEventListener('click', () => updateRequestStatus(request.id, 'aceptada'));
        const rejectBtn = document.createElement('button');
        rejectBtn.className = 'admin-btn admin-btn-danger';
        rejectBtn.textContent = 'Rechazar';
        rejectBtn.addEventListener('click', () => updateRequestStatus(request.id, 'rechazada'));
        actions.appendChild(approveBtn);
        actions.appendChild(rejectBtn);
        card.appendChild(actions);
      }
      return card;
    };

    const renderRequests = (requests) => {
      adminRequestsList.innerHTML = '';
      if (!requests.length) {
        if (adminRequestsEmpty) adminRequestsEmpty.style.display = 'block';
        else adminRequestsList.innerHTML = '<p>No hay solicitudes.</p>';
        return;
      }
      if (adminRequestsEmpty) adminRequestsEmpty.style.display = 'none';
      requests.forEach((req) => {
        adminRequestsList.appendChild(renderRequestCard(req));
      });
    };

    const updateRequestStatus = async (id, estado) => {
      try {
        const response = await fetch(`${API_BASE}/booking-requests/${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ estado })
        });
        if (!response.ok) throw new Error('Error al actualizar la solicitud');
        await loadTransferRequests();
      } catch (err) {
        console.error('Error actualizando solicitud:', err);
        alert('No se pudo actualizar la solicitud: ' + err.message);
      }
    };

    async function loadTransferRequests() {
      const adminToken = localStorage.getItem('token');
      if (!adminToken) {
        adminRequestsList.innerHTML = '<p>Inicia sesión como administrador para ver solicitudes.</p>';
        return;
      }
      try {
        const response = await fetch(`${API_BASE}/booking-requests`, {
          headers: { Authorization: `Bearer ${adminToken}` }
        });
        if (!response.ok) throw new Error(response.statusText);
        const data = await response.json();
        renderRequests(data);
      } catch (err) {
        console.error('Error al cargar solicitudes:', err);
        adminRequestsList.innerHTML = '<p>Error al cargar las solicitudes.</p>';
      }
    }

    loadTransferRequests();
  }

  if (listingForm && listingsList) {
    const capacidadInput = document.getElementById('capacidad');
    const adicionalDesdeInput = document.getElementById('adicional_desde');
    if (capacidadInput && adicionalDesdeInput) {
      const clampAdicionalDesde = () => {
        const capacidadValue = parseInt(capacidadInput.value || '1', 10);
        const desdeVal = parseInt(adicionalDesdeInput.value || '1', 10);
        if (!Number.isNaN(capacidadValue) && !Number.isNaN(desdeVal) && desdeVal > capacidadValue) {
          adicionalDesdeInput.value = String(capacidadValue);
        }
      };
      capacidadInput.addEventListener('input', clampAdicionalDesde);
      capacidadInput.addEventListener('change', clampAdicionalDesde);
    }
    async function loadListings() {
      try {
        console.log('Cargando listings para admin, token:', localStorage.getItem('token'));
        const response = await fetch(`${API_BASE}/listings`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('No autorizado o error en API: ' + response.statusText);
        const listings = await response.json();
        listingsList.innerHTML = '';
        listings.forEach(listing => {
          const div = document.createElement('div');
          div.className = 'room-card';
          div.innerHTML = `
            <h3>${listing.nombre}</h3>
            <p>${listing.descripcion}</p>
            <p>Ciudad: ${listing.ciudad || 'Sin ciudad'}</p>
            <p>Capacidad: ${listing.capacidad}</p>
            <p>Camas: ${listing.camas}</p>
            <p>Precio base: $${listing.precio_base}</p>
            ${Number(listing.tarifa_huesped_adicional || 0) > 0
              ? `<p>+ $${Number(listing.tarifa_huesped_adicional).toFixed(2)} desde ${listing.adicional_desde} huéspedes</p>`
              : ''}
            <p>Link Airbnb: <a href="${listing.airbnb_link || '#'}" target="_blank">${listing.airbnb_link || 'No disponible'}</a></p>
            <a href="${listing.airbnb_link || '#'}" target="_blank" class="admin-btn admin-btn-primary">Reservar en Airbnb</a>
            <button class="admin-btn admin-btn-warning" onclick="editListing(${listing.id})">Editar</button>
            <button class="admin-btn admin-btn-danger" onclick="deleteListing(${listing.id})">Eliminar</button>
          `;
          listingsList.appendChild(div);
        });
      } catch (err) {
        console.error('Error al cargar hospedajes:', err);
        alert('Error al cargar hospedajes: ' + err.message);
      }
    }

    loadListings();

    listingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('listing-id').value;
      const airbnbLinkInput = document.getElementById('airbnb_link').value;
      console.log('Valor de airbnb_link antes de enviar:', airbnbLinkInput); // Depuración
      const listing = {
        nombre: document.getElementById('nombre').value,
        descripcion: document.getElementById('descripcion').value,
        imagen: document.getElementById('imagen').value,
        ciudad: document.getElementById('ciudad').value.trim(),
        capacidad: parseInt(document.getElementById('capacidad').value),
        camas: parseInt(document.getElementById('camas').value),
        precio_base: parseFloat(document.getElementById('precio').value),
        tarifa_huesped_adicional: parseFloat(document.getElementById('tarifa_adicional').value || '0'),
        adicional_desde: parseInt(document.getElementById('adicional_desde').value || '1', 10),
        airbnb_ical_url: document.getElementById('airbnb_ical_url').value.trim(),
        servicios: document.getElementById('servicios').value.split(',').map(s => s.trim()),
        airbnb_link: airbnbLinkInput || '' // Asegura que no sea undefined
      };
      try {
        console.log('Guardando hospedaje:', id ? 'Actualizar ID ' + id : 'Crear nuevo', 'Payload:', listing);
        console.log('Token enviado:', localStorage.getItem('token'));
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE}/listings/${id}` : `${API_BASE}/listings`;
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(listing)
        });
        console.log('Respuesta del servidor:', response.status, response.statusText);
        if (!response.ok) throw new Error('Error al guardar: ' + response.statusText);
        const result = await response.json();
        console.log('Datos guardados:', result);
        listingForm.reset();
        document.getElementById('listing-id').value = '';
        loadListings();
        alert(id ? 'Hospedaje actualizado' : 'Hospedaje creado');
      } catch (err) {
        console.error('Error al guardar hospedaje:', err);
        alert('Error al guardar hospedaje: ' + err.message);
      }
    });

    window.editListing = async (id) => {
      try {
        console.log('Cargando hospedaje para editar:', id);
        const response = await fetch(`${API_BASE}/listings/${id}`);
        if (!response.ok) throw new Error('No encontrado');
        const listing = await response.json();
        document.getElementById('listing-id').value = listing.id;
        document.getElementById('nombre').value = listing.nombre;
        document.getElementById('descripcion').value = listing.descripcion;
        document.getElementById('imagen').value = listing.imagen;
        document.getElementById('ciudad').value = listing.ciudad || '';
        document.getElementById('capacidad').value = listing.capacidad;
        document.getElementById('camas').value = listing.camas;
        document.getElementById('precio').value = listing.precio_base;
        document.getElementById('tarifa_adicional').value = listing.tarifa_huesped_adicional || 0;
        document.getElementById('adicional_desde').value = listing.adicional_desde || 1;
        document.getElementById('servicios').value = (listing.servicios || []).join(', ');
        document.getElementById('airbnb_link').value = listing.airbnb_link || '';
        document.getElementById('airbnb_ical_url').value = listing.airbnb_ical_url || '';
      } catch (err) {
        console.error('Error al cargar hospedaje:', err);
        alert('Error al cargar hospedaje para editar: ' + err.message);
      }
    };

    window.deleteListing = async (id) => {
      if (confirm('¿Estás seguro de eliminar este hospedaje?')) {
        try {
          console.log('Eliminando hospedaje:', id);
          const response = await fetch(`${API_BASE}/listings/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (!response.ok) throw new Error('Error al eliminar');
          loadListings();
          alert('Hospedaje eliminado');
        } catch (err) {
          console.error('Error al eliminar:', err);
          alert('Error al eliminar: ' + err.message);
        }
      }
    };
  }

  // ============================
  // ADMIN: TOURS
  // ============================
  const tourForm = document.getElementById('tour-form');
  const toursList = document.getElementById('tours-list');

  if (tourForm && toursList) {
    async function loadToursAdmin() {
      try {
        console.log('Cargando tours para admin, token:', localStorage.getItem('token'));
        const response = await fetch(`${API_BASE}/tours`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) throw new Error('No autorizado o error en API: ' + response.statusText);
        const tours = await response.json();
        toursList.innerHTML = '';
        tours.forEach(tour => {
          const div = document.createElement('div');
          div.className = 'room-card';
          div.innerHTML = `
            <h3>${tour.nombre}</h3>
            <p>${tour.descripcion}</p>
            ${tour.duracion_horas ? `<p>Duración: ${tour.duracion_horas} horas</p>` : ''}
            <p>Precio: $${tour.precio}</p>
            ${tour.cupo_maximo ? `<p>Cupo máximo: ${tour.cupo_maximo} personas</p>` : ''}
            ${tour.punto_encuentro ? `<p>Punto de encuentro: ${tour.punto_encuentro}</p>` : ''}
            <p>Activo: ${tour.activo ? 'Sí' : 'No'}</p>
            <button class="admin-btn admin-btn-warning" onclick="editTour(${tour.id})">Editar</button>
            <button class="admin-btn admin-btn-danger" onclick="deleteTour(${tour.id})">Eliminar</button>
          `;
          toursList.appendChild(div);
        });
      } catch (err) {
        console.error('Error al cargar tours:', err);
        alert('Error al cargar tours: ' + err.message);
      }
    }

    loadToursAdmin();

    tourForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const id = document.getElementById('tour-id').value;
      const serviciosStr = document.getElementById('tour-servicios').value;

      const tour = {
        nombre: document.getElementById('tour-nombre').value,
        descripcion: document.getElementById('tour-descripcion').value,
        imagen: document.getElementById('tour-imagen').value || null,
        duracion_horas: document.getElementById('tour-duracion').value
          ? parseInt(document.getElementById('tour-duracion').value)
          : null,
        precio: parseFloat(document.getElementById('tour-precio').value),
        cupo_maximo: document.getElementById('tour-cupo').value
          ? parseInt(document.getElementById('tour-cupo').value)
          : null,
        punto_encuentro: document.getElementById('tour-punto').value || null,
        servicios_incluidos: serviciosStr
          ? serviciosStr.split(',').map(s => s.trim()).filter(Boolean)
          : [],
        activo: document.getElementById('tour-activo').checked
      };

      try {
        console.log('Guardando tour:', id ? 'Actualizar ID ' + id : 'Crear nuevo', 'Payload:', tour);
        const method = id ? 'PUT' : 'POST';
        const url = id ? `${API_BASE}/tours/${id}` : `${API_BASE}/tours`;
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(tour)
        });
        console.log('Respuesta del servidor (tours):', response.status, response.statusText);
        if (!response.ok) throw new Error('Error al guardar tour: ' + response.statusText);
        const result = await response.json();
        console.log('Tour guardado:', result);
        tourForm.reset();
        document.getElementById('tour-id').value = '';
        document.getElementById('tour-activo').checked = true;
        loadToursAdmin();
        alert(id ? 'Tour actualizado' : 'Tour creado');
      } catch (err) {
        console.error('Error al guardar tour:', err);
        alert('Error al guardar tour: ' + err.message);
      }
    });

    window.editTour = async (id) => {
      try {
        console.log('Cargando tour para editar:', id);
        const response = await fetch(`${API_BASE}/tours/${id}`);
        if (!response.ok) throw new Error('No encontrado');
        const tour = await response.json();
        document.getElementById('tour-id').value = tour.id;
        document.getElementById('tour-nombre').value = tour.nombre;
        document.getElementById('tour-descripcion').value = tour.descripcion;
        document.getElementById('tour-imagen').value = tour.imagen || '';
        document.getElementById('tour-duracion').value = tour.duracion_horas || '';
        document.getElementById('tour-precio').value = tour.precio;
        document.getElementById('tour-cupo').value = tour.cupo_maximo || '';
        document.getElementById('tour-punto').value = tour.punto_encuentro || '';
        document.getElementById('tour-servicios').value = (tour.servicios_incluidos || []).join(', ');
        document.getElementById('tour-activo').checked = tour.activo;
      } catch (err) {
        console.error('Error al cargar tour:', err);
        alert('Error al cargar tour para editar: ' + err.message);
      }
    };

    window.deleteTour = async (id) => {
      if (confirm('¿Estás seguro de eliminar este tour?')) {
        try {
          console.log('Eliminando tour:', id);
          const response = await fetch(`${API_BASE}/tours/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
          });
          if (!response.ok) throw new Error('Error al eliminar tour');
          loadToursAdmin();
          alert('Tour eliminado');
        } catch (err) {
          console.error('Error al eliminar tour:', err);
          alert('Error al eliminar tour: ' + err.message);
        }
      }
    };
  }

  // ============================
  // ADMIN: TABS HOSPEDAJES / TOURS
  // ============================
  const tabRequests = document.getElementById('tab-requests');
  const tabHospedajes = document.getElementById('tab-hospedajes');
  const tabTours = document.getElementById('tab-tours');
  const adminRequests = document.getElementById('admin-requests');
  const adminHospedajes = document.getElementById('admin-hospedajes');
  const adminTours = document.getElementById('admin-tours');

  if (tabRequests && tabHospedajes && tabTours && adminRequests && adminHospedajes && adminTours) {
    const showSection = (section) => {
      adminRequests.style.display = section === 'requests' ? 'block' : 'none';
      adminHospedajes.style.display = section === 'hospedajes' ? 'block' : 'none';
      adminTours.style.display = section === 'tours' ? 'block' : 'none';
      tabRequests.classList.toggle('active', section === 'requests');
      tabHospedajes.classList.toggle('active', section === 'hospedajes');
      tabTours.classList.toggle('active', section === 'tours');
      document.body.classList.remove('admin-view-requests', 'admin-view-hospedajes', 'admin-view-tours');
      if (section === 'requests') document.body.classList.add('admin-view-requests');
      if (section === 'hospedajes') document.body.classList.add('admin-view-hospedajes');
      if (section === 'tours') document.body.classList.add('admin-view-tours');
    };

    tabRequests.addEventListener('click', () => showSection('requests'));
    tabHospedajes.addEventListener('click', () => showSection('hospedajes'));
    tabTours.addEventListener('click', () => showSection('tours'));
  }

  // ============================
  // Smooth scrolling para enlaces de menú
  // ============================
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        window.scrollTo({
          top: targetElement.offsetTop - 80,
          behavior: 'smooth'
        });
        const nav = document.getElementById('main-nav');
        if (nav) nav.classList.remove('active');
      }
    });
  });

  // ============================
  // Cargar datos iniciales
  // ============================
  if (cityFilter) {
    cityFilter.addEventListener('change', () => {
      const selectedCity = cityFilter.value;
      const filtered = selectedCity
        ? allListings.filter((listing) => (listing.ciudad || '').trim() === selectedCity)
        : allListings;
      renderHabitaciones(filtered);
    });
  }
  if (document.getElementById('rooms-container')) cargarHabitaciones();
  if (document.getElementById('tours-container')) cargarToursPublicos();
  if (document.getElementById('listing-detail')) cargarDetalleListing();
  if (document.getElementById('reservations-container')) cargarSolicitudesCliente();
});
