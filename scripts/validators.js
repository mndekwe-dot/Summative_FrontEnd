// scripts/validators.js

// ── Regex Patterns ─────────────────────────────────────────────────
// 1. Title: no leading/trailing spaces, no double spaces
const RE_TITLE = /^\S(?:.*\S)?$/;

// 2. Duration: non-negative number, up to 2 decimal places
const RE_DURATION = /^(0|[1-9]\d*)(\.\d{1,2})?$/;

// 3. Date: YYYY-MM-DD strict
const RE_DATE = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

// 4. Tag: letters, spaces, hyphens; no leading/trailing hyphens or spaces
const RE_TAG = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;

// 5. Time (optional): HH:MM 24-hour format — uses back-reference lookahead pattern
const RE_TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

// 6. ADVANCED — Duplicate word detection (back-reference) in notes
//    Catches: "the the", "study study", etc.
const RE_DUP_WORD = /\b(\w+)\s+\1\b/i;

// 7. ADVANCED — Lookahead: tag must NOT start with a number (positive lookahead for letter)
const RE_TAG_LOOKAHEAD = /^(?=[A-Za-z])/;

// ── Validators ─────────────────────────────────────────────────────
export function validateTitle(val) {
  if (!val || val.trim() === '') return 'Title is required.';
  if (!RE_TITLE.test(val)) return 'Title must not have leading or trailing spaces.';
  if (val.includes('  ')) return 'Title must not contain consecutive spaces.';
  if (val.length > 120) return 'Title must be 120 characters or fewer.';
  return '';
}

export function validateDuration(val) {
  if (!val || val.trim() === '') return 'Duration is required.';
  if (!RE_DURATION.test(val.trim())) return 'Duration must be a non-negative number (e.g. 1.5).';
  if (parseFloat(val) === 0) return 'Duration must be greater than 0.';
  return '';
}

export function validateDate(val) {
  if (!val || val.trim() === '') return 'Date is required.';
  if (!RE_DATE.test(val.trim())) return 'Date must be in YYYY-MM-DD format (e.g. 2025-09-29).';
  return '';
}

export function validateTag(val) {
  if (!val || val.trim() === '') return 'Tag is required.';
  if (!RE_TAG_LOOKAHEAD.test(val.trim())) return 'Tag must start with a letter.';
  if (!RE_TAG.test(val.trim())) return 'Tag may only contain letters, spaces, or hyphens.';
  return '';
}

export function validateTime(val) {
  if (!val || val.trim() === '') return ''; // optional
  if (!RE_TIME.test(val.trim())) return 'Time must be in HH:MM (24-hour) format.';
  return '';
}

export function checkDuplicateWord(val) {
  return RE_DUP_WORD.test(val);
}

// ── Safe Regex Compiler ────────────────────────────────────────────
export function compileRegex(input, flags = 'i') {
  try {
    return input ? new RegExp(input, flags) : null;
  } catch {
    return null;
  }
}

// ── JSON Import Validator ──────────────────────────────────────────
export function validateImportRecord(rec) {
  if (typeof rec !== 'object' || rec === null) return false;
  if (typeof rec.id !== 'string') return false;
  if (typeof rec.title !== 'string') return false;
  if (typeof rec.dueDate !== 'string') return false;
  if (typeof rec.duration !== 'number') return false;
  if (typeof rec.tag !== 'string') return false;
  return true;
}
