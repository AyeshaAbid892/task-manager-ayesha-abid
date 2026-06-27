/* ═══════════════════════════════════════════════════════
   tasks.js — Task CRUD (Create / Read / Update / Delete)
   Single source of truth: the tasks[] array.
   Every mutation → persistAndRefresh() → runPipeline()
═══════════════════════════════════════════════════════ */

let tasks   = [];
let archive = [];

/* ─── INIT ─── */
function initTasks() {
  tasks   = loadTasks();
  archive = loadArchive();
}

/* ─── READ ─── */
function getAllTasks()    { return tasks.slice(); }
function getTaskById(id) { return tasks.find(t => t.id === id); }
function getArchive()    { return archive.slice(); }

/* ─── CREATE ─── */
/**
 * Build a new task object and push to tasks[].
 * Required PDF data structure — exact field names.
 * priority now supports: 'highest' | 'high' | 'medium' | 'low' | 'lowest'
 */
function createTask(formData) {
  const task = {
    id:          Date.now(),
    title:       formData.title.trim(),
    description: formData.description.trim(),
    priority:    formData.priority,                 // exact string from select
    column:      formData.column,                   // 'todo'|'inprogress'|'done'
    dueDate:     formData.dueDate,                  // ISO YYYY-MM-DD string
    tags:        deduplicateTags(formData.tags),
    createdAt:   Date.now(),
  };
  tasks.push(task);
  persistAndRefresh();
  return task;
}

/* ─── UPDATE ─── */
/**
 * Merge changes into existing task. id and createdAt are immutable.
 */
function updateTask(id, changes) {
  const idx = tasks.findIndex(t => t.id === id);
  if (idx === -1) return null;

  tasks[idx] = {
    ...tasks[idx],
    ...changes,
    id:        tasks[idx].id,
    createdAt: tasks[idx].createdAt,
    tags: changes.tags ? deduplicateTags(changes.tags) : tasks[idx].tags,
  };

  persistAndRefresh();
  return tasks[idx];
}

/* ─── MOVE ─── */
/**
 * Move task one column left or right.
 * Column order: todo → inprogress → done
 */
function moveTask(id, direction) {
  const COLS = ['todo', 'inprogress', 'done'];
  const task = getTaskById(id);
  if (!task) return null;

  const cur    = COLS.indexOf(task.column);
  const target = direction === 'right' ? cur + 1 : cur - 1;
  if (target < 0 || target >= COLS.length) return null;

  return updateTask(id, { column: COLS[target] });
}

/* ─── DELETE ─── */
function deleteTask(id) {
  const before = tasks.length;
  tasks = tasks.filter(t => t.id !== id);
  if (tasks.length === before) return false;
  persistAndRefresh();
  return true;
}

/* ─── ARCHIVE ─── */
function archiveTask(id) {
  const task = getTaskById(id);
  if (!task) return false;
  archive.push({ ...task, archivedAt: Date.now() });
  tasks = tasks.filter(t => t.id !== id);
  saveTasks(tasks);
  saveArchive(archive);
  refreshUI();
  return true;
}

function restoreTask(id) {
  const item = archive.find(t => t.id === id);
  if (!item) return false;
  const { archivedAt, ...taskData } = item;
  tasks.push(taskData);
  archive = archive.filter(t => t.id !== id);
  saveTasks(tasks);
  saveArchive(archive);
  refreshUI();
  return true;
}

/* ─── DRAG & DROP REORDER ─── */
/**
 * Reorder tasks array after a drag-drop.
 * Moves draggedId to position before targetId in targetColumn.
 * If targetId is null, appends to end of column.
 */
function reorderTask(draggedId, targetId, targetColumn) {
  const dragIdx = tasks.findIndex(t => t.id === draggedId);
  if (dragIdx === -1) return;

  const [dragged] = tasks.splice(dragIdx, 1);
  dragged.column  = targetColumn;

  if (targetId === null) {
    tasks.push(dragged);
  } else {
    const targetIdx = tasks.findIndex(t => t.id === targetId);
    tasks.splice(targetIdx === -1 ? tasks.length : targetIdx, 0, dragged);
  }

  persistAndRefresh();
}

/* ─── EXPORT ─── */
/**
 * Download all active tasks as a dated .json file.
 * Uses Blob URL — no server required.
 */
function exportTasksToJSON() {
  const json   = JSON.stringify(tasks, null, 2);
  const blob   = new Blob([json], { type: 'application/json' });
  const url    = URL.createObjectURL(blob);
  const a      = document.createElement('a');
  a.href       = url;
  a.download   = `taskflow-export-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  showToast('Tasks exported successfully', 'success');
}

/* ─── HELPERS ─── */

/**
 * Remove duplicate tags — case-insensitive comparison.
 * Preserves original casing of first occurrence.
 */
function deduplicateTags(tags) {
  const seen = new Set();
  return tags.filter(tag => {
    const key = tag.toLowerCase().trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Save to localStorage then trigger full UI refresh. */
function persistAndRefresh() {
  saveTasks(tasks);
  refreshUI();
}

/**
 * Trigger the central pipeline defined in app.js.
 * Called by every state mutation.
 */
function refreshUI() {
  if (typeof runPipeline === 'function') runPipeline();
}