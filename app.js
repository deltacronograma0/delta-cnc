const STORAGE_KEYS = {
  MACHINES: 'DELTA_MACHINES_DATA',
  TEAMS: 'DELTA_TEAMS_DATA',
  USERS: 'DELTA_USERS_DATA',
  GEMINI_KEY: 'DELTA_GEMINI_KEY',
  CURRENT_USER: 'DELTA_CURRENT_USER',
  SUPABASE_URL: 'DELTA_SUPABASE_URL',
  SUPABASE_KEY: 'DELTA_SUPABASE_KEY'
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
  { id: 'EQ-001', name: 'Felipe e Arthur', tags: ['Alta Performance', 'Linha Leve', 'Fibras Laser'] },
  { id: 'EQ-002', name: 'Equipe Beta', tags: ['Linha Pesada', 'Precisão CNC', 'Centros Usinagem'] },
  { id: 'EQ-003', name: 'Equipe Alfa', tags: ['Linha Pesada', 'Corte Plasma', 'Routers Alta Potência'] },
  { id: 'EQ-004', name: 'Carlos e Renato', tags: ['Linha Intermediária', 'Routers Madeira', 'Sistemas Vácuo'] }
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
let importCancelled = false;
let currentAiAbortController = null;
let currentAiIndex = null;
let supabaseClient = null;
let supabaseChannel = null;
let isApplyingRemoteState = false;

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

function dataUrlToBlob(dataUrl) {
  const [header, base64] = dataUrl.split(',');
  const mime = header.match(/:(.*?);/)?.[1] || 'application/pdf';
  const bytes = atob(base64);
  const buffer = new Uint8Array(bytes.length);
  for (let index = 0; index < bytes.length; index++) buffer[index] = bytes.charCodeAt(index);
  return new Blob([buffer], { type: mime });
}

async function supabaseSalvarPdf(id, dataUrl) {
  if (!supabaseClient || !id || !dataUrl) return null;
  const path = `ordens/${String(id)}.pdf`;
  const { error } = await supabaseClient.storage
    .from('delta-pdfs')
    .upload(path, dataUrlToBlob(dataUrl), { contentType: 'application/pdf', upsert: true });
  if (error) throw error;
  return path;
}

async function supabaseBuscarPdf(path) {
  if (!supabaseClient || !path) return null;
  const { data, error } = await supabaseClient.storage.from('delta-pdfs').createSignedUrl(path, 300);
  if (error) throw error;
  return data?.signedUrl || null;
}

async function lerPdfComIA(base64Raw, apiKey, customPrompt, signal) {
  const prompt = customPrompt || 'Extraia somente estes campos desta OS em JSON puro: {"os":"número da OS","cliente":"nome do cliente","maquina":"modelo da máquina","linha":"Leve|Intermediária|Pesada","inicio":"YYYY-MM-DD","previsao":"YYYY-MM-DD"}. Não explique nada e não inclua outros campos.';

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
      maxOutputTokens: 300
    }
  };

  for (const model of GEMINI_MODELS) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal
      });

      if (response.status === 404) {
        console.warn(`Modelo ${model} retornou 404. Tentando próximo modelo...`);
        break;
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
        let apiMessage = `status ${response.status}`;
        try {
          const errorData = await response.json();
          apiMessage = errorData.error?.message || apiMessage;
        } catch (_) {}
        const temporaryError = [429, 500, 502, 503, 504].includes(response.status);
        if (temporaryError && attempt < 2) {
          await new Promise(resolve => setTimeout(resolve, 700 * (attempt + 1)));
          continue;
        }
        throw new Error(`Gemini: ${apiMessage}`);
      }
      } catch (fetchErr) {
        console.warn(`Tentativa com ${model} falhou:`, fetchErr);
        if (fetchErr?.message?.startsWith('Gemini:') || fetchErr?.name === 'AbortError') throw fetchErr;
        if (attempt === 2) throw fetchErr;
      }
    }
  }

  throw new Error('Falha ao processar PDF com os modelos Gemini disponíveis');
}

document.addEventListener('DOMContentLoaded', async () => {
  loadStorage();
  await initSupabaseSync();
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

document.addEventListener('click', (event) => {
  if (!event.target.closest('.multi-filter')) {
    document.querySelectorAll('.multi-filter-menu.open').forEach(menu => menu.classList.remove('open'));
  }
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

    if (supabaseClient && item.hasPdf && !item.pdfPath) {
      try {
        const localPdf = await idbBuscarPdf(item.id);
        if (localPdf) {
          item.pdfPath = await supabaseSalvarPdf(item.id, localPdf);
          mudou = true;
        }
      } catch (e) {
        console.warn('PDF mantido apenas no armazenamento local:', e);
      }
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
    appTeams = appTeams.map((team, index) => ({
      ...team,
      id: team.id || `EQ-${String(index + 1).padStart(3, '0')}`,
      name: normalizeTeamName(team.name)
    }));

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

    if (supabaseClient && !isApplyingRemoteState) {
      await saveSharedState();
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

function setSupabaseSyncStatus(message, connected = false) {
  const status = document.getElementById('supabaseSyncStatus');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-connected', connected);
}

function getSupabaseConfig() {
  return {
    url: localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) || '',
    key: localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY) || ''
  };
}

async function initSupabaseSync() {
  const config = getSupabaseConfig();
  if (!config.url || !config.key || !window.supabase?.createClient) {
    setSupabaseSyncStatus('Modo local');
    return;
  }

  try {
    supabaseClient = window.supabase.createClient(config.url, config.key);
    const { error: authError } = await supabaseClient.auth.signInAnonymously();
    if (authError) throw authError;
    const { data, error } = await supabaseClient
      .from('delta_app_state')
      .select('machines, teams, users')
      .eq('id', 'main')
      .maybeSingle();

    if (error) throw error;
    if (data) {
      applySharedState(data);
    } else {
      await saveSharedState();
    }

    supabaseChannel = supabaseClient
      .channel('delta-app-state-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'delta_app_state', filter: 'id=eq.main' }, payload => {
        if (payload.new) applySharedState(payload.new);
      })
      .subscribe(status => {
        setSupabaseSyncStatus(status === 'SUBSCRIBED' ? 'Sincronização online' : `Estado: ${status}`, status === 'SUBSCRIBED');
      });
  } catch (error) {
    console.error('Erro ao conectar ao Supabase:', error);
    supabaseClient = null;
    setSupabaseSyncStatus('Erro de conexão');
  }
}

function applySharedState(data) {
  isApplyingRemoteState = true;
  try {
    appMachines = Array.isArray(data.machines) ? data.machines : [];
    appData = appMachines;
    appTeams = Array.isArray(data.teams) ? data.teams : [];
    appUsers = Array.isArray(data.users) ? data.users : [];
    populateTeamFilters();
    renderTable();
    updateDashboard();
    renderTeams();
    updatePodio();
    renderUsers();
  } finally {
    isApplyingRemoteState = false;
  }
}

async function saveSharedState() {
  if (!supabaseClient) return;
  const { error } = await supabaseClient.from('delta_app_state').upsert({
    id: 'main',
    machines: appMachines,
    teams: appTeams,
    users: appUsers,
    updated_at: new Date().toISOString()
  });
  if (error) {
    console.error('Erro ao sincronizar dados:', error);
    setSupabaseSyncStatus('Erro ao salvar');
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

function formatDateBrazilian(dateValue) {
  if (!dateValue) return '';
  const normalized = String(dateValue).trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) return normalized;
  const parts = normalized.substring(0, 10).split('-');
  return parts.length === 3 && parts[0].length === 4
    ? `${parts[2]}/${parts[1]}/${parts[0]}`
    : normalized;
}

function parseBrazilianDate(value) {
  const normalized = String(value || '').trim();
  const parts = normalized.split('/');
  if (parts.length !== 3) return normalized;
  const [day, month, year] = parts;
  if (day.length !== 2 || month.length !== 2 || year.length !== 4) return normalized;
  return `${year}-${month}-${day}`;
}

function normalizeDateValue(value) {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(normalized)) return parseBrazilianDate(normalized);
  const isoMatch = normalized.match(/\d{4}-\d{2}-\d{2}/);
  return isoMatch ? isoMatch[0] : '';
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
  const machSelect = document.getElementById('machTeam');
  machSelect.innerHTML = '<option value="—">Sem equipe definida (—)</option>';

  const teamMenu = document.getElementById('filterTeamMenu');
  const selectedTeams = teamMenu
    ? [...teamMenu.querySelectorAll('input:checked')].map(input => input.value)
    : [];

  appTeams.forEach(t => {
    const teamOption = document.createElement('option');
    teamOption.value = t.name;
    teamOption.textContent = t.name;
    machSelect.appendChild(teamOption);
  });

  if (teamMenu) {
    teamMenu.innerHTML = appTeams.map(team => `
      <label><input type="checkbox" value="${escapeHtml(team.name)}" ${selectedTeams.includes(team.name) ? 'checked' : ''} onchange="updateMultiFilter('team')"> ${escapeHtml(team.name)}</label>
    `).join('') || '<span class="multi-filter-empty">Nenhuma equipe cadastrada</span>';
  }
  updateMultiFilter('team', false);
}

function toggleFilterMenu(group) {
  const menu = document.getElementById(`filter${group === 'line' ? 'Line' : group.charAt(0).toUpperCase() + group.slice(1)}Menu`);
  if (menu) menu.classList.toggle('open');
}

function getFilterValues(group) {
  const menuId = group === 'line' ? 'filterLineMenu' : `filter${group.charAt(0).toUpperCase() + group.slice(1)}Menu`;
  const menu = document.getElementById(menuId);
  return menu ? [...menu.querySelectorAll('input:checked')].map(input => input.value) : [];
}

function updateMultiFilter(group, shouldRender = true) {
  const values = getFilterValues(group);
  const triggerId = group === 'line' ? 'filterLineTrigger' : `filter${group.charAt(0).toUpperCase() + group.slice(1)}Trigger`;
  const trigger = document.getElementById(triggerId);
  if (trigger) {
    const labels = { status: 'estados', team: 'equipes', line: 'linhas' };
    trigger.innerHTML = values.length === 0
      ? `Todas as ${labels[group]} <span>⌄</span>`
      : `${values.length} selecionado${values.length > 1 ? 's' : ''} <span>⌄</span>`;
  }
  if (shouldRender) renderTable();
}

function clearFilters() {
  document.getElementById('filterPeriod').value = '';
  document.getElementById('filterSearch').value = '';
  document.querySelectorAll('#filterStatusMenu input, #filterTeamMenu input, #filterLineMenu input').forEach(input => {
    input.checked = false;
  });
  updateMultiFilter('status', false);
  updateMultiFilter('team', false);
  updateMultiFilter('line', false);
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
  const statusFilter = getFilterValues('status');
  const teamFilter = getFilterValues('team');
  const linhaFilter = getFilterValues('line');

  const filtered = appMachines.filter(item => {
    const computedStatus = getMachineStatus(item);

    if (search) {
      const hay = `${item.os || ''} ${item.cliente || ''} ${item.maquina || ''} ${item.equipe || ''} ${item.obs || ''} ${item.aiNotes || ''}`.toLowerCase();
      if (!hay.includes(search)) return false;
    }

    if (statusFilter.length > 0 && !statusFilter.includes(computedStatus)) return false;
    if (teamFilter.length > 0 && !teamFilter.includes(item.equipe)) return false;
    if (linhaFilter.length > 0 && !linhaFilter.includes(item.linha)) return false;

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

  if (item.pdfPath && supabaseClient) {
    try {
      const remotePdf = await supabaseBuscarPdf(item.pdfPath);
      if (remotePdf) {
        window.open(remotePdf, '_blank');
        return;
      }
    } catch (err) {
      console.warn('Erro ao carregar PDF do Supabase Storage:', err);
    }
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
      let pdfPath = target.pdfPath || '';
      if (newPdfData) {
        try {
          await idbSalvarPdf(id, newPdfData);
          pdfPath = await supabaseSalvarPdf(id, newPdfData) || pdfPath;
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
        pdfPath,
        pdfData: '',
        hasPdf
      };
    }
  } else {
    const newId = 'M_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
    let hasPdf = false;
    let pdfPath = '';
    if (newPdfData) {
      try {
        await idbSalvarPdf(newId, newPdfData);
        pdfPath = await supabaseSalvarPdf(newId, newPdfData) || '';
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
      pdfPath,
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

function getLocalDateString() {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60000;
  return new Date(now.getTime() - offset).toISOString().split('T')[0];
}

function getImportDateRule() {
  return document.getElementById('importStartDateRule')?.value || 'hoje';
}

function getPreviewStartDate(row) {
  const rule = getImportDateRule();
  if (rule === 'hoje') return getLocalDateString();
  if (rule === 'nenhuma') return '';
  return row.aiInicio || row.inicio || '';
}

function applyImportDateRule() {
  currentPreviewRows.forEach(row => {
    row.inicio = getPreviewStartDate(row);
  });
  renderImportProgress(currentPreviewRows.length);
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
  document.getElementById('importBatchSummary').style.display = 'none';
  document.getElementById('importQueue').style.display = 'none';
  renderImportPreviewTable();
  document.getElementById('multiImportModal').classList.add('open');
}

function closeMultiImportModal() {
  if (currentAiAbortController) cancelPdfsWithGemini();
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
  document.getElementById('importBatchSummary').style.display = 'grid';
  document.getElementById('importQueue').style.display = 'block';

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
      aiInicio: '',
      previsao: '',
      obs: '',
      aiNotes: `Ficheiro: ${f.name}`,
      status: 'Aguardando leitura',
      base64: ''
    };

    fileToDataUrl(f).then(dataUrl => {
      row.base64 = dataUrl;
    }).catch(err => console.error('Erro ao ler base64 do ficheiro:', err));

    return row;
  });

  applyImportDateRule();
  renderImportProgress(files.length);
}

async function processPdfsWithGemini(retryIndexes = null) {
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
  const btnCancel = document.getElementById('btnCancelAi');

  progressBox.style.display = 'block';
  document.getElementById('importBatchSummary').style.display = 'grid';
  document.getElementById('importQueue').style.display = 'block';
  btnParse.disabled = true;
  if (btnCancel) btnCancel.style.display = 'inline-flex';

  const indexes = retryIndexes || currentPreviewRows.map((_, index) => index);
  const total = indexes.length;
  let completed = 0;
  importCancelled = false;
  currentAiAbortController = new AbortController();
  progressText.textContent = `Lendo 0 de ${total}...`;
  progressBar.style.width = '0%';
  progressPercent.textContent = '0%';

  const aiPrompt = 'Extraia somente estes campos desta OS em JSON puro: {"os":"número da OS","cliente":"nome do cliente","maquina":"modelo da máquina","linha":"Leve|Intermediária|Pesada","inicio":"YYYY-MM-DD","previsao":"YYYY-MM-DD"}. Não explique nada e não inclua outros campos.';

  async function processSingleItem(i) {
    const row = currentPreviewRows[i];
    const file = row.file;
    currentAiIndex = i;
    currentAiAbortController = new AbortController();
    row.status = 'Lendo PDF...';
    renderImportProgress(total);

    try {
      const base64DataUrl = row.base64 || await fileToDataUrl(file);
      const base64Raw = base64DataUrl.includes(',') ? base64DataUrl.split(',')[1] : base64DataUrl;
      row.base64 = base64DataUrl;

      const parsed = await lerPdfComIA(base64Raw, geminiApiKey, aiPrompt, currentAiAbortController.signal);

      const extractedOs = (parsed.os || row.os || '').trim();
      row.os = extractedOs;
      row.cliente = parsed.cliente || 'Cliente Identificado';
      row.maquina = parsed.maquina || 'Router / Laser CNC';
      row.linha = ['Leve', 'Intermediária', 'Pesada'].includes(parsed.linha) ? parsed.linha : 'Leve';
      row.equipe = '';
      row.aiInicio = normalizeDateValue(parsed.inicio);
      row.inicio = getPreviewStartDate(row);
      row.previsao = normalizeDateValue(parsed.previsao);

      row.aiNotes = (parsed.detalhesTecnicos || parsed.obs || '').trim();
      row.obs = '';

      row.selected = true;
      row.status = 'Leitura concluída';
    } catch (err) {
      console.warn(`Falha na leitura IA de ${row.fileName}:`, err);
      row.aiNotes = `⚠️ Erro na IA: ${err.message || 'Falha ao analisar'}`;
      row.obs = '';
      row.selected = false;
      row.status = err.name === 'AbortError' ? 'Leitura cancelada' : 'Falha na leitura';
    } finally {
      completed++;
      const pct = Math.round((completed / total) * 100);
      progressBar.style.width = pct + '%';
      progressPercent.textContent = pct + '%';
      progressText.textContent = `${importCancelled ? 'Cancelando' : 'Lendo'} ${completed} de ${total}...`;
      renderImportProgress(total);
      currentAiAbortController = null;
      currentAiIndex = null;
    }
  }

  for (const index of indexes) {
    if (importCancelled) break;
    await processSingleItem(index);
  }

  progressText.textContent = importCancelled
    ? `Leitura cancelada após ${completed} de ${total} ficheiro(s).`
    : `✅ Concluído: ${completed} de ${total} ficheiro(s) analisado(s).`;
  document.getElementById('btnSaveMulti').disabled = !currentPreviewRows.some(r => r.selected);
  btnParse.disabled = false;
  if (btnCancel) btnCancel.style.display = 'none';
  currentAiAbortController = null;
}

function cancelPdfsWithGemini() {
  importCancelled = true;
  if (currentAiAbortController) currentAiAbortController.abort();
  const label = document.getElementById('importQueueLabel');
  if (label) label.textContent = 'Cancelando leitura atual...';
}

function cancelCurrentPdf(index) {
  if (currentAiIndex !== index || !currentAiAbortController) return;
  currentAiAbortController.abort();
}

function retryImportedRow(index) {
  if (!currentPreviewRows[index]) return;
  currentPreviewRows[index].status = 'Aguardando leitura';
  currentPreviewRows[index].selected = true;
  processPdfsWithGemini([index]);
}

function renderImportProgress(total = currentPreviewRows.length) {
  const completed = currentPreviewRows.filter(row => row.status === 'Leitura concluída').length;
  const errors = currentPreviewRows.filter(row => row.status === 'Falha na leitura').length;
  const selected = currentPreviewRows.filter(row => row.selected).length;
  const active = currentPreviewRows.filter(row => row.status === 'Lendo PDF...').length;
  const summary = {
    batchTotalCount: total,
    batchDoneCount: completed,
    batchErrorCount: errors,
    batchSelectedCount: selected
  };

  Object.entries(summary).forEach(([id, value]) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
  });

  const label = document.getElementById('importQueueLabel');
  if (label) label.textContent = active ? `${active} lendo agora` : completed === total ? 'Leitura concluída' : 'Aguardando início';

  const queue = document.getElementById('importQueueList');
  if (queue) {
    queue.innerHTML = currentPreviewRows.map(row => `
      <div class="import-queue-item">
        <span class="import-queue-file" title="${escapeHtml(row.fileName)}">📄 ${escapeHtml(row.fileName)}</span>
        <span class="import-queue-actions">
          <span class="import-queue-status ${row.status === 'Leitura concluída' ? 'is-done' : row.status === 'Falha na leitura' || row.status === 'Leitura cancelada' ? 'is-error' : row.status === 'Lendo PDF...' ? 'is-reading' : ''}">${escapeHtml(row.status || 'Aguardando leitura')}</span>
          ${row.status === 'Lendo PDF...' && currentAiIndex === currentPreviewRows.indexOf(row) ? `<button class="queue-cancel-btn" onclick="cancelCurrentPdf(${currentPreviewRows.indexOf(row)})">⏹ Cancelar</button>` : ''}
          ${row.status === 'Falha na leitura' || row.status === 'Leitura cancelada' ? `<button class="queue-retry-btn" onclick="retryImportedRow(${currentPreviewRows.indexOf(row)})">↻ Tentar novamente</button>` : ''}
        </span>
      </div>
    `).join('');
  }

  renderImportPreviewTable();
}

function renderImportPreviewTable() {
  const tbody = document.getElementById('importPreviewBody');
  if (currentPreviewRows.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10" style="text-align:center; padding:2.5rem; color:var(--text-muted);">
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
        <td><span class="import-status-pill ${row.status === 'Leitura concluída' ? 'is-done' : row.status === 'Falha na leitura' ? 'is-error' : row.status === 'Lendo PDF...' ? 'is-reading' : ''}">${escapeHtml(row.status || 'Aguardando leitura')}</span></td>
        <td style="max-width:140px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${escapeHtml(displayName)}">
          <span style="font-size:0.75rem; color:#93c5fd; font-weight:600; display:inline-flex; align-items:center; gap:0.35rem;">
            📄 ${escapeHtml(displayName)}
          </span>
        </td>
        <td><select class="preview-input" onchange="updatePreviewRowValue(${idx}, 'equipe', this.value)">
          <option value="">Selecionar equipe</option>
          ${appTeams.map(team => `<option value="${escapeHtml(team.name)}" ${row.equipe === team.name ? 'selected' : ''}>${escapeHtml(team.name)}</option>`).join('')}
        </select></td>
        <td><input type="text" class="preview-input" value="${escapeHtml(row.cliente)}" onchange="updatePreviewRowValue(${idx}, 'cliente', this.value)" placeholder="Cliente"></td>
        <td><input type="text" class="preview-input" value="${escapeHtml(row.maquina)}" onchange="updatePreviewRowValue(${idx}, 'maquina', this.value)" placeholder="Modelo"></td>
        <td>
          <select class="preview-input" onchange="updatePreviewRowValue(${idx}, 'linha', this.value)">
            <option value="Leve" ${row.linha === 'Leve' ? 'selected' : ''}>Leve</option>
            <option value="Intermediária" ${row.linha === 'Intermediária' ? 'selected' : ''}>Intermediária</option>
            <option value="Pesada" ${row.linha === 'Pesada' ? 'selected' : ''}>Pesada</option>
          </select>
        </td>
        <td><input type="text" inputmode="numeric" class="preview-input date-preview-input" value="${formatDateBrazilian(row.inicio)}" placeholder="DD/MM/AAAA" maxlength="10" pattern="\\d{2}/\\d{2}/\\d{4}" onchange="updatePreviewDateValue(${idx}, 'inicio', this.value)"></td>
        <td><input type="text" inputmode="numeric" class="preview-input date-preview-input" value="${formatDateBrazilian(row.previsao)}" placeholder="DD/MM/AAAA" maxlength="10" pattern="\\d{2}/\\d{2}/\\d{4}" onchange="updatePreviewDateValue(${idx}, 'previsao', this.value)"></td>
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
  renderImportProgress(currentPreviewRows.length);
}

function updatePreviewDateValue(idx, key, value) {
  const isoValue = parseBrazilianDate(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(isoValue) || isoValue === '') {
    updatePreviewRowValue(idx, key, isoValue);
  }
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

  const saveButton = document.getElementById('btnSaveMulti');
  const originalSaveLabel = saveButton.innerHTML;
  const saveStartedAt = Date.now();
  saveButton.disabled = true;
  saveButton.innerHTML = '⏳ Salvando...';

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
    let pdfPath = '';
    if (row.base64) {
      try {
        await idbSalvarPdf(newId, row.base64);
        pdfPath = await supabaseSalvarPdf(newId, row.base64) || '';
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
      pdfPath,
      pdfData: '',
      hasPdf
    };

    appMachines.unshift(newMach);
  }

  await saveData();
  const elapsed = Date.now() - saveStartedAt;
  const minimumFeedbackTime = 900;
  if (elapsed < minimumFeedbackTime) {
    await new Promise(resolve => setTimeout(resolve, minimumFeedbackTime - elapsed));
  }
  closeMultiImportModal();
  renderTable();
  updateDashboard();
  updatePodio();
  saveButton.innerHTML = originalSaveLabel;
  showToast('Ordens atualizadas com sucesso!');
}

let toastTimeout = null;

function showToast(message) {
  const toast = document.getElementById('appToast');
  const messageEl = document.getElementById('appToastMessage');
  if (!toast || !messageEl) return;
  messageEl.textContent = message;
  toast.classList.add('show');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('show'), 4200);
}

function openConfigModal() {
  document.getElementById('geminiApiKeyInput').value = geminiApiKey;
  const config = getSupabaseConfig();
  document.getElementById('supabaseUrlInput').value = config.url;
  document.getElementById('supabaseKeyInput').value = config.key;
  setSupabaseSyncStatus(supabaseClient ? 'Sincronização online' : (config.url && config.key ? 'Pronto para conectar' : 'Modo local'), Boolean(supabaseClient));
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

async function saveSupabaseConfig() {
  const url = document.getElementById('supabaseUrlInput').value.trim().replace(/\/$/, '');
  const key = document.getElementById('supabaseKeyInput').value.trim();
  if (!url || !key) {
    alert('Informe a URL e a Anon Key do Supabase.');
    return;
  }

  localStorage.setItem(STORAGE_KEYS.SUPABASE_URL, url);
  localStorage.setItem(STORAGE_KEYS.SUPABASE_KEY, key);
  if (supabaseChannel && supabaseClient) await supabaseClient.removeChannel(supabaseChannel);
  supabaseChannel = null;
  supabaseClient = null;
  setSupabaseSyncStatus('Conectando...');
  await initSupabaseSync();
  if (supabaseClient) {
    alert('Supabase conectado. As alterações serão compartilhadas em tempo real.');
  }
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
          <div class="team-name-lockup">
            <h3>${escapeHtml(t.name)}</h3>
            <span class="team-id-badge">${escapeHtml(t.id || 'EQ-000')}</span>
          </div>
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
    appTeams[idx] = { ...appTeams[idx], name, tags };
  } else {
    const nextId = `EQ-${String(appTeams.length + 1).padStart(3, '0')}`;
    appTeams.push({ id: nextId, name, tags });
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
  const dashboardPeriod = document.getElementById('dashboardPeriod')?.value || '2026-09';
  const [dashboardYear, dashboardMonth] = dashboardPeriod.split('-');
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const dashboardMonthName = monthNames[Number(dashboardMonth) - 1] || 'Mês selecionado';
  const dashboardLabel = `${dashboardMonthName}/${dashboardYear}`;
  document.querySelectorAll('.dashMonthName').forEach(element => {
    element.textContent = element.classList.contains('dashMonthName') && element.closest('.kpi-title') ? dashboardMonthName : dashboardLabel;
  });
  const annualChartTitle = document.getElementById('annualChartTitle');
  if (annualChartTitle) annualChartTitle.textContent = `📈 Arranques de produção anual (${dashboardYear})`;

  document.getElementById('kpiTotal').textContent = appMachines.length;

  const activeCount = appMachines.filter(m => getMachineStatus(m) === 'Em andamento').length;
  const deliveredCount = appMachines.filter(m => getMachineStatus(m) === 'Entregue').length;
  const activeSidebar = document.getElementById('sidebarActiveCount');
  const deliveredSidebar = document.getElementById('sidebarDeliveredCount');
  if (activeSidebar) activeSidebar.textContent = activeCount;
  if (deliveredSidebar) deliveredSidebar.textContent = deliveredCount;

  const emAndamento = activeCount;
  document.getElementById('kpiAndamento').textContent = emAndamento;

  const mesRefStr = dashboardPeriod;
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
          ? `<button class="btn-delta btn-indigo btn-sm dashboard-os-button" onclick="verPdfOs('${machine.id}')" title="Abrir ordem de serviço">📄 Abrir OS</button>`
          : `<span class="dash-os-number">OS ${escapeHtml(machine.os || 'não definida')}</span>`;

        return `
          <div class="dashboard-machine-row" data-search-text="${escapeHtml(`${machine.cliente || ''} ${machine.maquina || ''} ${machine.os || ''}`.toLowerCase())}">
            <div class="dashboard-machine-main">
              <strong>${escapeHtml(machine.maquina || 'Máquina sem modelo')}</strong>
              <span>${escapeHtml(machine.cliente || 'Cliente não definido')} · ${escapeHtml(machine.linha || 'Linha não definida')}</span>
              <div class="dashboard-machine-dates">
                <span>Início <b>${formatDateDisplay(machine.inicio)}</b></span>
                <span>Finalização <b>${formatDateDisplay(machine.entregaReal)}</b></span>
              </div>
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
            <div class="dashboard-team-search">
              <span>⌕</span>
              <input type="search" placeholder="Pesquisar cliente, máquina ou OS" oninput="filterDashboardTeam(this)">
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

  const analyticsBox = document.getElementById('dashboardAnalytics');
  if (analyticsBox) {
    const teamNames = [...new Set([...appTeams.map(team => team.name), ...appMachines.map(machine => machine.equipe).filter(Boolean)])];
    analyticsBox.innerHTML = teamNames.map(teamName => {
      const teamMachines = appMachines.filter(machine => machine.equipe === teamName && [machine.inicio, machine.previsao, machine.entregaReal].some(date => date && date.startsWith(mesRefStr)));
      const delivered = teamMachines.filter(machine => getMachineStatus(machine) === 'Entregue').length;
      const inProcess = teamMachines.filter(machine => getMachineStatus(machine) === 'Em andamento').length;
      const overdue = teamMachines.filter(machine => getMachineStatus(machine) === 'Atrasado').length;
      const planned = teamMachines.filter(machine => machine.previsao && machine.previsao.startsWith(mesRefStr)).length;
      const efficiency = planned ? Math.min(100, Math.round((delivered / planned) * 100)) : (delivered ? 100 : 0);
      const volume = Math.max(teamMachines.length, 1);
      const deliveredWidth = Math.round((delivered / volume) * 100);
      const processWidth = Math.round((inProcess / volume) * 100);
      const overdueWidth = Math.round((overdue / volume) * 100);

      return `
        <article class="team-analytics-card">
          <div class="team-analytics-header">
            <div><span class="section-kicker">Eficiência da equipe</span><h3>${escapeHtml(teamName)}</h3></div>
            <strong class="team-efficiency-value">${efficiency}%</strong>
          </div>
          <div class="team-efficiency-meter"><span style="width:${efficiency}%"></span></div>
          <div class="team-metric-bars">
            <div class="metric-bar-row"><span>Entregues <b>${delivered}</b></span><i><em class="bar-delivered" style="width:${deliveredWidth}%"></em></i></div>
            <div class="metric-bar-row"><span>Em processo <b>${inProcess}</b></span><i><em class="bar-process" style="width:${processWidth}%"></em></i></div>
            <div class="metric-bar-row"><span>Atrasadas <b>${overdue}</b></span><i><em class="bar-overdue" style="width:${overdueWidth}%"></em></i></div>
          </div>
          <div class="team-analytics-footer"><span>${teamMachines.length} no período</span><span>${planned} previstas</span></div>
        </article>
      `;
    }).join('') || '<div class="dashboard-empty">Sem equipes para analisar.</div>';
  }

  const annualChartBox = document.getElementById('annualChartBox');
  if (annualChartBox) {
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const counts = Array(12).fill(0);

    appMachines.forEach(m => {
      if (m.inicio && m.inicio.startsWith(`${dashboardYear}-`)) {
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
        <div class="svg-bar-col" title="${val} arranques em ${mes}/${dashboardYear}">
          <div class="svg-bar-val">${val}</div>
          <div class="svg-bar" style="height: ${Math.max(heightPct, 6)}%;"></div>
          <div class="svg-bar-label">${mes}</div>
        </div>
      `;
    }).join('');
  }

  const renderMonthlyBars = (containerId, values, titleSuffix) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const maxValue = Math.max(...values, 5);
    container.innerHTML = meses.map((mes, index) => {
      const value = values[index];
      const heightPct = Math.round((value / maxValue) * 100);
      return `<div class="svg-bar-col" title="${value} ${titleSuffix} em ${mes}/${dashboardYear}">
        <div class="svg-bar-val">${value}</div>
        <div class="svg-bar delivery-bar" style="height:${Math.max(heightPct, 6)}%;"></div>
        <div class="svg-bar-label">${mes}</div>
      </div>`;
    }).join('');
  };

  const deliveryCounts = Array(12).fill(0);
  appMachines.forEach(machine => {
    if (machine.entregaReal && machine.entregaReal.startsWith(`${dashboardYear}-`)) {
      const monthIndex = Number(machine.entregaReal.split('-')[1]) - 1;
      if (monthIndex >= 0 && monthIndex < 12) deliveryCounts[monthIndex]++;
    }
  });
  renderMonthlyBars('annualDeliveriesChart', deliveryCounts, 'entregas');

  const annualTeamsChart = document.getElementById('annualTeamsChart');
  if (annualTeamsChart) {
    const teamYearCounts = [...new Set([...appTeams.map(team => team.name), ...appMachines.map(machine => machine.equipe).filter(Boolean)])].map(teamName => {
      const count = appMachines.filter(machine => machine.equipe === teamName && machine.inicio && machine.inicio.startsWith(`${dashboardYear}-`)).length;
      return { name: teamName, count };
    }).sort((a, b) => b.count - a.count);
    const maxTeamCount = Math.max(...teamYearCounts.map(team => team.count), 1);
    annualTeamsChart.innerHTML = teamYearCounts.map(team => `
      <div class="team-year-row">
        <div class="team-year-label"><span>${escapeHtml(team.name)}</span><strong>${team.count}</strong></div>
        <div class="team-year-track"><span style="width:${Math.round((team.count / maxTeamCount) * 100)}%"></span></div>
      </div>
    `).join('') || '<div class="dashboard-empty">Sem produção registrada neste ano.</div>';
  }
}

function filterDashboardTeam(input) {
  const card = input.closest('.dashboard-team-card');
  if (!card) return;
  const query = input.value.toLowerCase().trim();
  card.querySelectorAll('.dashboard-machine-row').forEach(row => {
    const haystack = row.dataset.searchText || '';
    row.style.display = !query || haystack.includes(query) ? '' : 'none';
  });
}

function updatePodio() {
  const mesRefStr = document.getElementById('dashboardPeriod')?.value || '2026-09';
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
