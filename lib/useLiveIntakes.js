import { useEffect, useState } from 'react';
import { SHOWN_FOR_MS } from '@/lib/intakeStatus';
import { supabase } from '@/lib/supabase';

const RETRY_DELAY_MS = 3000;

// Keep whichever copy of a row is newer. The first load and the live events
// can arrive in either order, so "arrived last" is not the same as "newest".
function mergeNewer(current, rows) {
  const next = { ...current };
  for (const row of rows) {
    const known = next[row.id];
    if (!known || Date.parse(row.updated_at) >= Date.parse(known.updated_at)) {
      next[row.id] = row;
    }
  }
  return next;
}

export function useLiveIntakes() {
  const [rowsById, setRowsById] = useState({});
  const [connection, setConnection] = useState('connecting'); // connecting | live | offline
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true; // cleanup flips this, so callbacks that land late do nothing
    let retryTimer = null;

    async function loadRows() {
      const { data, error: loadError } = await supabase
        .from('patient_intakes')
        .select('*')
        // Only rows the staff view shows: anything changed in the last 24 hours.
        .gte('updated_at', new Date(Date.now() - SHOWN_FOR_MS).toISOString());
      if (!active) return;
      if (loadError) {
        console.error('Loading intakes failed', loadError);
        setError(loadError.message);
        clearTimeout(retryTimer);
        retryTimer = setTimeout(loadRows, RETRY_DELAY_MS);
        return;
      }
      setError(null);
      setLoaded(true);
      setRowsById((current) => mergeNewer(current, data));
    }

    function applyChange(payload) {
      if (!active) return;
      if (payload.eventType === 'DELETE') {
        setRowsById((current) => {
          const next = { ...current };
          delete next[payload.old.id];
          return next;
        });
        return;
      }
      setRowsById((current) => mergeNewer(current, [payload.new]));
    }

    // Load straight away, so staff see patients even if the live connection is
    // slow or blocked (some hospital networks block WebSockets).
    loadRows();

    // Load again every time the channel (re)connects: realtime only delivers
    // changes made while we are listening, so anything missed while the
    // connection was down comes from this reload instead.
    const channel = supabase
      .channel('staff-intakes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patient_intakes' },
        applyChange
      )
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') {
          setConnection('live');
          loadRows();
        } else {
          setConnection('offline'); // the client reconnects by itself
        }
      });

    return () => {
      active = false;
      clearTimeout(retryTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  // Oldest first, like a queue: new patients join the end, so cards never move.
  const intakes = Object.values(rowsById).sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at)
  );

  return { intakes, connection, loaded, error };
}
