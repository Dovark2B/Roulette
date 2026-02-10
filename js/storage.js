// Clé unique pour tout le projet
const STORAGE_KEY = 'mk_roulette_config_v1';

function defaultConfig() {
  return {
    version: Date.now(),
    images: [], // dataURL base64
    settings: {
      spinDuration: 3000,
      minInterval: 60,
      maxInterval: 260
    }
  };
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultConfig();
    const parsed = JSON.parse(raw);
    // Merge doux
    const base = defaultConfig();
    return {
      ...base,
      ...parsed,
      settings: { ...base.settings, ...(parsed.settings || {}) },
      images: Array.isArray(parsed.images) ? parsed.images : []
    };
  } catch {
    return defaultConfig();
  }
}

function saveConfig(cfg) {
  const safe = {
    ...cfg,
    version: Date.now()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(safe));
  return safe;
}

function estimateLocalStorageBytes() {
  let total = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    const v = localStorage.getItem(k) || '';
    total += (k.length + v.length) * 2; // UTF-16 approx
  }
  return total;
}

function triggerSpinSignal() {
  const signal = {
    timestamp: Date.now(),
    source: 'settings_manual'
  };
  localStorage.setItem('mk_roulette_spin_signal', JSON.stringify(signal));
}

window.MKR = {
  STORAGE_KEY,
  loadConfig,
  saveConfig,
  estimateLocalStorageBytes,
  triggerSpinSignal
};
