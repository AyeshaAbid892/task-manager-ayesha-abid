/* ═══════════════════════════════════════════════════════
   board.js — Jira-style Card & Column Rendering
═══════════════════════════════════════════════════════ */

const COLUMNS = ['todo', 'inprogress', 'done'];

/* Jira issue key counter — visual only */
let issueCounter = 1;

function renderBoard(filteredTasks) {
  /* Reset counter so keys match display order */
  issueCounter = 1;

  COLUMNS.forEach(column => {
    const container = document.getElementById(`tasks-${column}`);
    if (!container) return;
    const colTasks = getTasksForColumn(filteredTasks, column);
    container.innerHTML = '';
    if (colTasks.length === 0) {
      container.appendChild(buildEmptyState(column));
    } else {
      colTasks.forEach(task => container.appendChild(buildTaskCard(task)));
    }
  });
}

/* ─── BUILD CARD ─── */
function buildTaskCard(task) {
  const today     = getTodayDateString();
  const isOverdue = task.dueDate && task.dueDate < today && task.column !== 'done';
  const isDone    = task.column === 'done';
  const key       = `TF-${issueCounter++}`;

  const card = document.createElement('div');
  card.className = buildCardClasses(task, isOverdue, isDone);
  card.dataset.id  = task.id;
  card.dataset.key = key;
  card.draggable   = true;

  card.innerHTML = buildCardHTML(task, isOverdue, isDone, today, key);
  return card;
}

function buildCardClasses(task, isOverdue, isDone) {
  const cls = ['task-card'];
  if (isDone)    cls.push('is-done');
  if (isOverdue) cls.push('overdue');
  return cls.join(' ');
}

function buildCardHTML(task, isOverdue, isDone, today, key) {
  /* Labels (tags) row */
  const labelsHTML = task.tags && task.tags.length
    ? task.tags.map(t => `<span class="card-label">${escapeHTML(t)}</span>`).join('')
    : '';

  /* Priority icon — exact Jira colored squares */
  const prioHTML = buildPrioIcon(task.priority);

  /* Description preview */
  const descHTML = task.description
    ? `<div class="card-desc-preview">${escapeHTML(task.description.length > 55 ? task.description.slice(0,55)+'…' : task.description)}</div>`
    : '';

  /* Due date chip */
  const dueHTML = buildDueChip(task.dueDate, today, isDone, isOverdue);

  /* Done badge */
  const doneBadge = isDone
    ? `<span class="card-done-badge"><i class="fa-solid fa-check-circle"></i> Done</span>`
    : '';

  /* Move buttons */
  const moveLeft  = task.column !== 'todo'
    ? `<button class="card-action-btn" data-action="move-left"  data-id="${task.id}" title="Move left"><i class="fa-solid fa-arrow-left"></i></button>`
    : '';
  const moveRight = task.column !== 'done'
    ? `<button class="card-action-btn" data-action="move-right" data-id="${task.id}" title="Move right"><i class="fa-solid fa-arrow-right"></i></button>`
    : '';

  return `
    <!-- hover action buttons -->
    <div class="card-actions">
      ${moveLeft}
      ${moveRight}
      <button class="card-action-btn" data-action="archive" data-id="${task.id}" title="Archive"><i class="fa-solid fa-box-archive"></i></button>
      <button class="card-action-btn" data-action="edit"    data-id="${task.id}" title="Edit"><i class="fa-solid fa-pencil"></i></button>
      <button class="card-action-btn del" data-action="delete" data-id="${task.id}" title="Delete"><i class="fa-solid fa-trash"></i></button>
    </div>

    <!-- labels row -->
    ${labelsHTML ? `<div class="card-top-row"><div class="card-labels">${labelsHTML}</div></div>` : ''}

    <!-- summary / title -->
    <div class="card-summary">${escapeHTML(task.title)}</div>

    <!-- description preview -->
    ${descHTML}

    <!-- bottom meta row -->
    <div class="card-bottom-row">
      <span class="card-issue-key">${key}</span>
      ${dueHTML}
      ${doneBadge}
      <span class="card-bottom-spacer"></span>
      ${prioHTML}
    </div>
  `;
}

/* ─── DUE DATE CHIP ─── */
function buildDueChip(dueDate, today, isDone, isOverdue) {
  if (!dueDate) return '';
  const label = buildDueDateLabel(dueDate);

  if (isDone)    return `<span class="card-due-chip"><i class="fa-regular fa-calendar-check"></i> ${label}</span>`;
  if (isOverdue) return `<span class="card-due-chip overdue-chip"><i class="fa-solid fa-circle-exclamation"></i> ${label}</span>`;

  /* Countdown */
  const [y,m,d]    = dueDate.split('-').map(Number);
  const [ty,tm,td] = today.split('-').map(Number);
  const diff = Math.round((new Date(y,m-1,d) - new Date(ty,tm-1,td)) / 86400000);

  if (diff === 0) return `<span class="card-due-chip today-chip"><i class="fa-regular fa-clock"></i> Due today</span>`;
  if (diff === 1) return `<span class="card-due-chip countdown-chip"><i class="fa-regular fa-clock"></i> Due tomorrow</span>`;
  if (diff <= 7)  return `<span class="card-due-chip countdown-chip"><i class="fa-regular fa-clock"></i> Due in ${diff}d</span>`;
  return `<span class="card-due-chip"><i class="fa-regular fa-calendar"></i> ${label}</span>`;
}

/* ─── PRIORITY ICON (Jira colored square icons) ─── */
function buildPrioIcon(priority) {
  const config = {
    highest: { color: '#FF5630', icon: 'fa-angles-up',   label: 'Highest' },
    high:    { color: '#FF7452', icon: 'fa-angle-up',    label: 'High' },
    medium:  { color: '#F5A623', icon: 'fa-equals',      label: 'Medium' },
    low:     { color: '#2684FF', icon: 'fa-angle-down',  label: 'Low' },
    lowest:  { color: '#57A9FB', icon: 'fa-angles-down', label: 'Lowest' },
  };
  const c = config[priority] || config.medium;
  return `<span class="card-prio-icon" title="${c.label}"><i class="fa-solid ${c.icon}" style="color:${c.color}"></i></span>`;
}

/* ─── DATE FORMAT ─── */
function buildDueDateLabel(dateStr) {
  if (!dateStr) return '';
  const [y,m,d] = dateStr.split('-').map(Number);
  return new Date(y,m-1,d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' });
}

/* ─── EMPTY STATE ─── */
function buildEmptyState(column) {
  const cfg = {
    todo:       { icon:'fa-circle-plus',  text:'No issues' },
    inprogress: { icon:'fa-spinner',      text:'No issues in progress' },
    done:       { icon:'fa-circle-check', text:'No completed issues' },
  };
  const { icon, text } = cfg[column] || cfg.todo;
  const div = document.createElement('div');
  div.className = 'col-empty';
  div.innerHTML = `<i class="fa-solid ${icon} col-empty-icon"></i><span class="col-empty-text">${text}</span>`;
  return div;
}

/* ─── ISSUE DETAIL PANEL ─── */
function openIssueDetail(taskId) {
  const task = getTaskById(taskId);
  if (!task) return;

  const overlay = document.getElementById('issueDetailOverlay');
  const body    = document.getElementById('issueDetailBody');
  const keyEl   = document.getElementById('detailKey');

  /* Find the issue key from the rendered card */
  const card = document.querySelector(`.task-card[data-id="${taskId}"]`);
  if (keyEl && card) keyEl.textContent = card.dataset.key || 'TF-?';

  const today     = getTodayDateString();
  const isOverdue = task.dueDate && task.dueDate < today && task.column !== 'done';
  const isDone    = task.column === 'done';

  body.innerHTML = `
    <h2 class="detail-title">${escapeHTML(task.title)}</h2>

    <div class="detail-field-row">
      <div class="detail-field">
        <div class="detail-field-label">Status</div>
        <div class="detail-value">
          <span class="col-status-lozenge lozenge-${task.column}">
            ${task.column === 'todo' ? 'TO DO' : task.column === 'inprogress' ? 'IN PROGRESS' : 'DONE'}
          </span>
        </div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Priority</div>
        <div class="detail-priority-row">
          ${buildPrioIcon(task.priority)}
          <span class="detail-value" style="text-transform:capitalize">${task.priority}</span>
        </div>
      </div>
    </div>

    <div class="detail-field-row">
      <div class="detail-field">
        <div class="detail-field-label">Due date</div>
        <div class="detail-value">
          ${task.dueDate
            ? (isOverdue
                ? `<span style="color:var(--jira-red)"><i class="fa-solid fa-circle-exclamation"></i> ${buildDueDateLabel(task.dueDate)}</span>`
                : buildDueDateLabel(task.dueDate))
            : '<span style="color:var(--jira-text-subtle)">None</span>'}
        </div>
      </div>
      <div class="detail-field">
        <div class="detail-field-label">Created</div>
        <div class="detail-value">${new Date(task.createdAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</div>
      </div>
    </div>

    ${task.description ? `
    <div class="detail-section">
      <div class="detail-section-title">Description</div>
      <div class="detail-value">${escapeHTML(task.description)}</div>
    </div>` : ''}

    ${task.tags && task.tags.length ? `
    <div class="detail-section">
      <div class="detail-section-title">Labels</div>
      <div class="detail-tags">${task.tags.map(t=>`<span class="detail-tag">${escapeHTML(t)}</span>`).join('')}</div>
    </div>` : ''}

    <div class="detail-move-actions">
      ${task.column !== 'todo' ? `<button class="jira-btn jira-btn-secondary" data-action="move-left" data-id="${task.id}"><i class="fa-solid fa-arrow-left"></i> Move back</button>` : ''}
      ${task.column !== 'done' ? `<button class="jira-btn jira-btn-primary"   data-action="move-right" data-id="${task.id}"><i class="fa-solid fa-arrow-right"></i> Move forward</button>` : ''}
    </div>
  `;

  /* Wire detail edit button */
  document.getElementById('detailEdit').onclick = () => {
    closeIssueDetail();
    openEditModal(taskId);
  };

  overlay.classList.remove('hidden');
}

function closeIssueDetail() {
  document.getElementById('issueDetailOverlay').classList.add('hidden');
}

/* ─── HELPERS ─── */
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}