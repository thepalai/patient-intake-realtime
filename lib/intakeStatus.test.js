import { describe, expect, it } from 'vitest';
import {
  formatDuration,
  intakeStatus,
  isSetAside,
  isShown,
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
    const intake = { updated_at: ago(29 * SECOND), step_started_at: ago(2 * MINUTE) };
    expect(intakeStatus(intake, NOW).kind).toBe('filling');
  });

  it('shows "inactive" from 30 seconds without a change', () => {
    const intake = { updated_at: ago(30 * SECOND), step_started_at: ago(2 * MINUTE) };
    expect(intakeStatus(intake, NOW).kind).toBe('inactive');
  });

  it('times the step from when it started, not from the last change', () => {
    const intake = { updated_at: ago(40 * SECOND), step_started_at: ago(3 * MINUTE) };
    expect(intakeStatus(intake, NOW)).toEqual({
      kind: 'inactive',
      idleMs: 40 * SECOND,
      stepMs: 3 * MINUTE,
    });
  });

  it('never shows a negative time when the staff clock is a little behind the database', () => {
    const intake = { updated_at: ago(0), step_started_at: new Date(NOW + 500).toISOString() };
    expect(intakeStatus(intake, NOW).stepMs).toBe(0);
  });

  it('shows "submitted" once the form is sent, however old the last change', () => {
    const intake = {
      updated_at: ago(5 * HOUR),
      step_started_at: ago(5 * HOUR),
      submitted_at: ago(5 * HOUR),
    };
    expect(intakeStatus(intake, NOW)).toEqual({ kind: 'submitted' });
  });
});

describe('formatDuration', () => {
  // Each unit rounds down, so 59.999 seconds still reads "59 s".
  it.each([
    [0, '0 s'],
    [MINUTE - 1, '59 s'],
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

describe('submittedFor', () => {
  it('counts from the moment the form was sent', () => {
    expect(submittedFor({ submitted_at: ago(90 * SECOND) }, NOW)).toBe(90 * SECOND);
  });
});

describe('isSetAside', () => {
  it('keeps an inactive form in the queue for 10 minutes', () => {
    const intake = { updated_at: ago(10 * MINUTE - 1), step_started_at: ago(12 * MINUTE) };
    expect(isSetAside(intake, NOW)).toBe(false);
  });

  it('sets a form aside after 10 minutes without a change', () => {
    const intake = { updated_at: ago(10 * MINUTE), step_started_at: ago(12 * MINUTE) };
    expect(isSetAside(intake, NOW)).toBe(true);
  });

  it('never sets aside a submitted form', () => {
    const intake = {
      updated_at: ago(3 * HOUR),
      step_started_at: ago(3 * HOUR),
      submitted_at: ago(3 * HOUR),
    };
    expect(isSetAside(intake, NOW)).toBe(false);
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
