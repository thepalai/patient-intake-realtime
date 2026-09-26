import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Wait for a pause in typing before saving. Half a second is longer than the
// gap between keystrokes in a word, but short enough that staff still see
// answers almost as they are typed.
const SAVE_DELAY_MS = 500;
// Hospital Wi-Fi drops out for a few seconds at a time. Three seconds gets the
// answers through soon after it returns, without firing requests in a tight loop.
const RETRY_DELAY_MS = 3000;

// Send one upsert and return a real promise. A Supabase query sends its
// request each time it is awaited, and submit() must be able to wait for a
// request that flush() already sent without sending it again.
async function send(row) {
  return supabase.from('patient_intakes').upsert(row);
}

export function useAutosave() {
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error

  const idRef = useRef(null); // this intake's row id, made on the first save
  const latestRef = useRef(null); // the newest form values
  const timerRef = useRef(null); // the pending pause or retry timer
  const requestRef = useRef(null); // the request on its way to the database, or null
  const dirtyRef = useRef(false); // did a save come due while it was?
  const submittedRef = useRef(false); // once submitted, nothing else is sent

  // The browser makes the id, so the first save and every later one are the
  // same upsert: insert the row if it's new, update it if it exists.
  function rowWithId(values) {
    if (!idRef.current) {
      idRef.current = crypto.randomUUID();
    }
    return { id: idRef.current, ...values };
  }

  async function flush() {
    if (submittedRef.current) return;
    // One request at a time: two overlapping requests can land in either
    // order, and an older one landing last would overwrite newer answers.
    if (requestRef.current) {
      dirtyRef.current = true;
      return;
    }
    dirtyRef.current = false;

    const sent = latestRef.current;
    requestRef.current = send(rowWithId(sent));
    const { error } = await requestRef.current;
    requestRef.current = null;
    if (error) console.error('Autosave failed', error);

    if (submittedRef.current) {
      return; // submit() has taken over and sends the final answers itself
    }
    if (dirtyRef.current) {
      flush(); // a save came due while we waited: send the newest answers now
      return;
    }
    if (latestRef.current !== sent) {
      return; // the patient kept typing: the pause timer will send the newest answers
    }
    if (error) {
      setStatus('error');
      timerRef.current = setTimeout(flush, RETRY_DELAY_MS);
      return;
    }
    setStatus('saved');
  }

  function save(values) {
    if (submittedRef.current) return;
    latestRef.current = values;
    setStatus('saving');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, SAVE_DELAY_MS);
  }

  // Send the final answers, marked as submitted. Waits for any save already
  // on its way, so the final answers always land last. The patient pressed a
  // button, so a failure is reported back to them rather than retried here.
  async function submit(values) {
    clearTimeout(timerRef.current);
    submittedRef.current = true;
    await requestRef.current;

    // Any time works here: the database replaces it with its own clock.
    const { error } = await send(rowWithId({ ...values, submitted_at: new Date().toISOString() }));
    if (error) {
      console.error('Submit failed', error);
      submittedRef.current = false; // back to autosaving until they try again
      return { ok: false };
    }
    setStatus('saved');
    return { ok: true };
  }

  // No cleanup on unmount on purpose: a save that is already due should
  // still reach the database if the patient leaves the page.
  return { save, submit, status };
}
