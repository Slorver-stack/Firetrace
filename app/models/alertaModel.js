const supabase = require('./supabaseClient');

// Almacén en memoria de respaldo para reportes ciudadanos de Ojos del Bosque
const DEMO_REPORTES = [
  {
    id: 1,
    usuario_id: 5,
    nombre_reportante: 'Carlos Mendoza (Comité Vecinal Taquiña)',
    telefono_contacto: '+591 76665544',
    zona_o_referencia: 'Kilómetro 8 subida Taquiña, cerca a la toma de agua',
    departamento_id: 1,
    municipio_id: 1,
    latitud: -17.2954,
    longitud: -66.1789,
    fecha_hora_reporte: new Date(Date.now() - 3600000 * 2).toISOString(),
    descripcion: 'Columna de humo blanco denso observada en la ladera este. El viento está soplando en dirección a los pastizales secos.',
    nivel_humo_fuego: 'humo_denso',
    evidencia_foto_url: '/IMG/FONDO%20PAGINA/Bosque%20en%20llamas%20(PARA%20CUADROS%20PEQUE%C3%91OS).jfif',
    fotos: [
      '/IMG/FONDO%20PAGINA/Bosque%20en%20llamas%20(PARA%20CUADROS%20PEQUE%C3%91OS).jfif',
      '/IMG/FONDO%20PAGINA/Incendio%20forestal%20reflejado%20en%20el%20r%C3%ADo.png'
    ],
    estado: 'pendiente_revision',
    incendio_vinculado_id: 1
  },
  {
    id: 2,
    usuario_id: null,
    nombre_reportante: 'Ojos del Bosque Anónimo',
    telefono_contacto: '+591 71299444',
    zona_o_referencia: 'Comunidad Tirani, sendero norte Parque Tunari',
    departamento_id: 1,
    municipio_id: 1,
    latitud: -17.3120,
    longitud: -66.1850,
    fecha_hora_reporte: new Date(Date.now() - 3600000 * 5).toISOString(),
    descripcion: 'Fuego rastrero en pajonales secos, avance rápido por ráfagas de viento.',
    nivel_humo_fuego: 'fuego_activo',
    evidencia_foto_url: '/IMG/BARRA%20LATERAL/Bosque%20Incendio%20(BARRA%20LATERAL).jfif',
    fotos: [
      '/IMG/BARRA%20LATERAL/Bosque%20Incendio%20(BARRA%20LATERAL).jfif'
    ],
    estado: 'pendiente_revision',
    incendio_vinculado_id: 1
  }
];

let localReportesStore = [...DEMO_REPORTES];

const AlertaModel = {
  async getActivas() {
    try {
      const { data, error } = await supabase
        .from('alertas_notificaciones')
        .select(`*, incendios(nombre, latitud, longitud), zonas_interes(nombre)`)
        .eq('activa', true)
        .order('fecha_emision', { ascending: false });
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('[AlertaModel] Error al obtener alertas en Supabase:', e.message);
      return [];
    }
  },

  async create(alertaData) {
    const { data, error } = await supabase
      .from('alertas_notificaciones')
      .insert([alertaData])
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async desactivar(id) {
    const { error } = await supabase
      .from('alertas_notificaciones')
      .update({ activa: false })
      .eq('id', id);
    if (error) throw error;
    return true;
  },

  async getReportesCiudadanos(estado = null) {
    try {
      let query = supabase
        .from('reportes_ciudadanos')
        .select(`*, municipios(nombre), departamentos(nombre)`)
        .order('fecha_hora_reporte', { ascending: false });
      if (estado) query = query.eq('estado', estado);
      const { data, error } = await query;
      if (!error && Array.isArray(data) && data.length > 0) {
        // Enriquecer con fotos locales si fueron agregadas en sesión
        return data.map(item => {
          const match = localReportesStore.find(l => l.id === item.id);
          return {
            ...item,
            fotos: (match && match.fotos) || (item.evidencia_foto_url ? [item.evidencia_foto_url] : [])
          };
        });
      }
    } catch (e) {
      console.warn('[AlertaModel] Consulta Supabase reportes falló, usando local:', e.message);
    }
    // Fallback a almacenamiento local
    if (estado) {
      return localReportesStore.filter(r => r.estado === estado);
    }
    return localReportesStore;
  },

  async createReporte(reporteData) {
    const nuevoId = localReportesStore.length > 0 ? Math.max(...localReportesStore.map(r => r.id || 0)) + 1 : 1;
    const nuevoReporte = {
      id: nuevoId,
      usuario_id: reporteData.usuario_id || null,
      nombre_reportante: reporteData.nombre_reportante || 'Vigilante Ojos del Bosque',
      telefono_contacto: reporteData.telefono_contacto || '',
      zona_o_referencia: reporteData.zona_o_referencia || 'Zona no especificada',
      departamento_id: Number(reporteData.departamento_id) || 1,
      municipio_id: Number(reporteData.municipio_id) || 1,
      latitud: parseFloat(reporteData.latitud) || -17.3895,
      longitud: parseFloat(reporteData.longitud) || -66.1568,
      fecha_hora_reporte: new Date().toISOString(),
      descripcion: reporteData.descripcion || '',
      nivel_humo_fuego: reporteData.nivel_humo_fuego || 'humo_denso',
      evidencia_foto_url: reporteData.evidencia_foto_url || (Array.isArray(reporteData.fotos) && reporteData.fotos[0]) || null,
      fotos: Array.isArray(reporteData.fotos) ? reporteData.fotos : (reporteData.evidencia_foto_url ? [reporteData.evidencia_foto_url] : []),
      estado: 'pendiente_revision',
      incendio_vinculado_id: reporteData.incendio_vinculado_id || null
    };

    // 1. Guardar siempre en memoria local
    localReportesStore.unshift(nuevoReporte);

    // 2. Intentar guardar en Supabase (si existe la tabla)
    try {
      const payloadSupabase = {
        usuario_id: nuevoReporte.usuario_id,
        nombre_reportante: nuevoReporte.nombre_reportante,
        telefono_contacto: nuevoReporte.telefono_contacto,
        zona_o_referencia: nuevoReporte.zona_o_referencia,
        departamento_id: nuevoReporte.departamento_id,
        municipio_id: nuevoReporte.municipio_id,
        latitud: nuevoReporte.latitud,
        longitud: nuevoReporte.longitud,
        descripcion: nuevoReporte.descripcion,
        evidencia_foto_url: nuevoReporte.evidencia_foto_url,
        estado: nuevoReporte.estado,
        incendio_vinculado_id: nuevoReporte.incendio_vinculado_id
      };

      const { data, error } = await supabase
        .from('reportes_ciudadanos')
        .insert([payloadSupabase])
        .select()
        .single();

      if (!error && data) {
        nuevoReporte.id = data.id;
        // Si hay fotos adicionales y la tabla reporte_evidencias_fotos existe en Supabase:
        if (Array.isArray(nuevoReporte.fotos) && nuevoReporte.fotos.length > 0) {
          const fotosPayload = nuevoReporte.fotos.map(url => ({
            reporte_id: data.id,
            imagen_url: url
          }));
          await supabase.from('reporte_evidencias_fotos').insert(fotosPayload).catch(() => {});
        }
        return { ...data, fotos: nuevoReporte.fotos };
      }
    } catch (e) {
      console.warn('[AlertaModel] Inserción Supabase falló (se conservó en local):', e.message);
    }

    return nuevoReporte;
  }
};

module.exports = AlertaModel;
