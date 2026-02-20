// scripts/state.js
import { loadRecords, saveRecords, loadSettings, saveSettings } from './storage.js';

const DEFAULT_TAGS = ['Lecture', 'Assignment', 'Exam', 'Study', 'Project', 'Meeting', 'Lab', 'Other'];

const DEFAULT_SETTINGS = {
  theme: 'light',
  defaultUnit: 'hours',
  weeklyCapHours: 40,
  tags: [...DEFAULT_TAGS],
};

let records = [];
let settings = { ...DEFAULT_SETTINGS };

export function init() {
  records = loadRecords();
  const saved = loadSettings();
  if (saved) {
    settings = { ...DEFAULT_SETTINGS, ...saved };
    // Merge default tags (don't lose them)
    const allTags = new Set([...DEFAULT_TAGS, ...(saved.tags || [])]);
    settings.tags = [...allTags];
  }
}

// ── Records ──────────────────────────────────────────────────────
export function getRecords() { return [...records]; }

export function getRecordById(id) { return records.find(r => r.id === id); }

export function addRecord(record) {
  records.push(record);
  saveRecords(records);
}

export function updateRecord(id, updates) {
  const idx = records.findIndex(r => r.id === id);
  if (idx === -1) return false;
  records[idx] = { ...records[idx], ...updates, updatedAt: new Date().toISOString() };
  saveRecords(records);
  return true;
}

export function deleteRecord(id) {
  records = records.filter(r => r.id !== id);
  saveRecords(records);
}

export function importRecords(newRecords) {
  records = newRecords;
  saveRecords(records);
}

// ── Settings ─────────────────────────────────────────────────────
export function getSettings() { return { ...settings }; }

export function updateSettings(updates) {
  settings = { ...settings, ...updates };
  saveSettings(settings);
}

export function getTags() { return [...settings.tags]; }

export function addTag(tag) {
  if (!settings.tags.includes(tag)) {
    settings.tags.push(tag);
    saveSettings(settings);
    return true;
  }
  return false;
}

export function removeTag(tag) {
  if (DEFAULT_TAGS.includes(tag)) return false; // protect defaults
  settings.tags = settings.tags.filter(t => t !== tag);
  saveSettings(settings);
  return true;
}

export function isDefaultTag(tag) { return DEFAULT_TAGS.includes(tag); }

// ── ID generator ─────────────────────────────────────────────────
export function generateId() {
  return 'evt_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}
