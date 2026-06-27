/* ═══════════════════════════════════════════════════════
   stats.js — Statistics Bar & Badge Updates
   Uses Jira stat element IDs: statTotal, statInProgress,
   statCompleted, statOverdue, statPercent, statProgressBar
═══════════════════════════════════════════════════════ */

let statTotalEl, statInProgressEl, statCompletedEl,
    statOverdueEl, statPercentEl, statProgressBarEl;

function initStats() {
  statTotalEl       = document.getElementById('statTotal');
  statInProgressEl  = document.getElementById('statInProgress');
  statCompletedEl   = document.getElementById('statCompleted');
  statOverdueEl     = document.getElementById('statOverdue');
  statPercentEl     = document.getElementById('statPercent');
  statProgressBarEl = document.getElementById('statProgressBar');
}

/**
 * Recalculate all 5 stats from the FULL (unfiltered) tasks array.
 * Overdue = not in Done AND dueDate is before today.
 * @param {Array<Object>} allTasks
 */
function updateStats(allTasks) {
  const today      = getTodayDateString();
  const total      = allTasks.length;
  const inProgress = allTasks.filter(t => t.column === 'inprogress').length;
  const completed  = allTasks.filter(t => t.column === 'done').length;
  const overdue    = allTasks.filter(t =>
    t.column !== 'done' && t.dueDate && t.dueDate < today
  ).length;
  const percent    = total > 0 ? Math.round((completed / total) * 100) : 0;

  setStatValue(statTotalEl,      total);
  setStatValue(statInProgressEl, inProgress);
  setStatValue(statCompletedEl,  completed);
  setStatValue(statOverdueEl,    overdue);
  setStatValue(statPercentEl,    `${percent}%`);

  if (statProgressBarEl) statProgressBarEl.style.width = `${percent}%`;

  /* Overdue turns red when > 0 — Jira-style */
  if (statOverdueEl) {
    statOverdueEl.classList.toggle('overdue-red', overdue > 0);
  }
}

/**
 * Update column count badges — reflects FILTERED visible tasks.
 * Called with filtered results so badges match what's on screen.
 * @param {Array<Object>} filteredTasks
 */
function updateBadges(filteredTasks) {
  const counts = {
    todo:       filteredTasks.filter(t => t.column === 'todo').length,
    inprogress: filteredTasks.filter(t => t.column === 'inprogress').length,
    done:       filteredTasks.filter(t => t.column === 'done').length,
  };

  setBadge('badgeTodo',            counts.todo);
  setBadge('badgeInprogress',      counts.inprogress);
  setBadge('badgeDone',            counts.done);
  setBadge('tabBadgeTodo',         counts.todo);
  setBadge('tabBadgeInprogress',   counts.inprogress);
  setBadge('tabBadgeDone',         counts.done);
}

/* ─── HELPERS ─── */

function setStatValue(el, value) {
  if (!el) return;
  if (el.textContent !== String(value)) {
    el.textContent = value;
    el.classList.remove('stat-pulse');
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add('stat-pulse');
  }
}

function setBadge(id, value) {
  const el = document.getElementById(id);
  if (el) el.textContent = value;
}

/**
 * Return today as YYYY-MM-DD in local time (not UTC).
 * Used for overdue comparison against dueDate strings.
 * @returns {string}
 */
function getTodayDateString() {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  const d = String(n.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}