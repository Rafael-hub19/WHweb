-- =========================
-- Wooden House - MySQL Schema SIMPLIFICADO
-- BD: wooden_house
-- Versión: E-commerce (sin módulo de inventario completo)
-- =========================

CREATE DATABASE IF NOT EXISTS wooden_house
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE wooden_house;

-- =========================
-- Re-ejecución segura (borra tablas en orden correcto)
-- =========================
DROP TABLE IF EXISTS pagos;
DROP TABLE IF EXISTS detalle_pedido;
DROP TABLE IF EXISTS pedidos;

DROP TABLE IF EXISTS citas;
DROP TABLE IF EXISTS cotizaciones;

DROP TABLE IF EXISTS especificaciones_producto;
DROP TABLE IF EXISTS imagenes_producto;
DROP TABLE IF EXISTS productos;
DROP TABLE IF EXISTS categorias;

DROP TABLE IF EXISTS usuarios_personal;

-- =========================
-- 1) Personal interno (roles)
-- Auth real en Firebase Auth, aquí solo vínculo (firebase_uid) y rol
-- =========================
CREATE TABLE usuarios_personal (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firebase_uid VARCHAR(128) NOT NULL UNIQUE,
  nombre_completo VARCHAR(120) NOT NULL,
  correo VARCHAR(150) NOT NULL UNIQUE,
  rol ENUM('administrador','empleado') NOT NULL DEFAULT 'empleado',
  activo TINYINT(1) NOT NULL DEFAULT 1,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_rol (rol),
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 2) Catálogo
-- =========================
CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion TEXT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  
  INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE productos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  categoria_id INT NOT NULL,
  nombre VARCHAR(180) NOT NULL,
  descripcion TEXT NULL,
  precio_base DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  stock_disponible INT NOT NULL DEFAULT 0,  -- Stock simple
  etiqueta VARCHAR(40) NULL,  -- 'Nuevo', 'Más vendido', 'Oferta'
  activo TINYINT(1) NOT NULL DEFAULT 1,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_productos_categoria
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
    
  INDEX idx_categoria (categoria_id),
  INDEX idx_activo (activo),
  INDEX idx_etiqueta (etiqueta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE imagenes_producto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  url_imagen VARCHAR(350) NOT NULL,  -- URL Firebase Storage
  es_principal TINYINT(1) NOT NULL DEFAULT 0,
  orden INT NOT NULL DEFAULT 0,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_imagenes_producto
    FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE especificaciones_producto (
  id INT AUTO_INCREMENT PRIMARY KEY,
  producto_id INT NOT NULL,
  clave VARCHAR(80) NOT NULL,     -- 'dimensiones', 'material', 'acabado'
  valor VARCHAR(255) NOT NULL,

  CONSTRAINT fk_especificaciones_producto
    FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 3) Cotizaciones y Citas
-- =========================
CREATE TABLE cotizaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_cotizacion VARCHAR(30) NOT NULL UNIQUE,

  nombre_cliente VARCHAR(120) NOT NULL,
  correo_cliente VARCHAR(150) NOT NULL,
  telefono_cliente VARCHAR(30) NULL,

  tipo_mueble VARCHAR(80) NULL,
  descripcion_solicitud TEXT NOT NULL,
  tiene_medidas TINYINT(1) NOT NULL DEFAULT 0,
  medidas TEXT NULL,
  rango_presupuesto VARCHAR(60) NULL,
  requiere_instalacion TINYINT(1) NOT NULL DEFAULT 0,

  estado ENUM('nueva','en_revision','respondida','cerrada') NOT NULL DEFAULT 'nueva',
  
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_estado (estado),
  INDEX idx_correo (correo_cliente),
  INDEX idx_fecha (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE citas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_cita VARCHAR(30) NOT NULL UNIQUE,

  nombre_cliente VARCHAR(120) NOT NULL,
  correo_cliente VARCHAR(150) NOT NULL,
  telefono_cliente VARCHAR(30) NULL,

  direccion VARCHAR(255) NOT NULL,
  fecha_cita DATE NOT NULL,
  rango_horario VARCHAR(20) NULL,
  tipo ENUM('medicion','instalacion','otro') NOT NULL DEFAULT 'medicion',
  estado ENUM('nueva','confirmada','completada','cancelada') NOT NULL DEFAULT 'nueva',

  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_estado (estado),
  INDEX idx_fecha_cita (fecha_cita),
  INDEX idx_tipo (tipo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 4) Pedidos + detalle
-- =========================
CREATE TABLE pedidos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  numero_pedido VARCHAR(30) NOT NULL UNIQUE,
  token_seguimiento VARCHAR(32) NOT NULL UNIQUE,  -- Para tracking sin login

  nombre_cliente VARCHAR(120) NOT NULL,
  correo_cliente VARCHAR(150) NOT NULL,
  telefono_cliente VARCHAR(30) NULL,

  tipo_entrega ENUM('recoger','envio') NOT NULL DEFAULT 'envio',
  direccion_envio VARCHAR(255) NULL,

  incluye_instalacion TINYINT(1) NOT NULL DEFAULT 0,
  fecha_estimada DATE NULL,

  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  costo_envio DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  costo_instalacion DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  descuento DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10,2) NOT NULL DEFAULT 0.00,

  estado ENUM('pendiente','pagado','en_produccion','listo','entregado','cancelado')
    NOT NULL DEFAULT 'pendiente',

  notas VARCHAR(255) NULL,

  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_estado (estado),
  INDEX idx_correo (correo_cliente),
  INDEX idx_fecha_estimada (fecha_estimada),
  INDEX idx_fecha_creacion (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE detalle_pedido (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,
  producto_id INT NULL,  -- NULL si es personalizado
  nombre_producto VARCHAR(180) NOT NULL,
  precio_unitario DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  cantidad INT NOT NULL DEFAULT 1,
  total_linea DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_detalle_pedido_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    ON DELETE CASCADE 
    ON UPDATE CASCADE,

  CONSTRAINT fk_detalle_pedido_producto
    FOREIGN KEY (producto_id) REFERENCES productos(id)
    ON DELETE SET NULL 
    ON UPDATE CASCADE,
    
  INDEX idx_pedido (pedido_id),
  INDEX idx_producto (producto_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- 5) Pagos (sin datos de tarjeta)
-- =========================
CREATE TABLE pagos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  pedido_id INT NOT NULL,

  metodo ENUM('tarjeta','paypal') NOT NULL,
  proveedor ENUM('stripe','paypal') NOT NULL,
  id_transaccion_proveedor VARCHAR(120) NULL,

  estado ENUM('creado','aprobado','fallido','reembolsado') NOT NULL DEFAULT 'creado',
  monto DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  moneda VARCHAR(10) NOT NULL DEFAULT 'MXN',

  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_pagos_pedido
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id)
    ON DELETE CASCADE 
    ON UPDATE CASCADE,
    
  INDEX idx_pedido (pedido_id),
  INDEX idx_estado (estado),
  INDEX idx_proveedor (proveedor)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =========================
-- Constraints únicas
-- =========================

-- Solo 1 imagen principal por producto
CREATE UNIQUE INDEX uq_imagen_principal
ON imagenes_producto (producto_id, es_principal);

-- No repetir la misma clave de especificación en el mismo producto
CREATE UNIQUE INDEX uq_especificacion_clave
ON especificaciones_producto (producto_id, clave);
-- ================================================================
-- CAPACIDAD DE PRODUCCIÓN Y ENTREGAS
-- Controla cuántos pedidos/entregas pueden agendarse por semana
-- El admin configura esto desde el panel
-- ================================================================

CREATE TABLE IF NOT EXISTS capacidad_produccion (
  id INT AUTO_INCREMENT PRIMARY KEY,

  -- Semana representada como el lunes de esa semana
  semana_inicio DATE NOT NULL UNIQUE,

  -- Cuántos pedidos NUEVOS puede entrar a producción esa semana
  slots_produccion INT NOT NULL DEFAULT 3,

  -- Cuántas entregas/instalaciones pueden hacerse esa semana
  slots_entrega INT NOT NULL DEFAULT 5,

  -- Bloqueo total (vacaciones, cierre, etc.)
  bloqueado TINYINT(1) NOT NULL DEFAULT 0,
  motivo_bloqueo VARCHAR(150) NULL,

  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_semana (semana_inicio),
  INDEX idx_bloqueado (bloqueado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ================================================================
-- DÍAS BLOQUEADOS ESPECÍFICOS
-- Para días festivos, mantenimiento, etc.
-- ================================================================
CREATE TABLE IF NOT EXISTS dias_bloqueados (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fecha DATE NOT NULL UNIQUE,
  motivo VARCHAR(150) NOT NULL DEFAULT 'Día no hábil',
  fecha_creacion TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_fecha (fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
