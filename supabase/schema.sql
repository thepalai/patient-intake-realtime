-- id: uuid because we don't know HN of patient, but we want some unique id for each, which no one could guess.
-- first_name, last_name, phone_number: no "not null" because after the patient types the first letter the other fields are still empty so it'll get rejected.
create table public.patient_intakes (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  middle_name text,
  last_name text,
  phone_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Reset the default role and add select, insert and update. No delete because key is public, only admin could do.
revoke all on public.patient_intakes from anon, authenticated;
grant select, insert, update on public.patient_intakes to anon;
alter table public.patient_intakes enable row level security;

-- For staff
create policy "anon can read patient intakes" on public.patient_intakes
for select to anon using (true);
-- For patient
create policy "anon can add patient intakes" on public.patient_intakes
for insert to anon with check (true);
-- For patient
create policy "anon can edit patient intakes" on public.patient_intakes
for update to anon using (true) with check (true);

-- For staff to read realtime.
alter publication supabase_realtime add table public.patient_intakes;

-- The column default only sets updated_at on insert; this stamps every update too.
-- It uses the database clock, not the patient's phone, so the staff view can tell
-- who is still typing.
create function public.set_updated_at()
returns trigger
language plpgsql
-- Stop the function from picking up a look-alike now() from a different schema.
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- BEFORE, so the new time is set on the row before it is written to the table.
create trigger patient_intakes_updated_at
before update on public.patient_intakes
for each row execute function public.set_updated_at();