import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  intakeStatus,
  isSetAside,
  isShown,
  statusLabel,
  submittedFor,
} from '@/lib/intakeStatus';

// These rules take the current time as an argument, so each test simply
// passes one in: noon UTC on 26 September 2026. No clock needs faking.
const NOW = Date.parse('2026-09-26T12:00:00Z');
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;

// A timestamp `ms` before NOW, written as ISO text, the way rows arrive.
function ago(ms) {
  return new Date(NOW - ms).toISOString();
}

describe('intakeStatus', () => {
  it('shows "filling in" while the last change is under 30 seconds old', () => {
    const intake = { updated_at: ago(29 * SECOND) };
    expect(intakeStatus(intake, NOW)).toEqual({ kind: 'filling', idleMs: 29 * SECOND });
  });

  it('shows "inactive" from 30 seconds without a change', () => {
    const intake = { updated_at: ago(30 * SECOND) };
    expect(intakeStatus(intake, NOW)).toEqual({ kind: 'inactive', idleMs: 30 * SECOND });
  });

  it('shows "submitted" once the form is sent, however old the last change', () => {
    const intake = { updated_at: ago(5 * HOUR), submitted_at: ago(5 * HOUR) };
    expect(intakeStatus(intake, NOW)).toEqual({ kind: 'submitted' });
  });
});

describe('formatDuration', () => {
  it('shows nothing under a minute, so no label counts seconds', () => {
    expect(formatDuration(0)).toBeNull();
    expect(formatDuration(MINUTE - 1)).toBeNull();
  });

  // Each unit rounds down, so 59 minutes and 59.999 seconds still reads "59 min".
  it.each([
    [MINUTE, '1 min'],
    [HOUR - 1, '59 min'],
    [HOUR, '1 h'],
    [24 * HOUR - 1, '23 h'],
    [24 * HOUR, '1 d'],
    [50 * HOUR, '2 d'],
  ])('reads %i ms as "%s"', (ms, text) => {
    expect(formatDuration(ms)).toBe(text);
  });
});

describe('statusLabel', () => {
  // The label for a patient whose last change was `ms` ago.
  function labelAfter(ms) {
    return statusLabel(intakeStatus({ updated_at: ago(ms) }, NOW));
  }

  it('shows no time while the patient is filling in', () => {
    expect(labelAfter(5 * SECOND)).toBe('Filling in');
  });

  it('shows no time in the first minute of quiet either', () => {
    expect(labelAfter(45 * SECOND)).toBe('Inactive');
  });

  it('then counts whole minutes since the last change', () => {
    expect(labelAfter(MINUTE)).toBe('Inactive · 1 min');
    expect(labelAfter(10 * MINUTE - 1)).toBe('Inactive · 9 min');
  });

  it('shows the time a form was submitted', () => {
    const status = intakeStatus({ updated_at: ago(HOUR), submitted_at: ago(HOUR) }, NOW);
    expect(statusLabel(status, '18:35')).toBe('Submitted 18:35');
  });
});

describe('submittedFor', () => {
  it('counts from the moment the form was sent', () => {
    expect(submittedFor({ submitted_at: ago(90 * SECOND) }, NOW)).toBe(90 * SECOND);
  });
});

describe('isSetAside', () => {
  it('keeps an inactive form in the queue for 10 minutes', () => {
    expect(isSetAside({ updated_at: ago(10 * MINUTE - 1) }, NOW)).toBe(false);
  });

  it('sets a form aside after 10 minutes without a change', () => {
    expect(isSetAside({ updated_at: ago(10 * MINUTE) }, NOW)).toBe(true);
  });

  it('never sets aside a submitted form', () => {
    expect(isSetAside({ updated_at: ago(3 * HOUR), submitted_at: ago(3 * HOUR) }, NOW)).toBe(false);
  });
});

describe('isShown', () => {
  it('keeps a card on screen for 24 hours after its last change', () => {
    expect(isShown({ updated_at: ago(24 * HOUR - 1) }, NOW)).toBe(true);
    expect(isShown({ updated_at: ago(24 * HOUR) }, NOW)).toBe(false);
  });

  it('keeps a patient who arrived just before midnight on screen after it', () => {
    const intake = { updated_at: '2026-09-26T23:55:00+07:00' };
    expect(isShown(intake, Date.parse('2026-09-27T00:05:00+07:00'))).toBe(true);
  });
});
