-- id: uuid because we don't know HN of patient, but we want some unique id for each, which no one could guess.
-- first_name, last_name, phone_number: no "not null" because after the patient types the first letter the other fields are still empty so it'll get rejected.
create table public.patient_intakes (
  id uuid primary key default gen_random_uuid(),
  first_name text,
  middle_name text,
  last_name text,
  phone_number text,
  -- The other form fields are nullable for the same reason. Choices hold
  -- short English codes (e.g. 'female', 'th'); lib/fields.js has the labels.
  date_of_birth date,
  gender text,
  nationality text,
  preferred_language text,
  religion text,
  email text,
  address text,
  emergency_contact_name text,
  emergency_contact_relationship text,
  emergency_contact_phone text,
  -- Progress for the staff view: the step the patient is on (4 = checking
  -- their answers), when they reached it, and when they submitted.
  current_step smallint not null default 1,
  step_started_at timestamptz not null default now(),
  submitted_at timestamptz,
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

-- Stamps the progress times with the database clock too. The form sends the
-- step number and, on submit, any time for submitted_at; this sets the times.
create function public.stamp_intake_progress()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  -- A new step restarts the time-in-step clock.
  if new.current_step is distinct from old.current_step then
    new.step_started_at := now();
  end if;
  -- Submitted once: the first submission time stays, whatever is sent later.
  if old.submitted_at is not null then
    new.submitted_at := old.submitted_at;
  elsif new.submitted_at is not null then
    new.submitted_at := now();
  end if;
  return new;
end;
$$;

create trigger patient_intakes_progress
before update on public.patient_intakes
for each row execute function public.stamp_intake_progress();
