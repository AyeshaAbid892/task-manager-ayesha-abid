/* filters.js — Search/Filter/Sort Pipeline */
const filterState = { search: '', priority: 'all', sort: 'createdAt' };
const PRIORITY_WEIGHT = { highest:1, high:2, medium:3, low:4, lowest:5 };

function setSearch(v)   { filterState.search   = v.toLowerCase().trim(); }
function setPriority(v) { filterState.priority  = v; }
function setSort(v)     { filterState.sort      = v; }
function clearAllFilters() { filterState.search=''; filterState.priority='all'; filterState.sort='createdAt'; }

function applyPipeline(allTasks) {
  let r = allTasks.slice();
  if (filterState.search)           r = applySearch(r, filterState.search);
  if (filterState.priority !== 'all') r = applyPriorityFilter(r, filterState.priority);
  r = applySort(r, filterState.sort);
  return r;
}

function applySearch(tasks, q) {
  return tasks.filter(t =>
    t.title.toLowerCase().includes(q) ||
    t.description.toLowerCase().includes(q) ||
    t.tags.some(tag => tag.toLowerCase().includes(q))
  );
}

function applyPriorityFilter(tasks, p) {
  return tasks.filter(t => t.priority === p);
}

function applySort(tasks, key) {
  return tasks.slice().sort((a, b) => {
    if (key === 'dueDate') {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate) - new Date(b.dueDate);
    }
    if (key === 'priority') {
      return (PRIORITY_WEIGHT[a.priority]||99) - (PRIORITY_WEIGHT[b.priority]||99);
    }
    return b.createdAt - a.createdAt; /* newest first */
  });
}

function getTasksForColumn(filtered, col) {
  return filtered.filter(t => t.column === col);
}