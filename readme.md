# ReserveBnB — TenaAdventure

Resumen
- Aplicación para gestionar reservas de hospedaje (BnB) y actividades de aventura en Tena.
- Permite búsqueda de alojamientos, reservar experiencias, administrar disponibilidad y pagos (según integración).

Estado
- Estado: En desarrollo
- Funcionalidades básicas: catálogo, reservas, panel de administración (por implementar según versión)

Características
- Búsqueda y filtrado de alojamientos y actividades
- Calendario de disponibilidad
- Sistema de reservas con confirmación
- Perfil de usuario y gestión de reservas
- Puerta de enlace para pasarela de pagos (configurable)

Requisitos
- Node >= 16 (o indicar framework usado)
- Base de datos: PostgreSQL / MySQL / SQLite (ajustar según implementación)
- Docker (opcional)

Instalación (ejemplo estándar)
1. Clonar el repositorio
    git clone <URL-del-repositorio>
    cd reservebnb-tenaadventure
2. Instalar dependencias
    npm install
    (o) yarn install
3. Configurar variables de entorno
    - Crear un archivo `.env` con los valores necesarios (DB_URL, PORT, SECRET_KEY, PAYMENT_KEY, etc.)
4. Migrar la base de datos
    npm run migrate
    (o el comando correspondiente al ORM usado)

Ejecución
- Desarrollo:
  npm run dev
- Producción:
  npm start
- Con Docker:
  docker build -t reservebnb .
  docker run -p 3000:3000 --env-file .env reservebnb

Estructura sugerida
- /src — código fuente (frontend/backend)
- /migrations — migraciones de DB
- /docs — documentación adicional
- /tests — pruebas automatizadas

Pruebas
- Ejecutar pruebas unitarias/integración:
  npm test

Despliegue
- Instrucciones de despliegue dependerán de la infraestructura (Heroku, Vercel, DigitalOcean, Docker Swarm, Kubernetes).
- Asegurar variables de entorno y certificados SSL en producción.

Contribuciones
- Abrir issues para bugs o propuestas
- Crear pull requests con descripciones claras
- Seguir el formato de commits y pruebas asociadas

Licencia
- Indicar la licencia del proyecto (ej. MIT) en el fichero LICENSE.

Contacto
- Mantener issues y PRs en el repositorio. Para comunicación inmediata, añadir email o canal del equipo.

Notas
- Actualizar este README con detalles específicos del stack, comandos y variables de entorno reales del proyecto.
- Añadir guías de estilo y checklist de despliegue según avance el desarrollo.