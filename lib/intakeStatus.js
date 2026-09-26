// A patient is "filling in" while their answers keep changing. After 30
// seconds without a change they show as inactive. A submitted form stays
// submitted.
export const INACTIVE_AFTER_MS = 30_000;

// The status a card shows at a given moment. `updated_at` comes from the
// database clock and `now` from the staff screen's clock. Both follow network
// time, so the gap between them is far smaller than 30 seconds.
export function intakeStatus(intake, now) {
  if (intake.submitted_at) {
    return { kind: 'submitted' };
  }
  const idleMs = now - Date.parse(intake.updated_at);
  if (idleMs < INACTIVE_AFTER_MS) {
    return { kind: 'filling' };
  }
  return { kind: 'inactive', idleMs };
}

// How long a patient has been inactive: "45 s", "2 min", "3 h" or "2 d".
export function formatIdle(ms) {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}
