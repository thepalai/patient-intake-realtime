# OPD Check-in

A patient fills in an intake form on their own device while staff watch each field arrive live on another screen, with a status for every patient: **filling in**, **inactive** or **submitted**.

Built for the Agnos Health front-end take-home.

- **Live:** https://patient-intake-realtime-one.vercel.app
- **Try it** _(in progress)_: open `/patient` on a phone and `/staff` on a laptop, then start typing.

> **Work in progress.** Sections marked _TODO_ are filled in as each step lands.

## Requirements coverage

| Requirement | Status | Where |
|---|---|---|
| Patient form with the 12 listed fields | 🟡 4 of 12: names and phone | `components/IntakeForm.js`, `lib/fields.js` |
| Validation: required fields, phone number, email | ⏳ | |
| Patient form works on mobile and desktop | 🟡 layout adapts; recheck once the form is complete | `app/patient/page.js` |
| Staff view shows each field live as the patient types | 🟡 live for the fields built so far | `components/WaitingRoom.js`, `lib/useLiveIntakes.js` |
| Staff view adapts to screen size | 🟡 one, two or three columns of cards | `components/WaitingRoom.js` |
| Status: submitted / filling in / inactive | ⏳ | |
| Real-time sync between the two views | 🟡 form → staff view, for the fields built so far | [Real-time synchronization flow](#real-time-synchronization-flow) |
| Next.js + Tailwind CSS | ✅ | |
| Deployed on a frontend cloud platform | ✅ Vercel | live URL above |
| README + development planning documentation | 🟡 | this file |

✅ done · 🟡 partly done · ⏳ not started

## Tech stack

- **Next.js 16** (App Router, JavaScript) and **Tailwind CSS v4**
- **Supabase**: Postgres for storage, Realtime (`postgres_changes`) for live updates
- **Vercel** for hosting

## Getting started

You need Node.js 20.9+ and a Supabase project (the free tier is enough).

```bash
git clone https://github.com/thepalai/patient-intake-realtime.git
cd patient-intake-realtime
npm install
```

1. In the Supabase dashboard, open the **SQL Editor** and run [`supabase/schema.sql`](supabase/schema.sql) once. It creates the table, privileges, RLS policies, realtime publication and the `updated_at` trigger. It sets every privilege explicitly, so the result doesn't depend on the project's default settings.
2. Create `.env.local` in the project root with your project URL and **publishable** key (both are in the dashboard under Project Settings):

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   ```

3. Run `npm run dev` and open http://localhost:3000.

**Deploying to Vercel:** add the same two variables under Project Settings → Environment Variables. The `NEXT_PUBLIC_` prefix tells Next.js to inline the values into the browser bundle **at build time**, so a changed variable only takes effect after a redeploy.

## Assumptions

- **Many patients at once.** Several patients can fill in the form at the same time, as in a real outpatient department, and the staff view shows all of them. One form session is one row.
- **No login.** The brief doesn't ask for authentication, so `/patient` and `/staff` are separated by route, not by permission. The demo holds fake data only; see [Production considerations](#production-considerations).
- **Inactive** means no change for 30 seconds.

## Security model

With no login, both pages talk to Supabase using the **publishable key**, and requests made with it run as the Postgres role `anon`. The key is public by design (it ships in the JavaScript bundle), so everything the browser may do is decided inside the database, by two independent layers:

| Layer | Decides | When it's missing |
|---|---|---|
| `GRANT` (table privileges) | which **commands** `anon` may run | the request fails with `42501 permission denied` |
| Row Level Security policies | which **rows** a permitted command can reach | reads and updates quietly match **0 rows**, with no error (inserts are rejected) |

I tested each state on its own before moving on: no grant → `42501`; a grant but no policy → 0 rows; grant and policy → the row comes back.

What [`supabase/schema.sql`](supabase/schema.sql) sets up:

- **Revoke everything, then grant three commands.** The script starts with `revoke all … from anon, authenticated`, then grants `anon` only `select`, `insert` and `update`, which is all the two pages use. Depending on project settings, Supabase can grant the API roles *every* privilege on a new table, including `DELETE` and `TRUNCATE`, and RLS doesn't apply to `TRUNCATE`. Revoking first keeps the public role at least privilege and gives the same result on any project.
- **No delete at either layer.** Neither patients nor staff delete intakes, so there is no `delete` grant and no delete policy.
- **RLS enabled, with three policies `to anon`:** select, insert and update.
- **Realtime respects RLS.** The staff page only receives change events for rows its role can `SELECT`; without the select policy, the subscription connects and then stays silent.

> ⚠️ The policies use `using (true)`, so anyone holding the public key can read every intake. That is acceptable **only** because the demo holds fake data. See [Production considerations](#production-considerations).

## Data model

One table, `patient_intakes`, with **one row per form session** (full definition in [`supabase/schema.sql`](supabase/schema.sql)):

| Column | Purpose |
|---|---|
| `id` | UUID primary key |
| `first_name`, `middle_name`, `last_name`, `phone_number` | first slice; the other fields arrive with the full form |
| `created_at` | when the intake started |
| `updated_at` | last change, stamped by a database trigger on every update; drives the filling-in / inactive status |

- **Why a UUID:** a patient has no hospital number (HN) yet at intake. A random UUID also doesn't reveal how many intakes exist, and can't be enumerated once reads are locked down in production.
- **Why no `NOT NULL` on form fields:** with live sync, a row is saved while the patient is still typing, so an incomplete row is the normal state rather than an error. Required-field rules belong to the form's submit step, not to the database.

## Development planning

### Project structure

```
app/
  layout.js            root layout: font, page language, page title template
  globals.css          Tailwind, font, light-only colour scheme
  page.js              landing page, Thai first, English second
  patient/page.js      patient form page (server component: layout + metadata)
  staff/page.js        staff page (server component: metadata)
components/
  IntakeForm.js        the patient form (client component)
  WaitingRoom.js       staff screen: header, connection badge, loading / empty / error, card grid
  IntakeCard.js        one patient's card
  LiveBadge.js         connection status pill
lib/
  supabase.js          one shared Supabase client, built from the two public env vars
  fields.js            the form's fields, shared by the form and the card
  useAutosave.js       debounced, one-at-a-time upsert with retry
  useLiveIntakes.js    load + subscribe + merge for the staff view
supabase/
  schema.sql           table, privileges, RLS policies, realtime publication, updated_at trigger
```

### Design (UI/UX across screen sizes)

Guiding principles: clean, consistent, clear. Form patterns follow the GOV.UK Design System, adapted with what I learned about real patients as a radiology assistant.

> _TODO: layout per screen size, status colours, motion._

### Component architecture

> _TODO._

### Real-time synchronization flow

In place so far:

- **Transport.** The staff page subscribes to `postgres_changes` on `patient_intakes`. Supabase Realtime streams the database's own change log, so the staff view reacts to *any* committed write, whether it came from the patient form or the Supabase dashboard. Realtime listens to the database, not to the app, which let me verify the pipeline end to end on the live URL before any form existed.
- **Why Supabase Realtime.** It runs over WebSockets as a managed service: on Vercel there's no long-running server of my own to hold socket connections. And since the data has to be saved anyway, streaming the database's changes means the staff view shows exactly what is stored: one source of truth, nothing to keep in sync by hand.
- **Publication.** The table is in the `supabase_realtime` publication. The default replica identity (the primary key) is enough, because insert and update events carry the full new row.
- **Lifecycle.** The channel is created inside `useEffect` and removed in its cleanup with `supabase.removeChannel`. In development, React Strict Mode runs every effect, then its cleanup, then the effect again, to prove the cleanup works.
- **Realtime has no memory.** It only delivers changes made while connected, so the staff view must also load the current rows.

> _TODO: initial load and reconnects, debounced saves from the form, and a Mermaid diagram of the whole flow._

## Bonus features

> _TODO: only after every requirement above is done._

## Production considerations

This is a demo without login. Before it handled real patient data, I would change:

- **Authentication and ownership.** Staff sign in with Supabase Auth; patients get an anonymous session. Policies then check `auth.uid()`: a patient can read and update only their own intake, and only staff can read everyone's. Sessions also close today's open insert: right now anyone with the key can create rows, whereas signed-in writes can be tied to a user and rate-limited.
- **Sensitive data under Thailand's PDPA.** Religion is sensitive personal data (PDPA Section 26), so it stays optional here. Production would add explicit consent, access limited to staff who need it, and a retention policy, for example a scheduled `pg_cron` job that deletes abandoned and old intakes.
- **Languages.** A full multi-language UI, including the languages of migrant-worker patients (Lao, Burmese, Khmer).
- **Entry point.** The landing page's two buttons are a demo convenience; in a clinic, a QR code or kiosk would open `/patient` directly.

## Build log

Three lines at the end of each step.

**Day 1 — foundation**
- **Did:** deployed the Next.js + Tailwind scaffold to Vercel on day one; set up the Supabase table, privileges, RLS policies and realtime publication; built a staff page that logs live changes.
- **Decided:** Supabase `postgres_changes` for real-time; security enforced in the database (grants + RLS), because the browser key is public.
- **Verified:** each security layer on its own (error → 0 rows → 1 row), and a change made in the dashboard reaching the staff page on the live URL.

**Day 2 — thin slice**
- **Did:** a patient form (names and phone) that saves itself as the patient types, a staff waiting room whose cards update live, a landing page, and a trigger that keeps `updated_at` current.
- **Decided:** the browser creates each row's UUID, so every save is the same upsert, sent one at a time with retries; the staff view loads on open and after every reconnect, and keeps whichever copy of a row is newer.
- **Verified:** on the live URL, one row per patient (an INSERT, then UPDATEs); locally, cards appear in queue order, update and disappear live; eslint and the production build pass.

**Day 3 — the full form and the staff view**
- **Did:** the four-step patient form with validation, a review page and submit; a language page with a Thai/English switch; and a staff view that shows each patient's step, time on it and status, and folds away submitted and abandoned cards over time.
- **Decided:** every time on screen comes from the database clock (triggers) and one page clock, so no card runs a timer of its own; email is optional, because the brief asks for email validation where applicable and many older patients have no email; cards leave the staff view 24 hours after their last change rather than at midnight, because a hospital runs through the night.
- **Verified:** on the live URL, the staff view recovered after the laptop's Wi-Fi dropped, and a phone number typed while it was offline appeared without a refresh; back and forward move between steps without losing answers; switching language keeps every answer, including the birth year across calendars.

## How I built this

I used Claude (Anthropic's AI assistant) throughout. To be precise about who did what:

- **Day 1: database, security, deployment.** I wrote this code myself, with Claude teaching and reviewing.
- **Day 2 onward: UI and the `updated_at` trigger.** To fit the three-day window, most of this code is written by Claude from my decisions; the trigger's comments are mine: I wrote them first, then Claude made light edits to the wording and kept my phrasing. I review every diff before committing and test on real devices. These commits carry a `Co-authored-by: Claude` trailer.
- **This README.** Drafted with Claude from my decisions and test results; I review it before each commit.
- **Decisions.** Scope and order (one thin end-to-end slice first, then the full form), the data model, the security model, the real-time approach and the UI/UX choices are mine. Claude often laid out the options; I chose, and I can explain each choice.