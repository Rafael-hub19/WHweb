USE wooden_house;

SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;
SET CHARACTER SET utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DELETE FROM pagos;
DELETE FROM detalle_pedido;
DELETE FROM pedidos;
DELETE FROM citas;
DELETE FROM cotizaciones;
DELETE FROM especificaciones_producto;
DELETE FROM imagenes_producto;
DELETE FROM productos;
DELETE FROM categorias;
DELETE FROM usuarios_personal;

ALTER TABLE pagos                      AUTO_INCREMENT = 1;
ALTER TABLE detalle_pedido             AUTO_INCREMENT = 1;
ALTER TABLE pedidos                    AUTO_INCREMENT = 1;
ALTER TABLE citas                      AUTO_INCREMENT = 1;
ALTER TABLE cotizaciones               AUTO_INCREMENT = 1;
ALTER TABLE especificaciones_producto  AUTO_INCREMENT = 1;
ALTER TABLE imagenes_producto          AUTO_INCREMENT = 1;
ALTER TABLE productos                  AUTO_INCREMENT = 1;
ALTER TABLE categorias                 AUTO_INCREMENT = 1;
ALTER TABLE usuarios_personal          AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- ================================================================
-- USUARIOS
-- ================================================================
INSERT INTO usuarios_personal (firebase_uid, nombre_completo, correo, rol, activo) VALUES
('Kkpj4NaAHPZfLOCVEpD15jujIeh2', 'Rafael Avila', 'admin@woodenhouse.com',    'administrador', 1),
('3BH54ZXy4dRsehurZX8eSgg5jbV2', 'Juan Perez',   'empleado@woodenhouse.com', 'empleado',      1);

-- ================================================================
-- CATEGORIAS
-- id 1 = A Piso  |  id 2 = Flotados
-- ================================================================
INSERT INTO categorias (nombre, descripcion, activo) VALUES
('A Piso',   'Muebles de bano con instalacion a piso', 1),
('Flotados', 'Muebles de bano suspendidos o flotantes', 1);

-- ================================================================
-- PRODUCTOS (10 modelos reales)
-- SIN imagenes — se suben desde el panel administrador
-- id: Sevilla=1, Singapur=2, Roma=3, Edinburgo=4, Sydney=5,
--     Palermo=6, Budapest=7, Quebec=8, Toronto=9, Amsterdam=10
-- ================================================================
INSERT INTO productos
  (categoria_id, nombre, descripcion, precio_base, stock_disponible, etiqueta, activo)
VALUES
(1, 'Modelo Sevilla',
   'Mueble de bano a piso en combinacion nogal y blanco. Incluye ovalin ceramico ovalado, monomando cuadrado cromado, cespol de PBC y contra canasta. Fabricacion bajo pedido.',
   4900.00, 999, 'Popular', 1),

(1, 'Modelo Singapur',
   'Mueble de bano a piso con cajones amplios y acabado nogal natural. Monomando cuadrado negro cromado. Niche inferior abierto. Fabricacion bajo pedido.',
   4800.00, 999, NULL, 1),

(2, 'Modelo Roma',
   'Mueble flotado en acabado gris antracita. Diseno minimalista con 2 puertas y niche inferior. Incluye ovalin rectangular y monomando cromado. Fabricacion bajo pedido.',
   3900.00, 999, NULL, 1),

(2, 'Modelo Edinburgo',
   'Mueble flotado en acabado nogal natural con cajon corrido y niche inferior. Espejo LED/Touch rectangular disponible como accesorio opcional. Fabricacion bajo pedido.',
   3200.00, 999, 'Nuevo', 1),

(2, 'Modelo Sydney',
   'Mueble flotado de 120 cm en combinacion blanco y nogal. Cajon amplio con jaladeras lineales. Ideal para banos medianos y grandes. Fabricacion bajo pedido.',
   5900.00, 999, 'Mas vendido', 1),

(2, 'Modelo Palermo',
   'Mueble flotado de 120 cm con frentes en nogal natural y 3 puertas. Diseno rustico-contemporaneo con niche inferior corrido. Fabricacion bajo pedido.',
   6100.00, 999, NULL, 1),

(2, 'Modelo Budapest',
   'Mueble flotado compacto con acabado nogal oscuro. Ovalin redondo negro de resina. Espejo redondo LED/Touch disponible como accesorio opcional. Fabricacion bajo pedido.',
   3100.00, 999, NULL, 1),

(2, 'Modelo Quebec',
   'Mueble flotado con marco negro y cajon en nogal. Diseno bicolor moderno. Espejo redondo LED/Touch disponible como accesorio opcional. Fabricacion bajo pedido.',
   3900.00, 999, NULL, 1),

(2, 'Modelo Toronto',
   'Mueble flotado de 190 cm ideal para banos grandes. Cajon corrido en combinacion blanco y nogal. Fabricacion bajo pedido.',
   5950.00, 999, NULL, 1),

(2, 'Modelo Amsterdam',
   'Mueble flotado en acabado nogal con cajones amplios y niche inferior. Espejo rectangular LED/Touch disponible como accesorio opcional. Fabricacion bajo pedido.',
   3900.00, 999, NULL, 1);

-- imagenes_producto: VACIA intencionalmente
-- Se llenan desde el panel administrador (Firebase Storage)

-- ================================================================
-- ESPECIFICACIONES
-- ================================================================
INSERT INTO especificaciones_producto (producto_id, clave, valor) VALUES
-- SEVILLA
(1,'Tipo de instalacion','A piso'),
(1,'Largo','70 cm'),(1,'Alto','85 cm'),(1,'Fondo','50 cm'),
(1,'Ovalin','Ceramico ovalado 60x35 cm'),
(1,'Monomando','Cuadrado 30 cm cromado'),
(1,'Incluye','Cespol de PBC - Contra canasta'),
(1,'Espejo opcional','No incluye'),

-- SINGAPUR
(2,'Tipo de instalacion','A piso'),
(2,'Largo','80 cm'),(2,'Alto','85 cm'),(2,'Fondo','50 cm'),
(2,'Ovalin','Ceramico ovalado 60x40 cm'),
(2,'Monomando','Cuadrado negro 30 cm cromado'),
(2,'Incluye','Cespol de PBC - Contra canasta'),
(2,'Espejo opcional','No incluye'),

-- ROMA
(3,'Tipo de instalacion','Flotado'),
(3,'Largo','80 cm'),(3,'Alto','55 cm'),(3,'Fondo','50 cm'),
(3,'Ovalin','Rectangular 60x40 cm'),
(3,'Monomando','30 cm cromado'),
(3,'Incluye','Cespol de PBC - Contra canasta'),
(3,'Espejo opcional','No incluye'),

-- EDINBURGO
(4,'Tipo de instalacion','Flotado'),
(4,'Largo','80 cm'),(4,'Alto','55 cm'),(4,'Fondo','50 cm'),
(4,'Ovalin','Redondo 32 cm'),
(4,'Monomando','30 cm cromado'),
(4,'Incluye','Cespol de PBC - Contra canasta'),
(4,'Espejo opcional','Rectangular 50x70 cm - LED/Touch 4mm - 3 intensidades - $1,300'),

-- SYDNEY
(5,'Tipo de instalacion','Flotado'),
(5,'Largo','120 cm'),(5,'Alto','50 cm'),(5,'Fondo','50 cm'),
(5,'Ovalin','Rectangular 60x40 cm'),
(5,'Monomando','30 cm cromado'),
(5,'Incluye','Cespol de PBC - Contra canasta'),
(5,'Espejo opcional','No incluye'),

-- PALERMO
(6,'Tipo de instalacion','Flotado'),
(6,'Largo','120 cm'),(6,'Alto','55 cm'),(6,'Fondo','50 cm'),
(6,'Ovalin','Rectangular 60x40 cm'),
(6,'Monomando','30 cm cromado'),
(6,'Incluye','Cespol de PBC - Contra canasta'),
(6,'Espejo opcional','No incluye'),

-- BUDAPEST
(7,'Tipo de instalacion','Flotado'),
(7,'Largo','60 cm'),(7,'Alto','42 cm'),(7,'Fondo','42 cm'),
(7,'Ovalin','Redondo negro de resina 32 cm'),
(7,'Monomando','30 cm negro'),
(7,'Incluye','Cespol de PBC - Contra canasta'),
(7,'Espejo opcional','Redondo 90 cm - LED/Touch 6mm - 3 intensidades - $2,800'),

-- QUEBEC
(8,'Tipo de instalacion','Flotado'),
(8,'Largo','90 cm'),(8,'Alto','45 cm'),(8,'Fondo','50 cm'),
(8,'Ovalin','Redondo 40 cm'),
(8,'Monomando','20 cm cromado'),
(8,'Incluye','Cespol de PBC - Contra canasta'),
(8,'Espejo opcional','Redondo 90 cm - LED/Touch 6mm - 3 intensidades - $2,800'),

-- TORONTO
(9,'Tipo de instalacion','Flotado'),
(9,'Largo','190 cm'),(9,'Alto','50 cm'),(9,'Fondo','50 cm'),
(9,'Ovalin','Rectangular 60x38 cm'),
(9,'Monomando','30 cm cromado'),
(9,'Incluye','Cespol de PBC - Contra canasta'),
(9,'Espejo opcional','No incluye'),

-- AMSTERDAM
(10,'Tipo de instalacion','Flotado'),
(10,'Largo','80 cm'),(10,'Alto','55 cm'),(10,'Fondo','50 cm'),
(10,'Ovalin','Redondo 40 cm'),
(10,'Monomando','20 cm cromado'),
(10,'Incluye','Cespol de PBC - Contra canasta'),
(10,'Espejo opcional','Rectangular 50x70 cm - LED/Touch 4mm - 3 intensidades - $1,300');

-- ================================================================
-- DATOS DE PRUEBA (pedidos, citas, cotizaciones)
-- ================================================================
INSERT INTO cotizaciones
  (numero_cotizacion, nombre_cliente, correo_cliente, telefono_cliente,
   modelo_mueble, descripcion_solicitud, tiene_medidas, rango_presupuesto,
   requiere_instalacion, estado)
VALUES
('COT-2026-000001','Ana Maria Lopez','ana.lopez@email.com','33-1234-5678',
 'Flotado doble','Bano principal estilo moderno.',1,'$5,000 - $8,000',1,'nueva'),
('COT-2026-000002','Roberto Sanchez','roberto.s@email.com','33-8765-4321',
 'A piso','Modelo Sevilla o similar.',0,'$4,000 - $6,000',0,'en_revision');

INSERT INTO citas
  (numero_cita, nombre_cliente, correo_cliente, telefono_cliente,
   direccion, fecha_cita, rango_horario, tipo, estado)
VALUES
('CIT-2026-000001','Laura Fernandez','laura.f@email.com','33-5555-1111',
 'Calle Reforma 456 Col. Americana Guadalajara',
 '2026-03-15','10:00 AM - 12:00 PM','medicion','confirmada'),
('CIT-2026-000002','Carlos Mendoza','carlos.m@email.com','33-6666-2222',
 'Av. Patria 789 Col. Jardines del Valle Zapopan',
 '2026-03-20','2:00 PM - 4:00 PM','instalacion','nueva');

INSERT INTO pedidos
  (numero_pedido, token_seguimiento, nombre_cliente, correo_cliente,
   tipo_entrega, incluye_instalacion, fecha_estimada,
   subtotal, costo_envio, costo_instalacion, descuento, total, estado)
VALUES
('WH-2026-000001', MD5(CONCAT('WH-2026-000001',NOW())),
 'Juan Perez Garcia','juan.perez@email.com',
 'recoger', 0, '2026-03-25',
 4900.00, 0.00, 0.00, 0.00, 4900.00, 'pagado'),

('WH-2026-000002', MD5(CONCAT('WH-2026-000002',NOW())),
 'Maria Gonzalez','maria.g@email.com',
 'envio', 1, '2026-03-28',
 5900.00, 300.00, 800.00, 0.00, 7000.00, 'en_produccion');

INSERT INTO detalle_pedido
  (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, total_linea)
VALUES
(1, 1, 'Modelo Sevilla', 4900.00, 1, 4900.00),
(2, 5, 'Modelo Sydney',  5900.00, 1, 5900.00);

INSERT INTO pagos
  (pedido_id, metodo, id_transaccion_proveedor, estado, monto, moneda)
VALUES
(1, 'paypal', 'PAYPAL-TEST-001', 'aprobado', 4900.00, 'MXN'),
(2, 'stripe', NULL,              'pendiente', 7000.00, 'MXN');

INSERT IGNORE INTO capacidad_produccion
  (semana_inicio, slots_produccion, slots_entrega, bloqueado)
VALUES
('2026-02-23',999,999,0),('2026-03-02',999,999,0),('2026-03-09',999,999,0),
('2026-03-16',999,999,0),('2026-03-23',999,999,0),('2026-03-30',999,999,0),
('2026-04-06',  0,  0,1),
('2026-04-13',999,999,0),('2026-04-20',999,999,0),('2026-04-27',999,999,0),
('2026-05-04',999,999,0),('2026-05-11',999,999,0);

INSERT IGNORE INTO dias_bloqueados (fecha, motivo) VALUES
('2026-03-16','Natalicio de Benito Juarez'),
('2026-04-02','Jueves Santo'),
('2026-04-03','Viernes Santo'),
('2026-05-01','Dia del Trabajo'),
('2026-09-16','Dia de la Independencia'),
('2026-12-25','Navidad');

-- Verificacion final
SELECT 'Seed cargado correctamente' AS Mensaje;
SELECT COUNT(*) AS total_productos     FROM productos;
SELECT COUNT(*) AS total_imagenes      FROM imagenes_producto;   -- debe ser 0
SELECT COUNT(*) AS total_specs         FROM especificaciones_producto;
SELECT COUNT(*) AS total_usuarios      FROM usuarios_personal;