import { IntakeForm } from '@/components/IntakeForm';

export const metadata = {
  title: 'Patient form',
};

export default function PatientPage() {
  return (
    <main className="flex-1 bg-white sm:bg-slate-50 sm:px-6 sm:py-12">
      <div className="mx-auto w-full max-w-xl px-5 py-8 sm:rounded-2xl sm:bg-white sm:px-10 sm:shadow-sm sm:ring-1 sm:ring-slate-200">
        <IntakeForm />
      </div>
    </main>
  );
}