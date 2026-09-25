const STORAGE_KEYS = {
  MACHINES: 'DELTA_MACHINES_DATA',
  TEAMS: 'DELTA_TEAMS_DATA',
  USERS: 'DELTA_USERS_DATA',
  GEMINI_KEY: 'DELTA_GEMINI_KEY',
  CURRENT_USER: 'DELTA_CURRENT_USER',
  AUTH_SESSION_VERSION: 'DELTA_AUTH_SESSION_VERSION',
  STATE_UPDATED_AT: 'DELTA_STATE_UPDATED_AT',
  LAST_CONFIRMED_STATE: 'DELTA_LAST_CONFIRMED_STATE',
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
let draftSaveTimer = null;
let pendingDraftSave = false;
let sharedSaveInFlight = null;
let sharedSaveQueued = false;

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
  let deferredInstallPrompt = null;
  const installBtn = document.getElementById('installAppBtn');

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js?v=27').catch((error) => {
        console.warn('Service worker não registrado:', error);
      });
    });
  }

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    if (installBtn) {
      installBtn.classList.remove('hidden');
    }
  });

  installBtn?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      alert('O botão de instalação só aparece quando o navegador permitir a instalação do app.');
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    installBtn.classList.add('hidden');
  });

  setTimeout(() => {
    const brandSplash = document.getElementById('brandSplash');
    if (brandSplash) {
      brandSplash.classList.add('is-hidden');
      setTimeout(() => brandSplash.remove(), 500);
    }
  }, 3000);

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
  setupDraftAutosave();
});

window.addEventListener('beforeunload', (event) => {
  if (!pendingDraftSave && !draftSaveTimer && !sharedSaveInFlight) return;
  event.preventDefault();
  event.returnValue = 'Existe uma alteração sendo salva. Aguarde a confirmação antes de sair.';
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
    const sessionVersion = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION_VERSION);
    if (cur && sessionVersion === '2') {
      currentUser = JSON.parse(cur);
    } else {
      currentUser = null;
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION_VERSION, '2');
    }

    const configuredSupabase = localStorage.getItem(STORAGE_KEYS.SUPABASE_URL) && localStorage.getItem(STORAGE_KEYS.SUPABASE_KEY);
    if (configuredSupabase) {
      appMachines = [];
      appData = appMachines;
      appTeams = [];
      appUsers = [];
    }

  } catch (err) {
    console.error('Erro ao ler storage, aplicando valores padrão:', err);
    appMachines = [...DEFAULT_SEED_MACHINES];
    appData = appMachines;
    appTeams = [...DEFAULT_SEED_TEAMS];
    appUsers = [...DEFAULT_SEED_USERS];
    currentUser = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION_VERSION, '2');
  }
}

async function saveData() {
  try {
    const updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(appMachines));
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(appTeams));
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(appUsers));
    localStorage.setItem(STORAGE_KEYS.STATE_UPDATED_AT, String(updatedAt));
    if (currentUser) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(currentUser));
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION_VERSION, '2');
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }

    if (supabaseClient && !isApplyingRemoteState) {
      await queueSharedStateSave();
      pendingDraftSave = false;
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

function scheduleDraftSave(saveDraft) {
  clearTimeout(draftSaveTimer);
  pendingDraftSave = true;
  draftSaveTimer = setTimeout(async () => {
    draftSaveTimer = null;
    try {
      if (saveDraft()) await saveData();
      else pendingDraftSave = false;
    } catch (error) {
      console.warn('Autosave do rascunho falhou:', error);
    }
  }, 700);
}

function setupDraftAutosave() {
  const machineForm = document.getElementById('machineForm');
  machineForm?.addEventListener('input', () => scheduleDraftSave(saveMachineDraft));
  machineForm?.addEventListener('change', () => scheduleDraftSave(saveMachineDraft));

  const teamForm = document.getElementById('teamModal');
  teamForm?.addEventListener('input', () => scheduleDraftSave(saveTeamDraft));
  teamForm?.addEventListener('change', () => scheduleDraftSave(saveTeamDraft));

  const observation = document.getElementById('obsModalContent');
  observation?.addEventListener('input', () => scheduleDraftSave(saveObservationDraft));
}

function canAutosaveDraft() {
  return Boolean(currentUser && supabaseClient && !isApplyingRemoteState);
}

function saveMachineDraft() {
  if (!canAutosaveDraft()) return false;
  const id = document.getElementById('machId')?.value;
  if (!id) return false;
  const index = appMachines.findIndex(machine => machine.id === id);
  if (index < 0) return false;
  const target = appMachines[index];
  const team = document.getElementById('machTeam')?.value || '—';
  const teamRecord = appTeams.find(item => item.name === team);
  appMachines[index] = {
    ...target,
    equipe: team,
    equipeId: teamRecord?.id || target.equipeId || '',
    cliente: document.getElementById('machClient')?.value.trim() || '',
    maquina: document.getElementById('machModel')?.value.trim() || '',
    linha: document.getElementById('machLinha')?.value || target.linha,
    statusManual: document.getElementById('machStatusManual')?.value || target.statusManual,
    inicio: document.getElementById('machStart')?.value || '',
    previsao: document.getElementById('machForecast')?.value || '',
    entregaReal: document.getElementById('machReal')?.value || '',
    obs: document.getElementById('machNotes')?.value.trim() || ''
  };
  return true;
}

function saveTeamDraft() {
  if (!canAutosaveDraft()) return false;
  const index = Number(document.getElementById('teamEditIndex')?.value);
  if (!Number.isInteger(index) || index < 0 || !appTeams[index]) return false;
  appTeams[index] = {
    ...appTeams[index],
    name: document.getElementById('teamNameInput')?.value.trim() || '',
    id: document.getElementById('teamIdInput')?.value.trim().toUpperCase() || ''
  };
  return true;
}

function saveObservationDraft() {
  if (!canAutosaveDraft() || !currentObservationMachineId) return false;
  const item = appMachines.find(machine => machine.id === currentObservationMachineId);
  if (!item) return false;
  item.obs = document.getElementById('obsModalContent')?.value.trim() || '';
  return true;
}

function setSupabaseSyncStatus(message, connected = false) {
  const status = document.getElementById('supabaseSyncStatus');
  const indicator = document.getElementById('supabaseIndicator');
  const indicatorLabel = document.getElementById('supabaseIndicatorLabel');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('is-connected', connected);
  if (indicator) {
    const isSaving = /salvando/i.test(message);
    const stateClass = connected ? 'sync-online' : (isSaving ? 'sync-saving' : (currentUser ? 'sync-error' : 'sync-local'));
    indicator.classList.remove('sync-online', 'sync-saving', 'sync-error', 'sync-local');
    indicator.classList.add(stateClass);
    indicator.title = connected ? 'Dados sincronizados' : (currentUser ? message : 'Visualização disponível sem conexão');
  }
  if (indicatorLabel) {
    indicatorLabel.textContent = connected ? 'Sincronizado' : (/salvando/i.test(message) ? 'Salvando' : (currentUser ? 'Sem conexão' : 'Modo leitura'));
  }
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
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) {
      const { error: authError } = await supabaseClient.auth.signInAnonymously();
      if (authError) throw authError;
    }
    const { data, error } = await supabaseClient
      .from('delta_app_state')
      .select('machines, teams, users, updated_at')
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
        setupPermissions();
      });
  } catch (error) {
    console.error('Erro ao conectar ao Supabase:', error);
    supabaseClient = null;
    const detail = /rate limit|too many|429/i.test(error?.message || '')
      ? 'Limite temporário do Supabase. Aguarde alguns minutos e tente novamente.'
      : (error?.message ? `Erro de conexão: ${error.message}` : 'Erro de conexão');
    setSupabaseSyncStatus(detail);
    setupPermissions();
  }
}

function applySharedState(data) {
  const remoteUpdatedAt = Date.parse(data.updated_at || '') || 0;

  isApplyingRemoteState = true;
  try {
    appMachines = Array.isArray(data.machines) ? data.machines : [];
    appData = appMachines;
    appTeams = Array.isArray(data.teams) ? data.teams : [];
    appUsers = Array.isArray(data.users) ? data.users : [];
    if (remoteUpdatedAt) {
      localStorage.setItem(STORAGE_KEYS.STATE_UPDATED_AT, String(remoteUpdatedAt));
    }
    setLastConfirmedState({ machines: appMachines, teams: appTeams, users: appUsers });
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
  const currentState = { machines: appMachines, teams: appTeams, users: appUsers };
  const confirmedState = getLastConfirmedState();
  if (JSON.stringify(currentState) === JSON.stringify(confirmedState)) {
    setSupabaseSyncStatus('Sincronizado automaticamente', true);
    return;
  }
  setSupabaseSyncStatus('Salvando automaticamente...', false);
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
    throw error;
  }
  setLastConfirmedState(currentState);
  setSupabaseSyncStatus('Sincronizado automaticamente', true);
}

function getLastConfirmedState() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.LAST_CONFIRMED_STATE) || '{}');
  } catch (_) {
    return {};
  }
}

function setLastConfirmedState(state) {
  localStorage.setItem(STORAGE_KEYS.LAST_CONFIRMED_STATE, JSON.stringify(state));
}

async function queueSharedStateSave() {
  if (sharedSaveInFlight) {
    sharedSaveQueued = true;
    await sharedSaveInFlight;
    return;
  }

  sharedSaveInFlight = saveSharedState();
  try {
    await sharedSaveInFlight;
  } finally {
    sharedSaveInFlight = null;
    if (sharedSaveQueued) {
      sharedSaveQueued = false;
      await queueSharedStateSave();
    }
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
  const adminEls = document.querySelectorAll('.admin-only');

  if (currentUser) {
    userLabel.textContent = `${currentUser.email.split('@')[0]} (${currentUser.role})`;
    authBtn.textContent = 'Terminar Sessão';
    authBtn.className = 'btn-delta btn-danger btn-sm';
    editorEls.forEach(el => el.style.display = supabaseClient ? '' : 'none');
    adminEls.forEach(el => el.style.display = currentUser.role === 'Administrador' && supabaseClient ? '' : 'none');
  } else {
    userLabel.textContent = 'Visitante (Leitura)';
    authBtn.textContent = 'Entrar';
    authBtn.className = 'btn-delta btn-slate btn-sm';
    editorEls.forEach(el => el.style.display = 'none');
    adminEls.forEach(el => el.style.display = 'none');
  }
  checkGeminiBanner();
}

function requireEditor() {
  if (!currentUser) {
    showToast('Entre como Editor ou Administrador para editar.', 'error');
    toggleAuthModal();
    return false;
  }
  if (!supabaseClient) {
    showToast('Sem conexão. Conecte o Supabase antes de editar.', 'error');
    return false;
  }
  return true;
}

function requireAdmin() {
  if (!requireEditor()) return false;
  if (currentUser.role !== 'Administrador') {
    showToast('Acesso restrito ao Administrador.', 'error');
    return false;
  }
  return true;
}

function toggleAuthModal() {
  if (currentUser) {
    document.getElementById('logoutModal').classList.add('open');
  } else {
    document.getElementById('loginEmail').value = '';
    document.getElementById('loginPassword').value = '';
    document.getElementById('authModal').classList.add('open');
  }
}

function closeLogoutModal() {
  document.getElementById('logoutModal').classList.remove('open');
}

function confirmLogout() {
  currentUser = null;
  localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  setupPermissions();
  renderTable();
  renderUsers();
  closeLogoutModal();
}

function closeAuthModal() {
  document.getElementById('authModal').classList.remove('open');
}

async function handleLoginSubmit() {
  const submitButton = document.getElementById('loginSubmitButton');
  if (submitButton?.disabled) return;
  const email = document.getElementById('loginEmail').value.trim();
  const pass = document.getElementById('loginPassword').value;

  const user = appUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass);
  if (user) {
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = 'A entrar...';
      submitButton.classList.add('is-loading');
    }
    currentUser = user;
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION_VERSION, '2');
    await saveData();
    setupPermissions();
    closeAuthModal();
    showToast(`Sessão iniciada com sucesso. Bem-vindo, ${user.role}!`);
    if (submitButton) {
      submitButton.disabled = false;
      submitButton.textContent = 'Entrar no Sistema';
      submitButton.classList.remove('is-loading');
    }
  } else {
    showToast('Não foi possível iniciar sessão. Verifique os dados.', 'error');
  }
}

function switchTab(tabId) {
  const tabs = ['acompanhamento', 'dashboard', 'destaques', 'equipas', 'usuarios'];
  if (tabId === 'usuarios' && !requireAdmin()) return;
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
  if (!requireEditor()) return;
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

    const team = appTeams.find(currentTeam => currentTeam.name === item.equipe);
    const teamId = team?.id || '';

    return `
      <tr class="${isChecked ? 'selected-row' : ''}">
        <td style="text-align:center;">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleSelectMachine('${item.id}', this)" style="cursor:pointer; accent-color:#6366f1;">
        </td>
        <td>
          <div class="team-table-name">${escapeHtml(item.equipe || '—')}</div>
          ${teamId ? `<span class="team-table-id">${escapeHtml(teamId)}</span>` : ''}
        </td>
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
  if (!requireEditor()) return;
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

async function syncData() {
  if (supabaseClient) {
    await queueSharedStateSave();
    showToast('Dados conferidos e sincronizados automaticamente!');
    return;
  }

  loadStorage();
  renderTable();
  updateDashboard();
  updatePodio();
  alert('Base local sincronizada com sucesso!');
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
        await openPdfFromUrl(remotePdf);
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

async function openPdfFromUrl(pdfUrl) {
  try {
    const response = await fetch(pdfUrl, { credentials: 'omit' });
    if (!response.ok) throw new Error(`PDF retornou status ${response.status}`);
    const pdfBlob = await response.blob();
    const blobUrl = URL.createObjectURL(new Blob([pdfBlob], { type: 'application/pdf' }));
    window.open(blobUrl, '_blank');
    setTimeout(() => URL.revokeObjectURL(blobUrl), 120000);
  } catch (err) {
    console.warn('Não foi possível converter o PDF remoto para visualização:', err);
    window.open(pdfUrl, '_blank');
  }
}

function openMachineModal(id = null) {
  if (!requireEditor()) return;
  populateTeamFilters();
  const form = document.getElementById('machineForm');
  form.reset();
  document.getElementById('machPdfStatus').textContent = '';

  if (id) {
    const item = appMachines.find(m => m.id === id);
    if (!item) return;
    document.getElementById('machineModalTitle').textContent = `Editar Máquina — OS ${item.os || ''}`;
    document.getElementById('machId').value = item.id;
    if (item.equipe && ![...document.getElementById('machTeam').options].some(option => option.value === item.equipe)) {
      document.getElementById('machTeam').add(new Option(`${item.equipe} (histórica)`, item.equipe));
    }
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
  if (!requireEditor()) return;
  e.preventDefault();
  const id = document.getElementById('machId').value;
  const existingMachine = id ? appMachines.find(machine => machine.id === id) : null;
  const os = existingMachine?.os || `OS-${Date.now()}`;
  const equipe = document.getElementById('machTeam').value;
  const equipeRecord = appTeams.find(team => team.name === equipe);
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
        os, equipe, equipeId: equipeRecord?.id || target.equipeId || '', cliente, maquina, linha, statusManual,
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
      os, equipe, equipeId: equipeRecord?.id || '', cliente, maquina, linha, statusManual,
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
  if (!requireEditor()) return;
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

function showToast(message, type = 'success') {
  const toast = document.getElementById('appToast');
  const messageEl = document.getElementById('appToastMessage');
  if (!toast || !messageEl) return;
  messageEl.textContent = message;
  toast.classList.toggle('toast-error', type === 'error');
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
  } else {
    alert('Não foi possível conectar. Verifique a Project URL e a chave anon/publishable. Se aparecer erro de acesso anônimo, ative Authentication > Providers > Anonymous Sign-Ins no Supabase.');
  }
}

async function disconnectSupabase() {
  if (!supabaseClient && !getSupabaseConfig().url) {
    setSupabaseSyncStatus('Sem conexão');
    return;
  }

  if (!confirm('Desconectar a sincronização entre gestores neste dispositivo? Os dados locais serão mantidos.')) return;

  if (supabaseChannel && supabaseClient) {
    await supabaseClient.removeChannel(supabaseChannel);
  }
  if (supabaseClient) {
    await supabaseClient.auth.signOut().catch(() => {});
  }
  supabaseChannel = null;
  supabaseClient = null;
  localStorage.removeItem(STORAGE_KEYS.SUPABASE_URL);
  localStorage.removeItem(STORAGE_KEYS.SUPABASE_KEY);
  document.getElementById('supabaseUrlInput').value = '';
  document.getElementById('supabaseKeyInput').value = '';
  setSupabaseSyncStatus('Sem conexão');
  setupPermissions();
  showToast('Sincronização desconectada neste dispositivo.');
}

function checkGeminiBanner() {
  const banner = document.getElementById('geminiAlertBanner');
  if (banner) {
    const needsConnection = Boolean(currentUser) && !supabaseClient;
    banner.style.display = needsConnection ? 'flex' : 'none';
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
    return `
      <div class="teams-production-card" style="position:relative;">
        <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.75rem;">
          <div class="team-name-lockup">
            <h3>${escapeHtml(t.name)}</h3>
            <span class="team-id-badge">${escapeHtml(t.id || 'ID não definido')}</span>
          </div>
          <div class="editor-only" style="display:flex; gap:0.35rem;">
            <button class="btn-delta btn-slate btn-sm" onclick="openTeamModal(${idx})" title="Editar">✏️</button>
            <button class="btn-delta btn-danger btn-sm" onclick="deleteTeam(${idx})" title="Excluir">🗑️</button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  setupPermissions();
}

function openTeamModal(idx = -1) {
  if (!requireEditor()) return;
  document.getElementById('teamEditIndex').value = idx;
  if (idx >= 0 && appTeams[idx]) {
    document.getElementById('teamModalTitle').textContent = 'Editar Equipe';
    document.getElementById('teamNameInput').value = appTeams[idx].name || '';
    document.getElementById('teamIdInput').value = appTeams[idx].id || '';
  } else {
    document.getElementById('teamModalTitle').textContent = 'Registar Nova Equipe';
    document.getElementById('teamNameInput').value = '';
    document.getElementById('teamIdInput').value = '';
  }
  document.getElementById('teamModal').classList.add('open');
}

function closeTeamModal() {
  document.getElementById('teamModal').classList.remove('open');
}

function saveTeamSubmit() {
  if (!requireEditor()) return;
  const idx = parseInt(document.getElementById('teamEditIndex').value, 10);
  const name = document.getElementById('teamNameInput').value.trim();
  const id = document.getElementById('teamIdInput').value.trim().toUpperCase();

  if (!name) {
    alert('Insira o nome da equipe.');
    return;
  }

  if (!/^[A-Z]-\d{3}$/.test(id)) {
    alert('Insira o código da equipe no formato A-583.');
    return;
  }

  const duplicateId = appTeams.some((team, teamIndex) => teamIndex !== idx && String(team.id || '').toUpperCase() === id);
  if (duplicateId) {
    alert('Já existe uma equipe com esse código ID.');
    return;
  }

  if (idx >= 0 && appTeams[idx]) {
    appTeams[idx] = { ...appTeams[idx], id, name, tags: [] };
  } else {
    appTeams.push({ id, name, tags: [] });
  }

  saveData();
  closeTeamModal();
  renderTeams();
  populateTeamFilters();
  updateDashboard();
  updatePodio();
}

function deleteTeam(idx) {
  if (!requireEditor()) return;
  if (confirm(`Deseja retirar a equipe "${appTeams[idx].name}" da lista ativa? As máquinas já registadas continuarão com o histórico dessa equipe.`)) {
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
  if (currentUser?.role !== 'Administrador') {
    const usersTab = document.getElementById('tab-usuarios');
    if (usersTab) usersTab.classList.add('hidden');
    return;
  }

  tbody.innerHTML = appUsers.map((u, idx) => `
    <tr>
      <td><strong style="color:#ffffff;">${escapeHtml(u.email)}</strong></td>
      <td><span class="badge-status status-andamento">${escapeHtml(u.role)}</span></td>
      <td style="text-align:right;">
        <div class="user-actions">
          <button class="btn-delta btn-slate btn-sm admin-only" onclick="openUserModal(${idx})">✏️ Editar</button>
          ${idx > 0 ? `<button class="btn-delta btn-danger btn-sm admin-only" onclick="deleteUser(${idx})">🗑️ Excluir</button>` : '<span class="text-muted" style="font-size:0.75rem;">Sistema (Protegido)</span>'}
        </div>
      </td>
    </tr>
  `).join('');

  setupPermissions();
}

function openUserModal(idx = -1) {
  if (!requireAdmin()) return;
  document.getElementById('userEditIndex').value = idx;
  document.getElementById('userModalTitle').textContent = idx >= 0 ? 'Editar Utilizador' : 'Registar Novo Editor';
  document.getElementById('userModalSaveButton').textContent = idx >= 0 ? 'Guardar alterações' : 'Criar Acesso';
  document.getElementById('newEditorEmail').value = idx >= 0 ? appUsers[idx]?.email || '' : '';
  document.getElementById('newEditorPass').value = '';
  document.getElementById('userModal').classList.add('open');
}

function closeUserModal() {
  document.getElementById('userModal').classList.remove('open');
}

function saveNewUserSubmit() {
  if (!requireAdmin()) return;
  const email = document.getElementById('newEditorEmail').value.trim();
  const pass = document.getElementById('newEditorPass').value;
  const idx = parseInt(document.getElementById('userEditIndex').value, 10);
  if (!email || (idx < 0 && !pass)) {
    alert(idx >= 0 ? 'Preencha o e-mail.' : 'Preencha o e-mail e a palavra-passe.');
    return;
  }

  const duplicateEmail = appUsers.some((user, userIndex) => userIndex !== idx && user.email.toLowerCase() === email.toLowerCase());
  if (duplicateEmail) {
    alert('Já existe um utilizador com esse e-mail.');
    return;
  }

  if (idx >= 0 && appUsers[idx]) {
    appUsers[idx] = { ...appUsers[idx], email, pass: pass || appUsers[idx].pass };
  } else {
    appUsers.push({ email, pass, role: 'Editor' });
  }
  saveData();
  closeUserModal();
  renderUsers();
  alert(idx >= 0 ? 'Utilizador atualizado com sucesso!' : 'Utilizador criado com sucesso!');
}

function deleteUser(idx) {
  if (!requireAdmin()) return;
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
  const headerReferenceMonth = document.getElementById('headerReferenceMonth');
  if (headerReferenceMonth) headerReferenceMonth.textContent = dashboardLabel;
  document.querySelectorAll('.dashMonthName').forEach(element => {
    element.textContent = dashboardLabel;
  });
  const annualChartTitle = document.getElementById('annualChartTitle');
  if (annualChartTitle) annualChartTitle.textContent = `📈 Arranques de produção anual (${dashboardYear})`;
  const annualDataYear = document.getElementById('annualDataYear');
  if (annualDataYear) annualDataYear.textContent = dashboardYear;

  const mesRefStr = dashboardPeriod;
  const monthlyMachines = appMachines.filter(machine => [machine.inicio, machine.previsao, machine.entregaReal].some(date => date && date.startsWith(mesRefStr)));
  document.getElementById('kpiTotal').textContent = monthlyMachines.length;

  const activeCount = appMachines.filter(m => getMachineStatus(m) === 'Em andamento').length;
  const deliveredCount = appMachines.filter(m => getMachineStatus(m) === 'Entregue').length;
  const activeSidebar = document.getElementById('sidebarActiveCount');
  const deliveredSidebar = document.getElementById('sidebarDeliveredCount');
  if (activeSidebar) activeSidebar.textContent = activeCount;
  if (deliveredSidebar) deliveredSidebar.textContent = deliveredCount;

  const emAndamento = monthlyMachines.filter(machine => getMachineStatus(machine) === 'Em andamento').length;
  document.getElementById('kpiAndamento').textContent = emAndamento;
  const waitingCount = monthlyMachines.filter(machine => getMachineStatus(machine) === 'Aguardando produção').length;
  document.getElementById('kpiAguardando').textContent = waitingCount;
  const overdueCount = monthlyMachines.filter(machine => getMachineStatus(machine) === 'Atrasado').length;
  document.getElementById('kpiAtrasadas').textContent = overdueCount;
  const monthlyDeliveredCount = monthlyMachines.filter(machine => getMachineStatus(machine) === 'Entregue' && machine.entregaReal && machine.entregaReal.startsWith(mesRefStr)).length;
  document.getElementById('kpiEntreguesTotal').textContent = monthlyDeliveredCount;

  const entreguesMes = appMachines.filter(m => {
    const st = getMachineStatus(m);
    return st === 'Entregue' && m.entregaReal && m.entregaReal.startsWith(mesRefStr);
  }).length;

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
        const teamMachines = monthMachines.filter(m => m.equipe === teamName && m.cliente && m.cliente.trim());
        if (!teamMachines.length) return '';
        const overdue = teamMachines.filter(m => getMachineStatus(m) === 'Atrasado');
        const inProcess = teamMachines.filter(m => getMachineStatus(m) === 'Em andamento');
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
                <span class="dashboard-team-overdue-stat"><strong>${overdue.length}</strong> atrasadas</span>
                <span><strong>${inProcess.length}</strong> em processo</span>
                <span><strong>${ready.length}</strong> prontas</span>
              </div>
            </div>
            <div class="dashboard-team-search">
              <span>⌕</span>
              <input type="search" placeholder="Pesquisar cliente, máquina ou OS" oninput="filterDashboardTeam(this)">
            </div>
            ${overdue.length ? `<div class="dashboard-status-section overdue-section">
              <div class="dashboard-status-title"><span>Atrasadas</span><strong>${overdue.length}</strong></div>
              ${overdue.map(renderDashMachine).join('')}
            </div>` : ''}
            ${inProcess.length ? `<div class="dashboard-status-section process-section">
              <div class="dashboard-status-title"><span>Em processo</span><strong>${inProcess.length}</strong></div>
              ${inProcess.map(renderDashMachine).join('')}
            </div>` : ''}
            ${ready.length ? `<div class="dashboard-status-section ready-section">
              <div class="dashboard-status-title"><span>Prontas / entregues</span><strong>${ready.length}</strong></div>
              ${ready.map(renderDashMachine).join('')}
            </div>` : ''}
          </article>
        `;
      }).join('') || '<div class="dashboard-empty">Nenhuma máquina encontrada para o mês selecionado.</div>';
    }
  }

  const analyticsBox = document.getElementById('dashboardAnalytics');
  if (analyticsBox) {
    const dateDiffDays = (from, to) => {
      const start = new Date(`${from}T00:00:00`);
      const end = new Date(`${to}T00:00:00`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
      return Math.max(0, Math.round((end - start) / 86400000));
    };
    const [selectedYear, selectedMonth] = mesRefStr.split('-').map(Number);
    const previousDate = new Date(selectedYear, selectedMonth - 2, 1);
    const previousPeriod = `${previousDate.getFullYear()}-${String(previousDate.getMonth() + 1).padStart(2, '0')}`;
    const todayIso = new Date().toISOString().slice(0, 10);
    const teamNames = [...new Set([...appTeams.map(team => team.name), ...appMachines.map(machine => machine.equipe).filter(Boolean)])];
    analyticsBox.innerHTML = teamNames.map(teamName => {
      const teamMachines = appMachines.filter(machine => machine.equipe === teamName && [machine.inicio, machine.previsao, machine.entregaReal].some(date => date && date.startsWith(mesRefStr)));
      const plannedMachines = appMachines.filter(machine => machine.equipe === teamName && machine.previsao && machine.previsao.startsWith(mesRefStr));
      const onTime = plannedMachines.filter(machine => machine.entregaReal && machine.entregaReal <= machine.previsao).length;
      const lateDelivered = plannedMachines.filter(machine => machine.entregaReal && machine.entregaReal > machine.previsao).length;
      const pending = plannedMachines.filter(machine => !machine.entregaReal).length;
      const inProcess = teamMachines.filter(machine => getMachineStatus(machine) === 'Em andamento').length;
      const planned = plannedMachines.length;
      const efficiency = planned ? Math.min(100, Math.round((onTime / planned) * 100)) : 0;
      const delayDays = plannedMachines
        .filter(machine => machine.entregaReal && machine.entregaReal > machine.previsao)
        .map(machine => dateDiffDays(machine.previsao, machine.entregaReal));
      const overduePendingDays = plannedMachines
        .filter(machine => !machine.entregaReal && machine.previsao < todayIso)
        .map(machine => dateDiffDays(machine.previsao, todayIso));
      const allDelayDays = [...delayDays, ...overduePendingDays];
      const averageDelay = allDelayDays.length ? Math.round((allDelayDays.reduce((sum, days) => sum + days, 0) / allDelayDays.length) * 10) / 10 : 0;
      const previousPlanned = appMachines.filter(machine => machine.equipe === teamName && machine.previsao?.startsWith(previousPeriod));
      const previousOnTime = previousPlanned.filter(machine => machine.entregaReal && machine.entregaReal <= machine.previsao).length;
      const previousEfficiency = previousPlanned.length ? Math.min(100, Math.round((previousOnTime / previousPlanned.length) * 100)) : 0;
      const efficiencyDelta = efficiency - previousEfficiency;
      const trendClass = efficiencyDelta > 0 ? 'trend-up' : efficiencyDelta < 0 ? 'trend-down' : 'trend-stable';
      const trendLabel = efficiencyDelta > 0 ? `↑ ${efficiencyDelta} p.p. vs. mês anterior` : efficiencyDelta < 0 ? `↓ ${Math.abs(efficiencyDelta)} p.p. vs. mês anterior` : '→ igual ao mês anterior';
      const volume = Math.max(planned, 1);
      const onTimeWidth = Math.round((onTime / volume) * 100);
      const lateWidth = Math.round((lateDelivered / volume) * 100);
      const pendingWidth = Math.round((pending / volume) * 100);

      return `
        <article class="team-analytics-card">
          <div class="team-analytics-header">
            <div><span class="section-kicker">Eficiência de prazo</span><h3>${escapeHtml(teamName)}</h3></div>
            <strong class="team-efficiency-value">${efficiency}%</strong>
          </div>
          <div class="team-efficiency-meter"><span style="width:${efficiency}%"></span></div>
          <div class="team-metric-bars">
            <div class="metric-bar-row"><span>Previstas <b>${planned}</b></span><i><em class="bar-planned" style="width:100%"></em></i></div>
            <div class="metric-bar-row"><span>Entregues no prazo <b>${onTime}</b></span><i><em class="bar-delivered" style="width:${onTimeWidth}%"></em></i></div>
            <div class="metric-bar-row"><span>Entregues atrasadas <b>${lateDelivered}</b></span><i><em class="bar-overdue" style="width:${lateWidth}%"></em></i></div>
            <div class="metric-bar-row"><span>Pendentes <b>${pending}</b></span><i><em class="bar-pending" style="width:${pendingWidth}%"></em></i></div>
          </div>
          <div class="team-analytics-footer"><span>${inProcess} em produção</span><span>${planned} previstas no mês</span></div>
          <div class="team-analytics-insight"><span>Atraso médio <b>${averageDelay} dias</b></span><strong class="${trendClass}">${trendLabel}</strong></div>
        </article>
      `;
    }).join('') || '<div class="dashboard-empty">Sem equipes para analisar.</div>';
  }

  const monthlyTeamLinesBody = document.getElementById('monthlyTeamLinesBody');
  const monthlyTeamLinesLabel = document.getElementById('monthlyTeamLinesLabel');
  if (monthlyTeamLinesBody) {
    if (monthlyTeamLinesLabel) monthlyTeamLinesLabel.textContent = dashboardLabel;
    const monthlyTeamNames = [...new Set([...appTeams.map(team => team.name), ...monthlyMachines.map(machine => machine.equipe).filter(Boolean)])];
    monthlyTeamLinesBody.innerHTML = monthlyTeamNames.map(teamName => {
      const teamMonthlyMachines = appMachines.filter(machine => machine.equipe === teamName && machine.inicio?.startsWith(mesRefStr));
      const light = teamMonthlyMachines.filter(machine => machine.linha === 'Leve').length;
      const intermediate = teamMonthlyMachines.filter(machine => machine.linha === 'Intermediária').length;
      const heavy = teamMonthlyMachines.filter(machine => machine.linha === 'Pesada').length;
      return `<tr><td><strong class="monthly-team-name">${escapeHtml(teamName)}</strong></td><td><strong class="monthly-line-light">${light}</strong></td><td><strong class="monthly-line-intermediate">${intermediate}</strong></td><td><strong class="monthly-line-heavy">${heavy}</strong></td><td><strong class="monthly-line-total">${light + intermediate + heavy}</strong></td></tr>`;
    }).join('') || '<tr><td colspan="5" class="dashboard-empty">Sem máquinas iniciadas neste mês.</td></tr>';
  }

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const annualChartBox = document.getElementById('annualChartBox');
  if (annualChartBox) {
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
          <div class="svg-bar annual-bar-${idx % 4}" style="height: ${Math.max(heightPct, 6)}%;"></div>
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
        <div class="svg-bar delivery-bar annual-bar-${index % 4}" style="height:${Math.max(heightPct, 6)}%;"></div>
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

  const annualEfficiencyChart = document.getElementById('annualEfficiencyChart');
  if (annualEfficiencyChart) {
    const efficiencyTeamNames = [...new Set([...appTeams.map(team => team.name), ...appMachines.map(machine => machine.equipe).filter(Boolean)])];
    annualEfficiencyChart.innerHTML = efficiencyTeamNames.map(teamName => {
        const teamRecord = appTeams.find(team => team.name === teamName);
        const monthlyEfficiency = meses.map((_, monthIndex) => {
          const monthKey = `${dashboardYear}-${String(monthIndex + 1).padStart(2, '0')}`;
          const planned = appMachines.filter(machine => machine.equipe === teamName && machine.previsao?.startsWith(monthKey));
          if (!planned.length) return null;
          const onTime = planned.filter(machine => machine.entregaReal && machine.entregaReal <= machine.previsao).length;
          return Math.min(100, Math.round((onTime / planned.length) * 100));
        });
        const annualPlanned = appMachines.filter(machine => machine.equipe === teamName && machine.previsao?.startsWith(`${dashboardYear}-`));
        const annualOnTime = annualPlanned.filter(machine => machine.entregaReal && machine.entregaReal <= machine.previsao).length;
        const annualEfficiency = annualPlanned.length ? Math.round((annualOnTime / annualPlanned.length) * 100) : 0;
        return `<article class="annual-efficiency-team-card">
          <div class="annual-efficiency-team-heading"><div><h4>${escapeHtml(teamName)}</h4><small>${escapeHtml(teamRecord?.id || 'ID não definido')}</small></div><strong>${annualEfficiency}%</strong><span>${dashboardYear}</span></div>
          <div class="annual-efficiency-month-grid">${monthlyEfficiency.map((value, monthIndex) => `<div class="annual-efficiency-month ${value === null ? 'is-empty' : value >= 80 ? 'is-good' : value >= 50 ? 'is-medium' : 'is-low'}" title="${meses[monthIndex]}/${dashboardYear}: ${value === null ? 'sem previsão' : `${value}% no prazo`}"><b>${value === null ? '—' : `${value}%`}</b><span>${meses[monthIndex]}</span></div>`).join('')}</div>
        </article>`;
      }).join('') || '<div class="dashboard-empty">Sem equipes para analisar.</div>';
  }

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

  const renderMiniBars = (containerId, entries) => {
    const container = document.getElementById(containerId);
    if (!container) return;
    const maxValue = Math.max(...entries.map(entry => entry.value), 1);
    container.innerHTML = entries.map(entry => `
      <div class="mini-bar-row">
        <div class="mini-bar-label"><span>${escapeHtml(entry.label)}</span><strong>${entry.value}</strong></div>
        <div class="mini-bar-track"><span class="${entry.className || ''}" style="width:${Math.round((entry.value / maxValue) * 100)}%"></span></div>
      </div>
    `).join('') || '<div class="dashboard-empty">Sem dados para analisar.</div>';
  };

  const statusEntries = [
    { label: 'Em andamento', value: appMachines.filter(machine => getMachineStatus(machine) === 'Em andamento').length, color: '#60a5fa' },
    { label: 'Entregue', value: appMachines.filter(machine => getMachineStatus(machine) === 'Entregue').length, color: '#34d399' },
    { label: 'Atrasado', value: appMachines.filter(machine => getMachineStatus(machine) === 'Atrasado').length, color: '#fb7185' },
    { label: 'Aguardando', value: appMachines.filter(machine => getMachineStatus(machine) === 'Aguardando produção').length, color: '#fbbf24' }
  ];
  const statusTotal = Math.max(statusEntries.reduce((sum, entry) => sum + entry.value, 0), 1);
  let statusOffset = 0;
  const statusGradient = statusEntries.map(entry => {
    const start = statusOffset;
    statusOffset += (entry.value / statusTotal) * 360;
    return `${entry.color} ${start}deg ${statusOffset}deg`;
  }).join(', ');
  const statusDonut = document.getElementById('statusMixChart');
  const statusLegend = document.getElementById('statusMixLegend');
  if (statusDonut) statusDonut.style.setProperty('--donut-gradient', statusGradient);
  if (statusLegend) {
    statusLegend.innerHTML = statusEntries.map(entry => `
      <div class="dashboard-legend-item"><span><i style="background:${entry.color}"></i>${entry.label}</span><strong>${entry.value}</strong></div>
    `).join('');
  }

  renderMiniBars('lineMixChart', [
    { label: 'Leve', value: appMachines.filter(machine => machine.linha === 'Leve').length, className: 'mini-bar-blue' },
    { label: 'Intermediária', value: appMachines.filter(machine => machine.linha === 'Intermediária').length, className: 'mini-bar-purple' },
    { label: 'Pesada', value: appMachines.filter(machine => machine.linha === 'Pesada').length, className: 'mini-bar-orange' }
  ]);

  const periodMachines = appMachines.filter(machine => [machine.inicio, machine.previsao, machine.entregaReal].some(date => date && date.startsWith(mesRefStr)));
  renderMiniBars('deadlineChart', [
    { label: 'Previstas', value: periodMachines.filter(machine => machine.previsao && machine.previsao.startsWith(mesRefStr)).length, className: 'mini-bar-purple' },
    { label: 'Entregues', value: periodMachines.filter(machine => machine.entregaReal && machine.entregaReal.startsWith(mesRefStr)).length, className: 'mini-bar-green' },
    { label: 'Em atraso', value: periodMachines.filter(machine => getMachineStatus(machine) === 'Atrasado').length, className: 'mini-bar-red' }
  ]);

  const overdueMachinesList = document.getElementById('overdueMachinesList');
  const overdueMachinesSubtitle = document.getElementById('overdueMachinesSubtitle');
  if (overdueMachinesList) {
    const overdueMachines = periodMachines.filter(machine => getMachineStatus(machine) === 'Atrasado' && machine.cliente && machine.cliente.trim());
    if (overdueMachinesSubtitle) overdueMachinesSubtitle.textContent = `${overdueMachines.length} máquina(s) em atraso em ${dashboardLabel}.`;
    overdueMachinesList.innerHTML = overdueMachines.map(machine => `
      <div class="overdue-machine-item">
        <div><strong>${escapeHtml(machine.maquina || 'Máquina sem modelo')}</strong><span>${escapeHtml(machine.cliente)} · ${escapeHtml(machine.equipe || 'Equipe não definida')}</span></div>
        <b>${formatDateDisplay(machine.previsao)}</b>
      </div>
    `).join('') || '<div class="dashboard-empty overdue-empty">Nenhuma máquina atrasada neste mês.</div>';
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
  const mesRefStr = document.getElementById('highlightsMonth')?.value || document.getElementById('dashboardPeriod')?.value || '2026-09';
  const anoRef = document.getElementById('highlightsYear')?.value || mesRefStr.slice(0, 4);
  const teamNames = [...new Set([...appTeams.map(team => team.name), ...appMachines.map(machine => machine.equipe).filter(Boolean)])];
  const teamScores = teamNames.map(teamName => {
    const teamRecord = appTeams.find(team => team.name === teamName);
    const teamMachines = appMachines.filter(m => m.equipe === teamName);
    const periodMachines = teamMachines.filter(m => [m.inicio, m.previsao, m.entregaReal].some(date => date && date.startsWith(mesRefStr)));
    const delivered = teamMachines.filter(m => getMachineStatus(m) === 'Entregue' && m.entregaReal?.startsWith(mesRefStr)).length;
    const active = periodMachines.filter(m => getMachineStatus(m) === 'Em andamento').length;
    const overdue = periodMachines.filter(m => getMachineStatus(m) === 'Atrasado').length;
    const planned = teamMachines.filter(m => m.previsao?.startsWith(mesRefStr)).length;
    const efficiency = planned ? Math.min(100, Math.round((delivered / planned) * 100)) : 0;
    const startedInYear = teamMachines.filter(m => m.inicio?.startsWith(`${anoRef}-`)).length;
    return { name: teamName, id: teamRecord?.id || teamMachines.find(machine => machine.equipeId)?.equipeId || '', delivered, active, overdue, planned, efficiency, startedInYear, score: (delivered * 10) + active };
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
            <div style="font-size:0.76rem; color:#34d399; font-weight:600;">${item.delivered} máquina(s) · ${item.score} pts</div>
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
        <td><strong style="color:#fb7185;">${ts.overdue}</strong></td>
        <td><strong style="color:#fbbf24;">${ts.efficiency}%</strong></td>
        <td><strong style="color:#818cf8;">${ts.score} pts</strong></td>
      </tr>
    `).join('');
  }

  const highlightsAnalysis = document.getElementById('highlightsAnalysis');
  if (highlightsAnalysis) {
    const totals = teamScores.reduce((summary, team) => ({
      delivered: summary.delivered + team.delivered,
      active: summary.active + team.active,
      overdue: summary.overdue + team.overdue,
      planned: summary.planned + team.planned
    }), { delivered: 0, active: 0, overdue: 0, planned: 0 });
    const bestTeam = [...teamScores].sort((a, b) => b.score - a.score)[0];
    highlightsAnalysis.innerHTML = `
      <article class="highlight-stat-card highlight-stat-blue"><span>📊 Máquinas analisadas</span><strong>${totals.delivered + totals.active + totals.overdue}</strong><small>${mesRefStr}</small></article>
      <article class="highlight-stat-card highlight-stat-green"><span>🚀 Entregas no período</span><strong>${totals.delivered}</strong><small>Concluídas no mês</small></article>
      <article class="highlight-stat-card highlight-stat-amber"><span>⭐ Equipe destaque</span><strong>${escapeHtml(bestTeam?.name || '—')}</strong><small>${bestTeam ? `${bestTeam.score} pontos · ${bestTeam.efficiency}% eficiência` : 'Sem dados'}</small></article>
      <article class="highlight-stat-card highlight-stat-red"><span>⚠️ Em atraso</span><strong>${totals.overdue}</strong><small>Requer atenção</small></article>
    `;
  }

  const highlightsTeamBoard = document.getElementById('highlightsTeamBoard');
  if (highlightsTeamBoard) {
    const yearMachines = appMachines.filter(machine => machine.inicio?.startsWith(`${anoRef}-`));
    const maxTeamYear = Math.max(...teamScores.map(team => team.startedInYear), 1);
    highlightsTeamBoard.innerHTML = teamScores.map((team, index) => {
      const monthlyCounts = Array.from({ length: 12 }, (_, monthIndex) => yearMachines.filter(machine => machine.equipe === team.name && Number(machine.inicio.split('-')[1]) === monthIndex + 1).length);
      const maxMonth = Math.max(...monthlyCounts, 1);
      return `
        <article class="highlights-team-card rank-${Math.min(index + 1, 4)}">
          <div class="highlights-team-card-heading">
            <div>
              <span class="highlights-team-rank">#${index + 1}</span>
              <h3>${escapeHtml(team.name)}</h3>
              <small>${escapeHtml(team.id || 'ID não definido')}</small>
            </div>
            <strong>${team.score}<small> pts</small></strong>
          </div>
          <div class="highlights-team-metrics">
            <span><b>${team.delivered}</b> entregues</span>
            <span><b>${team.active}</b> produção</span>
            <span><b>${team.overdue}</b> atraso</span>
          </div>
          <div class="highlights-team-progress"><span style="width:${Math.round((team.startedInYear / maxTeamYear) * 100)}%"></span></div>
          <div class="highlights-team-progress-label"><span>Produção em ${anoRef}</span><b>${team.startedInYear} máquinas</b></div>
          <div class="highlights-team-sparkline" aria-label="Evolução mensal de ${escapeHtml(team.name)}">
            ${monthlyCounts.map((count, monthIndex) => `<span title="${count} em ${monthIndex + 1}/${anoRef}" style="height:${Math.max(8, Math.round((count / maxMonth) * 100))}%"></span>`).join('')}
          </div>
        </article>
      `;
    }).join('') || '<div class="dashboard-empty">Sem equipes para analisar.</div>';
  }

  const highlightsTrendChart = document.getElementById('highlightsTrendChart');
  if (highlightsTrendChart) {
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const yearMachines = appMachines.filter(machine => machine.inicio?.startsWith(`${anoRef}-`));
    const maxCount = Math.max(...months.map((_, index) => yearMachines.filter(machine => Number(machine.inicio.split('-')[1]) === index + 1).length), 1);
    highlightsTrendChart.innerHTML = months.map((month, index) => {
      const monthMachines = yearMachines.filter(machine => Number(machine.inicio.split('-')[1]) === index + 1);
      const teamCount = new Set(monthMachines.map(machine => machine.equipe).filter(Boolean)).size;
      return `<div class="highlight-trend-column" title="${month}/${anoRef}: ${monthMachines.length} máquinas, ${teamCount} equipes">
        <strong>${monthMachines.length}</strong><div class="highlight-trend-bar" style="height:${Math.max(8, Math.round((monthMachines.length / maxCount) * 100))}%"></div><span>${month}</span>
      </div>`;
    }).join('');
  }

  const highlightsAnnualTeams = document.getElementById('highlightsAnnualTeams');
  const highlightsAnnualPodium = document.getElementById('highlightsAnnualPodium');
  const highlightsAnnualLabel = document.getElementById('highlightsAnnualLabel');
  if (highlightsAnnualTeams) {
    if (highlightsAnnualLabel) highlightsAnnualLabel.textContent = `Ano ${anoRef}`;
    const annualTeamMetrics = teamScores.map(team => {
      const teamMachines = appMachines.filter(machine => machine.equipe === team.name && machine.inicio?.startsWith(`${anoRef}-`));
      return {
        ...team,
        annualLight: teamMachines.filter(machine => machine.linha === 'Leve').length,
        annualIntermediate: teamMachines.filter(machine => machine.linha === 'Intermediária').length,
        annualHeavy: teamMachines.filter(machine => machine.linha === 'Pesada').length,
        annualTotal: teamMachines.length,
        annualPlanned: teamMachines.filter(machine => machine.previsao?.startsWith(`${anoRef}-`)).length,
        annualOnTime: teamMachines.filter(machine => machine.previsao?.startsWith(`${anoRef}-`) && machine.entregaReal && machine.entregaReal <= machine.previsao).length
      };
    }).map(team => {
      const monthlyEfficiencies = Array.from({ length: 12 }, (_, monthIndex) => {
        const monthKey = `${anoRef}-${String(monthIndex + 1).padStart(2, '0')}`;
        const planned = appMachines.filter(machine => machine.equipe === team.name && machine.previsao?.startsWith(monthKey));
        if (!planned.length) return null;
        const onTime = planned.filter(machine => machine.entregaReal && machine.entregaReal <= machine.previsao).length;
        return Math.round((onTime / planned.length) * 100);
      }).filter(value => value !== null);
      const averageMonthlyEfficiency = monthlyEfficiencies.length ? Math.round(monthlyEfficiencies.reduce((sum, value) => sum + value, 0) / monthlyEfficiencies.length) : 0;
      return { ...team, averageMonthlyEfficiency };
    }).sort((a, b) => b.averageMonthlyEfficiency - a.averageMonthlyEfficiency || b.annualTotal - a.annualTotal);

    if (highlightsAnnualPodium) {
      const medals = ['🥇', '🥈', '🥉'];
      highlightsAnnualPodium.innerHTML = annualTeamMetrics.slice(0, 3).map((team, index) => `
        <article class="annual-highlight-podium-card podium-rank-${index + 1}">
          <span class="annual-highlight-medal">${medals[index]}</span>
          <strong>${escapeHtml(team.name)}</strong>
          <b>${team.averageMonthlyEfficiency}%</b>
          <small>média mensal · ${team.annualTotal} máquinas</small>
        </article>
      `).join('') || '<div class="dashboard-empty">Sem dados anuais para o pódio.</div>';
    }

    highlightsAnnualTeams.innerHTML = annualTeamMetrics.map((team, index) => `
      <div class="highlights-annual-team-row">
        <div class="highlights-annual-team-rank">${index + 1}</div>
        <div class="highlights-annual-team-main">
          <div class="highlights-annual-team-name"><strong>${escapeHtml(team.name)}</strong><span>${team.averageMonthlyEfficiency}% média mensal · ${team.annualTotal} máquinas</span></div>
          <div class="highlights-annual-team-track"><span style="width:${team.averageMonthlyEfficiency}%"></span></div>
        </div>
        <div class="highlights-annual-team-numbers"><span><b>${team.annualLight}</b> leves</span><span><b>${team.annualIntermediate}</b> interm.</span><span><b>${team.annualHeavy}</b> pesadas</span><span><b>${team.annualTotal}</b> total</span></div>
      </div>
    `).join('') || '<div class="dashboard-empty">Sem dados anuais para analisar.</div>';
  }
}

window.addEventListener('load', () => {
  if (document.getElementById('geminiAlertBanner')) {
    checkGeminiBanner();
  }
});
