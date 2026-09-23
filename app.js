const STORAGE_KEYS = {
  MACHINES: 'DELTA_MACHINES_DATA',
  TEAMS: 'DELTA_TEAMS_DATA',
  USERS: 'DELTA_USERS_DATA',
  GEMINI_KEY: 'DELTA_GEMINI_KEY',
  CURRENT_USER: 'DELTA_CURRENT_USER'
};

const IDB_NAME = 'delta-cnc-db';
const IDB_VERSION = 1;
const IDB_STORE = 'pdfs';

const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-3.8-flash'];
const MODELO_GEMINI = GEMINI_MODELS[0];

const SAMPLE_PDF_BASE64 = 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsOfCjEgMCBvYmoKPDwKL1R5cGUgL0NhdGFsb2cKL1BhZ2VzIDIgMCBSCj4+CmVuZG9iagoyIDAgb2JqCjw8Ci9UeXBlIC9QYWdlcwovS2lkcyBbMyAwIFJdCi9Db3VudCAxCj4+CmVuZG9iagozIDAgb2JqCjw8Ci9UeXBlIC9QYWdlCi9QYXJlbnQgMiAwIFIKL01lZGlhQm94IFswIDAgNjEyIDc5Ml0KL1Jlc291cmNlcyA8PAovRm9udCA8PAovRjEgNCAwIFIKPj4KPj4KL0NvbnRlbnRzIDUgMCBSCj4+CmVuZG9iago0IDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKNSAwIG9iago8PAovTGVuZ3RoIDQ0Cj4+CnN0cmVhbQpCVAovRjEgMTIgVGYKNzIgNzIwIFRECihtYXF1aW5hIERFTFRBIENOQyAtIE9TIE1vZGVsbykgVGoKRVQKZW5kc3RyZWFtCmVuZG9iagp4cmVmCjAgNgowMDAwMDAwMDAwIDY1NTM1IGYgCjAwMDAwMDAwMTUgMDAwMDAgbiAKMDAwMDAwMDA2OCAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDYKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjM5MAolJUVPRg==';

const DEFAULT_SEED_MACHINES = [
  { id: '1001', equipe: 'Felipe e Arthur', cliente: 'AC COMUNICACAO VISUAL LTDA', maquina: 'Fiber Split 50W + 4º Eixo + Estabilizador', linha: 'Leve', inicio: '2026-09-17', previsao: '2026-09-18', entregaReal: '2026-09-18', statusManual: 'automatico', obs: 'OS: DM01 | Concluído com testes óticos e alinhamento de espelhos galvo de alta precisão em laboratório.', os: 'DM01', pdfData: SAMPLE_PDF_BASE64 },
  { id: '1002', equipe: 'Felipe e Arthur', cliente: 'LAYSLA BRAGA DA SILVA', maquina: 'FIBER SPLIT 50W', linha: 'Leve', inicio: '2026-09-17', previsao: '2026-09-18', entregaReal: '', statusManual: 'automatico', obs: 'Em montagem de carcaça e testes de fonte laser.', os: 'DM02' },
  { id: '1003', equipe: 'Equipe Beta', cliente: 'JPX TECHNOLOGY LTDA', maquina: 'Centro de Usinagem Easy 2030, Spindle 12cv', linha: 'Pesada', inicio: '', previsao: '', entregaReal: '', statusManual: 'automatico', obs: 'Aguardando barramentos importados e revisão elétrica do painel CNC.', os: 'DM03' },
  { id: '1004', equipe: 'Equipe Alfa', cliente: 'METALURGICA SUL BRASIL', maquina: 'Router CNC Industrial 1530', linha: 'Pesada', inicio: '2026-09-02', previsao: '2026-09-12', entregaReal: '2026-09-11', statusManual: 'automatico', obs: 'Entregue com calibração a laser e trecho de teste completo.', os: 'DM04' },
  { id: '1005', equipe: 'Carlos e Renato', cliente: 'MÓVEIS PLANEJADOS ARTÍSTICA', maquina: 'Router Wood PRO 1325 Spindle 6kw', linha: 'Intermediária', inicio: '2026-09-10', previsao: '2026-09-22', entregaReal: '', statusManual: 'automatico', obs: 'Testes de vácuo em andamento e fixação da mesa.', os: 'DM05' }
];

const DEFAULT_SEED_TEAMS = [
  { name: 'Felipe e Arthur', tags: ['Alta Performance', 'Linha Leve', 'Fibras Laser'] },
  { name: 'Equipe Beta', tags: ['Linha Pesada', 'Precisão CNC', 'Centros Usinagem'] },
  { name: 'Equipe Alfa', tags: ['Linha Pesada', 'Corte Plasma', 'Routers Alta Potência'] },
  { name: 'Carlos e Renato', tags: ['Linha Intermediária', 'Routers Madeira', 'Sistemas Vácuo'] }
];

const DEFAULT_SEED_USERS = [
  { email: 'deltacronograma@gmail.com', pass: 'delta2026', role: 'Administrador' },
  { email: 'producao@deltacnc.pt', pass: 'delta123', role: 'Editor' }
];

let appMachines = [];
let appData = appMachines;
let appTeams = [];
let appUsers = [];
let currentUser = null;
let geminiApiKey = '';
let selectedMachineIds = new Set();
let currentPreviewRows = [];
let currentObservationMachineId = null;

function idbAbrir() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = (e) => reject(e.target.error);
  });
}

async function idbSalvarPdf(id, dataUrl) {
  if (!id || !dataUrl) return;
  const db = await idbAbrir();
  return new Promise((resolve, reject) => {
    const tx = db.transaction([IDB_STORE], 'readwrite');
    const store = tx.objectStore(IDB_STORE);
    const req = store.put({ id: String(id), dataUrl });
    req.onsuccess = () => resolve();
    req.onerror = (e) => reject(e.target.error);
  });
}

async function idbBuscarPdf(id) {
  if (!id) return null;
  try {
    const db = await idbAbrir();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([IDB_STORE], 'readonly');
      const store = tx.objectStore(IDB_STORE);
      const req = store.get(String(id));
      req.onsuccess = () => resolve(req.result ? req.result.dataUrl : null);
      req.onerror = (e) => reject(e.target.error);
    });
  } catch (err) {
    console.warn('Erro ao aceder ao IndexedDB:', err);
    return null;
  }
}

async function lerPdfComIA(base64Raw, apiKey, customPrompt) {
  const prompt = customPrompt || 'Extraia desta OS em JSON puro: {"os":"número da OS","cliente":"nome","maquina":"modelo","linha":"Leve|Intermediária|Pesada","inicio":"YYYY-MM-DD","previsao":"YYYY-MM-DD","detalhesTecnicos":"CNPJ | TAG | contato | especificações"}. Apenas JSON sem markdown.';

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: 'application/pdf',
            data: base64Raw
          }
        }
      ]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 500
    }
  };

  for (const model of GEMINI_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (response.status === 404) {
        console.warn(`Modelo ${model} retornou 404. Tentando próximo modelo...`);
        continue;
      }

      if (response.ok) {
        const data = await response.json();
        let rawText = '';
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
          rawText = data.candidates[0].content.parts[0]?.text || data.candidates[0].content.parts.map(p => p.text).join('\n');
        }

        let cleanJsonStr = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
        const firstBrace = cleanJsonStr.indexOf('{');
        const lastBrace = cleanJsonStr.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleanJsonStr = cleanJsonStr.substring(firstBrace, lastBrace + 1);
        }

        return JSON.parse(cleanJsonStr);
      } else {
        console.warn(`Modelo ${model} retornou status ${response.status}. Tentando próximo...`);
      }
    } catch (fetchErr) {
      console.warn(`Tentativa com ${model} falhou:`, fetchErr);
    }
  }

  throw new Error('Falha ao processar PDF com os modelos Gemini disponíveis');
}

document.addEventListener('DOMContentLoaded', async () => {
  loadStorage();
  await migrarPdfsAntigosParaIdb();
  updateClock();
  setInterval(updateClock, 1000);
  setupPermissions();
  populateTeamFilters();
  renderTable();
  updateDashboard();
  renderTeams();
  updatePodio();
  renderUsers();
  checkGeminiBanner();
});

async function migrarPdfsAntigosParaIdb() {
  let mudou = false;
  for (const item of appMachines) {
    if (item.pdfData && item.pdfData.length > 50) {
      try {
        await idbSalvarPdf(item.id, item.pdfData);
        item.pdfData = '';
        item.hasPdf = true;
        mudou = true;
      } catch (e) {
        console.warn('Erro ao migrar PDF para IndexedDB no carregamento:', e);
      }
    } else if (item.pdfData) {
      item.hasPdf = true;
      item.pdfData = '';
      mudou = true;
    }
  }
  if (mudou) {
    saveData();
  }
}

function loadStorage() {
  try {
    const m = localStorage.getItem(STORAGE_KEYS.MACHINES);
    appMachines = m ? JSON.parse(m) : [...DEFAULT_SEED_MACHINES];
    appData = appMachines;

    const t = localStorage.getItem(STORAGE_KEYS.TEAMS);
    appTeams = t ? JSON.parse(t) : [...DEFAULT_SEED_TEAMS];

    const u = localStorage.getItem(STORAGE_KEYS.USERS);
    appUsers = u ? JSON.parse(u) : [...DEFAULT_SEED_USERS];

    const normalizeTeamName = (name) => String(name || '').replace(/^Equipa\b/, 'Equipe');
    appMachines = appMachines.map(machine => ({ ...machine, equipe: normalizeTeamName(machine.equipe) }));
    appData = appMachines;
    appTeams = appTeams.map(team => ({ ...team, name: normalizeTeamName(team.name) }));

    geminiApiKey = localStorage.getItem(STORAGE_KEYS.GEMINI_KEY) || '';

    const cur = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (cur) {
      currentUser = JSON.parse(cur);
    } else {
      currentUser = appUsers[0];
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    }

    saveData();
  } catch (err) {
    console.error('Erro ao ler storage, aplicando valores padrão:', err);
    appMachines = [...DEFAULT_SEED_MACHINES];
    appData = appMachines;
    appTeams = [...DEFAULT_SEED_TEAMS];
    appUsers = [...DEFAULT_SEED_USERS];
    currentUser = appUsers[0];
  }
}

async function saveData() {
  try {
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(appMachines));
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(appTeams));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(appUsers));
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  } catch (e) {
    console.warn('Erro de gravação no localStorage (possível quota excedida):', e);
    try {
      for (const item of appMachines) {
        if (item.pdfData && item.pdfData.length > 0) {
          await idbSalvarPdf(item.id, item.pdfData);
          item.pdfData = '';
          item.hasPdf = true;
        }
      }
    } catch (idbErr) {
      console.error('Falha ao transferir para IndexedDB na recuperação de quota:', idbErr);
    }

    try {
      localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(appMachines));
      localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(appTeams));
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(appUsers));
      return;
    } catch (retryErr) {
      console.error('Ainda sem quota após limpeza:', retryErr);
    }

    alert('Não foi possível salvar: espaço de armazenamento cheio. Remova PDFs antigos ou exporte um backup.');
  }
}

function updateClock() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('pt-PT', { hour12: false });
  const dateStr = now.toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const el = document.getElementById('clockEl');
  if (el) el.innerHTML = `⏱️ ${dateStr} ${timeStr}`;
}

function setupPermissions() {
  const userLabel = document.getElementById('currentUserLabel');
  const authBtn = document.getElementById('authBtn');
  const editorEls = document.querySelectorAll('.editor-only');

  if (currentUser) {
    userLabel.textContent = `${currentUser.email.split('@')[0]} (${currentUser.role})`;
    authBtn.textContent = 'Terminar Sessão';
    authBtn.className = 'btn-delta btn-danger btn-sm';
    editorEls.forEach(el => el.style.display = '');
  } else {
    userLabel.textContent = 'Visitante (Leitura)';
    authBtn.textContent = 'Entrar';
    authBtn.className = 'btn-delta btn-slate btn-sm';
    editorEls.forEach(el => el.style.display = 'none');
  }
}

function toggleAuthModal() {
  if (currentUser) {
    if (confirm('Deseja terminar a sessão atual?')) {
      currentUser = null;
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      setupPermissions();
      renderTable();
      renderUsers();
    }
  } else {
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('authModal').classList.add('open');
  }
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
}

function handleLoginSubmit() {
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;

  const user = appUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass);
  if (user) {
    currentUser = user;
    saveData();
    setupPermissions();
    closeAuthModal();
    alert(`Bem-vindo, ${user.role}!`);
  } else {
    alert('Credenciais incorretas! Verifique o e-mail e a palavra-passe.');
  }
}

function switchTab(tabId) {
  const tabs = ['acompanhamento', 'dashboard', 'equipas', 'destaques', 'usuarios'];
  tabs.forEach(t => {
    const sec = document.getElementById(`tab-${t}`);
    if (sec) sec.classList.add('hidden');
  });

  document.querySelectorAll('.tab-button').forEach(btn => {
    btn.classList.remove('active');
    if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tabId)) {
      btn.classList.add('active');
    }
  });

  document.querySelectorAll('.sidebar-link').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  const activeSec = document.getElementById(`tab-${tabId}`);
  if (activeSec) activeSec.classList.remove('hidden');

  if (tabId === 'dashboard') updateDashboard();
  if (tabId === 'destaques') updatePodio();
  if (tabId === 'equipas') renderTeams();
  if (tabId === 'usuarios') renderUsers();
}

function getMachineStatus(item) {
  if (item.statusManual && item.statusManual !== 'automatico') {
    return item.statusManual;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const parseDateOnly = (dateStr) => {
    if (!dateStr || typeof dateStr !== 'string') return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      const dt = new Date(y, m, d);
      dt.setHours(0, 0, 0, 0);
      return isNaN(dt.getTime()) ? null : dt;
    }
    return null;
  };

  const entregaRealDate = parseDateOnly(item.entregaReal);
  const previsaoDate = parseDateOnly(item.previsao);
  const inicioDate = parseDateOnly(item.inicio);

  if (entregaRealDate) {
    return 'Entregue';
  }

  if (previsaoDate && previsaoDate < hoje) {
    return 'Atrasado';
  }

  if (inicioDate) {
    return 'Em andamento';
  }

  return 'Aguardando produção';
}

function getStatusBadge(status) {
  if (status === 'Entregue') {
    return `<span class="badge-status status-entregue">✓ Entregue</span>`;
  } else if (status === 'Em andamento') {
    return `<span class="badge-status status-andamento">⚙️ Em andamento</span>`;
  } else if (status === 'Atrasado') {
    return `<span class="badge-status status-atrasado">⚠️ Atrasado</span>`;
  }
  return `<span class="badge-status status-aguardando">⏳ Aguardando</span>`;
}

function formatDateDisplay(d) {
  if (!d) return '—';
  const parts = d.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return d;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function abrirObservacao(id) {
  const item = appMachines.find(m => m.id === id);
  if (!item) return;

  const titleEl = document.getElementById('obsModalTitle');
  const subtitleEl = document.getElementById('obsModalSubtitle');
  const contentEl = document.getElementById('obsModalContent');
  currentObservationMachineId = id;

  titleEl.textContent = `Observações do dia — OS ${item.os || 'N/A'} (${item.maquina || 'Máquina'})`;
  subtitleEl.textContent = `Cliente: ${item.cliente || '—'} | Equipe: ${item.equipe || '—'}`;
  contentEl.value = item.obs || '';

  document.getElementById('obsModal').classList.add('open');
}

function closeObsModal() {
  document.getElementById('obsModal').classList.remove('open');
  currentObservationMachineId = null;
}

async function saveObservation() {
  if (!currentObservationMachineId) return;
  const item = appMachines.find(machine => machine.id === currentObservationMachineId);
  if (!item) return;

  item.obs = document.getElementById('obsModalContent').value.trim();
  await saveData();
  renderTable();
  updateDashboard();
  closeObsModal();
}

function populateTeamFilters() {
  const selectFilter = document.getElementById('filterTeam');
  const machSelect = document.getElementById('machTeam');
  const val = selectFilter.value;

  selectFilter.innerHTML = '<option value="todas">Todas as Equipes</option>';
  machSelect.innerHTML = '<option value="—">Sem equipe definida (—)</option>';

  appTeams.forEach(t => {
    const opt1 = document.createElement('option');
    opt1.value = t.name;
    opt1.textContent = t.name;
    selectFilter.appendChild(opt1);

    const opt2 = document.createElement('option');
    opt2.value = t.name;
    opt2.textContent = t.name;
    machSelect.appendChild(opt2);
  });

  if (val) selectFilter.value = val;
}

function clearFilters() {
  document.getElementById('filterPeriod').value = '';
  document.getElementById('filterSearch').value = '';
  document.getElementById('filterStatus').value = 'todos';
  document.getElementById('filterTeam').value = 'todas';
  document.getElementById('filterLinha').value = 'todas';
  renderTable();
}

function renderTable() {
  const tbody = document.getElementById('machinesTableBody');
  const activeCount = appMachines.filter(m => getMachineStatus(m) === 'Em andamento').length;
  const deliveredCount = appMachines.filter(m => getMachineStatus(m) === 'Entregue').length;

  const activeSidebar = document.getElementById('sidebarActiveCount');
  const deliveredSidebar = document.getElementById('sidebarDeliveredCount');
  if (activeSidebar) activeSidebar.textContent = activeCount;
  if (deliveredSidebar) deliveredSidebar.textContent = deliveredCount;

  const period = document.getElementById('filterPeriod').value;
  const search = document.getElementById('filterSearch').value.toLowerCase().trim();
  const statusFilter = document.getElementById('filterStatus').value;
  const teamFilter = document.getElementById('filterTeam').value;
  const linhaFilter = document.getElementById('filterLinha').value;

  const filtered = appMachines.filter(item => {
    const computedStatus = getMachineStatus(item);

    if (search) {
      const hay = `${item.os || ''} ${item.cliente || ''} ${item.maquina || ''} ${item.equipe || ''} ${item.obs || ''} ${item.aiNotes || ''}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }

    if (statusFilter !== 'todos' && computedStatus !== statusFilter) return false;
    if (teamFilter !== 'todas' && item.equipe !== teamFilter) return false;
    if (linhaFilter !== 'todas' && item.linha !== linhaFilter) return false;

    if (period) {
      const inStart = item.inicio && item.inicio.startsWith(period);
      const inPrev = item.previsao && item.previsao.startsWith(period);
      const inReal = item.entregaReal && item.entregaReal.startsWith(period);
      if (!inStart && !inPrev && !inReal) return false;
    }

    return true;
  });

  document.getElementById('countShowing').textContent = `Mostrando ${filtered.length} de ${appMachines.length} máquinas`;
  document.getElementById('countTotalBadge').textContent = `Total: ${appMachines.length} registos`;

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="12" style="text-align:center; padding:3rem; color:var(--text-muted);">
          Nenhuma máquina encontrada com os filtros aplicados.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const status = getMachineStatus(item);
    const isChecked = selectedMachineIds.has(item.id);
    const linhaClass = item.linha === 'Pesada' ? 'pill-linha pesada' : 'pill-linha';

    let osHtml = '<span class="text-muted" style="color:#4b5563;">—</span>';
    if ((item.pdfData && item.pdfData.trim()) || item.hasPdf) {
      osHtml = `<button type="button" class="btn-delta btn-indigo btn-sm" onclick="verPdfOs('${item.id}')" title="Ver PDF da Ordem de Serviço em nova aba" style="padding:0.3rem 0.6rem; font-size:0.75rem; gap:0.35rem;">
        📄 Ver OS
      </button>`;
    }

    const obsText = item.obs ? (item.obs.length > 30 ? item.obs.substring(0, 30) + '...' : item.obs) : 'Adicionar nota';
    const obsClass = item.obs ? 'observation-chip has-note' : 'observation-chip empty-note';

    return `
      <tr class="${isChecked ? 'selected-row' : ''}">
        <td style="text-align:center;">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleSelectMachine('${item.id}', this)" style="cursor:pointer; accent-color:#6366f1;">
        </td>
        <td><strong style="color:#ffffff;">${escapeHtml(item.equipe || '—')}</strong></td>
        <td>${escapeHtml(item.cliente || '—')}</td>
        <td><span style="font-weight:600; color:#f3f4f6;">${escapeHtml(item.maquina || '—')}</span></td>
        <td><span class="${linhaClass}">${escapeHtml(item.linha || 'Leve')}</span></td>
        <td>${formatDateDisplay(item.inicio)}</td>
        <td>${formatDateDisplay(item.previsao)}</td>
        <td><strong style="color:#34d399;">${formatDateDisplay(item.entregaReal)}</strong></td>
        <td>${getStatusBadge(status)}</td>
        <td>
          <button type="button" class="${obsClass}" onclick="abrirObservacao('${item.id}')" title="Clique para editar a observação do dia">
            <span class="observation-chip-icon">${item.obs ? '✎' : '+'}</span>
            ${escapeHtml(obsText)}
          </button>
        </td>
        <td style="text-align:center;">${osHtml}</td>
        <td style="text-align:right; white-space:nowrap;">
          <button class="btn-delta btn-slate btn-sm editor-only" onclick="editMachine('${item.id}')" title="Editar">
            ✏️
          </button>
        </td>
      </tr>
    `;
  }).join('');

  setupPermissions();
}

function toggleSelectMachine(id, checkbox) {
  if (checkbox.checked) {
    selectedMachineIds.add(id);
  } else {
    selectedMachineIds.delete(id);
  }
  renderTable();
}

function toggleSelectAll(masterCheckbox) {
  if (masterCheckbox.checked) {
    appMachines.forEach(m => selectedMachineIds.add(m.id));
  } else {
    selectedMachineIds.clear();
  }
  renderTable();
}

function deleteSelectedMachines() {
  if (selectedMachineIds.size === 0) {
    alert('Selecione pelo menos uma máquina para excluir.');
    return;
  }
  if (!confirm(`Deseja realmente excluir as ${selectedMachineIds.size} máquina(s) selecionada(s)?`)) {
    return;
  }

  appMachines = appMachines.filter(m => !selectedMachineIds.has(m.id));
  selectedMachineIds.clear();
  saveData();
  renderTable();
  updateDashboard();
  updatePodio();
}

function syncData() {
  loadStorage();
  renderTable();
  updateDashboard();
  updatePodio();
  alert('Base sincronizada com sucesso!');
}

async function verPdfOs(id) {
  const item = appMachines.find(m => m.id === id);
  if (!item) {
    alert('Máquina não encontrada.');
    return;
  }

  if (item.pdfData && item.pdfData.trim()) {
    openPdfFromBase64(item.pdfData);
    return;
  }

  if (item.hasPdf) {
    try {
      const storedPdf = await idbBuscarPdf(item.id);
      if (storedPdf && storedPdf.trim()) {
        openPdfFromBase64(storedPdf);
        return;
      }
    } catch (err) {
      console.warn('Erro ao carregar PDF do IndexedDB:', err);
    }
  }

  alert('Documento PDF não encontrado para esta OS. O ficheiro pode ter sido removido ou não foi guardado corretamente.');
}

window.verPdfOs = verPdfOs;
window.openPdfAttachment = verPdfOs;

function openPdfFromBase64(pdfDataUri) {
  try {
    const commaIdx = pdfDataUri.indexOf(',');
    const base64 = commaIdx >= 0 ? pdfDataUri.slice(commaIdx + 1) : pdfDataUri;
    const byteCharacters = atob(base64.trim());
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const blob = new Blob([byteNumbers], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
  } catch (err) {
    console.warn('Erro ao abrir PDF via Blob, a recorrer à abertura direta:', err);
    window.open(pdfDataUri, '_blank');
  }
}

function openMachineModal(id = null) {
  populateTeamFilters();
  const form = document.getElementById('machineForm');
  form.reset();
  document.getElementById('machPdfStatus').textContent = '';

  if (id) {
    const item = appMachines.find(m => m.id === id);
    if (!item) return;
    document.getElementById('machineModalTitle').textContent = `Editar Máquina — OS ${item.os || ''}`;
    document.getElementById('machId').value = item.id;
    document.getElementById('machOs').value = item.os || '';
    document.getElementById('machTeam').value = item.equipe || '—';
    document.getElementById('machClient').value = item.cliente || '';
    document.getElementById('machModel').value = item.maquina || '';
    document.getElementById('machLinha').value = item.linha || 'Leve';
    document.getElementById('machStatusManual').value = item.statusManual || 'automatico';
    document.getElementById('machStart').value = item.inicio || '';
    document.getElementById('machForecast').value = item.previsao || '';
    document.getElementById('machReal').value = item.entregaReal || '';
    document.getElementById('machNotes').value = item.obs || '';
    if (item.pdfData || item.hasPdf) {
      document.getElementById('machPdfStatus').textContent = 'Ficheiro PDF anexado presente.';
    }
  } else {
    document.getElementById('machineModalTitle').textContent = 'Registar Máquina CNC';
    document.getElementById('machId').value = '';
  }

  document.getElementById('machineModal').classList.add('open');
}

function editMachine(id) {
  openMachineModal(id);
}

function closeMachineModal() {
  document.getElementById('machineModal').classList.remove('open');
}

async function saveMachine(e) {
  e.preventDefault();
  const id = document.getElementById('machId').value;
  const os = document.getElementById('machOs').value.trim();
  const equipe = document.getElementById('machTeam').value;
  const cliente = document.getElementById('machClient').value.trim();
  const maquina = document.getElementById('machModel').value.trim();
  const linha = document.getElementById('machLinha').value;
  const statusManual = document.getElementById('machStatusManual').value;
  const inicio = document.getElementById('machStart').value;
  const previsao = document.getElementById('machForecast').value;
  const entregaReal = document.getElementById('machReal').value;
  const obs = document.getElementById('machNotes').value.trim();

  const pdfInput = document.getElementById('machPdf');
  let newPdfData = null;

  if (pdfInput.files && pdfInput.files[0]) {
    try {
      newPdfData = await fileToDataUrl(pdfInput.files[0]);
    } catch (err) {
      console.error('Erro ao ler PDF:', err);
    }
  }

  if (id) {
    const index = appMachines.findIndex(m => m.id === id);
    if (index !== -1) {
      const target = appMachines[index];
      let hasPdf = target.hasPdf || false;
      if (newPdfData) {
        try {
          await idbSalvarPdf(id, newPdfData);
          hasPdf = true;
        } catch (idbErr) {
          console.warn('Erro ao salvar PDF no IndexedDB:', idbErr);
        }
      }
      appMachines[index] = {
        ...target,
        os, equipe, cliente, maquina, linha, statusManual,
        inicio, previsao, entregaReal, obs,
        aiNotes: target.aiNotes || '',
        pdfData: '',
        hasPdf
      };
    }
  } else {
    const newId = 'M_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    let hasPdf = false;
    if (newPdfData) {
      try {
        await idbSalvarPdf(newId, newPdfData);
        hasPdf = true;
      } catch (idbErr) {
        console.warn('Erro ao salvar PDF no IndexedDB:', idbErr);
      }
    }
    const newMachine = {
      id: newId,
      os, equipe, cliente, maquina, linha, statusManual,
      inicio, previsao, entregaReal, obs,
      aiNotes: '',
      pdfData: '',
      hasPdf
    };
    appMachines.unshift(newMachine);
  }

  await saveData();
  renderTable();
  updateDashboard();
  updatePodio();
  closeMachineModal();
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function openMultiImportModal() {
  currentPreviewRows = [];
  document.getElementById('multiPdfInput').value = '';
  const dateRuleSelect = document.getElementById('importStartDateRule');
  if (dateRuleSelect) dateRuleSelect.value = 'hoje';
  document.getElementById('aiProgressBox').style.display = 'none';
  document.getElementById('btnAiParse').disabled = true;
  document.getElementById('btnSaveMulti').disabled = true;
  document.getElementById('previewRowsCount').textContent = '0 ficheiros na fila';
  renderImportPreviewTable();
  document.getElementById('multiImportModal').classList.add('open');
}

function closeMultiImportModal() {
  document.getElementById('multiImportModal').classList.remove('open');
}

function onFilesSelected(input) {
  const files = Array.from(input.files || []);
  if (files.length === 0) {
    document.getElementById('btnAiParse').disabled = true;
    return;
  }
  document.getElementById('btnAiParse').disabled = false;
  document.getElementById('previewRowsCount').textContent = `${files.length} ficheiro(s) selecionado(s)`;

  currentPreviewRows = files.map((f, idx) => {
    const nameWithoutExt = f.name.replace(/\.[^/.]+$/, '');
    const initialOs = nameWithoutExt.toUpperCase().startsWith('DM') ? nameWithoutExt : ('DM' + (appMachines.length + idx + 1));
    const row = {
      id: 'import_' + idx,
      file: f,
      fileName: f.name,
      selected: true,
      os: initialOs,
      equipe: '',
      cliente: '',
      maquina: 'Máquina CNC (A aguardar IA)',
      linha: 'Leve',
      inicio: '',
      previsao: '',
      obs: '',
      aiNotes: `Ficheiro: ${f.name}`,
      base64: ''
    };

    fileToDataUrl(f).then(dataUrl => {
      row.base64 = dataUrl;
    }).catch(err => console.error('Erro ao ler base64 do ficheiro:', err));

    return row;
  });

  renderImportPreviewTable();
}

async function processPdfsWithGemini() {
  const files = Array.from(document.getElementById('multiPdfInput').files || []);
  if (files.length === 0) return;

  if (!geminiApiKey) {
    alert('Por favor configure primeiro a sua Chave da API do Gemini nas Definições!');
    openConfigModal();
    return;
  }

  const progressBox = document.getElementById('aiProgressBox');
  const progressText = document.getElementById('aiProgressText');
  const progressPercent = document.getElementById('aiProgressPercent');
  const progressBar = document.getElementById('aiProgressBar');
  const btnParse = document.getElementById('btnAiParse');

  progressBox.style.display = 'block';
  btnParse.disabled = true;

  const total = currentPreviewRows.length;
  let completed = 0;
  progressText.textContent = `Lendo 0 de ${total}...`;
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';

  const aiPrompt = 'Extraia desta OS em JSON puro: {"os":"número da OS","cliente":"nome","maquina":"modelo","linha":"Leve|Intermediária|Pesada","inicio":"YYYY-MM-DD","previsao":"YYYY-MM-DD","detalhesTecnicos":"CNPJ | TAG | contato | especificações"}. Apenas JSON sem markdown.';

  const CONCURRENCY_LIMIT = 4;
  let queueIndex = 0;

  async function processSingleItem(i) {
    const row = currentPreviewRows[i];
    const file = row.file;

    try {
      const base64DataUrl = row.base64 || await fileToDataUrl(file);
      const base64Raw = base64DataUrl.includes(',') ? base64DataUrl.split(',')[1] : base64DataUrl;
      row.base64 = base64DataUrl;

      const parsed = await lerPdfComIA(base64Raw, geminiApiKey, aiPrompt);

      const extractedOs = (parsed.os || row.os || '').trim();
      row.os = extractedOs;
      row.cliente = parsed.cliente || 'Cliente Identificado';
      row.maquina = parsed.maquina || 'Router / Laser CNC';
      row.linha = ['Leve', 'Intermediária', 'Pesada'].includes(parsed.linha) ? parsed.linha : 'Leve';
      row.equipe = '';
      row.inicio = parsed.inicio || '';
      row.previsao = parsed.previsao || '';

      row.aiNotes = (parsed.detalhesTecnicos || parsed.obs || '').trim();
      row.obs = '';

      row.selected = true;
    } catch (err) {
      console.warn(`Falha na leitura IA de ${row.fileName}:`, err);
      row.aiNotes = `⚠️ Erro na IA: ${err.message || 'Falha ao analisar'}`;
      row.obs = '';
      row.selected = false;
    } finally {
      completed++;
      const pct = Math.round((completed / total) * 100);
      progressBar.style.width = pct + '%';
      progressPercent.textContent = pct + '%';
      progressText.textContent = `Lendo ${completed} de ${total}...`;
      renderImportPreviewTable();
    }
  }

  const poolSize = Math.min(CONCURRENCY_LIMIT, total);
  const workers = Array.from({ length: poolSize }, async () => {
    while (queueIndex < total) {
      const currentIdx = queueIndex++;
      await processSingleItem(currentIdx);
    }
  });

  await Promise.all(workers);

  progressText.textContent = `✅ Concluído: ${completed} de ${total} ficheiro(s) analisado(s).`;
  document.getElementById('btnSaveMulti').disabled = !currentPreviewRows.some(r => r.selected);
  btnParse.disabled = false;
}

function renderImportPreviewTable() {
  const tbody = document.getElementById('importPreviewBody');
  if (currentPreviewRows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
          Nenhum PDF carregado ainda. Escolha ficheiros PDF acima para pré-visualizar e extrair.
        </td>
      </tr>
    `;
    document.getElementById('btnSaveMulti').disabled = true;
    return;
  }

  tbody.innerHTML = currentPreviewRows.map((row, idx) => {
    const displayName = row.fileName || (row.file && row.file.name) || (row.os ? `${row.os}.pdf` : 'OS.pdf');
    return `
      <tr>
        <td style="text-align:center;">
          <input type="checkbox" ${row.selected ? 'checked' : ''} onchange="updatePreviewRowValue(${idx}, 'selected', this.checked)" style="cursor:pointer; accent-color:#6366f1;">
        </td>
        <td style="max-width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(displayName)}">
          <span style="font-size:0.75rem; color:#93c5fd; font-weight:600; display:inline-flex; align-items:center; gap:0.35rem;">
            📄 ${escapeHtml(displayName)}
          </span>
        </td>
        <td><input type="text" class="preview-input" value="${escapeHtml(row.equipe)}" onchange="updatePreviewRowValue(${idx}, 'equipe', this.value)" placeholder="Equipe"></td>
        <td><input type="text" class="preview-input" value="${escapeHtml(row.cliente)}" onchange="updatePreviewRowValue(${idx}, 'cliente', this.value)" placeholder="Cliente"></td>
        <td><input type="text" class="preview-input" value="${escapeHtml(row.maquina)}" onchange="updatePreviewRowValue(${idx}, 'maquina', this.value)" placeholder="Modelo"></td>
        <td>
          <select class="preview-input" onchange="updatePreviewRowValue(${idx}, 'linha', this.value)">
            <option value="Leve" ${row.linha === 'Leve' ? 'selected' : ''}>Leve</option>
            <option value="Intermediária" ${row.linha === 'Intermediária' ? 'selected' : ''}>Intermediária</option>
            <option value="Pesada" ${row.linha === 'Pesada' ? 'selected' : ''}>Pesada</option>
          </select>
        </td>
        <td><input type="date" class="preview-input" value="${row.inicio || ''}" onchange="updatePreviewRowValue(${idx}, 'inicio', this.value)"></td>
        <td><input type="date" class="preview-input" value="${row.previsao || ''}" onchange="updatePreviewRowValue(${idx}, 'previsao', this.value)"></td>
        <td><input type="text" class="preview-input" value="${escapeHtml(row.aiNotes || '')}" onchange="updatePreviewRowValue(${idx}, 'aiNotes', this.value)" placeholder="Preenchido pela IA"></td>
      </tr>
    `;
  }).join('');

  document.getElementById('btnSaveMulti').disabled = !currentPreviewRows.some(r => r.selected);
}

function updatePreviewRowValue(idx, key, val) {
  if (currentPreviewRows[idx]) {
    currentPreviewRows[idx][key] = val;
  }
  document.getElementById('btnSaveMulti').disabled = !currentPreviewRows.some(r => r.selected);
}

function toggleSelectAllPreview(masterCheckbox) {
  const isChecked = masterCheckbox.checked;
  currentPreviewRows.forEach(row => row.selected = isChecked);
  renderImportPreviewTable();
}

async function saveImportedRows() {
  const selectedRows = currentPreviewRows.filter(r => r.selected);
  if (selectedRows.length === 0) {
    alert('Nenhum registo selecionado para salvar.');
    return;
  }

  const dateRule = document.getElementById('importStartDateRule').value;
  const todayStr = new Date().toISOString().split('T')[0];

  for (const row of selectedRows) {
    let finalInicio = row.inicio;
    if (dateRule === 'hoje') {
      finalInicio = todayStr;
    } else if (dateRule === 'nenhuma') {
      finalInicio = '';
    }

    const newId = 'M_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
    let hasPdf = false;
    if (row.base64) {
      try {
        await idbSalvarPdf(newId, row.base64);
        hasPdf = true;
      } catch (idbErr) {
        console.warn('Erro ao salvar PDF em lote no IndexedDB:', idbErr);
      }
    }

    const newMach = {
      id: newId,
      os: row.os || 'DM_NEW',
      equipe: row.equipe || '—',
      cliente: row.cliente || 'Cliente Novo',
      maquina: row.maquina || 'Router CNC',
      linha: row.linha || 'Leve',
      statusManual: 'automatico',
      inicio: finalInicio,
      previsao: row.previsao || '',
      entregaReal: '',
      obs: row.obs || '',
      aiNotes: row.aiNotes || '',
      pdfData: '',
      hasPdf
    };

    appMachines.unshift(newMach);
  }

  await saveData();
  closeMultiImportModal();
  renderTable();
  updateDashboard();
  updatePodio();
  alert(`${selectedRows.length} máquina(s) importada(s) com sucesso!`);
}

function openConfigModal() {
  document.getElementById('geminiApiKeyInput').value = geminiApiKey;
  document.getElementById('configModal').classList.add('open');
}

function closeConfigModal() {
  document.getElementById('configModal').classList.remove('open');
}

function saveGeminiKey() {
  const val = document.getElementById('geminiApiKeyInput').value.trim();
  geminiApiKey = val;
  localStorage.setItem(STORAGE_KEYS.GEMINI_KEY, val);
  checkGeminiBanner();
  alert('Chave da API do Gemini guardada com sucesso!');
  closeConfigModal();
}

function checkGeminiBanner() {
  const banner = document.getElementById('geminiAlertBanner');
  if (banner) {
    if (geminiApiKey && geminiApiKey.length > 5) {
      banner.style.display = 'none';
    } else {
      banner.style.display = 'flex';
    }
  }
}

function exportBackup() {
  const backupObj = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    machines: appMachines,
    teams: appTeams,
    users: appUsers
  };
  const blob = new Blob([JSON.stringify(backupObj, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DELTA_Backup_${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

async function importBackup(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = async function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if (data && Array.isArray(data.machines)) {
        appMachines = data.machines;
        if (Array.isArray(data.teams)) appTeams = data.teams;
        if (Array.isArray(data.users)) appUsers = data.users;
        await saveData();
        renderTable();
        updateDashboard();
        updatePodio();
        renderTeams();
        renderUsers();
        alert('Backup restaurado com sucesso!');
      } else {
        alert('Ficheiro de backup inválido ou corrompido.');
      }
    } catch (err) {
      console.error('Erro ao ler JSON de backup:', err);
      alert('Erro ao processar ficheiro JSON.');
    }
  };
  reader.readAsText(file);
}

function exportCSV() {
  let csv = 'ID;OS;Equipe;Cliente;Maquina;Linha;Inicio;Previsao;EntregaReal;Estado;Observacoes\n';
  appMachines.forEach(m => {
    const st = getMachineStatus(m);
    const row = [
      m.id,
      `"${(m.os || '').replace(/"/g, '""')}"`,
      `"${(m.equipe || '').replace(/"/g, '""')}"`,
      `"${(m.cliente || '').replace(/"/g, '""')}"`,
      `"${(m.maquina || '').replace(/"/g, '""')}"`,
      `"${(m.linha || '').replace(/"/g, '""')}"`,
      m.inicio || '',
      m.previsao || '',
      m.entregaReal || '',
      `"${st}"`,
      `"${(m.obs || '').replace(/"/g, '""')}"`
    ];
    csv += row.join(';') + '\n';
  });

  const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CP_DELTA_Relatorio_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function renderTeams() {
  const container = document.getElementById('teamsContainer');
  if (!container) return;

  if (appTeams.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); padding:1rem;">Nenhuma equipe registada.</div>';
    return;
  }

  container.innerHTML = appTeams.map((t, idx) => {
    const tagsHtml = (t.tags || []).map(tag => `<span class="team-badge-tag">${escapeHtml(tag)}</span>`).join('');
    const activeCount = appMachines.filter(m => m.equipe === t.name && getMachineStatus(m) === 'Em andamento').length;
    const deliveredCount = appMachines.filter(m => m.equipe === t.name && getMachineStatus(m) === 'Entregue').length;

    return `
      <div class="teams-production-card" style="position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.75rem;">
          <h3 style="margin:0; font-size:1.05rem; color:#ffffff; font-weight:700;">${escapeHtml(t.name)}</h3>
          <div class="editor-only" style="display:flex; gap:0.35rem;">
            <button class="btn-delta btn-slate btn-sm" onclick="openTeamModal(${idx})" title="Editar">✏️</button>
            <button class="btn-delta btn-danger btn-sm" onclick="deleteTeam(${idx})" title="Excluir">🗑️</button>
          </div>
        </div>
        <div style="margin-bottom:1rem;">${tagsHtml}</div>
        <div style="display:flex; justify-content:space-between; font-size:0.78rem; color:var(--text-muted); border-top:1px solid var(--border); padding-top:0.75rem;">
          <span>⚙️ Em Andamento: <strong style="color:#60a5fa;">${activeCount}</strong></span>
          <span>✅ Entregues: <strong style="color:#34d399;">${deliveredCount}</strong></span>
        </div>
      </div>
    `;
  }).join('');

  setupPermissions();
}

function openTeamModal(idx = -1) {
  document.getElementById('teamEditIndex').value = idx;
  if (idx >= 0 && appTeams[idx]) {
    document.getElementById('teamModalTitle').textContent = 'Editar Equipe';
    document.getElementById('teamNameInput').value = appTeams[idx].name || '';
    document.getElementById('teamTagsInput').value = (appTeams[idx].tags || []).join(', ');
  } else {
    document.getElementById('teamModalTitle').textContent = 'Registar Nova Equipe';
    document.getElementById('teamNameInput').value = '';
    document.getElementById('teamTagsInput').value = '';
  }
  document.getElementById('teamModal').classList.add('open');
}

function closeTeamModal() {
  document.getElementById('teamModal').classList.remove('open');
}

function saveTeamSubmit() {
  const idx = parseInt(document.getElementById('teamEditIndex').value, 10);
  const name = document.getElementById('teamNameInput').value.trim();
  const tagsRaw = document.getElementById('teamTagsInput').value;
  const tags = tagsRaw ? tagsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];

  if (!name) {
    alert('Insira o nome da equipe.');
    return;
  }

  if (idx >= 0 && appTeams[idx]) {
    appTeams[idx] = { name, tags };
  } else {
    appTeams.push({ name, tags });
  }

  saveData();
  closeTeamModal();
  renderTeams();
  populateTeamFilters();
  updateDashboard();
  updatePodio();
}

function deleteTeam(idx) {
  if (confirm(`Deseja excluir a equipe "${appTeams[idx].name}"?`)) {
    appTeams.splice(idx, 1);
    saveData();
    renderTeams();
    populateTeamFilters();
    updateDashboard();
    updatePodio();
  }
}

function renderUsers() {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  tbody.innerHTML = appUsers.map((u, idx) => `
    <tr>
      <td><strong style="color:#ffffff;">${escapeHtml(u.email)}</strong></td>
      <td><span class="badge-status status-andamento">${escapeHtml(u.role)}</span></td>
      <td style="text-align:right;">
        ${idx > 0 ? `<button class="btn-delta btn-danger btn-sm editor-only" onclick="deleteUser(${idx})">🗑️ Excluir</button>` : '<span class="text-muted" style="font-size:0.75rem;">Sistema (Protegido)</span>'}
      </td>
    </tr>
  `).join('');

  setupPermissions();
}

function openUserModal() {
  document.getElementById('newEditorEmail').value = '';
  document.getElementById('newEditorPass').value = '';
  document.getElementById('userModal').classList.add('open');
}

function closeUserModal() {
  document.getElementById('userModal').classList.remove('open');
}

function saveNewUserSubmit() {
  const email = document.getElementById('newEditorEmail').value.trim();
  const pass = document.getElementById('newEditorPass').value;
  if (!email || !pass) {
    alert('Preencha o e-mail e a palavra-passe.');
    return;
  }

  appUsers.push({ email, pass, role: 'Editor' });
  saveData();
  closeUserModal();
  renderUsers();
  alert('Utilizador criado com sucesso!');
}

function deleteUser(idx) {
  if (idx === 0) {
    alert('Não é possível excluir o Administrador principal.');
    return;
  }
  if (confirm(`Deseja excluir o acesso de ${appUsers[idx].email}?`)) {
    appUsers.splice(idx, 1);
    saveData();
    renderUsers();
  }
}

function updateDashboard() {
  document.getElementById('kpiTotal').textContent = appMachines.length;

  const activeCount = appMachines.filter(m => getMachineStatus(m) === 'Em andamento').length;
  const deliveredCount = appMachines.filter(m => getMachineStatus(m) === 'Entregue').length;
  const activeSidebar = document.getElementById('sidebarActiveCount');
  const deliveredSidebar = document.getElementById('sidebarDeliveredCount');
  if (activeSidebar) activeSidebar.textContent = activeCount;
  if (deliveredSidebar) deliveredSidebar.textContent = deliveredCount;

  const emAndamento = activeCount;
  document.getElementById('kpiAndamento').textContent = emAndamento;

  const mesRefStr = '2026-09';
  const entreguesMes = appMachines.filter(m => {
    const st = getMachineStatus(m);
    return st === 'Entregue' && m.entregaReal && m.entregaReal.startsWith(mesRefStr);
  }).length;

  document.getElementById('kpiEntreguesMes').textContent = entreguesMes;

  const prevMesCount = appMachines.filter(m => m.previsao && m.previsao.startsWith(mesRefStr)).length;
  const eficiencia = prevMesCount > 0 ? Math.round((entreguesMes / prevMesCount) * 100) : (entreguesMes > 0 ? 100 : 0);
  document.getElementById('kpiEficiencia').textContent = `${eficiencia}%`;

  const dashTeamsList = document.getElementById('dashTeamsList');
  if (dashTeamsList) {
    if (appTeams.length === 0) {
      dashTeamsList.innerHTML = '<div style="color:var(--text-muted); font-size:0.82rem;">Sem equipes registadas.</div>';
    } else {
      const monthMachines = appMachines.filter(m => [m.inicio, m.previsao, m.entregaReal].some(date => date && date.startsWith(mesRefStr)));
      const renderDashMachine = (machine) => {
        const hasPdf = Boolean((machine.pdfData && machine.pdfData.trim()) || machine.hasPdf);
        const status = getMachineStatus(machine);
        const osAction = hasPdf
          ? `<button class="btn-delta btn-indigo btn-sm" onclick="verPdfOs('${machine.id}')" title="Abrir ordem de serviço">📄 OS ${escapeHtml(machine.os || '')}</button>`
          : `<span class="dash-os-number">OS ${escapeHtml(machine.os || 'não definida')}</span>`;

        return `
          <div class="dashboard-machine-row">
            <div class="dashboard-machine-main">
              <strong>${escapeHtml(machine.maquina || 'Máquina sem modelo')}</strong>
              <span>${escapeHtml(machine.cliente || 'Cliente não definido')} · ${escapeHtml(machine.linha || 'Linha não definida')}</span>
            </div>
            <div class="dashboard-machine-meta">
              <span class="badge-status ${status === 'Entregue' ? 'status-entregue' : status === 'Atrasado' ? 'status-atrasado' : 'status-andamento'}">${escapeHtml(status)}</span>
              ${osAction}
            </div>
          </div>
        `;
      };

      const teamNames = [...new Set([...appTeams.map(t => t.name), ...monthMachines.map(m => m.equipe).filter(Boolean)])];
      dashTeamsList.innerHTML = teamNames.map(teamName => {
        const teamMachines = monthMachines.filter(m => m.equipe === teamName);
        const inProcess = teamMachines.filter(m => getMachineStatus(m) !== 'Entregue');
        const ready = teamMachines.filter(m => getMachineStatus(m) === 'Entregue');

        return `
          <article class="dashboard-team-card">
            <div class="dashboard-team-header">
              <div>
                <span class="section-kicker">Equipe</span>
                <h3>${escapeHtml(teamName)}</h3>
              </div>
              <div class="dashboard-team-stats">
                <span><strong>${teamMachines.length}</strong> máquinas no mês</span>
                <span><strong>${inProcess.length}</strong> em processo</span>
                <span><strong>${ready.length}</strong> prontas</span>
              </div>
            </div>
            <div class="dashboard-status-section process-section">
              <div class="dashboard-status-title"><span>Em processo</span><strong>${inProcess.length}</strong></div>
              ${inProcess.length ? inProcess.map(renderDashMachine).join('') : '<div class="dashboard-empty">Nenhuma máquina em processo neste mês.</div>'}
            </div>
            <div class="dashboard-status-section ready-section">
              <div class="dashboard-status-title"><span>Prontas / entregues</span><strong>${ready.length}</strong></div>
              ${ready.length ? ready.map(renderDashMachine).join('') : '<div class="dashboard-empty">Nenhuma máquina pronta neste mês.</div>'}
            </div>
          </article>
        `;
      }).join('') || '<div class="dashboard-empty">Nenhuma máquina encontrada para o mês selecionado.</div>';
    }
  }

  const annualChartBox = document.getElementById('annualChartBox');
  if (annualChartBox) {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const counts = Array(12).fill(0);

    appMachines.forEach(m => {
      if (m.inicio && m.inicio.startsWith('2026-')) {
        const mParts = m.inicio.split('-');
        if (mParts.length === 3) {
          const monthIdx = parseInt(mParts[1], 10) - 1;
          if (monthIdx >= 0 && monthIdx < 12) {
            counts[monthIdx]++;
          }
        }
      }
    });

    const maxVal = Math.max(...counts, 5);

    annualChartBox.innerHTML = meses.map((mes, idx) => {
      const val = counts[idx];
      const heightPct = Math.round((val / maxVal) * 100);
      return `
        <div class="svg-bar-col" title="${val} arranques em ${mes}/2026">
          <div class="svg-bar-val">${val}</div>
          <div class="svg-bar" style="height: ${Math.max(heightPct, 6)}%;"></div>
          <div class="svg-bar-label">${mes}</div>
        </div>
      `;
    }).join('');
  }
}

function updatePodio() {
  const mesRefStr = '2026-09';
  const teamScores = appTeams.map(t => {
    const delivered = appMachines.filter(m => m.equipe === t.name && getMachineStatus(m) === 'Entregue' && m.entregaReal && m.entregaReal.startsWith(mesRefStr)).length;
    const active = appMachines.filter(m => m.equipe === t.name && getMachineStatus(m) === 'Em andamento').length;
    return { name: t.name, delivered, active, score: (delivered * 10) + active };
  });

  teamScores.sort((a, b) => b.score - a.score);

  const podiumWrapper = document.getElementById('podiumWrapper');
  if (podiumWrapper) {
    const top3 = [teamScores[1], teamScores[0], teamScores[2]].filter(Boolean);
    const stepsConfig = [
      { pos: 2, label: '2º Lugar', medal: '🥈', stepClass: 'step-2' },
      { pos: 1, label: '1º Lugar', medal: '🥇', stepClass: 'step-1' },
      { pos: 3, label: '3º Lugar', medal: '🥉', stepClass: 'step-3' }
    ];

    podiumWrapper.innerHTML = stepsConfig.map(cfg => {
      const item = top3.find(t => {
        if (cfg.pos === 1) return t === teamScores[0];
        if (cfg.pos === 2) return t === teamScores[1];
        return t === teamScores[2];
      });

      if (!item) {
        return `
          <div class="podium-step ${cfg.stepClass}">
            <div class="podium-pillar">
              <div class="medal-icon">${cfg.medal}</div>
              <div style="font-weight:700; color:var(--text-muted); font-size:0.85rem;">—</div>
              <div style="font-size:0.75rem; color:var(--text-muted);">0 entregues</div>
            </div>
            <div style="margin-top:0.6rem; font-size:0.8rem; font-weight:700; color:var(--text-muted);">${cfg.label}</div>
          </div>
        `;
      }

      return `
        <div class="podium-step ${cfg.stepClass}">
          <div class="podium-pillar">
            <div class="medal-icon">${cfg.medal}</div>
            <div style="font-weight:700; color:#ffffff; font-size:0.92rem; margin-bottom:0.2rem;">${escapeHtml(item.name)}</div>
            <div style="font-size:0.76rem; color:#34d399; font-weight:600;">${item.delivered} máquina(s)</div>
          </div>
          <div style="margin-top:0.6rem; font-size:0.85rem; font-weight:700; color:#818cf8;">${cfg.label}</div>
        </div>
      `;
    }).join('');
  }

  const podiumTableBody = document.getElementById('podiumTableBody');
  if (podiumTableBody) {
    podiumTableBody.innerHTML = teamScores.map((ts, idx) => `
      <tr>
        <td><strong style="color:#ffffff;">#${idx + 1}</strong></td>
        <td>${escapeHtml(ts.name)}</td>
        <td><strong style="color:#34d399;">${ts.delivered}</strong></td>
        <td><strong style="color:#60a5fa;">${ts.active}</strong></td>
        <td><strong style="color:#818cf8;">${ts.score} pts</strong></td>
      </tr>
    `).join('');
  }
}

window.addEventListener('load', () => {
  if (document.getElementById('geminiAlertBanner')) {
    checkGeminiBanner();
  }
});
