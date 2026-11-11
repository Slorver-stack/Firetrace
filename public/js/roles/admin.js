/**
 * FireTrace - Panel de Administración
 * CRUD completo: usuarios, incendios, alertas, reportes, voluntariado
 */

const AdminView = {

  async render() {
    return `
    <div class="admin-shell">
      <!-- Tabs de navegación admin -->
      <div class="admin-tabs">
        <button class="admin-tab active" data-tab="dashboard" onclick="AdminView.switchTab('dashboard')">
          <i class="ph ph-squares-four"></i> Dashboard
        </button>
        <button class="admin-tab" data-tab="usuarios" onclick="AdminView.switchTab('usuarios')">
          <i class="ph ph-users"></i> Usuarios
        </button>
        <button class="admin-tab" data-tab="incendios" onclick="AdminView.switchTab('incendios')">
          <i class="ph ph-flame"></i> Incendios
        </button>
        <button class="admin-tab" data-tab="alertas" onclick="AdminView.switchTab('alertas')">
          <i class="ph ph-siren"></i> Alertas
        </button>
        <button class="admin-tab" data-tab="reportes" onclick="AdminView.switchTab('reportes')">
          <i class="ph ph-megaphone"></i> Reportes
        </button>
        <button class="admin-tab" data-tab="voluntariado" onclick="AdminView.switchTab('voluntariado')">
          <i class="ph ph-hand-heart"></i> Voluntariado
        </button>
      </div>
      <div class="admin-content" id="adminContent">
        ${skeletonLoader(4)}
      </div>
    </div>`;
  },

  async afterRender() {
    await AdminView.switchTab('dashboard');
    AdminView._updateRightPanel();
  },

  _updateRightPanel() {
    const rp = document.getElementById('rightPanel');
    if (!rp) return;
    rp.innerHTML = `
      <div class="rp-card rp-admin-info">
        <div class="rp-card-header"><i class="ph ph-shield-star"></i> Panel Administrador</div>
        <p style="font-size:0.82rem;color:var(--color-text-muted);margin-top:.5rem;">Tienes acceso completo a todos los módulos del sistema FireTrace.</p>
        <hr class="ft-divider">
        <div class="rp-admin-links">
          <button class="admin-quick-btn" onclick="AdminView.switchTab('usuarios')"><i class="ph ph-user-plus"></i> Nuevo Usuario</button>
          <button class="admin-quick-btn" onclick="AdminView.switchTab('incendios')"><i class="ph ph-flame"></i> Ver Incendios</button>
          <button class="admin-quick-btn" onclick="AdminView.switchTab('reportes')"><i class="ph ph-clipboard-text"></i> Reportes Pendientes</button>
        </div>
      </div>`;
  },

  async switchTab(tab) {
    document.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
    const activeBtn = document.querySelector(`.admin-tab[data-tab="${tab}"]`);
    if (activeBtn) activeBtn.classList.add('active');

    const content = document.getElementById('adminContent');
    if (!content) return;
    content.innerHTML = skeletonLoader(3);

    switch(tab) {
      case 'dashboard':   await AdminView._renderDashboard(content); break;
      case 'usuarios':    await AdminView._renderUsuarios(content); break;
      case 'incendios':   await AdminView._renderIncendios(content); break;
      case 'alertas':     await AdminView._renderAlertas(content); break;
      case 'reportes':    await AdminView._renderReportes(content); break;
      case 'voluntariado':await AdminView._renderVoluntariado(content); break;
    }
  },

  // ── DASHBOARD ADMIN ──────────────────────────────────────────────────────
  async _renderDashboard(container) {
    const [stats, alertas, reportes, voluntariado] = await Promise.all([
      FireTraceAPI.getEstadisticasDashboard().catch(() => ({ data: {} })),
      FireTraceAPI.getAlertas().catch(() => ({ data: [] })),
      FireTraceAPI.getReportes().catch(() => ({ data: [] })),
      FireTraceAPI.getVoluntariado().catch(() => ({ data: [] }))
    ]);

    const s = stats.data || {};
    const alertasData = alertas.data || [];
    const reportesData = reportes.data || [];
    const volData = voluntariado.data || [];
    const pendientes = reportesData.filter(r => r.estado === 'pendiente_revision').length;
    const volPendientes = volData.filter(v => v.estado === 'recibido').length;

    container.innerHTML = `
      <div class="admin-dashboard">
        <h2 class="admin-section-title"><i class="ph ph-squares-four"></i> Resumen del Sistema</h2>
        <div class="grid-4" style="margin-bottom:1.5rem">
          ${AdminView._kpi('Incendios Activos', s.incendios_activos || 0, 'ph-flame', 'var(--color-critical)')}
          ${AdminView._kpi('Incendios Controlados', s.incendios_controlados || 0, 'ph-check-circle', 'var(--color-warning)')}
          ${AdminView._kpi('Focos Calor (24h)', s.focos_ultimas_24h || 0, 'ph-thermometer', 'var(--color-fire-primary)')}
          ${AdminView._kpi('Alertas Activas', alertasData.length, 'ph-siren', 'var(--color-critical)')}
        </div>
        <div class="grid-4" style="margin-bottom:1.5rem">
          ${AdminView._kpi('Reportes Pendientes', pendientes, 'ph-megaphone', 'var(--color-warning)')}
          ${AdminView._kpi('Solicitudes Voluntariado', volPendientes, 'ph-hand-heart', 'var(--color-safe)')}
          ${AdminView._kpi('Incendios Extinguidos', s.incendios_extinguidos || 0, 'ph-check-fat', 'var(--color-safe)')}
          ${AdminView._kpi('Zonas en Vigilancia', 12, 'ph-eye', 'var(--color-medium)')}
        </div>

        <div class="grid-2">
          <div class="ft-card">
            <div class="section-header">
              <span class="section-title"><i class="ph ph-siren"></i> Alertas Activas</span>
              <button class="btn-ghost btn-sm" onclick="AdminView.switchTab('alertas')">Ver todas</button>
            </div>
            ${alertasData.slice(0,4).map(a => `
              <div class="info-row">
                <span class="info-row-label"><i class="ph ph-dot-outline" style="color:${a.prioridad==='critica'?'var(--color-critical)':'var(--color-warning)'}"></i>${a.titulo}</span>
                <span class="badge ${a.prioridad==='critica'?'badge-activo':'badge-medio'}">${a.prioridad}</span>
              </div>`).join('') || '<p class="text-muted">Sin alertas activas</p>'}
          </div>
          <div class="ft-card">
            <div class="section-header">
              <span class="section-title"><i class="ph ph-megaphone"></i> Reportes Recientes</span>
              <button class="btn-ghost btn-sm" onclick="AdminView.switchTab('reportes')">Ver todos</button>
            </div>
            ${reportesData.slice(0,4).map(r => `
              <div class="info-row">
                <span class="info-row-label"><i class="ph ph-map-pin"></i>${r.zona_o_referencia}</span>
                <span class="badge ${r.estado==='pendiente_revision'?'badge-activo':'badge-extinguido'}">${r.estado.replace('_',' ')}</span>
              </div>`).join('') || '<p class="text-muted">Sin reportes recientes</p>'}
          </div>
        </div>
      </div>`;
  },

  _kpi(label, value, icon, color) {
    return `
      <div class="kpi-card" style="border-top:3px solid ${color}">
        <i class="ph ${icon}" style="font-size:1.5rem;color:${color};margin-bottom:.5rem;display:block"></i>
        <div class="kpi-value" style="color:${color}">${value}</div>
        <div class="kpi-label">${label}</div>
      </div>`;
  },

  // ── GESTIÓN DE USUARIOS ───────────────────────────────────────────────────
  async _renderUsuarios(container) {
    try {
      const res = await FireTraceAPI.getUsuarios();
      const usuarios = res.data || [];

      container.innerHTML = `
        <div class="admin-usuarios">
          <div class="section-header">
            <h2 class="admin-section-title"><i class="ph ph-users"></i> Gestión de Usuarios (${usuarios.length})</h2>
            <div style="display:flex;gap:.5rem;align-items:center">
              <select class="ft-select" style="width:140px" onchange="AdminView._filterUsuarios(this.value)">
                <option value="">Todos los roles</option>
                <option value="administrador">Administrador</option>
                <option value="bombero_respuesta">Bombero / SAR</option>
                <option value="voluntario">Voluntario</option>
                <option value="ciudadano">Ciudadano</option>
              </select>
              <button class="btn-fire" onclick="AdminView.showCrearUsuario()">
                <i class="ph ph-user-plus"></i> Nuevo Usuario
              </button>
            </div>
          </div>
          <div class="ft-card" style="overflow-x:auto">
            <table class="ft-table" id="tablaUsuarios">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Email</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                ${usuarios.map(u => AdminView._usuarioRow(u)).join('')}
              </tbody>
            </table>
          </div>
        </div>`;
    } catch(e) {
      container.innerHTML = `<div class="error-view"><i class="ph ph-warning"></i><p>${e.message}</p></div>`;
    }
  },

  _usuarioRow(u) {
    const rolLabels = {
      'administrador':'Administrador','bombero_respuesta':'Bombero / SAR',
      'voluntario':'Voluntario','ciudadano':'Ciudadano'
    };
    const rolColors = {
      'administrador':'var(--color-fire-primary)','bombero_respuesta':'var(--color-critical)',
      'voluntario':'var(--color-safe)','ciudadano':'var(--color-medium)'
    };
    return `
      <tr data-rol="${u.rol}">
        <td><strong>${u.nombre_completo}</strong></td>
        <td><code style="background:rgba(255,255,255,.04);padding:2px 6px;border-radius:4px;font-size:.8rem">${u.usuario}</code></td>
        <td style="color:var(--color-text-muted);font-size:.82rem">${u.email}</td>
        <td><span style="color:${rolColors[u.rol]||'var(--color-text-sec)'};font-weight:600;font-size:.82rem">${rolLabels[u.rol]||u.rol}</span></td>
        <td><span class="${u.activo?'badge badge-extinguido':'badge risk-alto'}">${u.activo?'Activo':'Inactivo'}</span></td>
        <td style="color:var(--color-text-muted);font-size:.78rem">${formatDate(u.creado_el)}</td>
        <td>
          <div style="display:flex;gap:.35rem">
            <button class="btn-ghost btn-sm" onclick="AdminView.editarUsuario(${u.id})" title="Editar">
              <i class="ph ph-pencil"></i>
            </button>
            <button class="${u.activo?'btn-ghost':'btn-safe'} btn-sm" onclick="AdminView.toggleUsuario(${u.id},${!u.activo})" title="${u.activo?'Desactivar':'Activar'}">
              <i class="ph ph-${u.activo?'prohibit':'check'}"></i>
            </button>
            <button class="btn-critical btn-sm" onclick="AdminView.eliminarUsuario(${u.id},'${u.nombre_completo}')" title="Eliminar">
              <i class="ph ph-trash"></i>
            </button>
          </div>
        </td>
      </tr>`;
  },

  _filterUsuarios(rol) {
    document.querySelectorAll('#tablaUsuarios tbody tr').forEach(tr => {
      tr.style.display = (!rol || tr.dataset.rol === rol) ? '' : 'none';
    });
  },

  showCrearUsuario() {
    openModal(`
      <form id="formCrearUsuario" onsubmit="AdminView.crearUsuario(event)">
        <div class="form-row">
          <div class="form-group">
            <label class="ft-label">Nombre Completo *</label>
            <input class="ft-input" name="nombre_completo" required placeholder="Ej: Juan Pérez">
          </div>
          <div class="form-group">
            <label class="ft-label">Nombre de Usuario *</label>
            <input class="ft-input" name="usuario" required placeholder="juanperez123">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="ft-label">Email *</label>
            <input class="ft-input" type="email" name="email" required placeholder="correo@ejemplo.bo">
          </div>
          <div class="form-group">
            <label class="ft-label">Teléfono</label>
            <input class="ft-input" name="telefono" placeholder="+591 7XXXXXXX">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="ft-label">Contraseña *</label>
            <input class="ft-input" type="password" name="password" required placeholder="Mínimo 6 caracteres">
          </div>
          <div class="form-group">
            <label class="ft-label">Rol *</label>
            <select class="ft-select" name="rol" required>
              <option value="ciudadano">Ciudadano</option>
              <option value="voluntario">Voluntario</option>
              <option value="bombero_respuesta">Bombero / SAR</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
          <button type="button" class="btn-ghost" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn-fire"><i class="ph ph-user-plus"></i> Crear Usuario</button>
        </div>
      </form>`, 'Nuevo Usuario');
  },

  async crearUsuario(e) {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    try {
      await FireTraceAPI.createUsuario(data);
      closeModal();
      showToast('Usuario creado correctamente', 'success');
      await AdminView._renderUsuarios(document.getElementById('adminContent'));
    } catch(err) { showToast(err.message, 'error'); }
  },

  async editarUsuario(id) {
    try {
      const res = await FireTraceAPI.get(`/usuarios/${id}`).catch(() => null);
      openModal(`
        <form id="formEditarUsuario" onsubmit="AdminView.actualizarUsuario(event,${id})">
          <div class="form-row">
            <div class="form-group">
              <label class="ft-label">Nombre Completo *</label>
              <input class="ft-input" name="nombre_completo" required>
            </div>
            <div class="form-group">
              <label class="ft-label">Teléfono</label>
              <input class="ft-input" name="telefono">
            </div>
          </div>
          <div class="form-group">
            <label class="ft-label">Rol *</label>
            <select class="ft-select" name="rol" required>
              <option value="ciudadano">Ciudadano</option>
              <option value="voluntario">Voluntario</option>
              <option value="bombero_respuesta">Bombero / SAR</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>
          <div class="form-group">
            <label class="ft-label">Nueva Contraseña (dejar vacío para no cambiar)</label>
            <input class="ft-input" type="password" name="password" placeholder="Nueva contraseña...">
          </div>
          <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
            <button type="button" class="btn-ghost" onclick="closeModal()">Cancelar</button>
            <button type="submit" class="btn-fire"><i class="ph ph-floppy-disk"></i> Guardar Cambios</button>
          </div>
        </form>`, `Editar Usuario #${id}`);
    } catch(e) { showToast(e.message, 'error'); }
  },

  async actualizarUsuario(e, id) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    if (!data.password) delete data.password;
    try {
      await FireTraceAPI.updateUsuario(id, data);
      closeModal();
      showToast('Usuario actualizado', 'success');
      await AdminView._renderUsuarios(document.getElementById('adminContent'));
    } catch(err) { showToast(err.message, 'error'); }
  },

  async toggleUsuario(id, nuevoEstado) {
    try {
      await FireTraceAPI.updateUsuario(id, { activo: nuevoEstado });
      showToast(nuevoEstado ? 'Usuario activado' : 'Usuario desactivado', 'success');
      await AdminView._renderUsuarios(document.getElementById('adminContent'));
    } catch(e) { showToast(e.message, 'error'); }
  },

  async eliminarUsuario(id, nombre) {
    if (!confirm(`¿Confirmas eliminar al usuario "${nombre}"? Esta acción no se puede deshacer.`)) return;
    try {
      await FireTraceAPI.deleteUsuario(id);
      showToast('Usuario eliminado', 'success');
      await AdminView._renderUsuarios(document.getElementById('adminContent'));
    } catch(e) { showToast(e.message, 'error'); }
  },

  // ── GESTIÓN DE INCENDIOS ──────────────────────────────────────────────────
  async _renderIncendios(container) {
    try {
      const res = await FireTraceAPI.getIncendios();
      const incendios = res.data || [];
      container.innerHTML = `
        <div class="section-header">
          <h2 class="admin-section-title"><i class="ph ph-flame"></i> Gestión de Incendios (${incendios.length})</h2>
          <div style="display:flex;gap:.5rem">
            <select class="ft-select" style="width:140px" onchange="AdminView._filterIncendios(this.value)">
              <option value="">Todos los estados</option>
              <option value="activo">Activo</option>
              <option value="bajo_seguimiento">Seguimiento</option>
              <option value="controlado">Controlado</option>
              <option value="extinguido">Extinguido</option>
            </select>
            <button class="btn-fire" onclick="AdminView.showCrearIncendio()">
              <i class="ph ph-plus"></i> Registrar Incendio
            </button>
          </div>
        </div>
        <div class="ft-card" style="overflow-x:auto">
          <table class="ft-table" id="tablaIncendios">
            <thead><tr>
              <th>Código</th><th>Nombre</th><th>Zona / Municipio</th>
              <th>Hectáreas</th><th>Nivel Riesgo</th><th>Estado</th>
              <th>Fecha Inicio</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              ${incendios.map(i => `
                <tr data-estado="${i.estado}">
                  <td><code style="font-size:.75rem;color:var(--color-fire-primary)">${i.codigo_incendio}</code></td>
                  <td><strong style="font-size:.85rem">${i.nombre}</strong></td>
                  <td style="font-size:.8rem;color:var(--color-text-muted)">${i.zonas_interes?.nombre || ''} / ${i.municipios?.nombre || ''}</td>
                  <td><strong style="color:var(--color-warning)">${parseFloat(i.hectareas_afectadas||0).toFixed(0)}</strong> ha</td>
                  <td>${riskBadge(i.nivel_riesgo)}</td>
                  <td>${estadoBadge(i.estado)}</td>
                  <td style="font-size:.78rem;color:var(--color-text-muted)">${formatDate(i.fecha_inicio)}</td>
                  <td>
                    <div style="display:flex;gap:.35rem">
                      <button class="btn-ghost btn-sm" onclick="App.navigate('incendio-vivo')" title="Ver en vivo"><i class="ph ph-eye"></i></button>
                      <button class="btn-ghost btn-sm" onclick="AdminView.cambiarEstadoIncendio(${i.id},'${i.estado}')" title="Cambiar Estado"><i class="ph ph-arrows-clockwise"></i></button>
                    </div>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>`;
    } catch(e) {
      container.innerHTML = `<div class="error-view"><i class="ph ph-warning"></i><p>${e.message}</p></div>`;
    }
  },

  _filterIncendios(estado) {
    document.querySelectorAll('#tablaIncendios tbody tr').forEach(tr => {
      tr.style.display = (!estado || tr.dataset.estado === estado) ? '' : 'none';
    });
  },

  async cambiarEstadoIncendio(id, estadoActual) {
    const estados = ['activo','bajo_seguimiento','controlado','extinguido'];
    const idx = estados.indexOf(estadoActual);
    const nuevoEstado = estados[(idx+1) % estados.length];
    if (!confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) return;
    try {
      await FireTraceAPI.updateIncendio(id, { estado: nuevoEstado });
      showToast(`Estado cambiado a: ${nuevoEstado}`, 'success');
      await AdminView._renderIncendios(document.getElementById('adminContent'));
    } catch(e) { showToast(e.message, 'error'); }
  },

  showCrearIncendio() {
    openModal(`
      <form id="formCrearIncendio" onsubmit="AdminView.crearIncendio(event)">
        <div class="form-group">
          <label class="ft-label">Nombre del Incendio *</label>
          <input class="ft-input" name="nombre" required placeholder="Ej: Incendio Serranía Tunari Norte">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="ft-label">Código *</label>
            <input class="ft-input" name="codigo_incendio" required placeholder="INC-CBB-2026-003">
          </div>
          <div class="form-group">
            <label class="ft-label">Nivel de Riesgo *</label>
            <select class="ft-select" name="nivel_riesgo" required>
              <option value="bajo">Bajo</option>
              <option value="medio">Medio</option>
              <option value="alto" selected>Alto</option>
              <option value="critico">Crítico</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="ft-label">Latitud *</label>
            <input class="ft-input" name="latitud" type="number" step="0.0000001" required placeholder="-17.2954">
          </div>
          <div class="form-group">
            <label class="ft-label">Longitud *</label>
            <input class="ft-input" name="longitud" type="number" step="0.0000001" required placeholder="-66.1789">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="ft-label">Zona ID *</label>
            <input class="ft-input" name="zona_id" type="number" required value="1">
          </div>
          <div class="form-group">
            <label class="ft-label">Municipio ID *</label>
            <input class="ft-input" name="municipio_id" type="number" required value="1">
          </div>
        </div>
        <div class="form-group">
          <label class="ft-label">Fuente de Información</label>
          <input class="ft-input" name="fuente_informacion" value="Aqua MODIS / VIIRS / Reporte Técnico SAR">
        </div>
        <div class="form-group">
          <label class="ft-label">Resumen de la Situación</label>
          <textarea class="ft-input" name="resumen_situacion" rows="3" style="resize:vertical"></textarea>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
          <button type="button" class="btn-ghost" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn-fire"><i class="ph ph-flame"></i> Registrar</button>
        </div>
      </form>`, 'Registrar Nuevo Incendio');
  },

  async crearIncendio(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    data.departamento_id = 1;
    data.fecha_inicio = new Date().toISOString();
    data.ultima_actualizacion = new Date().toISOString();
    data.estado = 'activo';
    try {
      await FireTraceAPI.createIncendio(data);
      closeModal();
      showToast('Incendio registrado correctamente', 'success');
      await AdminView._renderIncendios(document.getElementById('adminContent'));
    } catch(err) { showToast(err.message, 'error'); }
  },

  // ── GESTIÓN DE ALERTAS ────────────────────────────────────────────────────
  async _renderAlertas(container) {
    try {
      const res = await FireTraceAPI.getAlertas();
      const alertas = res.data || [];
      container.innerHTML = `
        <div class="section-header">
          <h2 class="admin-section-title"><i class="ph ph-siren"></i> Alertas Activas (${alertas.length})</h2>
          <button class="btn-fire" onclick="AdminView.showCrearAlerta()"><i class="ph ph-plus"></i> Nueva Alerta</button>
        </div>
        <div style="display:flex;flex-direction:column;gap:.75rem">
          ${alertas.map(a => `
            <div class="ft-card" style="border-left:3px solid ${a.prioridad==='critica'?'var(--color-critical)':'var(--color-warning)'}">
              <div class="section-header">
                <div>
                  <strong>${a.titulo}</strong>
                  <span class="badge ${a.prioridad==='critica'?'badge-activo':'badge-medio'}" style="margin-left:.5rem">${a.prioridad}</span>
                  <span class="badge" style="margin-left:.25rem;background:rgba(255,255,255,.05)">${a.tipo_alerta.replace(/_/g,' ')}</span>
                </div>
                <button class="btn-critical btn-sm" onclick="AdminView.desactivarAlerta(${a.id})">
                  <i class="ph ph-x"></i> Desactivar
                </button>
              </div>
              <p style="font-size:.82rem;color:var(--color-text-muted);margin:.5rem 0">${a.mensaje}</p>
              <div style="font-size:.75rem;color:var(--color-text-disabled)">${formatDate(a.fecha_emision)} · Radio: ${a.radio_afectacion_km} km</div>
            </div>`).join('') || '<div class="ft-card"><p class="text-muted">Sin alertas activas en este momento.</p></div>'}
        </div>`;
    } catch(e) {
      container.innerHTML = `<div class="error-view"><p>${e.message}</p></div>`;
    }
  },

  async desactivarAlerta(id) {
    if (!confirm('¿Desactivar esta alerta?')) return;
    try {
      await FireTraceAPI.desactivarAlerta(id);
      showToast('Alerta desactivada', 'success');
      await AdminView._renderAlertas(document.getElementById('adminContent'));
    } catch(e) { showToast(e.message, 'error'); }
  },

  showCrearAlerta() {
    openModal(`
      <form onsubmit="AdminView.crearAlerta(event)">
        <div class="form-group">
          <label class="ft-label">Título *</label>
          <input class="ft-input" name="titulo" required placeholder="ALERTA CRÍTICA · INCENDIO ACTIVO">
        </div>
        <div class="form-group">
          <label class="ft-label">Mensaje *</label>
          <textarea class="ft-input" name="mensaje" required rows="3" style="resize:vertical"></textarea>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="ft-label">Tipo de Alerta</label>
            <select class="ft-select" name="tipo_alerta">
              <option value="critica_incendio">Crítica - Incendio</option>
              <option value="preventiva_meteorologica">Preventiva Meteorológica</option>
              <option value="reactivacion_detectada">Reactivación Detectada</option>
              <option value="informativa_general">Informativa General</option>
            </select>
          </div>
          <div class="form-group">
            <label class="ft-label">Prioridad</label>
            <select class="ft-select" name="prioridad">
              <option value="baja">Baja</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
              <option value="critica">Crítica</option>
            </select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="ft-label">Zona ID *</label>
            <input class="ft-input" name="zona_id" type="number" value="1" required>
          </div>
          <div class="form-group">
            <label class="ft-label">Radio de Afectación (km)</label>
            <input class="ft-input" name="radio_afectacion_km" type="number" value="10" step="0.1">
          </div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:.75rem;margin-top:1rem">
          <button type="button" class="btn-ghost" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn-critical"><i class="ph ph-siren"></i> Emitir Alerta</button>
        </div>
      </form>`, 'Nueva Alerta');
  },

  async crearAlerta(e) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.target));
    try {
      await FireTraceAPI.createAlerta(data);
      closeModal();
      showToast('Alerta emitida correctamente', 'fire');
      await AdminView._renderAlertas(document.getElementById('adminContent'));
    } catch(err) { showToast(err.message, 'error'); }
  },

  // ── REPORTES CIUDADANOS ───────────────────────────────────────────────────
  async _renderReportes(container) {
    try {
      const res = await FireTraceAPI.getReportes();
      const reportes = res.data || [];
      container.innerHTML = `
        <div class="section-header">
          <h2 class="admin-section-title"><i class="ph ph-megaphone"></i> Reportes Ciudadanos (${reportes.length})</h2>
          <select class="ft-select" style="width:170px" onchange="AdminView._filterReportes(this.value)">
            <option value="">Todos los estados</option>
            <option value="pendiente_revision">Pendiente Revisión</option>
            <option value="en_revision">En Revisión</option>
            <option value="vinculado_incendio">Vinculado a Incendio</option>
            <option value="descartado">Descartado</option>
          </select>
        </div>
        <div style="display:flex;flex-direction:column;gap:.75rem" id="listaReportes">
          ${reportes.map(r => `
            <div class="ft-card reporte-item" data-estado="${r.estado}">
              <div class="section-header">
                <div>
                  <strong>${r.zona_o_referencia}</strong>
                  <span class="badge ${r.estado==='pendiente_revision'?'badge-activo':r.estado==='vinculado_incendio'?'badge-controlado':'badge-extinguido'}" style="margin-left:.5rem">
                    ${r.estado.replace(/_/g,' ')}
                  </span>
                </div>
                <div style="display:flex;gap:.35rem">
                  <select class="ft-select" style="width:170px" onchange="AdminView.cambiarEstadoReporte(${r.id},this.value)">
                    <option value="pendiente_revision" ${r.estado==='pendiente_revision'?'selected':''}>Pendiente Revisión</option>
                    <option value="en_revision" ${r.estado==='en_revision'?'selected':''}>En Revisión</option>
                    <option value="vinculado_incendio" ${r.estado==='vinculado_incendio'?'selected':''}>Vinculado a Incendio</option>
                    <option value="descartado" ${r.estado==='descartado'?'selected':''}>Descartado</option>
                  </select>
                </div>
              </div>
              <p style="font-size:.82rem;color:var(--color-text-sec);margin:.5rem 0">${r.descripcion}</p>
              <div style="font-size:.75rem;color:var(--color-text-muted)">
                Reportante: ${r.nombre_reportante||'Anónimo'} · Tel: ${r.telefono_contacto||'N/D'} · ${formatDate(r.fecha_hora_reporte)}
              </div>
            </div>`).join('') || '<div class="ft-card"><p class="text-muted">Sin reportes.</p></div>'}
        </div>`;
    } catch(e) {
      container.innerHTML = `<div class="error-view"><p>${e.message}</p></div>`;
    }
  },

  _filterReportes(estado) {
    document.querySelectorAll('.reporte-item').forEach(el => {
      el.style.display = (!estado || el.dataset.estado === estado) ? '' : 'none';
    });
  },

  async cambiarEstadoReporte(id, estado) {
    try {
      await FireTraceAPI.updateReporte(id, { estado });
      showToast('Estado del reporte actualizado', 'success');
    } catch(e) { showToast(e.message, 'error'); }
  },

  // ── VOLUNTARIADO ──────────────────────────────────────────────────────────
  async _renderVoluntariado(container) {
    try {
      const res = await FireTraceAPI.getVoluntariado();
      const solicitudes = res.data || [];
      container.innerHTML = `
        <div class="section-header">
          <h2 class="admin-section-title"><i class="ph ph-hand-heart"></i> Solicitudes de Voluntariado (${solicitudes.length})</h2>
        </div>
        <div class="ft-card" style="overflow-x:auto">
          <table class="ft-table">
            <thead><tr>
              <th>Nombre</th><th>Email</th><th>Teléfono</th><th>Ciudad</th>
              <th>Área de Interés</th><th>Estado</th><th>Fecha</th><th>Acciones</th>
            </tr></thead>
            <tbody>
              ${solicitudes.map(s => `
                <tr>
                  <td><strong>${s.nombre_completo}</strong></td>
                  <td style="font-size:.8rem">${s.email}</td>
                  <td style="font-size:.8rem">${s.telefono}</td>
                  <td style="font-size:.8rem;color:var(--color-text-muted)">${s.ciudad_residencia}</td>
                  <td><span class="badge badge-medio" style="font-size:.7rem">${s.area_interes.replace(/_/g,' ')}</span></td>
                  <td>
                    <select class="ft-select" style="font-size:.78rem;padding:.3rem .5rem" onchange="AdminView.cambiarEstadoVoluntariado(${s.id},this.value)">
                      <option value="recibido" ${s.estado==='recibido'?'selected':''}>Recibido</option>
                      <option value="contactado" ${s.estado==='contactado'?'selected':''}>Contactado</option>
                      <option value="en_capacitacion" ${s.estado==='en_capacitacion'?'selected':''}>En Capacitación</option>
                      <option value="habilitado" ${s.estado==='habilitado'?'selected':''}>Habilitado</option>
                      <option value="rechazado" ${s.estado==='rechazado'?'selected':''}>Rechazado</option>
                    </select>
                  </td>
                  <td style="font-size:.75rem;color:var(--color-text-muted)">${formatDate(s.fecha_solicitud)}</td>
                  <td>
                    <button class="btn-ghost btn-sm" onclick="AdminView.verMotivacion('${s.nombre_completo}','${(s.motivacion_o_experiencia||'').replace(/'/g,"\\'")}')">
                      <i class="ph ph-eye"></i>
                    </button>
                  </td>
                </tr>`).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--color-text-muted)">Sin solicitudes</td></tr>'}
            </tbody>
          </table>
        </div>`;
    } catch(e) {
      container.innerHTML = `<div class="error-view"><p>${e.message}</p></div>`;
    }
  },

  async cambiarEstadoVoluntariado(id, estado) {
    try {
      await FireTraceAPI._fetch('PUT', `/voluntariado/${id}`, { estado });
      showToast('Estado actualizado', 'success');
    } catch(e) { showToast(e.message, 'error'); }
  },

  verMotivacion(nombre, texto) {
    openModal(`<p style="line-height:1.7;color:var(--color-text-sec)">${texto}</p>`, `Motivación: ${nombre}`);
  }
};

// Registrar en el router
if (typeof App !== 'undefined') {
  App.register('admin', () => AdminView.render(), () => AdminView.afterRender());
}
window.AdminView = AdminView;
