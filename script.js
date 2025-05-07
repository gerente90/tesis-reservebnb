document.addEventListener('DOMContentLoaded', function() {
    // Cargar habitaciones
    cargarHabitaciones();
    
    // Cargar reservas del usuario
    cargarReservas();
    
    // Configurar menú móvil
    const menuToggle = document.getElementById('menu-toggle');
    const mainNav = document.getElementById('main-nav');
    
    menuToggle.addEventListener('click', function() {
        mainNav.classList.toggle('active');
    });
    
    // Configurar formulario de reserva
    const reservationForm = document.getElementById('reservation-form');
    const roomTypeSelect = document.getElementById('room-type');
    const checkInInput = document.getElementById('check-in');
    const checkOutInput = document.getElementById('check-out');
    const guestsInput = document.getElementById('guests');
    const totalPriceElement = document.getElementById('total-price');
    const reservationDetails = document.getElementById('reservation-details');
    
    // Llenar select de tipos de habitación
    habitaciones.forEach(habitacion => {
        const option = document.createElement('option');
        option.value = habitacion.id;
        option.textContent = `${habitacion.nombre} - $${habitacion.precio}/noche`;
        roomTypeSelect.appendChild(option);
    });
    
    // Configurar fechas mínimas
    const today = new Date().toISOString().split('T')[0];
    checkInInput.min = today;
    checkOutInput.min = today;
    
    // Actualizar fecha mínima de salida cuando cambia la de entrada
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
    
    // Manejar envío del formulario de reserva
    reservationForm.addEventListener('submit', function(e) {
        e.preventDefault();
        console.log('Iniciando proceso de reserva...');
        
        const habitacionId = parseInt(roomTypeSelect.value);
        const habitacion = habitaciones.find(h => h.id === habitacionId);
        
        if (!habitacion) {
            console.log('No se seleccionó habitación válida');
            mostrarModal('Error', 'Por favor selecciona una habitación válida.');
            return;
        }
        
        const numHuespedes = parseInt(guestsInput.value) || 1;
        
        if (numHuespedes > habitacion.capacidad) {
            console.log('Exceso de capacidad');
            mostrarModal('Error', `Esta habitación tiene una capacidad máxima de ${habitacion.capacidad} huéspedes.`);
            return;
        }
        
        if (!checkInInput.value || !checkOutInput.value) {
            console.log('Fechas no seleccionadas');
            mostrarModal('Error', 'Por favor selecciona fechas de check-in y check-out.');
            return;
        }
        
        const nuevaReserva = {
            id: Date.now(),
            habitacionId: habitacion.id,
            nombreHabitacion: habitacion.nombre,
            imagenHabitacion: habitacion.imagen,
            checkIn: checkInInput.value,
            checkOut: checkOutInput.value,
            huespedes: numHuespedes,
            nombre: document.getElementById('name').value,
            email: document.getElementById('email').value,
            precioTotal: calcularTotal(checkInInput.value, checkOutInput.value, habitacion.precio),
            estado: 'confirmada',
            fechaReserva: new Date().toISOString().split('T')[0]
        };
        
        console.log('Creando nueva reserva:', nuevaReserva);
        guardarReserva(nuevaReserva);
        console.log('Reserva guardada. Reservas actuales:', reservas);
        
        cargarReservas();
        console.log('Reservas cargadas en la interfaz');
        
        // Resetear formulario
        reservationForm.reset();
        totalPriceElement.textContent = '$0';
        reservationDetails.innerHTML = '<p>Selecciona una habitación para ver los detalles</p>';
        
        mostrarModal('Reserva Confirmada', `Tu reserva en ${habitacion.nombre} ha sido confirmada con éxito. Recibirás un correo electrónico con los detalles.`);
    });
    
    // Función para actualizar el precio total
    function actualizarPrecioTotal() {
        const habitacionId = parseInt(roomTypeSelect.value);
        const habitacion = habitaciones.find(h => h.id === habitacionId);
        
        if (!habitacion || !checkInInput.value || !checkOutInput.value) {
            return;
        }
        
        const total = calcularTotal(checkInInput.value, checkOutInput.value, habitacion.precio);
        totalPriceElement.textContent = `$${total}`;
        
        // Actualizar detalles de la reserva
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
    }
    
    // Función para cargar las habitaciones
    function cargarHabitaciones() {
        const roomsContainer = document.getElementById('rooms-container');
        roomsContainer.innerHTML = '';
        
        habitaciones.forEach(habitacion => {
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
                </div>
            `;
            roomsContainer.appendChild(roomCard);
        });
    }
    
    // Función para cargar las reservas del usuario
    function cargarReservas() {
        const reservationsContainer = document.getElementById('reservations-container');
        const noReservationsMsg = document.getElementById('no-reservations');
        
        if (reservas.length === 0) {
            noReservationsMsg.style.display = 'block';
            reservationsContainer.innerHTML = '';
            return;
        }
        
        noReservationsMsg.style.display = 'none';
        reservationsContainer.innerHTML = '';
        
        reservas.forEach(reserva => {
            const habitacion = habitaciones.find(h => h.id === reserva.habitacionId);
            
            const reservaElement = document.createElement('div');
            reservaElement.className = 'reservation-item';
            reservaElement.innerHTML = `
                <div class="reservation-info">
                    <h3>${reserva.nombreHabitacion}</h3>
                    <p><strong>Fecha:</strong> ${new Date(reserva.checkIn).toLocaleDateString()} - ${new Date(reserva.checkOut).toLocaleDateString()}</p>
                    <p><strong>Huéspedes:</strong> ${reserva.huespedes}</p>
                    <p><strong>Total:</strong> $${reserva.precioTotal}</p>
                    <span class="status ${reserva.estado}">${reserva.estado}</span>
                </div>
                <button class="cancel-btn" data-id="${reserva.id}">Cancelar</button>
            `;
            reservationsContainer.appendChild(reservaElement);
        });
        
        // Agregar event listeners a los botones de cancelar
        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const reservaId = parseInt(this.getAttribute('data-id'));
                if (confirm('¿Estás seguro de que deseas cancelar esta reserva?')) {
                    eliminarReserva(reservaId);
                    cargarReservas();
                    mostrarModal('Reserva Cancelada', 'Tu reserva ha sido cancelada exitosamente.');
                }
            });
        });
    }
    
    // Smooth scrolling para los enlaces del menú
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
                
                // Cerrar menú móvil si está abierto
                mainNav.classList.remove('active');
            }
        });
    });
});