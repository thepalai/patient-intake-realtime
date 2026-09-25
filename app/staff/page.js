'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function StaffPage() {
    useEffect(() => {
    const channel = supabase
        .channel('staff-monitor')                   
        .on(
        'postgres_changes',                        
        { event: '*', schema: 'public', table: 'patient_intakes' },
        (payload) => { console.log('change', payload); }
        )
        .subscribe((status) => console.log('status', status));

    return () => { supabase.removeChannel(channel); };
    }, []);

  return <main>Staff view</main>;
}