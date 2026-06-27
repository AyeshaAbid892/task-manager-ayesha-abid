/* ═══════════════════════════════════════════════════════
   ui.js — Jira-style UI Interactions
═══════════════════════════════════════════════════════ */

/* ─── MODAL STATE ─── */
let editingTaskId = null;
let currentTags   = [];

/* DOM refs */
let taskModalOverlay, modalTitle, modalSaveBtn;
let taskTitleInput, taskDescInput, taskPriorityInput,
    taskDueDateInput, taskColumnInput, tagInput, tagsPillsEl;
let titleErrorEl, dueDateErrorEl;

function initModal() {
  taskModalOverlay  = document.getElementById('taskModalOverlay');
  modalTitle        = document.getElementById('modalTitle');
  modalSaveBtn      = document.getElementById('modalSave');
  taskTitleInput    = document.getElementById('taskTitle');
  taskDescInput     = document.getElementById('taskDesc');
  taskPriorityInput = document.getElementById('taskPriority');
  taskDueDateInput  = document.getElementById('taskDueDate');
  taskColumnInput   = document.getElementById('taskColumn');
  tagInput          = document.getElementById('tagInput');
  tagsPillsEl       = document.getElementById('tagsPills');
  titleErrorEl      = document.getElementById('titleError');
  dueDateErrorEl    = document.getElementById('dueDateError');
}

/* ─── OPEN MODAL ─── */
function openCreateModal(preselectedColumn) {
  editingTaskId = null;
  currentTags   = [];
  clearForm();
  if (preselectedColumn) taskColumnInput.value = preselectedColumn;
  taskDueDateInput.min     = getTodayDateString();
  modalTitle.textContent   = 'Create issue';
  modalSaveBtn.textContent = 'Create';
  showModal();
}

function openEditModal(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;
  editingTaskId            = taskId;
  currentTags              = task.tags.slice();
  taskTitleInput.value     = task.title;
  taskDescInput.value      = task.description;
  taskPriorityInput.value  = task.priority;
  taskColumnInput.value    = task.column;
  taskDueDateInput.value   = task.dueDate;
  taskDueDateInput.min     = '';
  renderTagPills();
  clearValidationErrors();
  modalTitle.textContent   = 'Edit issue';
  modalSaveBtn.textContent = 'Save changes';
  showModal();
}

function showModal() {
  taskModalOverlay.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  setTimeout(() => taskTitleInput.focus(), 50);
}

function closeTaskModal() {
  taskModalOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  editingTaskId = null;
  currentTags   = [];
}

/* ─── VALIDATION ─── */
function validateForm() {
  clearValidationErrors();
  let ok = true;
  const title   = taskTitleInput.value.trim();
  const dueDate = taskDueDateInput.value;
  const today   = getTodayDateString();

  if (title.length < 3) {
    showFieldError(taskTitleInput, titleErrorEl,
      title.length === 0 ? 'Summary is required.' : 'Summary must be at least 3 characters.');
    ok = false;
  }
  if (dueDate && editingTaskId === null && dueDate < today) {
    showFieldError(taskDueDateInput, dueDateErrorEl, 'Due date cannot be in the past.');
    ok = false;
  }
  return ok;
}

function showFieldError(inputEl, errorEl, msg) {
  inputEl.classList.add('error');
  if (errorEl) { errorEl.textContent = ''; errorEl.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i> ${msg}`; errorEl.classList.remove('hidden'); }
}

function clearValidationErrors() {
  [taskTitleInput, taskDueDateInput].forEach(el => el && el.classList.remove('error'));
  [titleErrorEl, dueDateErrorEl].forEach(el => el && el.classList.add('hidden'));
}

function clearForm() {
  taskTitleInput.value    = '';
  taskDescInput.value     = '';
  taskPriorityInput.value = 'medium';
  taskColumnInput.value   = 'todo';
  taskDueDateInput.value  = '';
  currentTags             = [];
  renderTagPills();
  clearValidationErrors();
}

/* ─── SAVE ─── */
function handleModalSave() {
  if (!validateForm()) return;
  const formData = {
    title:       taskTitleInput.value.trim(),
    description: taskDescInput.value.trim(),
    priority:    taskPriorityInput.value,
    column:      taskColumnInput.value,
    dueDate:     taskDueDateInput.value,
    tags:        currentTags.slice(),
  };
  if (editingTaskId !== null) {
    updateTask(editingTaskId, formData);
    showToast('Issue updated', 'success');
  } else {
    createTask(formData);
    showToast('Issue created', 'success');
  }
  closeTaskModal();
}

/* ─── TAGS ─── */
function addTag(raw) {
  const val = raw.trim().replace(/,$/, '').trim();
  if (!val) return;
  if (!currentTags.some(t => t.toLowerCase() === val.toLowerCase())) {
    currentTags.push(val);
    renderTagPills();
  }
  tagInput.value = '';
}

function removeTag(idx) {
  currentTags.splice(idx, 1);
  renderTagPills();
}

function renderTagPills() {
  if (!tagsPillsEl) return;
  tagsPillsEl.innerHTML = currentTags.map((tag, i) => `
    <span class="jira-tag-pill">
      ${escapeHTML(tag)}
      <span class="jira-tag-remove" data-index="${i}">×</span>
    </span>`).join('');
}

/* ─── DELETE CONFIRM ─── */
let pendingDeleteId = null;

function showDeleteConfirm(id) {
  pendingDeleteId = id;
  document.getElementById('confirmOverlay').classList.remove('hidden');
  document.getElementById('confirmDelete').focus();
}

function confirmDelete() {
  if (pendingDeleteId === null) return;
  deleteTask(pendingDeleteId);
  closeConfirmDialog();
  showToast('Issue deleted', 'info');
}

function closeConfirmDialog() {
  document.getElementById('confirmOverlay').classList.add('hidden');
  pendingDeleteId = null;
}

/* ─── THEME ─── */
function initTheme() { applyTheme(loadTheme()); }

function toggleTheme() {
  const next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  applyTheme(next);
  saveTheme(next);
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  const icon  = document.getElementById('themeIcon');
  const label = document.getElementById('themeLabel');
  if (theme === 'dark') {
    if (icon)  icon.className  = 'fa-solid fa-sun';
    if (label) label.textContent = 'Light';
  } else {
    if (icon)  icon.className  = 'fa-solid fa-moon';
    if (label) label.textContent = 'Dark';
  }
}

/* ─── ARCHIVE ─── */
function openArchivePanel() {
  renderArchiveList();
  document.getElementById('archiveOverlay').classList.remove('hidden');
}
function closeArchivePanel() { document.getElementById('archiveOverlay').classList.add('hidden'); }

function renderArchiveList() {
  const listEl   = document.getElementById('archiveList');
  const archived = getArchive();
  if (archived.length === 0) {
    listEl.innerHTML = '<p class="archive-empty"><i class="fa-solid fa-box-open" style="font-size:24px;display:block;margin-bottom:8px;opacity:0.4"></i>Archive is empty</p>';
    return;
  }
  listEl.innerHTML = archived.map(task => {
    const colName = task.column === 'todo' ? 'To Do' : task.column === 'inprogress' ? 'In Progress' : 'Done';
    const prio = task.priority.charAt(0).toUpperCase() + task.priority.slice(1);
    return `
    <div class="archive-item">
      <div class="archive-item-info">
        <div class="archive-item-title">${escapeHTML(task.title)}</div>
        <div class="archive-item-meta">${prio} · ${colName}${task.dueDate ? ' · Due ' + buildDueDateLabel(task.dueDate) : ''}</div>
      </div>
      <button class="btn-restore" data-id="${task.id}">Restore</button>
    </div>`;
  }).join('');
}

/* ─── TABS ─── */
let activeTab = 'todo';
function initTabs() { showTab('todo'); }
function showTab(col) {
  activeTab = col;
  document.querySelectorAll('.col-tab').forEach(b => b.classList.toggle('active', b.dataset.col === col));
  document.querySelectorAll('.kanban-col').forEach(c => c.classList.toggle('tab-active', c.dataset.column === col));
}

/* ─── DRAG & DROP ─── */
let draggedTaskId = null;

function initDragDrop(boardEl) {
  boardEl.addEventListener('dragstart', e => {
    const card = e.target.closest('.task-card');
    if (!card) return;
    draggedTaskId = Number(card.dataset.id);
    requestAnimationFrame(() => card.classList.add('dragging'));
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(draggedTaskId));
  });

  boardEl.addEventListener('dragend', e => {
    const card = e.target.closest('.task-card');
    if (card) card.classList.remove('dragging');
    document.querySelectorAll('.kanban-col.drag-over').forEach(c => c.classList.remove('drag-over'));
    draggedTaskId = null;
  });

  boardEl.addEventListener('dragover', e => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const col = e.target.closest('.kanban-col');
    if (col) col.classList.add('drag-over');
  });

  boardEl.addEventListener('dragleave', e => {
    const col = e.target.closest('.kanban-col');
    if (col && !col.contains(e.relatedTarget)) col.classList.remove('drag-over');
  });

  boardEl.addEventListener('drop', e => {
    e.preventDefault();
    if (!draggedTaskId) return;
    const col = e.target.closest('.kanban-col');
    if (!col) return;
    const targetColId = col.dataset.column;
    const targetCard  = e.target.closest('.task-card');
    const targetId    = targetCard ? Number(targetCard.dataset.id) : null;
    if (targetId === draggedTaskId) return;
    reorderTask(draggedTaskId, targetId, targetColId);
    col.classList.remove('drag-over');
  });
}

/* ─── TOAST ─── */
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = `jira-toast ${type}`;
  toast.innerHTML = `<span class="toast-dot"></span>${escapeHTML(message)}`;
  container.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('toast-out');
    setTimeout(() => toast.remove(), 200);
  }, 3000);
}

/* ─── SEARCH CLEAR BTN ─── */
function updateSearchClearBtn(val) {
  const btn = document.getElementById('searchClear');
  if (btn) btn.classList.toggle('hidden', val.length === 0);
}