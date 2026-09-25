import { useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Wait for a pause in typing before saving. Half a second is longer than the
// gap between keystrokes in a word, but short enough that staff still see
// answers almost as they are typed.
const SAVE_DELAY_MS = 500;
// Hospital Wi-Fi drops out for a few seconds at a time. Three seconds gets the
// answers through soon after it returns, without firing requests in a tight loop.
const RETRY_DELAY_MS = 3000;

export function useAutosave() {
  const [status, setStatus] = useState('idle'); // idle | saving | saved | error

  const idRef = useRef(null); // this intake's row id, made on the first save
  const latestRef = useRef(null); // the newest form values
  const timerRef = useRef(null); // the pending pause or retry timer
  const inFlightRef = useRef(false); // is a request on its way to the database?
  const dirtyRef = useRef(false); // did a save come due while it was?

  async function flush() {
    // One request at a time: two overlapping requests can land in either
    // order, and an older one landing last would overwrite newer answers.
    if (inFlightRef.current) {
      dirtyRef.current = true;
      return;
    }
    inFlightRef.current = true;
    dirtyRef.current = false;

    // The browser makes the id, so the first save and every later one are the
    // same upsert: insert the row if it's new, update it if it exists.
    if (!idRef.current) {
      idRef.current = crypto.randomUUID();
    }
    const sent = latestRef.current;
    const { error } = await supabase
      .from('patient_intakes')
      .upsert({ id: idRef.current, ...sent });
    inFlightRef.current = false;
    if (error) console.error('Autosave failed', error);

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
    latestRef.current = values;
    setStatus('saving');
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(flush, SAVE_DELAY_MS);
  }

  // No cleanup on unmount on purpose: a save that is already due should
  // still reach the database if the patient leaves the page.
  return { save, status };
}