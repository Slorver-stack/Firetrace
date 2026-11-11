-- ==============================================================================
-- PROYECTO: FIRETRACE - NASA Space Apps Challenge 2026
-- BASE DE DATOS: firetrace_db
-- MOTOR: MySQL / MariaDB (Optimizado para XAMPP / MariaDB 10.4+)
-- DESCRIPCIÓN: Estructura relacional completa diseñada según las especificaciones
--              del documento de diseño de la plataforma FireTrace.
-- ==============================================================================

CREATE DATABASE IF NOT EXISTS `firetrace_db` 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

USE `firetrace_db`;

-- Desactivar temporalmente revisión de claves foráneas para recreación limpia
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `solicitudes_voluntariado`;
DROP TABLE IF EXISTS `instituciones_aliadas`;
DROP TABLE IF EXISTS `historias_biodiversidad`;
DROP TABLE IF EXISTS `bitacora_informes`;
DROP TABLE IF EXISTS `correos_notificaciones_log`;
DROP TABLE IF EXISTS `movilizacion_respuesta`;
DROP TABLE IF EXISTS `alertas_notificaciones`;
DROP TABLE IF EXISTS `reportes_ciudadanos`;
DROP TABLE IF EXISTS `vigilancia_reactivaciones`;
DROP TABLE IF EXISTS `rutas_y_peligros`;
DROP TABLE IF EXISTS `recursos_cercanos`;
DROP TABLE IF EXISTS `condiciones_meteorologicas`;
DROP TABLE IF EXISTS `evolucion_incendio`;
DROP TABLE IF EXISTS `focos_calor`;
DROP TABLE IF EXISTS `incendios`;
DROP TABLE IF EXISTS `zonas_interes`;
DROP TABLE IF EXISTS `municipios`;
DROP TABLE IF EXISTS `departamentos`;
DROP TABLE IF EXISTS `voluntarios_perfil`;
DROP TABLE IF EXISTS `usuarios`;
DROP TABLE IF EXISTS `estadisticas_historicas`;

SET FOREIGN_KEY_CHECKS = 1;

-- ==============================================================================
-- 1. MÓDULO DE USUARIOS, ROLES Y ACCESOS (FireTrace Respuesta y Gestión)
-- ==============================================================================

CREATE TABLE `usuarios` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre_completo` VARCHAR(150) NOT NULL,
    `email` VARCHAR(120) NOT NULL UNIQUE,
    `usuario` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL COMMENT 'Almacena hash seguro o credencial demostración (12345)',
    `telefono` VARCHAR(25) NULL,
    `rol` ENUM('bombero_respuesta', 'voluntario', 'ciudadano', 'administrador') NOT NULL DEFAULT 'ciudadano',
    `latitud_actual` DECIMAL(10, 7) NULL COMMENT 'Ubicación voluntaria para alertas cercanas',
    `longitud_actual` DECIMAL(10, 7) NULL,
    `permiso_ubicacion` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 si autorizó compartir ubicación',
    `zona_seguimiento_id` INT NULL COMMENT 'Zona preferida de monitoreo configurada por el usuario',
    `activo` TINYINT(1) NOT NULL DEFAULT 1,
    `creado_el` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `actualizado_el` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_usuario_rol` (`rol`),
    INDEX `idx_usuario_login` (`usuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `voluntarios_perfil` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NOT NULL UNIQUE,
    `capacitacion_completada` TINYINT(1) NOT NULL DEFAULT 0,
    `codigos_comunicacion_aprobados` TINYINT(1) NOT NULL DEFAULT 0,
    `senales_seguridad_aprobadas` TINYINT(1) NOT NULL DEFAULT 0,
    `habilitado_por_coordinador` TINYINT(1) NOT NULL DEFAULT 0,
    `coordinador_aprobador_id` INT NULL,
    `fecha_habilitacion` DATETIME NULL,
    `observaciones_medicas_habilidades` TEXT NULL,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`coordinador_aprobador_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 2. MÓDULO TERRITORIAL Y GEOGRÁFICO (Bolivia / Cochabamba / Áreas Protegidas)
-- ==============================================================================

CREATE TABLE `departamentos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(60) NOT NULL UNIQUE,
    `codigo_iso` VARCHAR(10) NOT NULL,
    `latitud_centro` DECIMAL(10, 7) NOT NULL,
    `longitud_centro` DECIMAL(10, 7) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `municipios` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `departamento_id` INT NOT NULL,
    `nombre` VARCHAR(100) NOT NULL,
    `latitud_centro` DECIMAL(10, 7) NULL,
    `longitud_centro` DECIMAL(10, 7) NULL,
    FOREIGN KEY (`departamento_id`) REFERENCES `departamentos`(`id`) ON DELETE CASCADE,
    INDEX `idx_municipio_depto` (`departamento_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `zonas_interes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `municipio_id` INT NOT NULL,
    `nombre` VARCHAR(120) NOT NULL COMMENT 'Ej: Parque Nacional Tunari, Laguna Taquiña, etc.',
    `tipo_zona` ENUM('parque_nacional', 'reserva_forestal', 'area_protegida', 'comunidad_rural', 'valle_agricola', 'zona_urbana_periferica') NOT NULL,
    `nivel_riesgo_estimado` ENUM('bajo', 'medio', 'alto', 'critico') NOT NULL DEFAULT 'medio',
    `es_area_protegida` TINYINT(1) NOT NULL DEFAULT 0,
    `superficie_total_ha` DECIMAL(12, 2) NULL,
    `latitud` DECIMAL(10, 7) NOT NULL,
    `longitud` DECIMAL(10, 7) NOT NULL,
    `radio_cobertura_km` DECIMAL(8, 2) NOT NULL DEFAULT 5.0,
    `descripcion` TEXT NULL,
    `activa` TINYINT(1) NOT NULL DEFAULT 1,
    FOREIGN KEY (`municipio_id`) REFERENCES `municipios`(`id`) ON DELETE CASCADE,
    INDEX `idx_zona_riesgo` (`nivel_riesgo_estimado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 3. MÓDULO PRINCIPAL DE INCENDIOS (Dashboard Activo, Histórico y En Vivo)
-- ==============================================================================

CREATE TABLE `incendios` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `codigo_incendio` VARCHAR(30) NOT NULL UNIQUE COMMENT 'Ej: INC-CBB-2026-001',
    `nombre` VARCHAR(150) NOT NULL COMMENT 'Ej: Incendio Serranía Tunari Norte',
    `zona_id` INT NOT NULL,
    `municipio_id` INT NOT NULL,
    `departamento_id` INT NOT NULL,
    `latitud` DECIMAL(10, 7) NOT NULL,
    `longitud` DECIMAL(10, 7) NOT NULL,
    `fecha_inicio` DATETIME NOT NULL,
    `ultima_actualizacion` DATETIME NOT NULL,
    `fecha_controlado` DATETIME NULL,
    `fecha_extinguido` DATETIME NULL,
    `hectareas_afectadas` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `nivel_riesgo` ENUM('bajo', 'medio', 'alto', 'critico') NOT NULL DEFAULT 'alto',
    `estado` ENUM('activo', 'bajo_seguimiento', 'controlado', 'extinguido') NOT NULL DEFAULT 'activo',
    `es_seguimiento_en_vivo` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Activa interfaz Dark Mode de Incendio en Vivo',
    `alerta_critica` TINYINT(1) NOT NULL DEFAULT 0 COMMENT 'Despliega cintillo ALERTA CRITICA',
    `fuente_informacion` VARCHAR(150) NOT NULL DEFAULT 'Aqua MODIS / VIIRS / Reporte Técnico SAR',
    `perimetro_geojson` LONGTEXT NULL COMMENT 'Geometría del área quemada para representación poligonal',
    `resumen_situacion` TEXT NULL,
    `creado_el` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`zona_id`) REFERENCES `zonas_interes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`municipio_id`) REFERENCES `municipios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`departamento_id`) REFERENCES `departamentos`(`id`) ON DELETE CASCADE,
    INDEX `idx_incendios_estado` (`estado`),
    INDEX `idx_incendios_vivo` (`es_seguimiento_en_vivo`),
    INDEX `idx_incendios_fecha` (`fecha_inicio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 4. FOCOS DE CALOR Y DATOS SATELITALES (NASA MODIS / VIIRS)
-- ==============================================================================

CREATE TABLE `focos_calor` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `incendio_id` INT NULL COMMENT 'Vinculado a un incendio confirmado o NULL si es foco aislado',
    `zona_id` INT NULL,
    `satelite_instrumento` ENUM('Aqua MODIS', 'Terra MODIS', 'Suomi NPP VIIRS', 'NOAA-20 VIIRS', 'NOAA-21 VIIRS') NOT NULL,
    `latitud` DECIMAL(10, 7) NOT NULL,
    `longitud` DECIMAL(10, 7) NOT NULL,
    `brillo_temperatura_k` DECIMAL(7, 2) NOT NULL COMMENT 'Brightness temperature en Kelvin (ej: 342.5 K)',
    `potencia_radiativa_frp_mw` DECIMAL(8, 2) NULL COMMENT 'Fire Radiative Power en Megawatts',
    `nivel_confianza` VARCHAR(20) NOT NULL COMMENT 'nominal, high, low o porcentaje 0-100%',
    `fecha_hora_adquisicion` DATETIME NOT NULL,
    `es_deteccion_repetida` TINYINT(1) NOT NULL DEFAULT 0,
    `creado_el` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`incendio_id`) REFERENCES `incendios`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`zona_id`) REFERENCES `zonas_interes`(`id`) ON DELETE SET NULL,
    INDEX `idx_focos_fecha` (`fecha_hora_adquisicion`),
    INDEX `idx_focos_satelite` (`satelite_instrumento`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 5. EVOLUCIÓN TEMPORAL DEL INCENDIO (Gráficos del Dashboard)
-- ==============================================================================

CREATE TABLE `evolucion_incendio` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `incendio_id` INT NOT NULL,
    `fecha_hora_registro` DATETIME NOT NULL,
    `hectareas_acumuladas` DECIMAL(10, 2) NOT NULL,
    `focos_calor_detectados` INT NOT NULL DEFAULT 0,
    `nivel_riesgo_momento` ENUM('bajo', 'medio', 'alto', 'critico') NOT NULL,
    `observaciones` VARCHAR(255) NULL,
    FOREIGN KEY (`incendio_id`) REFERENCES `incendios`(`id`) ON DELETE CASCADE,
    INDEX `idx_evolucion_tiempo` (`incendio_id`, `fecha_hora_registro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 6. CONDICIONES METEOROLÓGICAS (Panel de Condiciones Actuales & Pronóstico)
-- ==============================================================================

CREATE TABLE `condiciones_meteorologicas` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `incendio_id` INT NULL,
    `zona_id` INT NOT NULL,
    `fecha_hora_registro` DATETIME NOT NULL,
    `temperatura_c` DECIMAL(5, 2) NOT NULL COMMENT 'Ej: 32.00 °C',
    `humedad_relativa_pct` DECIMAL(5, 2) NOT NULL COMMENT 'Ej: 35.00 %',
    `velocidad_viento_kmh` DECIMAL(5, 2) NOT NULL COMMENT 'Ej: 12.00 km/h',
    `direccion_viento` VARCHAR(20) NOT NULL DEFAULT 'NO' COMMENT 'N, NE, E, SE, S, SO, O, NO',
    `estado_cielo` VARCHAR(50) NOT NULL DEFAULT 'Cielo despejado' COMMENT 'Despejado, Nubosidad parcial, Viento seco, etc.',
    `riesgo_propagacion` ENUM('bajo', 'medio', 'alto', 'critico') NOT NULL DEFAULT 'alto',
    `pronostico_6h_texto` VARCHAR(255) NULL COMMENT 'Variación estimada en próximas 6 horas',
    `pronostico_24h_texto` VARCHAR(255) NULL COMMENT 'Pronóstico meteorológico próximas 24 horas',
    `fuente_meteorologica` VARCHAR(100) NOT NULL DEFAULT 'SENAMHI / Estación Local Tunari',
    FOREIGN KEY (`incendio_id`) REFERENCES `incendios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`zona_id`) REFERENCES `zonas_interes`(`id`) ON DELETE CASCADE,
    INDEX `idx_meteo_zona` (`zona_id`, `fecha_hora_registro`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 7. RECURSOS CERCANOS E INFRAESTRUCTURA DE APOYO (Fuentes de agua, salud, etc.)
-- ==============================================================================

CREATE TABLE `recursos_cercanos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `incendio_id` INT NULL COMMENT 'Vinculado a un incendio específico o registrado como infraestructura general',
    `zona_id` INT NOT NULL,
    `nombre` VARCHAR(150) NOT NULL COMMENT 'Ej: Laguna Tunari, Posta Médica Sacaba, Base SAR Cochabamba',
    `tipo_recurso` ENUM('fuente_agua', 'comunidad', 'estacion_bomberos_sar', 'centro_salud', 'punto_encuentro', 'base_operaciones') NOT NULL,
    `subtipo` VARCHAR(60) NULL COMMENT 'Laguna, Río, Pozo, Embalse, Hospital, Cuartel, etc.',
    `distancia_km` DECIMAL(6, 2) NOT NULL COMMENT 'Distancia al foco o centro de la zona (ej: 2.30 km)',
    `disponibilidad_real` ENUM('disponible_operativo', 'acceso_restringido', 'agotado_seco', 'en_verificacion') NOT NULL DEFAULT 'disponible_operativo',
    `latitud` DECIMAL(10, 7) NOT NULL,
    `longitud` DECIMAL(10, 7) NOT NULL,
    `detalles_capacidad` VARCHAR(255) NULL COMMENT 'Ej: Capacidad 50.000 L, 12 camas, 2 helicópteros',
    `contacto_emergencia` VARCHAR(50) NULL,
    FOREIGN KEY (`incendio_id`) REFERENCES `incendios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`zona_id`) REFERENCES `zonas_interes`(`id`) ON DELETE CASCADE,
    INDEX `idx_recurso_tipo` (`tipo_recurso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 8. RED VIAL, RUTAS DE ACCESO Y AVISOS DE PELIGRO
-- ==============================================================================

CREATE TABLE `rutas_y_peligros` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `incendio_id` INT NOT NULL,
    `nombre_tramo` VARCHAR(150) NOT NULL COMMENT 'Ej: Camino Serranía km 4 a punto de encuentro',
    `tipo_via` ENUM('carretera_pavimentada', 'camino_tierra', 'sendero_forestal', 'camino_vecinal') NOT NULL,
    `estado_transitabilidad` ENUM('despejado_autorizado', 'precaucion_humo', 'bloqueado_fuego', 'restringido_autoridades') NOT NULL DEFAULT 'precaucion_humo',
    `es_ruta_autorizada` TINYINT(1) NOT NULL DEFAULT 1,
    `advertencia_peligro` TEXT NULL COMMENT 'Ej: Tránsito cerrado por presencia de humo denso y desprendimientos',
    `fecha_actualizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`incendio_id`) REFERENCES `incendios`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 9. MÓDULO DE VIGILANCIA DE REACTIVACIONES (Incendios controlados bajo alerta)
-- ==============================================================================

CREATE TABLE `vigilancia_reactivaciones` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `incendio_id` INT NOT NULL,
    `zona_id` INT NOT NULL,
    `fecha_declarado_controlado` DATETIME NOT NULL,
    `estado_vigilancia` ENUM('en_vigilancia', 'posible_reactivacion', 'reactivacion_detectada', 'cerrada_segura') NOT NULL DEFAULT 'en_vigilancia',
    `nivel_riesgo_actual` ENUM('bajo', 'medio', 'alto') NOT NULL DEFAULT 'medio',
    `puntos_calientes_detectados` INT NOT NULL DEFAULT 0,
    `tiempo_deteccion_horas` DECIMAL(6, 2) NULL COMMENT 'Tiempo transcurrido desde detección satelital (ej: 5.4 horas)',
    `ultima_senal_fecha_hora` DATETIME NULL,
    `fuente_senal` VARCHAR(100) NULL COMMENT 'Satélite VIIRS / Patrullaje terrestre',
    `observaciones_historial` TEXT NULL,
    `revisado_por_usuario_id` INT NULL,
    `actualizado_el` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (`incendio_id`) REFERENCES `incendios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`zona_id`) REFERENCES `zonas_interes`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`revisado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL,
    INDEX `idx_vigilancia_estado` (`estado_vigilancia`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 10. MÓDULO DE POSIBLES INCENDIOS Y REPORTES CIUDADANOS
-- ==============================================================================

CREATE TABLE `reportes_ciudadanos` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NULL COMMENT 'Puede ser usuario registrado o reporte anónimo',
    `nombre_reportante` VARCHAR(100) NULL,
    `telefono_contacto` VARCHAR(30) NULL,
    `zona_o_referencia` VARCHAR(150) NOT NULL COMMENT 'Ej: Kilómetro 8 subida Taquiña',
    `departamento_id` INT NOT NULL,
    `municipio_id` INT NOT NULL,
    `latitud` DECIMAL(10, 7) NOT NULL,
    `longitud` DECIMAL(10, 7) NOT NULL,
    `fecha_hora_reporte` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    `descripcion` TEXT NOT NULL,
    `evidencia_foto_url` VARCHAR(255) NULL,
    `estado` ENUM('pendiente_revision', 'en_revision', 'vinculado_incendio', 'descartado') NOT NULL DEFAULT 'pendiente_revision',
    `incendio_vinculado_id` INT NULL,
    `evaluador_usuario_id` INT NULL,
    `notas_evaluacion` TEXT NULL,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`departamento_id`) REFERENCES `departamentos`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`municipio_id`) REFERENCES `municipios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`incendio_vinculado_id`) REFERENCES `incendios`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`evaluador_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE SET NULL,
    INDEX `idx_reportes_estado` (`estado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 11. SISTEMA DE ALERTAS, NOTIFICACIONES Y MOVILIZACIÓN (FireTrace Respuesta)
-- ==============================================================================

CREATE TABLE `alertas_notificaciones` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `incendio_id` INT NULL,
    `zona_id` INT NOT NULL,
    `titulo` VARCHAR(150) NOT NULL COMMENT 'Ej: ALERTA CRÍTICA · INCENDIO ACTIVO',
    `mensaje` TEXT NOT NULL,
    `tipo_alerta` ENUM('critica_incendio', 'preventiva_meteorologica', 'reactivacion_detectada', 'informativa_general') NOT NULL,
    `prioridad` ENUM('baja', 'media', 'alta', 'critica') NOT NULL DEFAULT 'alta',
    `radio_afectacion_km` DECIMAL(6, 2) NOT NULL DEFAULT 10.00,
    `activa` TINYINT(1) NOT NULL DEFAULT 1,
    `fecha_emision` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`incendio_id`) REFERENCES `incendios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`zona_id`) REFERENCES `zonas_interes`(`id`) ON DELETE CASCADE,
    INDEX `idx_alerta_activa` (`activa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `movilizacion_respuesta` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `alerta_id` INT NOT NULL,
    `incendio_id` INT NOT NULL,
    `usuario_id` INT NOT NULL,
    `distancia_estimada_usuario_km` DECIMAL(6, 2) NULL,
    `disponibilidad_confirmada` ENUM('disponible', 'no_disponible', 'en_espera') NOT NULL DEFAULT 'en_espera',
    `autorizacion_coordinador` ENUM('pendiente', 'autorizado_despliegue', 'no_autorizado_mantener_seguro') NOT NULL DEFAULT 'pendiente',
    `punto_encuentro_asignado_id` INT NULL,
    `instrucciones_seguridad` TEXT NULL,
    `fecha_respuesta` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`alerta_id`) REFERENCES `alertas_notificaciones`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`incendio_id`) REFERENCES `incendios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`punto_encuentro_asignado_id`) REFERENCES `recursos_cercanos`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `correos_notificaciones_log` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NOT NULL,
    `alerta_id` INT NOT NULL,
    `correo_destinatario` VARCHAR(120) NOT NULL,
    `asunto` VARCHAR(200) NOT NULL,
    `contenido_resumen` TEXT NOT NULL,
    `enlace_reporte_seguro` VARCHAR(255) NOT NULL,
    `enviado_exitoso` TINYINT(1) NOT NULL DEFAULT 1,
    `fecha_envio` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`alerta_id`) REFERENCES `alertas_notificaciones`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 12. BITÁCORA DEL BOSQUE: BIBLIOTECA DE INFORMES Y REGISTROS
-- ==============================================================================

CREATE TABLE `bitacora_informes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `titulo` VARCHAR(200) NOT NULL COMMENT 'Ej: Incendios forestales - Cochabamba (2025)',
    `tipo_informe` ENUM('incendios_registrados', 'focos_de_calor', 'evolucion_historica', 'zonas_de_riesgo', 'analisis_comparativo') NOT NULL,
    `departamento_id` INT NOT NULL,
    `municipio_id` INT NULL,
    `zona_id` INT NULL,
    `fecha_elaboracion` DATE NOT NULL,
    `periodo_analizado` VARCHAR(100) NOT NULL COMMENT 'Ej: Temporada seca 2024 - 2025',
    `fuente_informacion` VARCHAR(150) NOT NULL COMMENT 'Ej: NASA FIRMS (MODIS/VIIRS) / ABT / Los Tiempos',
    `formato_archivo` ENUM('PDF', 'XLSX', 'CSV') NOT NULL,
    `tamano_archivo_legible` VARCHAR(20) NOT NULL DEFAULT '2.4 MB',
    `archivo_url` VARCHAR(255) NOT NULL,
    `total_descargas` INT NOT NULL DEFAULT 0,
    `creado_por_usuario_id` INT NOT NULL,
    `descripcion_contenido` TEXT NULL,
    `creado_el` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`departamento_id`) REFERENCES `departamentos`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`municipio_id`) REFERENCES `municipios`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`zona_id`) REFERENCES `zonas_interes`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`creado_por_usuario_id`) REFERENCES `usuarios`(`id`) ON DELETE CASCADE,
    INDEX `idx_informes_tipo` (`tipo_informe`),
    INDEX `idx_informes_fecha` (`fecha_elaboracion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 13. HISTORIAS REALES, BIODIVERSIDAD, PROPÓSITO Y VOLUNTARIADO
-- ==============================================================================

CREATE TABLE `historias_biodiversidad` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `titulo` VARCHAR(200) NOT NULL COMMENT 'Ej: El jaguar: una de las especies más afectadas por los incendios',
    `subtitulo` VARCHAR(255) NULL,
    `especie_o_comunidad` VARCHAR(100) NOT NULL COMMENT 'Ej: Jaguar (Panthera onca) / Comunidades del Tunari',
    `categoria` ENUM('biodiversidad', 'impacto_comunidades', 'prevencion_recuperacion') NOT NULL DEFAULT 'biodiversidad',
    `imagen_url` VARCHAR(255) NOT NULL,
    `contenido_completo` LONGTEXT NOT NULL,
    `fuente_referencia` VARCHAR(200) NOT NULL,
    `destacado_en_inicio` TINYINT(1) NOT NULL DEFAULT 1,
    `creado_el` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `instituciones_aliadas` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nombre` VARCHAR(150) NOT NULL,
    `sigla` VARCHAR(30) NULL,
    `tipo_entidad` ENUM('gubernamental', 'cuerpo_bomberos_sar', 'ong_ambiental', 'academica_cientifica') NOT NULL,
    `logo_url` VARCHAR(255) NULL,
    `descripcion_contribucion` TEXT NULL,
    `sitio_web` VARCHAR(200) NULL,
    `estado_confirmacion` ENUM('confirmado', 'en_proceso', 'pendiente') NOT NULL DEFAULT 'pendiente'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `solicitudes_voluntariado` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `usuario_id` INT NULL,
    `nombre_completo` VARCHAR(150) NOT NULL,
    `email` VARCHAR(120) NOT NULL,
    `telefono` VARCHAR(30) NOT NULL,
    `ciudad_residencia` VARCHAR(100) NOT NULL DEFAULT 'Cochabamba',
    `motivacion_o_experiencia` TEXT NOT NULL,
    `area_interes` ENUM('apoyo_logistico', 'observacion_comunitaria', 'sensibilizacion_ambiental', 'brigada_apoyo') NOT NULL DEFAULT 'observacion_comunitaria',
    `estado` ENUM('recibido', 'contactado', 'en_capacitacion', 'habilitado', 'rechazado') NOT NULL DEFAULT 'recibido',
    `fecha_solicitud` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==============================================================================
-- 14. ESTADÍSTICAS HISTÓRICAS CONSOLIDADAS (Cochabamba y Bolivia)
-- ==============================================================================

CREATE TABLE `estadisticas_historicas` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `departamento_id` INT NOT NULL,
    `zona_id` INT NULL,
    `anio` INT NOT NULL,
    `total_incendios_registrados` INT NOT NULL DEFAULT 0,
    `hectareas_quemadas_estimadas` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
    `detecciones_satelitales_calor` INT NOT NULL DEFAULT 0,
    `fuente_datos` VARCHAR(150) NOT NULL COMMENT 'Ej: Los Tiempos, Aqua MODIS NASA, GWIS',
    FOREIGN KEY (`departamento_id`) REFERENCES `departamentos`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`zona_id`) REFERENCES `zonas_interes`(`id`) ON DELETE SET NULL,
    UNIQUE KEY `uk_depto_zona_anio` (`departamento_id`, `zona_id`, `anio`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==============================================================================
-- INSERCIÓN DE DATOS INICIALES (SEED DATA DEL DOCUMENTO FIRETRACE)
-- ==============================================================================

-- 1. Departamentos
INSERT INTO `departamentos` (`id`, `nombre`, `codigo_iso`, `latitud_centro`, `longitud_centro`) VALUES
(1, 'Cochabamba', 'BO-C', -17.3895000, -66.1568000),
(2, 'Santa Cruz', 'BO-S', -17.7833000, -63.1821000),
(3, 'Beni', 'BO-B', -14.8333000, -64.9000000),
(4, 'La Paz', 'BO-L', -16.5000000, -68.1500000);

-- 2. Municipios de Cochabamba
INSERT INTO `municipios` (`id`, `departamento_id`, `nombre`, `latitud_centro`, `longitud_centro`) VALUES
(1, 1, 'Cochabamba (Cercado)', -17.3935000, -66.1570000),
(2, 1, 'Sacaba', -17.4042000, -66.0408000),
(3, 1, 'Quillacollo', -17.3980000, -66.2790000),
(4, 1, 'Tiquipaya', -17.3380000, -66.2160000),
(5, 1, 'Colcapirhua', -17.3880000, -66.2360000);

-- 3. Zonas de Interés y Áreas Protegidas (Destacado: Parque Nacional Tunari)
INSERT INTO `zonas_interes` (`id`, `municipio_id`, `nombre`, `tipo_zona`, `nivel_riesgo_estimado`, `es_area_protegida`, `superficie_total_ha`, `latitud`, `longitud`, `radio_cobertura_km`, `descripcion`) VALUES
(1, 1, 'Parque Nacional Tunari', 'parque_nacional', 'alto', 1, 300000.00, -17.2833330, -66.1833330, 25.0, 'Reserva natural y pulmón hídrico de Cochabamba, vulnerable a chaqueos e incendios periódicos.'),
(2, 4, 'Serranía Taquiña - Tiquipaya', 'reserva_forestal', 'critico', 1, 12000.00, -17.3125000, -66.2050000, 8.0, 'Zona boscosa y cuenca de riesgo hidrológico y forestal.'),
(3, 2, 'Cordillera de Sacaba', 'valle_agricola', 'medio', 0, 18500.00, -17.3750000, -66.0120000, 10.0, 'Zona de pastizales y comunidades campesinas.'),
(4, 3, 'Zona Forestal El Paso - Quillacollo', 'comunidad_rural', 'bajo', 0, 8500.00, -17.3450000, -66.2650000, 6.0, 'Franja boscosa de eucaliptos y zonas recreacionales.');

-- 4. Usuarios del Sistema (Incluye el usuario 'bombero' de demostración exigido en pág. 41)
INSERT INTO `usuarios` (`id`, `nombre_completo`, `email`, `usuario`, `password`, `telefono`, `rol`, `latitud_actual`, `longitud_actual`, `permiso_ubicacion`, `zona_seguimiento_id`) VALUES
(1, 'Bombero Demostración SAR', 'bombero@firetrace.bo', 'bombero', '12345', '+591 4 4252222', 'bombero_respuesta', -17.3850000, -66.1600000, 1, 1),
(2, 'Ing. Carlos Mendoza (Admin)', 'admin@firetrace.bo', 'admin', 'admin2026', '+591 70712345', 'administrador', -17.3930000, -66.1550000, 1, 1),
(3, 'Elena Rocha (Voluntaria Habilitada)', 'elena.voluntaria@firetrace.bo', 'elena_vol', 'voluntario123', '+591 72298765', 'voluntario', -17.3700000, -66.1750000, 1, 1),
(4, 'Comunidad Vecinal Tunari', 'vecinos.tunari@gmail.com', 'vecino_tunari', 'vecino2026', '+591 79700011', 'ciudadano', -17.3200000, -66.1900000, 1, 1);

-- 5. Perfil de Voluntario Habilitado
INSERT INTO `voluntarios_perfil` (`id`, `usuario_id`, `capacitacion_completada`, `codigos_comunicacion_aprobados`, `senales_seguridad_aprobadas`, `habilitado_por_coordinador`, `coordinador_aprobador_id`, `fecha_habilitacion`, `observaciones_medicas_habilidades`) VALUES
(1, 3, 1, 1, 1, 1, 1, '2026-08-01 10:00:00', 'Capacitada en códigos radiales, primeros auxilios básicos y vigilancia pasiva comunitaria.');

-- 6. Incendio Activo Principal (Incendio en Vivo - Parque Nacional Tunari)
INSERT INTO `incendios` (`id`, `codigo_incendio`, `nombre`, `zona_id`, `municipio_id`, `departamento_id`, `latitud`, `longitud`, `fecha_inicio`, `ultima_actualizacion`, `hectareas_afectadas`, `nivel_riesgo`, `estado`, `es_seguimiento_en_vivo`, `alerta_critica`, `fuente_informacion`, `resumen_situacion`) VALUES
(1, 'INC-TUNARI-2026-01', 'Incendio Parque Nacional Tunari (Sector Taquiña)', 1, 1, 1, -17.2954000, -66.1789000, '2026-08-12 09:30:00', '2026-08-12 14:32:00', 320.00, 'alto', 'activo', 1, 1, 'Satélite VIIRS NOAA-20 / MODIS Aqua / Alerta SAR', 'Incendio activo de rápida propagación en pendiente pronunciada. Afecta cobertura de pajonales y bosques de queñua con viento del noroeste a 12 km/h.'),
(2, 'INC-SACABA-2026-02', 'Foco Serranías de Sacaba', 3, 2, 1, -17.3780000, -66.0250000, '2026-08-11 15:00:00', '2026-08-12 12:15:00', 45.00, 'medio', 'controlado', 0, 0, 'Aqua MODIS', 'Quema controlada en pastizales periféricos, bajo vigilancia de reactivación.');

-- 7. Focos de Calor Satelitales (Aqua MODIS & VIIRS)
INSERT INTO `focos_calor` (`incendio_id`, `zona_id`, `satelite_instrumento`, `latitud`, `longitud`, `brillo_temperatura_k`, `potencia_radiativa_frp_mw`, `nivel_confianza`, `fecha_hora_adquisicion`, `es_deteccion_repetida`) VALUES
(1, 1, 'Suomi NPP VIIRS', -17.2954000, -66.1789000, 354.20, 48.60, 'high', '2026-08-12 13:45:00', 1),
(1, 1, 'NOAA-20 VIIRS', -17.2941000, -66.1802000, 348.80, 39.20, 'high', '2026-08-12 14:10:00', 1),
(1, 1, 'Aqua MODIS', -17.2980000, -66.1755000, 336.50, 28.10, 'nominal', '2026-08-12 14:20:00', 0),
(2, 3, 'Aqua MODIS', -17.3780000, -66.0250000, 318.20, 11.40, 'nominal', '2026-08-12 11:30:00', 0);

-- 8. Evolución Temporal del Incendio Activo (Datos para los 3 gráficos del Dashboard)
INSERT INTO `evolucion_incendio` (`incendio_id`, `fecha_hora_registro`, `hectareas_acumuladas`, `focos_calor_detectados`, `nivel_riesgo_momento`, `observaciones`) VALUES
(1, '2026-08-12 09:30:00', 35.00, 3, 'medio', 'Detección inicial de foco de calor'),
(1, '2026-08-12 11:00:00', 110.00, 7, 'alto', 'Propagación impulsada por vientos de ladera'),
(1, '2026-08-12 12:30:00', 220.00, 12, 'alto', 'Despliegue de cuadrilla SAR'),
(1, '2026-08-12 14:32:00', 320.00, 15, 'critico', 'Paso a alerta crítica por cercanía a comunidad Taquiña');

-- 9. Condiciones Meteorológicas Actuales (según cifras del diseño: Temp 32°C, Humedad 35%, Viento 12 km/h)
INSERT INTO `condiciones_meteorologicas` (`incendio_id`, `zona_id`, `fecha_hora_registro`, `temperatura_c`, `humedad_relativa_pct`, `velocidad_viento_kmh`, `direccion_viento`, `estado_cielo`, `riesgo_propagacion`, `pronostico_6h_texto`, `pronostico_24h_texto`, `fuente_meteorologica`) VALUES
(1, 1, '2026-08-12 14:32:00', 32.00, 35.00, 12.00, 'NO', 'Cielo despejado con bruma de humo', 'alto', 'Incremento moderado de viento hacia las 17:00 con ráfagas de hasta 22 km/h. Sin probabilidad de lluvia.', 'Continuación de temperaturas elevadas y ambiente muy seco en las próximas 24 horas.', 'SENAMHI Estación Sarco - Tunari');

-- 10. Recursos Cercanos e Infraestructura (Laguna Tunari 2.3 km, Estaciones SAR, etc.)
INSERT INTO `recursos_cercanos` (`incendio_id`, `zona_id`, `nombre`, `tipo_recurso`, `subtipo`, `distancia_km`, `disponibilidad_real`, `latitud`, `longitud`, `detalles_capacidad`, `contacto_emergencia`) VALUES
(1, 1, 'Laguna Tunari', 'fuente_agua', 'Laguna / Embalse natural', 2.30, 'disponible_operativo', -17.2790000, -66.1950000, 'Acceso para camiones cisterna y helibaldes', '+591 4 4291122'),
(1, 1, 'Comunidad Taquiña Norte', 'comunidad', 'Población campesina', 3.80, 'disponible_operativo', -17.3180000, -66.1920000, 'Aprox. 420 familias en riesgo preventivo', '+591 71700234'),
(1, 1, 'Base Operativa SAR Cochabamba', 'estacion_bomberos_sar', 'Cuartel Central SAR-Bolivia', 4.50, 'disponible_operativo', -17.3620000, -66.1700000, 'Unidad de rescate, 3 carros bombas, 25 rescatistas', '132'),
(1, 1, 'Hospital del Norte (Sacaba/Cochabamba)', 'centro_salud', 'Hospital de 2do Nivel', 5.20, 'disponible_operativo', -17.3550000, -66.1450000, 'Atención médica para afectados por asfixia y quemaduras', '168'),
(1, 1, 'Punto de Encuentro Cruce Taquiña', 'punto_encuentro', 'Punto de reunión autorizado', 2.10, 'disponible_operativo', -17.3100000, -66.1850000, 'Zona segura para coordinación de cuadrillas autorizadas', '+591 4 4252222');

-- 11. Rutas de Acceso y Advertencias de Peligro
INSERT INTO `rutas_y_peligros` (`incendio_id`, `nombre_tramo`, `tipo_via`, `estado_transitabilidad`, `es_ruta_autorizada`, `advertencia_peligro`) VALUES
(1, 'Avenida Ecológica a Cruce Taquiña', 'carretera_pavimentada', 'despejado_autorizado', 1, 'Vía principal despejada para unidades de socorro.'),
(1, 'Camino de herradura Sendero Queñuas', 'sendero_forestal', 'bloqueado_fuego', 0, 'Peligro extremo: Tránsito prohibido por llamas cruzando el sendero y humo cero visibilidad.');

-- 12. Vigilancia de Reactivaciones (Módulo 2 del documento)
INSERT INTO `vigilancia_reactivaciones` (`incendio_id`, `zona_id`, `fecha_declarado_controlado`, `estado_vigilancia`, `nivel_riesgo_actual`, `puntos_calientes_detectados`, `tiempo_deteccion_horas`, `ultima_senal_fecha_hora`, `fuente_senal`, `observaciones_historial`, `revisado_por_usuario_id`) VALUES
(2, 3, '2026-08-11 18:00:00', 'en_vigilancia', 'medio', 2, 5.40, '2026-08-12 11:30:00', 'Aqua MODIS', 'Persisten brazas subterráneas en raíces de eucalipto. Se mantiene cuadrilla comunitaria en ronda.', 1);

-- 13. Reportes Ciudadanos (Módulo 3: Posibles Incendios)
INSERT INTO `reportes_ciudadanos` (`usuario_id`, `nombre_reportante`, `telefono_contacto`, `zona_o_referencia`, `departamento_id`, `municipio_id`, `latitud`, `longitud`, `descripcion`, `estado`, `incendio_vinculado_id`, `evaluador_usuario_id`, `notas_evaluacion`) VALUES
(4, 'Vecino Vigilante Tunari', '+591 79700011', 'Límite Alto Taquiña cerca al bosque de pinos', 1, 1, -17.2960000, -66.1770000, 'Columna espesa de humo grisáceo divisada desde las 09:15 am, olor fuerte a quemado.', 'vinculado_incendio', 1, 1, 'Corroborado con detección satelital VIIRS. Vinculado al incidente activo INC-TUNARI-2026-01.'),
(NULL, 'Senderista Anónimo', '+591 70744556', 'Paso de la Cumbre Tiquipaya', 1, 4, -17.3050000, -66.2100000, 'Fogata descuidada aparente por turistas.', 'pendiente_revision', NULL, NULL, NULL);

-- 14. Alertas y Notificaciones Activas
INSERT INTO `alertas_notificaciones` (`id`, `incendio_id`, `zona_id`, `titulo`, `mensaje`, `tipo_alerta`, `prioridad`, `radio_afectacion_km`, `activa`) VALUES
(1, 1, 1, 'ALERTA CRÍTICA · INCENDIO ACTIVO', 'Se requiere revisar la información disponible de este incidente y mantener el seguimiento de su evolución. Comunidades de Taquiña y Tunari mantener precaución.', 'critica_incendio', 'critica', 12.00, 1),
(2, 2, 3, 'Posible reactivación: pendiente de revisión', 'Nuevas señales de calor detectadas en sector Serranías de Sacaba. Se requiere verificación en terreno.', 'reactivacion_detectada', 'media', 5.00, 1);

-- 15. Movilización y Respuesta de Prueba
INSERT INTO `movilizacion_respuesta` (`alerta_id`, `incendio_id`, `usuario_id`, `distancia_estimada_usuario_km`, `disponibilidad_confirmada`, `autorizacion_coordinador`, `punto_encuentro_asignado_id`, `instrucciones_seguridad`) VALUES
(1, 1, 3, 2.80, 'disponible', 'autorizado_despliegue', 5, 'Presentarse con equipo de protección visual y botas en Punto de Encuentro Cruce Taquiña. Asignada a logística y apoyo de hidratación.');

-- 16. Bitácora del Bosque (Biblioteca de Informes Descargables)
INSERT INTO `bitacora_informes` (`titulo`, `tipo_informe`, `departamento_id`, `municipio_id`, `zona_id`, `fecha_elaboracion`, `periodo_analizado`, `fuente_informacion`, `formato_archivo`, `tamano_archivo_legible`, `archivo_url`, `total_descargas`, `creado_por_usuario_id`, `descripcion_contenido`) VALUES
('Incendios forestales - Cochabamba (2025)', 'incendios_registrados', 1, 1, 1, '2026-01-15', 'Gestión Anual 2025', 'NASA FIRMS (Aqua/VIIRS) y Los Tiempos', 'PDF', '3.4 MB', 'uploads/informes/incendios_cochabamba_2025.pdf', 142, 2, 'Consolidado anual de incendios, áreas quemadas en Parque Tunari y respuesta operativa.'),
('Focos de calor MODIS/VIIRS Tunari 2026', 'focos_de_calor', 1, 1, 1, '2026-08-10', 'Enero - Agosto 2026', 'NASA Space Apps / Aqua MODIS', 'XLSX', '1.8 MB', 'uploads/informes/focos_calor_tunari_2026.xlsx', 89, 2, 'Base de datos de detecciones satelitales con latitud, longitud, FRP y temperatura de brillo.'),
('Evolución histórica del fuego en Cochabamba (2012-2023)', 'evolucion_historica', 1, NULL, 1, '2024-03-20', '2012 a 2023', 'Periódico Los Tiempos / ABT', 'PDF', '5.1 MB', 'uploads/informes/evolucion_historica_2012_2023.pdf', 315, 2, 'Análisis de 1.045 incendios registrados y 91.583 hectáreas afectadas en el departamento.'),
('Zonas de mayor riesgo Tunari - Mapa de Vulnerabilidad', 'zonas_de_riesgo', 1, 4, 2, '2026-06-01', 'Temporada Seca 2026', 'FireTrace Analytics / Modelos Bioclimáticos', 'CSV', '820 KB', 'uploads/informes/zonas_riesgo_tunari.csv', 64, 2, 'Dataset estructurado con variables de combustible vegetal, pendiente y proximidad a fuentes de agua.');

-- 17. Historias Reales y Biodiversidad
INSERT INTO `historias_biodiversidad` (`titulo`, `subtitulo`, `especie_o_comunidad`, `categoria`, `imagen_url`, `contenido_completo`, `fuente_referencia`, `destacado_en_inicio`) VALUES
('El jaguar: una de las especies más afectadas por los incendios', 'El fuego no solo destruye árboles: destruye el hogar y la vida de especies que dependen del bosque.', 'Jaguar (Panthera onca)', 'biodiversidad', 'FONDO PAGINA/Cndor sobre el incendio forestal.png', 'Los incendios forestales destruyen el hábitat crítico del jaguar, reduciendo su disponibilidad de presas, forzando su desplazamiento hacia zonas pobladas y fragmentando corredores biológicos vitales. Recuperar estos ecosistemas toma décadas.', 'Fundación para la Conservación del Bosque Seco Chiquitano (FCBC) / Red de Biodiversidad', 1),
('Comunidades del Tunari: guardianes de la cuenca hídrica', 'Familias campesinas enfrentan la pérdida de pastizales y canales de agua.', 'Comunidades agrarias de Taquiña y Tiquipaya', 'impacto_comunidades', 'BARRA LATERAL/Montaas al atardecer_ proteger lo que importa (BARRA LATERAL).png', 'Las comunidades aledañas al Tunari dependen de los bosques para la recarga de acuíferos. Cuando el fuego devasta la cuenca, se pierde la provisión de agua potable para los valles centrales.', 'Reporte Social Cochabamba 2026', 1);

-- 18. Estadísticas Históricas Precargadas (Datos del Documento FireTrace)
INSERT INTO `estadisticas_historicas` (`departamento_id`, `zona_id`, `anio`, `total_incendios_registrados`, `hectareas_quemadas_estimadas`, `detecciones_satelitales_calor`, `fuente_datos`) VALUES
(1, NULL, 2023, 105, 9500.00, 3120, 'Los Tiempos / ABT'),
(1, 1, 2023, 48, 4200.00, 1450, 'Informe Técnico Parque Tunari'),
(1, NULL, 2024, 180, 14200.00, 5840, 'Aqua MODIS / GWIS'),
(2, NULL, 2024, 1450, 8500000.00, 62000, 'NASA Earth Observatory / GWIS'),
(1, 1, 2026, 22, 1850.00, 640, 'Registro FireTrace hasta Agosto 2026');
