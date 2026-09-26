// A patient is "filling in" while their answers keep changing. After 30
// seconds without a change they show as inactive. A submitted form stays
// submitted.
export const INACTIVE_AFTER_MS = 30_000;

// After 10 minutes without a change, an unsubmitted form has most likely been
// left: the patient went back past the first step, closed the tab or reloaded,
// and a new visit starts a new row. Those cards move out of the queue so they
// don't sit at the top of it for good.
export const SET_ASIDE_AFTER_MS = 10 * 60_000;

// A new submission stays open for 2 minutes, so staff notice it arrive. After
// that it shows only its header until someone opens it, and a card opened by
// hand closes again 2 minutes later. After an hour, submitted cards fold into
// their own section, so a busy screen shows mostly the people still filling in.
export const SUBMITTED_OPEN_MS = 2 * 60_000;
export const OPENED_FOR_MS = 2 * 60_000;
export const SUBMITTED_IN_VIEW_MS = 60 * 60_000;

// A card leaves the staff view 24 hours after its last change. This is a
// rolling window, not a cut-off at midnight: the hospital runs through the
// night, so a patient who arrives at 23:55 stays on screen. The rows stay in
// the database; staff can only look, and clearing old rows is an admin task.
export const SHOWN_FOR_MS = 24 * 60 * 60_000;

// The status a card shows at a given moment. `updated_at` comes from the
// database clock and `now` from the staff screen's clock. Both follow network
// time, so the gap between them is far smaller than 30 seconds.
export function intakeStatus(intake, now) {
  if (intake.submitted_at) {
    return { kind: 'submitted' };
  }
  const idleMs = now - Date.parse(intake.updated_at);
  return { kind: idleMs < INACTIVE_AFTER_MS ? 'filling' : 'inactive', idleMs };
}

// A duration as staff read it: "2 min", "3 h" or "2 d". Whole minutes only,
// so a label changes at most once a minute; under a minute there is nothing
// to show.
export function formatDuration(ms) {
  const minutes = Math.floor(ms / 60_000);
  if (minutes < 1) return null;
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  return `${Math.floor(hours / 24)} d`;
}

// The words on a card's status pill. Only an inactive patient shows a time:
// how long since their last change. That is the same clock that moves a card
// out of the queue at 10 minutes, and nothing on screen counts while a
// patient is filling in, so a busy screen stays calm.
export function statusLabel(status, submittedAt) {
  if (status.kind === 'submitted') return `Submitted ${submittedAt}`;
  if (status.kind === 'filling') return 'Filling in';
  const idle = formatDuration(status.idleMs);
  return idle ? `Inactive · ${idle}` : 'Inactive';
}

// How long ago a form was submitted.
export function submittedFor(intake, now) {
  return now - Date.parse(intake.submitted_at);
}

// Is this card out of the queue right now? As soon as the patient types again,
// `updated_at` moves on and the card comes back.
export function isSetAside(intake, now) {
  const status = intakeStatus(intake, now);
  return status.kind === 'inactive' && status.idleMs >= SET_ASIDE_AFTER_MS;
}

// Is this card still on the staff view? Checked against the page's clock, so
// a screen left open for days drops old cards by itself.
export function isShown(intake, now) {
  return now - Date.parse(intake.updated_at) < SHOWN_FOR_MS;
}
