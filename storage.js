// scripts/storage.js
const RECORDS_KEY = 'organizer:records';
const SETTINGS_KEY = 'organizer:settings';

export const loadRecords = () => {
  try {
    return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]');
  } catch { return []; }
};

export const saveRecords = (records) => {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
};

export const loadSettings = () => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY) || 'null');
  } catch { return null; }
};

export const saveSettings = (settings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const clearAll = () => {
  localStorage.removeItem(RECORDS_KEY);
  localStorage.removeItem(SETTINGS_KEY);
};
