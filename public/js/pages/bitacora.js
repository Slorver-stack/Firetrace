/**
 * FireTrace - Monitor de Incendios Bolivia
 * Vista: Bitácora del Bosque (Biblioteca de Informes y Auditoría)
 * public/js/pages/bitacora.js
 */

const BitacoraView = {
  informes: [],
  filteredInformes: [],

  async render() {
    return `
      <div class="bitacora-page">
        <!-- HEADER DE LA SECCIÓN -->
        <div class="card-header-flex" style="flex-wrap: wrap; gap: 1rem; align-items: center;">
          <div>
            <div class="badge" style="background: rgba(56,189,248,0.15); color: #38bdf8; border: 1px solid rgba(56,189,248,0.3); margin-bottom: 0.4rem;">
              <i class="ph ph-notebook"></i> Biblioteca Documental & Datos Abiertos
            </div>
            <h1 style="font-family: var(--font-display); font-size: 1.6rem; font-weight: 800; color: #fff;">
              Bitácora del Bosque
            </h1>
            <p style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.2rem;">
              Repositorio público de informes técnicos, datasets satelitales de calor y balances de áreas quemadas en Bolivia.
            </p>
          </div>

          <div style="display: flex; gap: 0.5rem;">
            <button class="btn btn-secondary" onclick="BitacoraView.exportAllCSV()">
              <i class="ph ph-file-csv"></i> Exportar Catálogo
            </button>
          </div>
        </div>

        <!-- 1. ESTADÍSTICAS DE LA BIBLIOTECA -->
        <div class="stats-grid" style="margin-top: 1.5rem; grid-template-columns: repeat(4, 1fr);">
          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Total Informes</span>
              <div class="stats-card-icon" style="background: rgba(56,189,248,0.15); color: #38bdf8;">
                <i class="ph ph-files"></i>
              </div>
            </div>
            <div class="stats-card-value" id="bitacoraTotalInformes" style="color: #38bdf8;">--</div>
            <div class="stats-card-trend trend-neutral">
              <i class="ph ph-check"></i> Documentos auditados
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Total Descargas</span>
              <div class="stats-card-icon" style="background: rgba(34,197,94,0.15); color: #22c55e;">
                <i class="ph ph-download-simple"></i>
              </div>
            </div>
            <div class="stats-card-value" id="bitacoraTotalDescargas" style="color: #22c55e;">--</div>
            <div class="stats-card-trend trend-up">
              <i class="ph ph-arrow-up"></i> Acceso de investigadores
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Formatos Disponibles</span>
              <div class="stats-card-icon" style="background: rgba(234,179,8,0.15); color: #eab308;">
                <i class="ph ph-file-text"></i>
              </div>
            </div>
            <div class="stats-card-value" style="color: #eab308;">PDF · XLSX · CSV</div>
            <div class="stats-card-trend trend-neutral">
              <i class="ph ph-database"></i> Interoperabilidad NASA
            </div>
          </div>

          <div class="stats-card">
            <div class="stats-card-header">
              <span class="stats-card-title">Última Actualización</span>
              <div class="stats-card-icon" style="background: rgba(249,115,22,0.15); color: #f97316;">
                <i class="ph ph-clock"></i>
              </div>
            </div>
            <div class="stats-card-value" style="font-size: 1.6rem; color: #f97316;">Hoy</div>
            <div class="stats-card-trend trend-neutral">
              <i class="ph ph-cloud-arrow-down"></i> Sincronizado
            </div>
          </div>
        </div>

        <!-- 2. BARRA DE FILTROS -->
        <div class="side-card" style="padding: 1.25rem; margin-top: 1.5rem;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            <!-- Filtro por tipo -->
            <div>
              <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">
                <i class="ph ph-funnel"></i> Tipo de Informe:
              </label>
              <select id="filtroTipo" class="ft-select" style="width: 100%; padding: 0.55rem; background: var(--bg-surface-elevated); border: 1px solid var(--border-light); border-radius: 8px; color: #fff; font-size: 0.825rem;" onchange="BitacoraView.aplicarFiltros()">
                <option value="todos">Todos los tipos</option>
                <option value="incendios_registrados">Incendios Registrados</option>
                <option value="focos_de_calor">Focos de Calor</option>
                <option value="evolucion_historica">Evolución Histórica</option>
                <option value="zonas_de_riesgo">Zonas de Riesgo</option>
                <option value="analisis_comparativo">Análisis Comparativo</option>
              </select>
            </div>

            <!-- Filtro por departamento -->
            <div>
              <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">
                <i class="ph ph-map-pin"></i> Departamento:
              </label>
              <select id="filtroDepto" class="ft-select" style="width: 100%; padding: 0.55rem; background: var(--bg-surface-elevated); border: 1px solid var(--border-light); border-radius: 8px; color: #fff; font-size: 0.825rem;" onchange="BitacoraView.aplicarFiltros()">
                <option value="todos">Todos los departamentos</option>
                <option value="Cochabamba">Cochabamba</option>
                <option value="Santa Cruz">Santa Cruz</option>
                <option value="Beni">Beni</option>
                <option value="La Paz">La Paz</option>
              </select>
            </div>

            <!-- Filtro por formato -->
            <div>
              <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">
                <i class="ph ph-file-code"></i> Formato de Archivo:
              </label>
              <select id="filtroFormato" class="ft-select" style="width: 100%; padding: 0.55rem; background: var(--bg-surface-elevated); border: 1px solid var(--border-light); border-radius: 8px; color: #fff; font-size: 0.825rem;" onchange="BitacoraView.aplicarFiltros()">
                <option value="todos">Todos los formatos</option>
                <option value="PDF">PDF (Documento)</option>
                <option value="XLSX">XLSX (Planilla Excel)</option>
                <option value="CSV">CSV (Datos sin formato)</option>
              </select>
            </div>

            <!-- Búsqueda por texto -->
            <div>
              <label style="font-size: 0.75rem; color: var(--text-muted); display: block; margin-bottom: 0.35rem;">
                <i class="ph ph-magnifying-glass"></i> Buscar por título:
              </label>
              <input type="text" id="filtroTexto" placeholder="Ej: Tunari, MODIS, 2025..." style="width: 100%; padding: 0.55rem; background: var(--bg-surface-elevated); border: 1px solid var(--border-light); border-radius: 8px; color: #fff; font-size: 0.825rem;" oninput="BitacoraView.aplicarFiltros()">
            </div>
          </div>
        </div>

        <!-- 3. GRID DE INFORMES DISPONIBLES -->
        <div style="margin-top: 1.5rem;">
          <div class="card-header-flex">
            <span class="card-section-title"><i class="ph ph-folder-open"></i> Archivos y Datasets Disponibles</span>
            <span style="font-size: 0.8rem; color: var(--text-muted);" id="conteoResultados">
              Cargando informes...
            </span>
          </div>

          <div id="informesGrid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.25rem; margin-top: 1rem;">
            <!-- Renderizado dinámico -->
          </div>
        </div>
      </div>
    `;
  },

  async afterRender() {
    await this.loadInformes();
  },

  async loadInformes() {
    try {
      const res = await window.FireTraceAPI.get('/bitacora');
      this.informes = res?.data || res || [];
    } catch (err) {
      console.warn('[BitacoraView] Fallback con datos por defecto:', err);
      this.informes = [];
    }

    if (!this.informes.length) {
      this.informes = [
        {
          id: 1,
          titulo: 'Incendios forestales - Cochabamba (2025)',
          tipo_informe: 'incendios_registrados',
          departamento: 'Cochabamba',
          departamentos: { nombre: 'Cochabamba' },
          periodo_analizado: 'Gestión Anual 2025',
          fuente_informacion: 'NASA FIRMS (Aqua/VIIRS) y Los Tiempos',
          formato_archivo: 'PDF',
          tamano_archivo_legible: '3.4 MB',
          total_descargas: 142,
          descripcion_contenido: 'Consolidado anual de incendios, áreas quemadas en Parque Tunari y respuesta operativa.'
        },
        {
          id: 2,
          titulo: 'Focos de calor MODIS/VIIRS Tunari 2026',
          tipo_informe: 'focos_de_calor',
          departamento: 'Cochabamba',
          departamentos: { nombre: 'Cochabamba' },
          periodo_analizado: 'Enero - Agosto 2026',
          fuente_informacion: 'NASA Space Apps / Aqua MODIS',
          formato_archivo: 'XLSX',
          tamano_archivo_legible: '1.8 MB',
          total_descargas: 89,
          descripcion_contenido: 'Base de datos de detecciones satelitales con latitud, longitud, FRP y temperatura de brillo.'
        },
        {
          id: 3,
          titulo: 'Evolución histórica del fuego en Cochabamba (2012-2023)',
          tipo_informe: 'evolucion_historica',
          departamento: 'Cochabamba',
          departamentos: { nombre: 'Cochabamba' },
          periodo_analizado: '2012 a 2023',
          fuente_informacion: 'Periódico Los Tiempos / ABT',
          formato_archivo: 'PDF',
          tamano_archivo_legible: '5.1 MB',
          total_descargas: 315,
          descripcion_contenido: 'Análisis de 1.045 incendios registrados y 91.583 hectáreas afectadas en el departamento.'
        },
        {
          id: 4,
          titulo: 'Zonas de mayor riesgo Tunari - Mapa de Vulnerabilidad',
          tipo_informe: 'zonas_de_riesgo',
          departamento: 'Cochabamba',
          departamentos: { nombre: 'Cochabamba' },
          periodo_analizado: 'Temporada Seca 2026',
          fuente_informacion: 'FireTrace Analytics / Modelos Bioclimáticos',
          formato_archivo: 'CSV',
          tamano_archivo_legible: '820 KB',
          total_descargas: 64,
          descripcion_contenido: 'Dataset estructurado con variables de combustible vegetal, pendiente y proximidad a fuentes de agua.'
        },
        {
          id: 5,
          titulo: 'Gran Chiquitanía: Detección y cicatriz de fuego 2024',
          tipo_informe: 'analisis_comparativo',
          departamento: 'Santa Cruz',
          departamentos: { nombre: 'Santa Cruz' },
          periodo_analizado: 'Mayo - Noviembre 2024',
          fuente_informacion: 'NASA Earth Observatory / GWIS',
          formato_archivo: 'PDF',
          tamano_archivo_legible: '6.8 MB',
          total_descargas: 420,
          descripcion_contenido: 'Estudio de caso multiespectral con imágenes Sentinel-2 y VIIRS sobre el impacto en Santa Cruz.'
        }
      ];
    }

    // Actualizar estadísticas de la biblioteca
    const totalDescargas = this.informes.reduce((acc, it) => acc + (it.total_descargas || 0), 0);
    const totInfEl = document.getElementById('bitacoraTotalInformes');
    const totDescEl = document.getElementById('bitacoraTotalDescargas');

    if (totInfEl) totInfEl.textContent = this.informes.length;
    if (totDescEl) totDescEl.textContent = totalDescargas.toLocaleString();

    this.filteredInformes = [...this.informes];
    this.renderInformesGrid();
  },

  renderInformesGrid() {
    const grid = document.getElementById('informesGrid');
    const conteoEl = document.getElementById('conteoResultados');
    if (!grid) return;

    if (conteoEl) {
      conteoEl.textContent = `${this.filteredInformes.length} archivo(s) encontrado(s)`;
    }

    if (!this.filteredInformes.length) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-surface); border-radius: 12px; border: 1px dashed var(--border-subtle);">
          <i class="ph ph-folder-dashed" style="font-size: 2.5rem; color: var(--text-muted);"></i>
          <h3 style="color: #fff; margin-top: 0.5rem;">No se encontraron informes</h3>
          <p style="font-size: 0.85rem; color: var(--text-muted); margin-top: 0.25rem;">Prueba cambiando los filtros seleccionados.</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = this.filteredInformes.map(inf => {
      const fmt = (inf.formato_archivo || 'PDF').toUpperCase();
      let iconClass = 'ph-file-pdf';
      let iconColor = '#ef4444';
      let iconBg = 'rgba(239, 68, 68, 0.15)';

      if (fmt === 'XLSX' || fmt === 'XLS') {
        iconClass = 'ph-file-xls';
        iconColor = '#22c55e';
        iconBg = 'rgba(34, 197, 94, 0.15)';
      } else if (fmt === 'CSV') {
        iconClass = 'ph-file-csv';
        iconColor = '#38bdf8';
        iconBg = 'rgba(56, 189, 248, 0.15)';
      }

      const depto = inf.departamentos?.nombre || inf.departamento || 'Bolivia';

      return `
        <div class="informe-card side-card" style="display: flex; flex-direction: column; justify-content: space-between; padding: 1.5rem; border: 1px solid var(--border-subtle); transition: transform 0.25s ease, border-color 0.25s ease;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 0.5rem;">
              <div style="width: 44px; height: 44px; border-radius: 10px; background: ${iconBg}; color: ${iconColor}; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
                <i class="ph ${iconClass}"></i>
              </div>
              <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem;">
                <span class="badge" style="background: ${iconBg}; color: ${iconColor}; font-weight: 700;">
                  ${fmt}
                </span>
                <span style="font-size: 0.72rem; color: var(--text-muted);">
                  ${inf.tamano_archivo_legible || '2.4 MB'}
                </span>
              </div>
            </div>

            <h3 style="font-family: var(--font-display); font-size: 1.05rem; font-weight: 700; color: #fff; margin-top: 1rem; line-height: 1.35;">
              ${inf.titulo}
            </h3>

            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.4rem; line-height: 1.4;">
              ${inf.descripcion_contenido || 'Sin descripción detallada.'}
            </p>

            <div style="margin-top: 0.85rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle); font-size: 0.75rem; color: var(--text-muted); display: flex; flex-direction: column; gap: 0.25rem;">
              <div><strong style="color: #cbd5e1;">Período:</strong> ${inf.periodo_analizado}</div>
              <div><strong style="color: #cbd5e1;">Departamento:</strong> ${depto}</div>
              <div><strong style="color: #cbd5e1;">Fuente:</strong> ${inf.fuente_informacion}</div>
            </div>
          </div>

          <div style="display: flex; align-items: center; justify-content: space-between; margin-top: 1.25rem; padding-top: 0.75rem; border-top: 1px solid var(--border-subtle);">
            <span style="font-size: 0.75rem; color: var(--text-muted); display: flex; align-items: center; gap: 0.35rem;">
              <i class="ph ph-download-simple"></i> <strong id="descargasCount_${inf.id}">${inf.total_descargas || 0}</strong> descargas
            </span>
            <button class="btn btn-secondary btn-sm" onclick="BitacoraView.descargarInforme(${inf.id})">
              <i class="ph ph-download"></i> Descargar
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  aplicarFiltros() {
    const tipo = document.getElementById('filtroTipo')?.value || 'todos';
    const depto = document.getElementById('filtroDepto')?.value || 'todos';
    const formato = document.getElementById('filtroFormato')?.value || 'todos';
    const texto = (document.getElementById('filtroTexto')?.value || '').toLowerCase();

    this.filteredInformes = this.informes.filter(inf => {
      const matchTipo = tipo === 'todos' || inf.tipo_informe === tipo;
      const infDepto = inf.departamentos?.nombre || inf.departamento || '';
      const matchDepto = depto === 'todos' || infDepto === depto;
      const matchFormato = formato === 'todos' || (inf.formato_archivo || '').toUpperCase() === formato;
      const matchTexto = !texto || (inf.titulo || '').toLowerCase().includes(texto) || (inf.descripcion_contenido || '').toLowerCase().includes(texto);

      return matchTipo && matchDepto && matchFormato && matchTexto;
    });

    this.renderInformesGrid();
  },

  descargarInforme(id) {
    const inf = this.informes.find(i => i.id === id);
    if (!inf) return;

    // Incrementar contador visual
    inf.total_descargas = (inf.total_descargas || 0) + 1;
    const countEl = document.getElementById(`descargasCount_${id}`);
    if (countEl) countEl.textContent = inf.total_descargas;

    const totDescEl = document.getElementById('bitacoraTotalDescargas');
    if (totDescEl) {
      const total = this.informes.reduce((acc, it) => acc + (it.total_descargas || 0), 0);
      totDescEl.textContent = total.toLocaleString();
    }

    showToast(`Iniciando descarga: ${inf.titulo} (${inf.formato_archivo})`, 'success');

    // Generar archivo virtual descargable si no hay archivo real en disco
    const dummyContent = `FIRETRACE BOLIVIA - REPORTE TECNICO\nDocumento: ${inf.titulo}\nPeriodo: ${inf.periodo_analizado}\nFuente: ${inf.fuente_informacion}\nFormato: ${inf.formato_archivo}\nGenerado el: ${new Date().toISOString()}`;
    const blob = new Blob([dummyContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${inf.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}.${inf.formato_archivo.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  exportAllCSV() {
    let csv = 'ID,Titulo,Tipo,Departamento,Periodo,Fuente,Formato,Descargas\n';
    this.informes.forEach(i => {
      const depto = i.departamentos?.nombre || i.departamento || '';
      csv += `"${i.id}","${i.titulo}","${i.tipo_informe}","${depto}","${i.periodo_analizado}","${i.fuente_informacion}","${i.formato_archivo}","${i.total_descargas}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FireTrace_Catalogo_Informes_${new Date().getFullYear()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast('Catálogo completo exportado a CSV', 'success');
  }
};

// Registro en el Router SPA para ambas variantes de ruta
if (typeof App !== 'undefined') {
  App.register('bitacora-bosque', () => BitacoraView.render(), () => BitacoraView.afterRender());
  App.register('bitacora', () => BitacoraView.render(), () => BitacoraView.afterRender());
}
