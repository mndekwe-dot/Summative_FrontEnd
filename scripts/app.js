// app.js — main controller
import * as State from './state.js';
import * as UI from './ui.js';
import { filterRecords, sortRecords, escapeHtml } from './search.js';
import { validateTitle, validateDuration, validateDate, validateTag, validateTime, checkDuplicateWord, validateImportRecord } from './validators.js';

// Load saved data from localStorage when the app starts
State.init();


//  Simple helpers 

// Shortcut so we don't have to type document.getElementById every time
function getEl(id) {
  return document.getElementById(id);
}

// Format a YYYY-MM-DD date as "Today", "Tomorrow", or "Fri 20 Feb"
function formatDate(dateStr) {
  var date     = new Date(dateStr + 'T00:00:00');
  var today    = new Date();
  var tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  if (date.toDateString() === today.toDateString())    return 'Today';
  if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
  return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}

// Format a number of hours as "1.5h" or "30min"
// NOTE: ui.js has formatDuration() which also accepts a unit argument for the table/cards.
// This simpler version is used only on the home page where no unit toggle is needed.
function formatHours(hours) {
  if (hours < 1) return Math.round(hours * 60) + 'min';
  return hours + 'h';
}

// Parse a YYYY-MM-DD string as a local date (avoids timezone issues).
// Defined here for use in app.js; ui.js has its own private copy for the same reason.
function parseDate(str) {
  var parts = str.split('-').map(Number);
  return new Date(parts[0], parts[1] - 1, parts[2]);
}

// Return midnight of today as a Date object.
// Centralised here so we don't repeat "new Date(); setHours(0,0,0,0)" in every function.
function getTodayMidnight() {
  var d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}


//  Theme (light / dark) 

function applyTheme(theme) {
  var systemPrefers = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  var resolved = (theme === 'auto') ? systemPrefers : theme;
  document.documentElement.setAttribute('data-theme', resolved);
  getEl('theme-toggle').textContent = (resolved === 'light') ? '🌙' : '☀️';
}

// Apply the saved theme as soon as the page loads
applyTheme(State.getSettings().theme);

// Toggle between light and dark when the moon/sun button is clicked
getEl('theme-toggle').addEventListener('click', function () {
  var current  = State.getSettings().theme;
  var systemPrefers = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  var resolved = (current === 'auto') ? systemPrefers : current;
  var next     = (resolved === 'light') ? 'dark' : 'light';

  State.updateSettings({ theme: next });
  applyTheme(next);

  // Also tick the matching radio button inside Settings
  var radio = document.querySelector('input[name="theme"][value="' + next + '"]');
  if (radio) radio.checked = true;
});


//  Navigation 

var ALL_SECTIONS = ['home', 'about', 'dashboard', 'records', 'add', 'settings'];

function showSection(id) {
  // Fall back to home if the id is not recognised
  if (!ALL_SECTIONS.includes(id)) id = 'home';

  // Show the requested section, hide all others
  ALL_SECTIONS.forEach(function (name) {
    var section = getEl(name);
    if (section) {
      if (name === id) section.classList.remove('hidden');
      else             section.classList.add('hidden');
    }
  });

  // Highlight the active nav link
  document.querySelectorAll('.tnav-link, .drawer-link').forEach(function (link) {
    if (link.dataset.section === id) {
      link.classList.add('active');
      link.setAttribute('aria-current', 'page');
    } else {
      link.classList.remove('active');
      link.setAttribute('aria-current', 'false');
    }
  });

  // Update the browser URL bar
  window.location.hash = id;

  // Render the content for whichever section just became visible
  if (id === 'home')      renderHome();
  if (id === 'dashboard') UI.renderDashboard();
  if (id === 'records')   refreshRecords();
  if (id === 'settings')  renderSettings();

  closeMobileDrawer();
}

// showSection is also called from onclick attributes in the HTML
window.showSection = showSection;

document.querySelectorAll('.tnav-link, .drawer-link').forEach(function (link) {
  link.addEventListener('click', function (e) {
    e.preventDefault();
    showSection(link.dataset.section);
  });
});

document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-nav]');
  if (btn) {
    e.preventDefault();
    showSection(btn.dataset.nav);
  }
});

// "+ Add Event" button in the top nav bar
getEl('add-event-btn').addEventListener('click', function () {
  showSection('add');
});


//  Mobile drawer 

function openMobileDrawer() {
  getEl('mobile-drawer').classList.remove('hidden');
  getEl('drawer-overlay').classList.remove('hidden');
  getEl('menu-toggle').setAttribute('aria-expanded', 'true');
}

function closeMobileDrawer() {
  getEl('mobile-drawer').classList.add('hidden');
  getEl('drawer-overlay').classList.add('hidden');
  getEl('menu-toggle').setAttribute('aria-expanded', 'false');
}

getEl('menu-toggle').addEventListener('click', openMobileDrawer);
getEl('close-drawer').addEventListener('click', closeMobileDrawer);
getEl('drawer-overlay').addEventListener('click', closeMobileDrawer);

// Single Escape handler covers both the drawer and the delete modal
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') {
    closeMobileDrawer();
    closeDeleteModal();
  }
});


//  Home page 

// Which tag chip is currently selected on the home page ("" means All)
var homeTagFilter = '';

function renderHome() {
  var records       = State.getRecords();
  var todayMidnight = getTodayMidnight();
  var oneWeekLater  = new Date(todayMidnight.getTime() + 7 * 24 * 60 * 60 * 1000);

  // Count events due this week
  var thisWeek = records.filter(function (r) {
    var d = parseDate(r.dueDate);
    return d >= todayMidnight && d <= oneWeekLater;
  });

  // Count tasks due in the next 3 days
  var dueSoon = records.filter(function (r) {
    var d    = parseDate(r.dueDate);
    var diff = d - todayMidnight;
    return diff >= 0 && diff <= 3 * 24 * 60 * 60 * 1000;
  });

  getEl('home-stat-events').textContent = thisWeek.length;
  getEl('home-stat-tasks').textContent  = dueSoon.length;
  getEl('home-stat-total').textContent  = records.length;

  var streak = calcStreak(records);
  getEl('home-streak').textContent = streak + ' day' + (streak !== 1 ? 's' : '');

  renderHomeFilterChips(records);
  renderHomeEvents(records);
  renderHomeTasks(records);
  renderHomeTrending(records);
}

// Count how many days in a row have had activity
function calcStreak(records) {
  if (records.length === 0) return 0;

  var activeDates = {};
  records.forEach(function (r) {
    var date = r.createdAt ? r.createdAt.slice(0, 10) : r.dueDate;
    activeDates[date] = true;
  });

  var streak = 0;
  var today  = new Date();
  for (var i = 0; i < 365; i++) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    var key = d.toISOString().slice(0, 10);
    if (activeDates[key]) streak++;
    else break;
  }
  return streak;
}

// Render the tag filter chips (All, Study, Lab, etc.)
function renderHomeFilterChips(records) {
  var container = getEl('home-filter-tags');
  if (!container) return;

  // Collect unique tags
  var tags = [];
  records.forEach(function (r) {
    if (!tags.includes(r.tag)) tags.push(r.tag);
  });

  var allChips = ['All'].concat(tags.slice(0, 8));
  container.innerHTML = allChips.map(function (tag) {
    var isActive = (tag === 'All' && homeTagFilter === '') || tag === homeTagFilter;
    var dataTag  = (tag === 'All') ? '' : tag;
    return '<button class="filter-chip' + (isActive ? ' active' : '') + '" data-tag="' + dataTag + '">' + tag + '</button>';
  }).join('');

  container.querySelectorAll('.filter-chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      homeTagFilter = chip.dataset.tag;
      renderHomeFilterChips(records);
      renderHomeEvents(records);
    });
  });
}

// Render the upcoming events list
function renderHomeEvents(records) {
  var container     = getEl('home-events-list');
  if (!container) return;

  var todayMidnight = getTodayMidnight();

  var filtered = homeTagFilter
    ? records.filter(function (r) { return r.tag === homeTagFilter; })
    : records;

  var upcoming = filtered
    .filter(function (r) { return parseDate(r.dueDate) >= todayMidnight; })
    .sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); })
    .slice(0, 5);

  if (upcoming.length === 0) {
    container.innerHTML = '<div class="empty-home"><div class="empty-home-icon">📅</div><p>No upcoming events. Add one to get started!</p></div>';
    return;
  }

  container.innerHTML = upcoming.map(function (r) {
    var colour  = UI.getTagClass(r.tag);
    var timeStr = r.time ? ' · ' + escapeHtml(r.time) : '';
    return (
      '<article class="event-item">' +
        '<div class="event-info">' +
          '<div class="event-title">' + escapeHtml(r.title) + '</div>' +
          '<div class="event-meta">' +
            '<span class="event-meta-item">' + escapeHtml(formatDate(r.dueDate)) + timeStr + '</span>' +
            '<span class="event-meta-item">⏱ ' + formatHours(r.duration) + '</span>' +
          '</div>' +
        '</div>' +
        '<span class="tag-badge ' + colour + '">' + escapeHtml(r.tag) + '</span>' +
      '</article>'
    );
  }).join('');
}

// Render the My Tasks list
function renderHomeTasks(records) {
  var container = getEl('home-tasks-list');
  if (!container) return;

  if (records.length === 0) {
    container.innerHTML = '<div class="empty-home"><div class="empty-home-icon">✅</div><p>No tasks yet. Add your first!</p></div>';
    return;
  }

  var todayMidnight = getTodayMidnight();

  // Show the 5 soonest tasks
  var sorted = records.slice()
    .sort(function (a, b) { return a.dueDate.localeCompare(b.dueDate); })
    .slice(0, 5);

  container.innerHTML = sorted.map(function (r) {
    var dueDate   = parseDate(r.dueDate);
    var isOverdue = dueDate < todayMidnight;
    var isDueSoon = !isOverdue && (dueDate - todayMidnight) <= 2 * 24 * 60 * 60 * 1000;
    var done      = r.done || false;

    var warning = (isOverdue || isDueSoon) && !done ? '<span class="task-priority-icon">⚠</span>' : '';

    return (
      '<div class="task-item" role="listitem">' +
        '<button class="task-check' + (done ? ' done' : '') + '" data-id="' + r.id + '"></button>' +
        '<div class="task-text">' +
          '<div class="task-title' + (done ? ' done' : '') + '">' + escapeHtml(r.title) + '</div>' +
          '<div class="task-due">' + formatDate(r.dueDate) + '</div>' +
        '</div>' +
        warning +
      '</div>'
    );
  }).join('');

  // Toggle done when a checkbox is clicked
  container.querySelectorAll('.task-check').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var record = State.getRecordById(btn.dataset.id);
      if (record) {
        State.updateRecord(btn.dataset.id, { done: !record.done });
        renderHomeTasks(State.getRecords());
      }
    });
  });
}

// Render the Trending sidebar
function renderHomeTrending(records) {
  var container = getEl('home-trending');
  if (!container) return;

  if (records.length === 0) {
    container.innerHTML = '<p style="color:var(--text-3);font-size:.82rem">No trending data yet.</p>';
    return;
  }

  // Count records per tag
  var tagCounts = {};
  records.forEach(function (r) {
    tagCounts[r.tag] = (tagCounts[r.tag] || 0) + 1;
  });

  var top3 = Object.entries(tagCounts)
    .sort(function (a, b) { return b[1] - a[1]; })
    .slice(0, 3);

  var labels = {
    Study: 'Study Group', Lecture: 'Lecture Series', Lab: 'Lab Session',
    Exam: 'Exam Prep', Project: 'Project Team', Meeting: 'Group Meeting',
    Assignment: 'Assignment Hub', Other: 'Campus Activity'
  };

  container.innerHTML = top3.map(function (entry) {
    var tag   = entry[0];
    var count = entry[1];
    var name  = labels[tag] || tag + ' Events';
    return (
      '<div class="trending-item">' +
        '<div class="trending-name">' + escapeHtml(name) + '</div>' +
        '<div class="trending-meta">' +
          '<span class="tag-badge ' + UI.getTagClass(tag) + '">' + escapeHtml(tag) + '</span>' +
          '<span class="trending-count">' + count + ' record' + (count !== 1 ? 's' : '') + '</span>' +
        '</div>' +
      '</div>'
    );
  }).join('');
}


//  Records page 

var currentSearchRegex = null;
var recordToDeleteId   = null;

function refreshRecords() {
  var allRecords = State.getRecords();
  var query      = getEl('search-input').value;
  var caseSens   = getEl('case-toggle').checked;
  var tagFilter  = getEl('tag-filter').value;
  var sortKey    = getEl('sort-select').value;

  // Filter by search query (supports regex)
  var result = filterRecords(allRecords, query, caseSens);
  currentSearchRegex = result.regex;
  getEl('search-error').textContent = result.error;

  // Then filter by chosen tag
  var byTag = tagFilter
    ? result.filtered.filter(function (r) { return r.tag === tagFilter; })
    : result.filtered;

  // Then sort
  var sorted = sortRecords(byTag, sortKey);

  // Draw the table and cards
  UI.renderTable(sorted, currentSearchRegex, editRecord, promptDelete, toggleDone);
  UI.renderCards(sorted, currentSearchRegex, editRecord, promptDelete, toggleDone);
  UI.updateEmptyState(sorted.length > 0);
  UI.updateRecordCount(sorted.length, allRecords.length);
}

// Re-run search/sort whenever controls change
['search-input', 'sort-select', 'tag-filter'].forEach(function (id) {
  getEl(id).addEventListener('input', refreshRecords);
});
getEl('case-toggle').addEventListener('change', refreshRecords);

// Toggle a task's done state from the records page
function toggleDone(id) {
  var record = State.getRecordById(id);
  if (!record) return;
  State.updateRecord(id, { done: !record.done });
  refreshRecords();
  renderHome();
}


//  Delete confirmation modal 

function promptDelete(id) {
  var record = State.getRecordById(id);
  recordToDeleteId = id;
  getEl('delete-modal-desc').textContent = 'Delete "' + (record ? record.title : 'this task') + '"? This cannot be undone.';
  getEl('delete-modal').classList.remove('hidden');
  getEl('confirm-delete-btn').focus();
}

function closeDeleteModal() {
  getEl('delete-modal').classList.add('hidden');
  recordToDeleteId = null;
}

getEl('confirm-delete-btn').addEventListener('click', function () {
  if (!recordToDeleteId) return;
  State.deleteRecord(recordToDeleteId);
  closeDeleteModal();
  refreshRecords();
});

getEl('cancel-delete-btn').addEventListener('click', closeDeleteModal);

getEl('delete-modal').addEventListener('click', function (e) {
  if (e.target === getEl('delete-modal')) closeDeleteModal();
});


//  Export / Import 

function exportJSON() {
  var records = State.getRecords();
  var blob    = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' });
  var url     = URL.createObjectURL(blob);
  var link    = document.createElement('a');
  link.href     = url;
  link.download = 'campusflow-export.json';
  link.click();
  URL.revokeObjectURL(url);
}

function handleImport(file) {
  if (!file) return;
  var reader = new FileReader();

  reader.onload = function (e) {
    try {
      var data = JSON.parse(e.target.result);
      if (!Array.isArray(data)) throw new Error('File must contain a JSON array.');

      var valid   = data.filter(function (r) { return validateImportRecord(r); });
      var skipped = data.length - valid.length;

      if (valid.length === 0) throw new Error('No valid records found in file.');

      State.importRecords(valid);
      refreshRecords();
      alert('Imported ' + valid.length + ' records.' + (skipped ? ' Skipped ' + skipped + ' invalid.' : ''));
    } catch (err) {
      alert('Import failed: ' + err.message);
    }
  };

  reader.readAsText(file);
}

// The records page has export/import buttons, and so does the Settings page
getEl('export-btn').addEventListener('click', exportJSON);
getEl('settings-export-btn').addEventListener('click', exportJSON);

getEl('import-file').addEventListener('change', function (e) {
  handleImport(e.target.files[0]);
  e.target.value = ''; // reset so the same file can be imported again
});
getEl('settings-import-file').addEventListener('change', function (e) {
  handleImport(e.target.files[0]);
  e.target.value = '';
});


//  Add / Edit form 

var taskForm    = getEl('task-form');
var editIdInput = getEl('edit-id'); // hidden field — stores the ID when editing an existing task

function clearForm() {
  editIdInput.value = '';

  // Clear every text input and textarea
  ['field-title', 'field-due', 'field-duration', 'field-tag', 'field-time', 'field-notes'].forEach(function (id) {
    var input = getEl(id);
    if (input) {
      input.value = '';
      input.removeAttribute('aria-invalid');
    }
  });

  // Clear every error message
  ['err-title', 'err-due', 'err-duration', 'err-tag', 'err-time'].forEach(function (id) {
    var errEl = getEl(id);
    if (errEl) errEl.textContent = '';
  });

  // Reset headings and button label
  getEl('form-heading').textContent  = 'Add Task';
  getEl('form-subtitle').textContent = 'Fill in the details below';
  getEl('submit-btn').textContent    = 'Save Task';
  getEl('form-status').textContent   = '';
  getEl('dup-warning').classList.add('hidden');
  getEl('field-unit').value          = State.getSettings().defaultUnit;
}

function editRecord(id) {
  var record = State.getRecordById(id);
  if (!record) return;

  editIdInput.value = id;

  getEl('field-title').value    = record.title;
  getEl('field-due').value      = record.dueDate;
  getEl('field-duration').value = record.duration;
  getEl('field-unit').value     = record.unit || 'hours';
  getEl('field-tag').value      = record.tag;
  getEl('field-time').value     = record.time || '';
  getEl('field-notes').value    = record.notes || '';

  getEl('form-heading').textContent  = 'Edit Task';
  getEl('form-subtitle').textContent = 'Editing: ' + record.title;
  getEl('submit-btn').textContent    = 'Update Task';

  showSection('add');
}

getEl('cancel-edit-btn').addEventListener('click', function () {
  clearForm();
  showSection('records');
});

// Validate each field when the user leaves it (on blur)
function validateOnBlur(fieldId, errorId, validatorFn) {
  var input = getEl(fieldId);
  var errEl = getEl(errorId);
  if (!input || !errEl) return;

  input.addEventListener('blur', function () {
    var error = validatorFn(input.value);
    errEl.textContent = error;
    input.setAttribute('aria-invalid', error ? 'true' : 'false');
  });
}

validateOnBlur('field-title',    'err-title',    validateTitle);
validateOnBlur('field-due',      'err-due',      validateDate);
validateOnBlur('field-duration', 'err-duration', validateDuration);
validateOnBlur('field-tag',      'err-tag',      validateTag);
validateOnBlur('field-time',     'err-time',     validateTime);

// Warn about duplicate words in notes (e.g. "the the")
getEl('field-notes').addEventListener('input', function (e) {
  getEl('dup-warning').classList.toggle('hidden', !checkDuplicateWord(e.target.value));
});

// Handle form submit — save a new task or update an existing one
taskForm.addEventListener('submit', function (e) {
  e.preventDefault();

  var title    = getEl('field-title').value.trim();
  var dueDate  = getEl('field-due').value.trim();
  var duration = getEl('field-duration').value.trim();
  var unit     = getEl('field-unit').value;
  var tag      = getEl('field-tag').value.trim();
  var time     = getEl('field-time').value.trim();
  var notes    = getEl('field-notes').value.trim();

  var titleError    = validateTitle(title);
  var dateError     = validateDate(dueDate);
  var durationError = validateDuration(duration);
  var tagError      = validateTag(tag);
  var timeError     = validateTime(time);

  getEl('err-title').textContent    = titleError;
  getEl('err-due').textContent      = dateError;
  getEl('err-duration').textContent = durationError;
  getEl('err-tag').textContent      = tagError;
  getEl('err-time').textContent     = timeError;

  if (titleError || dateError || durationError || tagError || timeError) {
    getEl('form-status').textContent = 'Please fix the errors above.';
    return;
  }

  var durationInHours = (unit === 'minutes') ? parseFloat(duration) / 60 : parseFloat(duration);
  var now = new Date().toISOString();

  if (editIdInput.value) {
    State.updateRecord(editIdInput.value, {
      title: title, dueDate: dueDate, duration: durationInHours,
      unit: unit, tag: tag, time: time, notes: notes, updatedAt: now
    });
    getEl('form-status').textContent = '✅ Task updated.';
  } else {
    State.addRecord({
      id: State.generateId(), title: title, dueDate: dueDate,
      duration: durationInHours, unit: unit, tag: tag, time: time,
      notes: notes, done: false, createdAt: now, updatedAt: now
    });
    getEl('form-status').textContent = '✅ Task saved.';
  }

  clearForm();
  setTimeout(function () { showSection('records'); }, 700);
});


//  Settings page 

function renderSettings() {
  var settings = State.getSettings();

  var themeRadio = document.querySelector('input[name="theme"][value="' + settings.theme + '"]');
  if (themeRadio) themeRadio.checked = true;

  var unitRadio = document.querySelector('input[name="default-unit"][value="' + settings.defaultUnit + '"]');
  if (unitRadio) unitRadio.checked = true;

  UI.renderTagList(function (tag) {
    if (State.removeTag(tag)) renderSettings();
  });

  getEl('cap-input').value = settings.weeklyCapHours || 40;
}

document.querySelectorAll('input[name="theme"]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    State.updateSettings({ theme: radio.value });
    applyTheme(radio.value);
  });
});

document.querySelectorAll('input[name="default-unit"]').forEach(function (radio) {
  radio.addEventListener('change', function () {
    State.updateSettings({ defaultUnit: radio.value });
  });
});

getEl('add-tag-btn').addEventListener('click', function () {
  var input  = getEl('new-tag-input');
  var errEl  = getEl('err-new-tag');
  var tagVal = input.value.trim();
  var error  = validateTag(tagVal);

  errEl.textContent = error;
  if (error) {
    input.setAttribute('aria-invalid', 'true');
    return;
  }

  input.removeAttribute('aria-invalid');

  if (State.addTag(tagVal)) {
    input.value = '';
    renderSettings();
    UI.populateTagDatalist();
    UI.populateTagFilter();
  } else {
    errEl.textContent = 'Tag already exists.';
  }
});

getEl('new-tag-input').addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    getEl('add-tag-btn').click();
  }
});

getEl('clear-data-btn').addEventListener('click', function () {
  if (confirm('Delete ALL records? This cannot be undone.')) {
    State.importRecords([]);
    refreshRecords();
  }
});

getEl('cap-input').addEventListener('input', function () {
  var cap = parseInt(getEl('cap-input').value) || 40;
  State.updateSettings({ weeklyCapHours: cap });
  UI.renderDashboard();
});


//  Quick converter (inside Settings) 

function updateConverter() {
  var value  = parseFloat(getEl('conv-input').value);
  var from   = getEl('conv-from').value;
  var to     = getEl('conv-to').value;
  var result = getEl('conv-result');

  if (isNaN(value)) { result.textContent = ''; return; }

  var converted;
  if (from === to)             converted = value;
  else if (from === 'minutes') converted = (value / 60).toFixed(2);
  else                         converted = (value * 60).toFixed(0);

  result.textContent = value + ' ' + from + ' = ' + converted + ' ' + to;
}

['conv-input', 'conv-from', 'conv-to'].forEach(function (id) {
  getEl(id).addEventListener('input', updateConverter);
});


//  Start the app 

// Go to the section in the URL hash, or home if none
var startSection = window.location.hash.slice(1);
if (ALL_SECTIONS.includes(startSection)) showSection(startSection);
else showSection('home');

// Populate tag controls once on startup
UI.populateTagFilter();
UI.populateTagDatalist();