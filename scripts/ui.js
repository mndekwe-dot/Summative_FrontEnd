import { getRecords, getSettings, getTags, isDefaultTag } from './state.js';
import { highlight, escapeHtml } from './search.js';


//  Tag colour helper 

var TAG_COLOUR_LIST = ['tag-teal', 'tag-rose', 'tag-sky', 'tag-purple', 'tag-amber', 'tag-default'];
var tagColourMap   = {};
var colourIndex    = 0;

export function getTagClass(tag) {
  if (!tagColourMap[tag]) {
    tagColourMap[tag] = TAG_COLOUR_LIST[colourIndex % TAG_COLOUR_LIST.length];
    colourIndex++;
  }
  return tagColourMap[tag];
}

// Build a coloured tag badge as an HTML string
function tagBadge(tag, regex) {
  var cls      = getTagClass(tag);
  var text     = regex ? highlight(tag, regex) : escapeHtml(tag);
  return '<span class="tag-badge ' + cls + '">' + text + '</span>';
}
// Format hours as "1.5h" or "30 min"
function formatDuration(hours, unit) {
  if (unit === 'minutes') return Math.round(hours * 60) + ' min';
  if (hours < 1)          return Math.round(hours * 60) + ' min';
  return hours + 'h';
}

// Parse YYYY-MM-DD as a local date
function parseLocalDate(str) {
  var parts = str.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}


//  Records table (shown on desktop) 

export function renderTable(records, regex, onEdit, onDelete, onToggleDone) {
  var tbody    = document.getElementById('records-tbody');
  var settings = getSettings();

  if (!records.length) {
    tbody.innerHTML = '';
    return;
  }

  tbody.innerHTML = records.map(function (r) {
    var titleHTML = highlight(r.title, regex);
    var dateHTML  = highlight(r.dueDate, regex);
    var doneStyle = r.done ? 'opacity:0.5' : '';
    var textDecor = r.done ? 'line-through' : 'none';
    var textColor = r.done ? 'var(--text-3)' : 'inherit';

    // Show a short preview of notes if there are any
    var notesHTML = '';
    if (r.notes) {
      var preview = escapeHtml(r.notes.slice(0, 60)) + (r.notes.length > 60 ? '…' : '');
      notesHTML = '<br><small style="color:var(--text-3)">' + preview + '</small>';
    }

    return (
      '<tr style="' + doneStyle + '">' +
        '<td><span style="text-decoration:' + textDecor + ';color:' + textColor + '">' + titleHTML + '</span>' + notesHTML + '</td>' +
        '<td><span style="font-family:var(--font-mono);font-size:0.85rem">' + dateHTML + (r.time ? ' ' + escapeHtml(r.time) : '') + '</span></td>' +
        '<td style="font-family:var(--font-mono)">' + formatDuration(r.duration, settings.defaultUnit) + '</td>' +
        '<td>' + tagBadge(r.tag, regex) + '</td>' +
        '<td>' +
          '<div style="display:flex;gap:0.4rem;align-items:center">' +
            '<button class="btn-icon" data-action="done" data-id="' + r.id + '" aria-pressed="' + r.done + '">' + (r.done ? '✅' : '⬜') + '</button>' +
            '<button class="btn-icon" data-action="edit"   data-id="' + r.id + '">✏️</button>' +
            '<button class="btn-icon" data-action="delete" data-id="' + r.id + '">🗑</button>' +
          '</div>' +
        '</td>' +
      '</tr>'
    );
  }).join('');

  // Attach click handlers to every action button
  tbody.querySelectorAll('[data-action="done"]').forEach(function (btn) {
    btn.addEventListener('click', function () { onToggleDone(btn.dataset.id); });
  });
  tbody.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
    btn.addEventListener('click', function () { onEdit(btn.dataset.id); });
  });
  tbody.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
    btn.addEventListener('click', function () { onDelete(btn.dataset.id); });
  });
}


//  Records cards (shown on mobile) 

export function renderCards(records, regex, onEdit, onDelete, onToggleDone) {
  var container = document.getElementById('records-cards');
  var settings  = getSettings();

  if (!records.length) {
    container.innerHTML = '';
    return;
  }

  container.innerHTML = records.map(function (r) {
    var titleHTML = highlight(r.title, regex);
    var dateHTML  = highlight(r.dueDate, regex);
    var textDecor = r.done ? 'line-through' : 'none';

    var notesHTML = '';
    if (r.notes) {
      var preview = escapeHtml(r.notes.slice(0, 80)) + (r.notes.length > 80 ? '…' : '');
      notesHTML = '<p style="font-size:0.8rem;color:var(--text-3);margin-bottom:0.5rem">' + preview + '</p>';
    }

    return (
      '<article class="record-card">' +
        '<div class="record-card-header">' +
          '<span class="record-card-title" style="text-decoration:' + textDecor + '">' + titleHTML + '</span>' +
          tagBadge(r.tag, regex) +
        '</div>' +
        '<div class="record-card-meta">' +
          '<span>📅 ' + dateHTML + (r.time ? ' ' + escapeHtml(r.time) : '') + '</span>' +
          '<span>⏱ ' + formatDuration(r.duration, settings.defaultUnit) + '</span>' +
        '</div>' +
        notesHTML +
        '<div class="record-card-actions">' +
          '<button class="btn btn-outline btn-sm" data-action="done"   data-id="' + r.id + '">' + (r.done ? '✅ Done' : '⬜ Mark Done') + '</button>' +
          '<button class="btn btn-outline btn-sm" data-action="edit"   data-id="' + r.id + '">✏️ Edit</button>' +
          '<button class="btn btn-outline btn-sm" data-action="delete" data-id="' + r.id + '">🗑 Delete</button>' +
        '</div>' +
      '</article>'
    );
  }).join('');

  container.querySelectorAll('[data-action="done"]').forEach(function (btn) {
    btn.addEventListener('click', function () { onToggleDone(btn.dataset.id); });
  });
  container.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
    btn.addEventListener('click', function () { onEdit(btn.dataset.id); });
  });
  container.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
    btn.addEventListener('click', function () { onDelete(btn.dataset.id); });
  });
}


//  Dashboard 

export function renderDashboard() {
  var records  = getRecords();
  var settings = getSettings();

  // Helper: set text of an element safely
  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  // Stat cards
  var totalHours = records.reduce(function (sum, r) { return sum + r.duration; }, 0);
  setText('stat-total', records.length);
  setText('stat-duration', settings.defaultUnit === 'minutes'
    ? Math.round(totalHours * 60) + 'm'
    : totalHours.toFixed(1) + 'h');

  // Top tag (the one with the most records)
  var tagCounts = {};
  records.forEach(function (r) { tagCounts[r.tag] = (tagCounts[r.tag] || 0) + 1; });
  var topEntry = Object.entries(tagCounts).sort(function (a, b) { return b[1] - a[1]; })[0];
  setText('stat-top-tag', topEntry ? topEntry[0] : '—');

  // Count tasks due this week
  var today    = new Date();
  var todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  var weekEnd  = new Date(todayMidnight.getTime() + 7 * 24 * 60 * 60 * 1000);
  var thisWeek = records.filter(function (r) {
    var d = parseLocalDate(r.dueDate);
    return d >= todayMidnight && d <= weekEnd;
  });
  setText('stat-week', thisWeek.length);

  // Weekly cap progress bar
  renderCapBar(records);

  // 7-day trend chart
  renderTrendChart(records);

  // Tag distribution bars
  renderTagBars(tagCounts);
}

// Progress bar showing hours used vs the weekly cap
function renderCapBar(records) {
  var capInput = document.getElementById('cap-input');
  var fill     = document.getElementById('cap-fill');
  var bar      = document.getElementById('cap-bar');
  var status   = document.getElementById('cap-status');
  if (!capInput || !fill || !bar || !status) return;

  var cap        = parseInt(capInput.value) || 40;
  var totalHours = records.reduce(function (sum, r) { return sum + r.duration; }, 0);
  var percent    = Math.min((totalHours / cap) * 100, 100);

  fill.style.width = percent + '%';
  bar.setAttribute('aria-valuenow', Math.round(percent));

  if (totalHours > cap) {
    var over = (totalHours - cap).toFixed(1);
    fill.classList.add('over');
    status.classList.add('over');
    status.textContent = '⚠️ Over cap by ' + over + 'h! Total: ' + totalHours.toFixed(1) + 'h / ' + cap + 'h';
  } else {
    var remaining = (cap - totalHours).toFixed(1);
    fill.classList.remove('over');
    status.classList.remove('over');
    status.textContent = totalHours.toFixed(1) + 'h used · ' + remaining + 'h remaining of ' + cap + 'h cap';
  }
}

// Bar chart of tasks added per day for the last 7 days
function renderTrendChart(records) {
  var chartEl  = document.getElementById('trend-chart');
  var labelsEl = document.getElementById('trend-labels');
  if (!chartEl || !labelsEl) return;

  // Build one bucket per day for the last 7 days
  var days = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      date:  d.toISOString().slice(0, 10),
      count: 0
    });
  }

  // Count how many records were created on each day
  records.forEach(function (r) {
    var created = (r.createdAt || r.dueDate).slice(0, 10);
    var day = days.find(function (d) { return d.date === created; });
    if (day) day.count++;
  });

  var max = Math.max.apply(null, days.map(function (d) { return d.count; }).concat([1]));

  chartEl.innerHTML = days.map(function (d) {
    var height = Math.max(Math.round((d.count / max) * 100), 4);
    return '<div class="trend-bar" style="height:' + height + '%" data-count="' + d.count + '" aria-label="' + d.label + ': ' + d.count + ' tasks"></div>';
  }).join('');

  labelsEl.innerHTML = days.map(function (d) {
    return '<span class="trend-label">' + d.label + '</span>';
  }).join('');
}

// Horizontal bars showing record count per tag
function renderTagBars(tagCounts) {
  var container = document.getElementById('tag-dist-chart');
  if (!container) return;

  var sorted = Object.entries(tagCounts)
    .sort(function (a, b) { return b[1] - a[1]; })
    .slice(0, 6);

  if (!sorted.length) {
    container.innerHTML = '<p style="color:var(--text-3);font-size:0.85rem">No records yet.</p>';
    return;
  }

  var max = sorted[0][1];

  container.innerHTML = sorted.map(function (entry) {
    var tag   = entry[0];
    var count = entry[1];
    var cls   = getTagClass(tag);
    var pct   = (count / max) * 100;
    return (
      '<div class="tag-bar-row">' +
        '<span class="tag-bar-label">' + escapeHtml(tag) + '</span>' +
        '<div class="tag-bar-track">' +
          '<div class="tag-bar-fill ' + cls + '" style="width:' + pct + '%"></div>' +
        '</div>' +
        '<span class="tag-bar-count">' + count + '</span>' +
      '</div>'
    );
  }).join('');
}


//  Tag controls 

// Fill the tag dropdown on the Records page
export function populateTagFilter() {
  var sel  = document.getElementById('tag-filter');
  var tags = getTags();
  if (!sel) return;
  sel.innerHTML = '<option value="">All tags</option>' +
    tags.map(function (t) {
      return '<option value="' + escapeHtml(t) + '">' + escapeHtml(t) + '</option>';
    }).join('');
}

// Fill the datalist that shows tag suggestions in the form
export function populateTagDatalist() {
  var dl   = document.getElementById('tag-datalist');
  var tags = getTags();
  if (!dl) return;
  dl.innerHTML = tags.map(function (t) {
    return '<option value="' + escapeHtml(t) + '">';
  }).join('');
}

// Render the tag list on the Settings page
export function renderTagList(onRemove) {
  var container = document.getElementById('tag-list');
  var tags      = getTags();
  if (!container) return;

  container.innerHTML = tags.map(function (t) {
    // Default tags cannot be removed
    var removeBtn = isDefaultTag(t)
      ? ''
      : '<button class="tag-remove" data-tag="' + escapeHtml(t) + '" aria-label="Remove ' + escapeHtml(t) + '">×</button>';
    return '<span class="tag-item" role="listitem">' + escapeHtml(t) + removeBtn + '</span>';
  }).join('');

  container.querySelectorAll('.tag-remove').forEach(function (btn) {
    btn.addEventListener('click', function () { onRemove(btn.dataset.tag); });
  });
}


//  Misc UI updates 

// Show or hide the "no records" empty state
export function updateEmptyState(hasRecords) {
  var empty = document.getElementById('empty-state');
  if (!empty) return;
  if (hasRecords) empty.classList.add('hidden');
  else            empty.classList.remove('hidden');
}
// Update the "12 of 20 records shown" counter
export function updateRecordCount(count, total) {
  var el = document.getElementById('record-count');
  if (!el) return;
  if (count === total) {
    el.textContent = total + ' record' + (total !== 1 ? 's' : '');
  } else {
    el.textContent = count + ' of ' + total + ' record' + (total !== 1 ? 's' : '') + ' shown';
  }
}