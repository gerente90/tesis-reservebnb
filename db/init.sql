CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'huesped',
  telefono TEXT
);

CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  imagen TEXT,
  ciudad TEXT,
  capacidad INTEGER,
  camas INTEGER,
  precio_base NUMERIC NOT NULL,
  tarifa_huesped_adicional NUMERIC NOT NULL DEFAULT 0,
  adicional_desde INTEGER NOT NULL DEFAULT 1,
  airbnb_ical_url TEXT,
  servicios JSONB NOT NULL DEFAULT '[]',
  airbnb_link TEXT
);

CREATE TABLE IF NOT EXISTS tours (
  id SERIAL PRIMARY KEY,
  nombre TEXT NOT NULL,
  descripcion TEXT NOT NULL,
  imagen TEXT,
  duracion_horas INTEGER,
  precio NUMERIC NOT NULL,
  cupo_maximo INTEGER,
  punto_encuentro TEXT,
  servicios_incluidos JSONB NOT NULL DEFAULT '[]',
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reservations (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  check_in DATE NOT NULL,
  check_out DATE NOT NULL,
  huespedes INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  email TEXT NOT NULL,
  precio_total NUMERIC NOT NULL,
  estado TEXT NOT NULL DEFAULT 'confirmada'
);

CREATE TABLE IF NOT EXISTS booking_requests (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('listing', 'tour')),
  item_id INTEGER NOT NULL,
  item_nombre TEXT NOT NULL,
  fecha_inicio DATE,
  fecha_fin DATE,
  personas INTEGER NOT NULL DEFAULT 1,
  estado TEXT NOT NULL DEFAULT 'pendiente',
  monto_estimado NUMERIC NOT NULL DEFAULT 0,
  metodo_pago TEXT NOT NULL DEFAULT 'transferencia',
  notas TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
