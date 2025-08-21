// Base de datos de habitaciones
const habitaciones = [
    {
        id: 1,
        nombre: "Habitación Estándar",
        descripcion: "Una habitación cómoda y acogedora con todas las comodidades básicas para una estancia placentera.",
        imagen: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        capacidad: 2,
        camas: "1 cama queen size",
        precio: 120,
        servicios: ["WiFi gratuito", "TV pantalla plana", "Aire acondicionado", "Baño privado"]
    },
    {
        id: 2,
        nombre: "Habitación Deluxe",
        descripcion: "Amplia habitación con vistas panorámicas y amenities de lujo para una experiencia superior.",
        imagen: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        capacidad: 2,
        camas: "1 cama king size",
        precio: 180,
        servicios: ["WiFi gratuito", "TV pantalla plana", "Minibar", "Aire acondicionado", "Baño privado con jacuzzi"]
    },
    {
        id: 3,
        nombre: "Suite Ejecutiva",
        descripcion: "Elegante suite con sala de estar separada, ideal para viajeros de negocios o parejas que buscan más espacio.",
        imagen: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        capacidad: 2,
        camas: "1 cama king size",
        precio: 250,
        servicios: ["WiFi gratuito", "TV pantalla plana", "Minibar", "Aire acondicionado", "Baño privado con jacuzzi", "Escritorio de trabajo"]
    },
    {
        id: 4,
        nombre: "Suite Presidencial",
        descripcion: "Nuestra suite más exclusiva, con amplio espacio, vistas espectaculares y servicios personalizados.",
        imagen: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        capacidad: 4,
        camas: "1 cama king size + 1 sofá cama",
        precio: 450,
        servicios: ["WiFi gratuito", "TV pantalla plana", "Minibar premium", "Aire acondicionado", "Baño privado con sauna", "Sala de estar", "Comedor", "Servicio de mayordomo"]
    },
    {
        id: 5,
        nombre: "Habitación Familiar",
        descripcion: "Amplia habitación diseñada para familias, con espacio suficiente para todos y comodidades pensadas en los más pequeños.",
        imagen: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        capacidad: 4,
        camas: "2 camas queen size",
        precio: 200,
        servicios: ["WiFi gratuito", "TV pantalla plana", "Aire acondicionado", "Baño privado", "Zona de juegos infantiles"]
    },
    {
        id: 6,
        nombre: "Habitación con Vista al Mar",
        descripcion: "Disfruta de impresionantes vistas al mar desde tu habitación, con balcón privado para disfrutar de las puestas de sol.",
        imagen: "https://images.unsplash.com/photo-1455587734955-081b22074882?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        capacidad: 2,
        camas: "1 cama king size",
        precio: 220,
        servicios: ["WiFi gratuito", "TV pantalla plana", "Minibar", "Aire acondicionado", "Baño privado", "Balcón privado"]
    }
];

// Base de datos de reservas (simulada)
let reservas = JSON.parse(localStorage.getItem('reservas')) || [];