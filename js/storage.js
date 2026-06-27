/* ═══════════════════════════════════════════════════════
   storage.js — localStorage Read / Write ONLY
   No DOM, no rendering, no business logic here.
═══════════════════════════════════════════════════════ */

const STORAGE_KEYS = {
  TASKS:   'taskflow_tasks',
  ARCHIVE: 'taskflow_archive',
  THEME:   'theme',
};

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.warn('[storage] Could not parse tasks:', e);
    return [];
  }
}

function saveTasks(tasks) {
  try {
    // Store plain objects — never HTML
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('[storage] Could not save tasks:', e);
  }
}

function loadArchive() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ARCHIVE);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

function saveArchive(archive) {
  try {
    localStorage.setItem(STORAGE_KEYS.ARCHIVE, JSON.stringify(archive));
  } catch (e) {
    console.error('[storage] Could not save archive:', e);
  }
}

function loadTheme() {
  return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
}

function saveTheme(theme) {
  localStorage.setItem(STORAGE_KEYS.THEME, theme);
}