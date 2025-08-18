// Funciones para manejar reservas
function guardarReserva(reserva) {
    try {
        reservas.push(reserva);
        localStorage.setItem('reservas', JSON.stringify(reservas));
        return reserva;
    } catch (e) {
        console.error('Error al guardar en localStorage:', e);
        // Fallback: mantener en memoria aunque falle localStorage
        return reserva;
    }
}

function eliminarReserva(id) {
    reservas = reservas.filter(reserva => reserva.id !== id);
    try {
        localStorage.setItem('reservas', JSON.stringify(reservas));
    } catch (e) {
        console.error('Error al actualizar localStorage:', e);
    }
}

function calcularTotal(checkIn, checkOut, precioPorNoche) {
    try {
        const unDia = 24 * 60 * 60 * 1000; // milisegundos en un día
        const fechaInicio = new Date(checkIn);
        const fechaFin = new Date(checkOut);
        
        if (isNaN(fechaInicio.getTime()) || isNaN(fechaFin.getTime())) {
            console.error('Fechas inválidas:', checkIn, checkOut);
            return 0;
        }
        
        const diferenciaDias = Math.round(Math.abs((fechaFin - fechaInicio) / unDia));
        return diferenciaDias * precioPorNoche;
    } catch (e) {
        console.error('Error al calcular total:', e);
        return 0;
    }
}

function mostrarModal(titulo, mensaje) {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalButton = document.getElementById('modal-button');
    
    modalTitle.textContent = titulo;
    modalMessage.textContent = mensaje;
    modal.style.display = 'flex';
    
    modalButton.onclick = function() {
        modal.style.display = 'none';
    }
    
    document.querySelector('.close-modal').onclick = function() {
        modal.style.display = 'none';
    }
    
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    }
}