document.addEventListener('DOMContentLoaded', function() {
  // Cargar habitaciones desde API
  async function cargarHabitaciones() {
    try {
      console.log('Cargando habitaciones desde API');
      const response = await fetch('http://localhost:5001/api/listings');
      if (!response.ok) throw new Error('Error al cargar listings: ' + response.statusText);
      const habitaciones = await response.json();
      const roomsContainer = document.getElementById('rooms-container');
      const roomTypeSelect = document.getElementById('room-type');
      if (roomsContainer) roomsContainer.innerHTML = '';
      if (roomTypeSelect) roomTypeSelect.innerHTML = '<option value="">Seleccione una habitación</option>';
      habitaciones.forEach(habitacion => {
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
                <span><i class="fas fa-user"></i> ${habitacion.capacidad} personas</span>
                <span><i class="fas fa-bed"></i> ${habitacion.camas}</span>
              </div>
              <div class="room-price">
                <div class="services-icons">
                  ${habitacion.servicios.map(serv => `<i class="fas fa-check" title="${serv}"></i>`).join('')}
                </div>
                <div class="price">
                  $${habitacion.precio}<span>/noche</span>
                </div>
              </div>
              <a href="${habitacion.airbnb_link || '#'}" target="_blank" class="btn-primary">Reservar en Airbnb</a>
            </div>
          `;
          roomsContainer.appendChild(roomCard);
        }
        if (roomTypeSelect) {
          const option = document.createElement('option');
          option.value = habitacion.id;
          option.textContent = `${habitacion.nombre} - $${habitacion.precio}/noche`;
          roomTypeSelect.appendChild(option);
        }
      });
    } catch (err) {
      console.error('Error al cargar habitaciones:', err);
      alert('Error al cargar habitaciones: ' + err.message);
    }
  }

  // Cargar reservas desde API
  async function cargarReservas() {
    try {
      console.log('Cargando reservas desde API');
      const response = await fetch('http://localhost:5001/api/reservations');
      if (!response.ok) throw new Error('Error al cargar reservas: ' + response.statusText);
      const reservas = await response.json();
      const reservationsContainer = document.getElementById('reservations-container');
      const noReservationsMsg = document.getElementById('no-reservations');
      if (reservationsContainer) reservationsContainer.innerHTML = '';
      if (reservas.length === 0) {
        if (noReservationsMsg) noReservationsMsg.style.display = 'block';
        return;
      }
      if (noReservationsMsg) noReservationsMsg.style.display = 'none';
      reservas.forEach(reserva => {
        const reservaElement = document.createElement('div');
        reservaElement.className = 'reservation-item';
        reservaElement.innerHTML = `
          <div class="reservation-info">
            <h3>Reserva #${reserva.id}</h3>
            <p><strong>Fecha:</strong> ${new Date(reserva.check_in).toLocaleDateString()} - ${new Date(reserva.check_out).toLocaleDateString()}</p>
            <p><strong>Huéspedes:</strong> ${reserva.huespedes}</p>
            <p><strong>Total:</strong> $${reserva.precio_total}</p>
            <span class="status ${reserva.estado}">${reserva.estado}</span>
          </div>
        `;
        reservationsContainer.appendChild(reservaElement);
      });
    } catch (err) {
      console.error('Error al cargar reservas:', err);
      alert('Error al cargar reservas: ' + err.message);
    }
  }

  // Calcular precio total
  function calcularTotal(checkIn, checkOut, precioPorNoche) {
    const fechaInicio = new Date(checkIn);
    const fechaFin = new Date(checkOut);
    const noches = (fechaFin - fechaInicio) / (1000 * 60 * 60 * 24);
    return noches >= 1 ? (noches * precioPorNoche).toFixed(2) : 0;
  }

  // Configurar formulario de reserva
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
        const response = await fetch(`http://localhost:5001/api/listings/${habitacionId}`);
        if (!response.ok) throw new Error('Error al cargar habitación');
        const habitacion = await response.json();
        const total = calcularTotal(checkInInput.value, checkOutInput.value, habitacion.precio);
        totalPriceElement.textContent = `$${total}`;
        const fechaInicio = new Date(checkInInput.value).toLocaleDateString();
        const fechaFin = new Date(checkOutInput.value).toLocaleDateString();
        reservationDetails.innerHTML = `
          <div class="reservation-room">
            <img src="${habitacion.imagen}" alt="${habitacion.nombre}" style="width:100px; height:auto; border-radius:4px;">
            <div>
              <h4>${habitacion.nombre}</h4>
              <p>${habitacion.camas}</p>
              <p>Capacidad: ${habitacion.capacidad} personas</p>
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
      const habitacionId = parseInt(roomTypeSelect.value);
      try {
        console.log('Enviando reserva para habitación:', habitacionId);
        const response = await fetch(`http://localhost:5001/api/listings/${habitacionId}`);
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
        const nuevaReserva = {
          listing_id: habitacionId,
          check_in: checkInInput.value,
          check_out: checkOutInput.value,
          huespedes: numHuespedes,
          nombre: document.getElementById('name').value,
          email: document.getElementById('email').value,
          precio_total: calcularTotal(checkInInput.value, checkOutInput.value, habitacion.precio)
        };
        console.log('Creando reserva:', nuevaReserva);
        const res = await fetch('http://localhost:5001/api/reservations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(nuevaReserva)
        });
        if (!res.ok) throw new Error('Error al guardar reserva');
        reservationForm.reset();
        totalPriceElement.textContent = '$0';
        reservationDetails.innerHTML = '<p>Selecciona una habitación para ver los detalles</p>';
        cargarReservas();
        alert(`Reserva en ${habitacion.nombre} confirmada.`);
      } catch (err) {
        console.error('Error al crear reserva:', err);
        alert('Error al crear la reserva: ' + err.message);
      }
    });
  }

  // Configurar formulario de login
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    console.log('Formulario de login encontrado');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      console.log('Intentando login con username:', username);
      try {
        const response = await fetch('http://localhost:5001/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password })
        });
        console.log('Respuesta de /api/auth/login:', response.status, response.statusText);
        if (!response.ok) throw new Error('Error en login: ' + response.statusText);
        const data = await response.json();
        console.log('Datos recibidos:', data);
        if (data.token) {
          localStorage.setItem('token', data.token);
          console.log('Token guardado:', localStorage.getItem('token'));
          window.location.href = '/admin.html';
        } else {
          console.log('Login fallido: no token recibido');
          alert('Credenciales inválidas');
        }
      } catch (err) {
        console.error('Error en login:', err);
        alert('Error al iniciar sesión: ' + err.message);
      }
    });
  } else {
    console.log('Formulario de login no encontrado');
  }

  // Lógica para admin.html
  const listingForm = document.getElementById('listing-form');
  const listingsList = document.getElementById('listings-list');
  const logoutBtn = document.getElementById('logout-btn');

  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      window.location.href = '/index.html';
      console.log('Sesión cerrada');
    });
  }

  if (listingForm && listingsList) {
    async function loadListings() {
      try {
        console.log('Cargando listings para admin, token:', localStorage.getItem('token'));
        const response = await fetch('http://localhost:5001/api/listings', {
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
            <p>Capacidad: ${listing.capacidad}</p>
            <p>Camas: ${listing.camas}</p>
            <p>Precio: $${listing.precio}</p>
            <p>Link Airbnb: <a href="${listing.airbnb_link || '#'}" target="_blank">${listing.airbnb_link || 'No disponible'}</a></p>
            <a href="${listing.airbnb_link || '#'}" target="_blank" class="btn-primary">Reservar en Airbnb</a>
            <button onclick="editListing(${listing.id})">Editar</button>
            <button onclick="deleteListing(${listing.id})">Eliminar</button>
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
        capacidad: parseInt(document.getElementById('capacidad').value),
        camas: document.getElementById('camas').value,
        precio: parseFloat(document.getElementById('precio').value),
        servicios: document.getElementById('servicios').value.split(',').map(s => s.trim()),
        airbnb_link: airbnbLinkInput || '' // Asegura que no sea undefined
      };
      try {
        console.log('Guardando hospedaje:', id ? 'Actualizar ID ' + id : 'Crear nuevo', 'Payload:', listing);
        console.log('Token enviado:', localStorage.getItem('token'));
        const method = id ? 'PUT' : 'POST';
        const url = id ? `http://localhost:5001/api/listings/${id}` : 'http://localhost:5001/api/listings';
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
        const response = await fetch(`http://localhost:5001/api/listings/${id}`);
        if (!response.ok) throw new Error('No encontrado');
        const listing = await response.json();
        document.getElementById('listing-id').value = listing.id;
        document.getElementById('nombre').value = listing.nombre;
        document.getElementById('descripcion').value = listing.descripcion;
        document.getElementById('imagen').value = listing.imagen;
        document.getElementById('capacidad').value = listing.capacidad;
        document.getElementById('camas').value = listing.camas;
        document.getElementById('precio').value = listing.precio;
        document.getElementById('servicios').value = listing.servicios.join(', ');
        document.getElementById('airbnb_link').value = listing.airbnb_link || '';
      } catch (err) {
        console.error('Error al cargar hospedaje:', err);
        alert('Error al cargar hospedaje para editar: ' + err.message);
      }
    };

    window.deleteListing = async (id) => {
      if (confirm('¿Estás seguro de eliminar este hospedaje?')) {
        try {
          console.log('Eliminando hospedaje:', id);
          const response = await fetch(`http://localhost:5001/api/listings/${id}`, {
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

  // Smooth scrolling para enlaces de menú
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
        document.getElementById('main-nav').classList.remove('active');
      }
    });
  });

  // Cargar datos iniciales
  if (document.getElementById('rooms-container')) cargarHabitaciones();
  if (document.getElementById('reservations-container')) cargarReservas();
});