import { compileRegex } from './validators.js';

// Highlight regex matches in text with <mark> tags.
export function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function highlight(text, re) {
  const safe = escapeHtml(text);
  if (!re) return safe;
  return safe.replace(re, m => `<mark>${escapeHtml(m)}</mark>`);
}

// Filter records by regex query against title, tag, and date fields.
export function filterRecords(records, query, caseSensitive) {
  if (!query.trim()) return { filtered: records, regex: null, error: '' };

  const flags = caseSensitive ? '' : 'i';
  const re = compileRegex(query, flags);
  if (!re) return { filtered: [], regex: null, error: 'Invalid regex pattern.' };

  const filtered = records.filter(r =>
    re.test(r.title) || re.test(r.tag) || re.test(r.dueDate) || re.test(r.notes || '')
  );
  return { filtered, regex: re, error: '' };
}

// Sort records by given key.
export function sortRecords(records, sortKey) {
  const copy = [...records];
  switch (sortKey) {
    case 'date-desc': return copy.sort((a, b) => b.dueDate.localeCompare(a.dueDate));
    case 'date-asc':  return copy.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
    case 'title-asc': return copy.sort((a, b) => a.title.localeCompare(b.title));
    case 'title-desc':return copy.sort((a, b) => b.title.localeCompare(a.title));
    case 'duration-asc':  return copy.sort((a, b) => a.duration - b.duration);
    case 'duration-desc': return copy.sort((a, b) => b.duration - a.duration);
    default: return copy;
  }
}
