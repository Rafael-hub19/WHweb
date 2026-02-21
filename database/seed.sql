USE wooden_house;

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

ALTER TABLE pagos AUTO_INCREMENT = 1;
ALTER TABLE detalle_pedido AUTO_INCREMENT = 1;
ALTER TABLE pedidos AUTO_INCREMENT = 1;
ALTER TABLE citas AUTO_INCREMENT = 1;
ALTER TABLE cotizaciones AUTO_INCREMENT = 1;
ALTER TABLE especificaciones_producto AUTO_INCREMENT = 1;
ALTER TABLE imagenes_producto AUTO_INCREMENT = 1;
ALTER TABLE productos AUTO_INCREMENT = 1;
ALTER TABLE categorias AUTO_INCREMENT = 1;
ALTER TABLE usuarios_personal AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

INSERT INTO usuarios_personal (firebase_uid, nombre_completo, correo, rol, activo) VALUES
('Kkpj4NaAHPZfLOCVEpD15jujIeh2', 'Rafael Avila', 'admin@woodenhouse.com', 'administrador', 1),
('3BH54ZXy4dRsehurZX8eSgg5jbV2', 'Juan Pérez', 'empleado@woodenhouse.com', 'empleado', 1);

INSERT INTO categorias (nombre, descripcion, activo) VALUES
('Muebles de Baño', 'Muebles completos para baño con diversas opciones de acabados', 1),
('Accesorios de Baño', 'Accesorios complementarios para baño', 1),
('Servicios', 'Servicios de medición e instalación profesional', 1);

INSERT INTO productos (categoria_id, nombre, descripcion, precio_base, stock_disponible, etiqueta, activo) VALUES
(1, 'Mueble Milano', 'Mueble de baño moderno con diseño minimalista. Acabado nogal de alta calidad. Incluye lavabo de cerámica. Dimensiones: 120x60x45 cm. Fabricación bajo pedido con tiempo de entrega de 10-15 días hábiles.', 8500.00, 5, 'Más vendido', 1),
(1, 'Mueble Venecia', 'Mueble clásico con acabado en madera natural barnizada. Lavabo de mármol incluido. Diseño elegante con 2 cajones de cierre suave y espacio inferior de almacenamiento. Dimensiones: 90x50x65 cm.', 12800.00, 3, 'Popular', 1),
(1, 'Mueble Toscana', 'Mueble rústico de madera de pino con acabado natural. Ideal para baños amplios. Doble lavabo de cerámica. 4 cajones espaciosos con rieles telescópicos. Dimensiones: 100x55x70 cm.', 15200.00, 2, NULL, 1),
(1, 'Mueble Oslo', 'Diseño minimalista escandinavo. MDF laqueado blanco mate. Lavabo integrado. Perfecto para espacios pequeños. Sistema push-open en cajones. Dimensiones: 70x40x55 cm.', 7900.00, 8, 'Nuevo', 1),
(1, 'Mueble París', 'Mueble elegante de madera de cedro con barniz premium. Lavabo sobre cubierta de mármol sintético. 3 cajones con herrajes de lujo. Dimensiones: 85x48x62 cm.', 11500.00, 4, NULL, 1),
(1, 'Mueble Tokyo', 'Diseño compacto y funcional. MDF gris mate con toques cromados. Lavabo cerámico pequeño. Ideal para baños de visitas. Dimensiones: 60x35x50 cm.', 6200.00, 10, 'Oferta', 1),
(2, 'Espejo con Marco de Madera', 'Espejo de 80x60cm con marco de madera nogal a juego con muebles Milano y París.', 1200.00, 15, NULL, 1),
(2, 'Organizador de Pared', 'Estante flotante de madera para accesorios de baño. 60x20x15 cm.', 850.00, 20, NULL, 1),
(3, 'Servicio de Instalación Básica', 'Incluye: instalación del mueble, conexión de lavabo, ajustes finales. No incluye trabajo de plomería ni electricidad.', 800.00, 999, NULL, 1),
(3, 'Servicio de Instalación Completa', 'Incluye: instalación del mueble, plomería completa, conexiones eléctricas, acabados finales, limpieza del área.', 1500.00, 999, NULL, 1);

INSERT IGNORE INTO imagenes_producto (producto_id, url_imagen, es_principal, orden) VALUES
(1, 'https://firebasestorage.googleapis.com/v0/b/wooden-house/milano-principal.jpg', 1, 0),
(1, 'https://firebasestorage.googleapis.com/v0/b/wooden-house/milano-lateral.jpg', 0, 1),
(1, 'https://firebasestorage.googleapis.com/v0/b/wooden-house/milano-detalle.jpg', 0, 2),
(2, 'https://firebasestorage.googleapis.com/v0/b/wooden-house/venecia-principal.jpg', 1, 0),
(2, 'https://firebasestorage.googleapis.com/v0/b/wooden-house/venecia-lateral.jpg', 0, 1),
(3, 'https://firebasestorage.googleapis.com/v0/b/wooden-house/toscana-principal.jpg', 1, 0),
(4, 'https://firebasestorage.googleapis.com/v0/b/wooden-house/oslo-principal.jpg', 1, 0),
(5, 'https://firebasestorage.googleapis.com/v0/b/wooden-house/paris-principal.jpg', 1, 0),
(6, 'https://firebasestorage.googleapis.com/v0/b/wooden-house/tokyo-principal.jpg', 1, 0),
(7, 'https://firebasestorage.googleapis.com/v0/b/wooden-house/espejo-principal.jpg', 1, 0),
(8, 'https://firebasestorage.googleapis.com/v0/b/wooden-house/organizador-principal.jpg', 1, 0);

INSERT INTO especificaciones_producto (producto_id, clave, valor) VALUES
(1, 'dimensiones', '120 x 60 x 45 cm'),
(1, 'material', 'MDF de alta densidad'),
(1, 'acabado', 'Laminado nogal mate'),
(1, 'lavabo', 'Cerámica blanca incluido'),
(1, 'cajones', '2 cajones con cierre suave'),
(1, 'peso', '35 kg aproximadamente'),
(2, 'dimensiones', '90 x 50 x 65 cm'),
(2, 'material', 'Madera natural'),
(2, 'acabado', 'Barniz transparente satinado'),
(2, 'lavabo', 'Mármol natural incluido'),
(2, 'cajones', '2 cajones + 1 compartimento'),
(2, 'peso', '42 kg aproximadamente'),
(3, 'dimensiones', '100 x 55 x 70 cm'),
(3, 'material', 'Madera de pino'),
(3, 'acabado', 'Natural con protección'),
(3, 'lavabo', 'Doble lavabo cerámica'),
(3, 'cajones', '4 cajones con rieles telescópicos'),
(3, 'peso', '55 kg aproximadamente'),
(4, 'dimensiones', '70 x 40 x 55 cm'),
(4, 'material', 'MDF laqueado'),
(4, 'acabado', 'Blanco mate'),
(4, 'lavabo', 'Integrado de resina'),
(4, 'cajones', '2 cajones sistema push-open'),
(4, 'peso', '28 kg aproximadamente'),
(5, 'dimensiones', '85 x 48 x 62 cm'),
(5, 'material', 'Madera de cedro'),
(5, 'acabado', 'Barniz premium brillante'),
(5, 'lavabo', 'Sobre cubierta mármol sintético'),
(5, 'cajones', '3 cajones con herrajes premium'),
(5, 'peso', '38 kg aproximadamente'),
(6, 'dimensiones', '60 x 35 x 50 cm'),
(6, 'material', 'MDF'),
(6, 'acabado', 'Gris mate con detalles cromados'),
(6, 'lavabo', 'Cerámica compacta'),
(6, 'cajones', '1 cajón + estante'),
(6, 'peso', '22 kg aproximadamente'),
(7, 'dimensiones', '80 x 60 x 3 cm'),
(7, 'material', 'Vidrio + marco madera'),
(7, 'acabado', 'Nogal mate'),
(7, 'peso', '8 kg aproximadamente'),
(8, 'dimensiones', '60 x 20 x 15 cm'),
(8, 'material', 'Madera MDF'),
(8, 'acabado', 'Nogal mate'),
(8, 'peso', '3 kg aproximadamente');

INSERT INTO cotizaciones (numero_cotizacion, nombre_cliente, correo_cliente, telefono_cliente, tipo_mueble, descripcion_solicitud, tiene_medidas, medidas, rango_presupuesto, requiere_instalacion, estado) VALUES
('COT-2026-000001', 'Ana María López', 'ana.lopez@email.com', '33-1234-5678', 'Mueble de baño doble', 'Necesito un mueble para dos lavabos, estilo moderno, para baño principal de 3x2.5 metros.', 1, 'Espacio disponible: 180cm ancho x 60cm profundidad', '$15,000 - $20,000', 1, 'nueva'),
('COT-2026-000002', 'Roberto Sánchez', 'roberto.s@email.com', '33-8765-4321', 'Mueble esquinero', 'Busco aprovechar un espacio en esquina del baño de visitas.', 0, NULL, '$8,000 - $12,000', 0, 'en_revision');

INSERT INTO citas (numero_cita, nombre_cliente, correo_cliente, telefono_cliente, direccion, fecha_cita, rango_horario, tipo, estado) VALUES
('CIT-2026-000001', 'Laura Fernández', 'laura.f@email.com', '33-5555-1111', 'Calle Reforma 456, Col. Americana, Guadalajara, Jal.', '2026-03-15', '10:00 AM - 12:00 PM', 'medicion', 'confirmada'),
('CIT-2026-000002', 'Carlos Mendoza', 'carlos.m@email.com', '33-6666-2222', 'Av. Patria 789, Col. Jardines del Valle, Zapopan, Jal.', '2026-03-20', '2:00 PM - 4:00 PM', 'instalacion', 'nueva');

INSERT INTO pedidos (numero_pedido, token_seguimiento, nombre_cliente, correo_cliente, telefono_cliente, tipo_entrega, direccion_envio, incluye_instalacion, fecha_estimada, subtotal, costo_envio, costo_instalacion, descuento, total, estado) VALUES
('WH-2026-000001', MD5(CONCAT('WH-2026-000001', NOW())), 'Juan Pérez García', 'juan.perez@email.com', '33-1111-2222', 'envio', 'Calle Libertad 123, Col. Centro, Guadalajara, Jal.', 1, '2026-03-25', 8500.00, 300.00, 800.00, 0.00, 9600.00, 'pagado'),
('WH-2026-000002', MD5(CONCAT('WH-2026-000002', NOW())), 'María González', 'maria.g@email.com', '33-3333-4444', 'recoger', NULL, 0, '2026-03-18', 12800.00, 0.00, 0.00, 0.00, 12800.00, 'en_produccion'),
('WH-2026-000003', MD5(CONCAT('WH-2026-000003', NOW())), 'Pedro Ramírez', 'pedro.r@email.com', '33-5555-6666', 'envio', 'Av. Americas 567, Col. Providencia, Guadalajara, Jal.', 1, '2026-04-05', 7400.00, 250.00, 1500.00, 200.00, 8950.00, 'pendiente');

INSERT INTO detalle_pedido (pedido_id, producto_id, nombre_producto, precio_unitario, cantidad, total_linea) VALUES
(1, 1, 'Mueble Milano', 8500.00, 1, 8500.00),
(2, 2, 'Mueble Venecia', 12800.00, 1, 12800.00),
(3, 6, 'Mueble Tokyo', 6200.00, 1, 6200.00),
(3, 7, 'Espejo con Marco de Madera', 1200.00, 1, 1200.00);

INSERT INTO pagos (pedido_id, metodo, id_transaccion_proveedor, estado, monto, moneda) VALUES
(1, 'tarjeta', 'pi_3ABC123XYZ456', 'aprobado', 9600.00, 'MXN'),
(2, 'paypal', NULL, 'pendiente', 12800.00, 'MXN');

SELECT 'Base de datos cargada exitosamente' AS Mensaje;
SELECT COUNT(*) AS total_productos FROM productos;
SELECT COUNT(*) AS total_usuarios FROM usuarios_personal;
SELECT COUNT(*) AS total_pedidos FROM pedidos;
-- ================================================================
-- Capacidad de producción: próximas 16 semanas
-- Ajusta slots_produccion y slots_entrega según tu taller
-- ================================================================
INSERT IGNORE INTO capacidad_produccion (semana_inicio, slots_produccion, slots_entrega, bloqueado) VALUES
-- Calcular desde hoy al lunes de cada semana
-- (en producción esto se genera dinámicamente con el script de admin)
('2026-02-16', 3, 5, 0),
('2026-02-23', 3, 5, 0),
('2026-03-02', 3, 5, 0),
('2026-03-09', 3, 5, 0),
('2026-03-16', 3, 4, 0),
('2026-03-23', 3, 5, 0),
('2026-03-30', 2, 3, 0),
('2026-04-06', 0, 0, 1),   -- Semana Santa (bloqueada)
('2026-04-13', 3, 5, 0),
('2026-04-20', 3, 5, 0),
('2026-04-27', 3, 5, 0),
('2026-05-04', 3, 5, 0),
('2026-05-11', 3, 5, 0),
('2026-05-18', 3, 5, 0),
('2026-05-25', 3, 5, 0),
('2026-06-01', 3, 5, 0);

-- Días festivos oficiales México 2026
INSERT IGNORE INTO dias_bloqueados (fecha, motivo) VALUES
('2026-02-02', 'Día de la Constitución (lunes)'),
('2026-03-16', 'Natalicio de Benito Juárez (lunes)'),
('2026-04-02', 'Jueves Santo'),
('2026-04-03', 'Viernes Santo'),
('2026-05-01', 'Día del Trabajo'),
('2026-09-16', 'Día de la Independencia'),
('2026-11-02', 'Día de Muertos'),
('2026-11-16', 'Revolución Mexicana (lunes)'),
('2026-12-25', 'Navidad');